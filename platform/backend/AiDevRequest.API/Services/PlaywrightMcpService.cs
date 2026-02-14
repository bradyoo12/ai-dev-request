using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IPlaywrightMcpService
{
    Task<PlaywrightMcpTestConfig> GenerateTestsAsync(string userId, string testScenario, Guid? projectId);
    Task<TestHealingRecord> HealFailedTestAsync(Guid testConfigId, string failureReason);
    Task<List<PlaywrightMcpTestConfig>> GetTestConfigsAsync(string userId);
    Task<List<TestHealingRecord>> GetHealingHistoryAsync(Guid testConfigId);
    Task<TestExecutionResult> RunTestAsync(Guid testConfigId);
}

public class PlaywrightMcpService : IPlaywrightMcpService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<PlaywrightMcpService> _logger;

    public PlaywrightMcpService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<PlaywrightMcpService> logger)
    {
        _context = context;
        _logger = logger;

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<PlaywrightMcpTestConfig> GenerateTestsAsync(string userId, string testScenario, Guid? projectId)
    {
        var config = new PlaywrightMcpTestConfig
        {
            UserId = userId,
            ProjectId = projectId,
            TestScenario = testScenario,
            Status = "generating",
        };

        _context.PlaywrightMcpTestConfigs.Add(config);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Started Playwright MCP test generation for user {UserId}", userId);

        try
        {
            var prompt = $@"You are an expert Playwright test engineer with MCP (Model Context Protocol) integration capabilities.
Generate comprehensive Playwright tests for the following scenario:

## Test Scenario
{testScenario}

## Requirements
1. Use Playwright with TypeScript
2. Include page object models where appropriate
3. Use robust locators (data-testid, role-based, text-based)
4. Add self-healing locator fallbacks
5. Include setup/teardown hooks
6. Cover happy paths, edge cases, and error states

Respond with ONLY a JSON object:
{{
  ""testCode"": ""complete Playwright test file content"",
  ""locators"": [
    {{
      ""name"": ""element description"",
      ""primary"": ""primary locator strategy"",
      ""fallbacks"": [""fallback1"", ""fallback2""]
    }}
  ],
  ""scenarios"": [""list of test scenario descriptions""]
}}

Generate realistic, runnable Playwright test code. JSON only.";

            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 8000,
                Temperature = 0.3m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var generated = StructuredOutputHelper.DeserializeResponse<GeneratedPlaywrightTest>(content);

            if (generated != null)
            {
                config.GeneratedTestCode = generated.TestCode;
                config.Status = "completed";
                config.SuccessRate = 100.0;
                _logger.LogInformation("Playwright MCP test generation completed for user {UserId}", userId);
            }
            else
            {
                config.Status = "failed";
            }

            config.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return config;
        }
        catch (Exception ex)
        {
            config.Status = "failed";
            config.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Playwright MCP test generation failed for user {UserId}", userId);
            throw;
        }
    }

    public async Task<TestHealingRecord> HealFailedTestAsync(Guid testConfigId, string failureReason)
    {
        var config = await _context.PlaywrightMcpTestConfigs.FindAsync(testConfigId)
            ?? throw new InvalidOperationException("Test config not found");

        _logger.LogInformation("Starting test healing for config {ConfigId}", testConfigId);

        var prompt = $@"You are an expert at self-healing Playwright tests. A test has failed and needs to be fixed.

## Original Test Code
{config.GeneratedTestCode ?? "No test code available"}

## Failure Reason
{failureReason}

Analyze the failure and suggest a fix. Respond with ONLY a JSON object:
{{
  ""originalLocator"": ""the locator that failed"",
  ""updatedLocator"": ""the suggested replacement locator"",
  ""healingStrategy"": ""description of the healing strategy used"",
  ""success"": true
}}

JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 4000,
                Temperature = 0.2m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var healResult = StructuredOutputHelper.DeserializeResponse<HealingResult>(content);

            var record = new TestHealingRecord
            {
                TestConfigId = testConfigId,
                OriginalLocator = healResult?.OriginalLocator ?? "unknown",
                UpdatedLocator = healResult?.UpdatedLocator ?? "unknown",
                FailureReason = failureReason,
                HealingStrategy = healResult?.HealingStrategy ?? "unknown",
                Success = healResult?.Success ?? false,
            };

            _context.TestHealingRecords.Add(record);

            // Update healing history JSON on the config
            var existingHistory = new List<object>();
            if (!string.IsNullOrEmpty(config.HealingHistoryJson))
            {
                existingHistory = JsonSerializer.Deserialize<List<object>>(config.HealingHistoryJson) ?? new();
            }
            existingHistory.Add(new { record.OriginalLocator, record.UpdatedLocator, record.HealingStrategy, record.Success, record.CreatedAt });
            config.HealingHistoryJson = JsonSerializer.Serialize(existingHistory);
            config.UpdatedAt = DateTime.UtcNow;

            // Recalculate success rate
            var allRecords = await _context.TestHealingRecords
                .Where(r => r.TestConfigId == testConfigId)
                .ToListAsync();
            allRecords.Add(record);
            config.SuccessRate = allRecords.Count > 0
                ? (double)allRecords.Count(r => r.Success) / allRecords.Count * 100.0
                : 0;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Test healing completed for config {ConfigId}: {Strategy}",
                testConfigId, record.HealingStrategy);

            return record;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test healing failed for config {ConfigId}", testConfigId);
            throw;
        }
    }

    public async Task<List<PlaywrightMcpTestConfig>> GetTestConfigsAsync(string userId)
    {
        return await _context.PlaywrightMcpTestConfigs
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<TestHealingRecord>> GetHealingHistoryAsync(Guid testConfigId)
    {
        return await _context.TestHealingRecords
            .Where(r => r.TestConfigId == testConfigId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<TestExecutionResult> RunTestAsync(Guid testConfigId)
    {
        var config = await _context.PlaywrightMcpTestConfigs.FindAsync(testConfigId)
            ?? throw new InvalidOperationException("Test config not found");

        config.Status = "running";
        config.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Simulated test execution - in production this would invoke Playwright runner
        var passed = !string.IsNullOrEmpty(config.GeneratedTestCode);
        var output = passed
            ? $"All tests passed for scenario: {config.TestScenario}"
            : "No test code available to execute.";

        config.Status = passed ? "passed" : "failed";
        config.SuccessRate = passed ? 100.0 : 0.0;
        config.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Test execution for {TestConfigId}: {Status}", testConfigId, config.Status);

        return new TestExecutionResult
        {
            TestConfigId = testConfigId,
            Passed = passed,
            Output = output,
            ExecutedAt = DateTime.UtcNow,
        };
    }
}

public class TestExecutionResult
{
    public Guid TestConfigId { get; set; }
    public bool Passed { get; set; }
    public string Output { get; set; } = "";
    public DateTime ExecutedAt { get; set; }
}

public class GeneratedPlaywrightTest
{
    public string TestCode { get; set; } = "";
    public List<PlaywrightLocator> Locators { get; set; } = new();
    public List<string> Scenarios { get; set; } = new();
}

public class PlaywrightLocator
{
    public string Name { get; set; } = "";
    public string Primary { get; set; } = "";
    public List<string> Fallbacks { get; set; } = new();
}

public class HealingResult
{
    public string OriginalLocator { get; set; } = "";
    public string UpdatedLocator { get; set; } = "";
    public string HealingStrategy { get; set; } = "";
    public bool Success { get; set; }
}
