using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITestHealingService
{
    Task<TestHealingRecord> AnalyzeFailureAsync(int projectId, TestHealingRequest request);
    Task<List<TestHealingRecord>> GetHealingHistoryAsync(int projectId);
    Task<TestHealingRecord?> GetHealingRecordAsync(Guid id);
    Task<List<TestHealingRecord>> GetReviewQueueAsync(int projectId);
    Task<TestHealingRecord?> ApproveHealingAsync(Guid id);
    Task<TestHealingRecord?> RejectHealingAsync(Guid id);
    Task<TestHealingSettings> GetSettingsAsync(int projectId);
    Task<TestHealingSettings> UpdateSettingsAsync(int projectId, TestHealingSettings settings);
    Task<TestHealingStats> GetStatsAsync(int projectId);
}

public class TestHealingService : ITestHealingService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<TestHealingService> _logger;
    private readonly string _projectsBasePath;

    // In-memory settings store (per project); in production, use a DB table
    private static readonly Dictionary<int, TestHealingSettings> _settingsStore = new();

    public TestHealingService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<TestHealingService> logger)
    {
        _context = context;
        _logger = logger;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<TestHealingRecord> AnalyzeFailureAsync(int projectId, TestHealingRequest request)
    {
        var latestVersion = await _context.TestHealingRecords
            .Where(r => r.ProjectId == projectId)
            .MaxAsync(r => (int?)r.HealingVersion) ?? 0;

        var record = new TestHealingRecord
        {
            ProjectId = projectId,
            Status = "analyzing",
            TestFilePath = request.TestFilePath,
            OriginalSelector = request.OriginalSelector,
            FailureReason = request.FailureReason,
            LocatorStrategy = request.LocatorStrategy ?? "css",
            HealingVersion = latestVersion + 1,
        };

        _context.TestHealingRecords.Add(record);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Started test healing analysis v{Version} for project {ProjectId}, test {TestFile}",
            record.HealingVersion, projectId, request.TestFilePath);

        try
        {
            var healResult = await AnalyzeWithClaudeAsync(projectId, request);

            record.HealedSelector = healResult.HealedSelector;
            record.HealingSummary = healResult.Summary;
            record.ConfidenceScore = healResult.ConfidenceScore;
            record.SuggestedFixJson = JsonSerializer.Serialize(healResult.SuggestedFix);
            record.DiffJson = JsonSerializer.Serialize(new
            {
                before = request.OriginalSelector,
                after = healResult.HealedSelector,
                componentName = request.ComponentName ?? ""
            });

            // Auto-approve high confidence fixes, flag others for review
            if (healResult.ConfidenceScore >= 80)
            {
                record.Status = "healed";
                record.IsApproved = true;
                record.HealedAt = DateTime.UtcNow;
            }
            else
            {
                record.Status = "needs_review";
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Test healing completed for project {ProjectId}: confidence={Confidence}%, status={Status}",
                projectId, record.ConfidenceScore, record.Status);

            return record;
        }
        catch (Exception ex)
        {
            record.Status = "failed";
            record.HealingSummary = $"Analysis failed: {ex.Message}";
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Test healing failed for project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<List<TestHealingRecord>> GetHealingHistoryAsync(int projectId)
    {
        return await _context.TestHealingRecords
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<TestHealingRecord?> GetHealingRecordAsync(Guid id)
    {
        return await _context.TestHealingRecords.FindAsync(id);
    }

    public async Task<List<TestHealingRecord>> GetReviewQueueAsync(int projectId)
    {
        return await _context.TestHealingRecords
            .Where(r => r.ProjectId == projectId && r.Status == "needs_review")
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<TestHealingRecord?> ApproveHealingAsync(Guid id)
    {
        var record = await _context.TestHealingRecords.FindAsync(id);
        if (record == null) return null;

        record.IsApproved = true;
        record.IsRejected = false;
        record.Status = "healed";
        record.ReviewedAt = DateTime.UtcNow;
        record.HealedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return record;
    }

    public async Task<TestHealingRecord?> RejectHealingAsync(Guid id)
    {
        var record = await _context.TestHealingRecords.FindAsync(id);
        if (record == null) return null;

        record.IsRejected = true;
        record.IsApproved = false;
        record.Status = "failed";
        record.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return record;
    }

    public Task<TestHealingSettings> GetSettingsAsync(int projectId)
    {
        if (_settingsStore.TryGetValue(projectId, out var settings))
            return Task.FromResult(settings);

        var defaults = new TestHealingSettings();
        return Task.FromResult(defaults);
    }

    public Task<TestHealingSettings> UpdateSettingsAsync(int projectId, TestHealingSettings settings)
    {
        _settingsStore[projectId] = settings;
        return Task.FromResult(settings);
    }

    public async Task<TestHealingStats> GetStatsAsync(int projectId)
    {
        var records = await _context.TestHealingRecords
            .Where(r => r.ProjectId == projectId)
            .ToListAsync();

        return new TestHealingStats
        {
            TotalAnalyzed = records.Count,
            AutoHealed = records.Count(r => r.Status == "healed" && r.ConfidenceScore >= 80),
            NeedsReview = records.Count(r => r.Status == "needs_review"),
            Failed = records.Count(r => r.Status == "failed"),
            AverageConfidence = records.Count > 0
                ? (int)records.Average(r => r.ConfidenceScore) : 0,
            HealingRate = records.Count > 0
                ? Math.Round((double)records.Count(r => r.Status == "healed") / records.Count * 100, 1) : 0,
        };
    }

    private async Task<HealAnalysisResult> AnalyzeWithClaudeAsync(int projectId, TestHealingRequest request)
    {
        var prompt = $@"You are an expert test automation engineer specializing in self-healing test frameworks.

A Playwright/E2E test has failed because a UI element could not be found. Analyze the failure and suggest a healed selector.

## Failed Test Information
- Test file: {request.TestFilePath}
- Original selector: {request.OriginalSelector}
- Locator strategy: {request.LocatorStrategy ?? "css"}
- Failure reason: {request.FailureReason}
- Component name: {request.ComponentName ?? "unknown"}
- Page context: {request.PageContext ?? "unknown"}

{(request.ComponentDiff != null ? $@"## Component Change Diff
```
{request.ComponentDiff}
```" : "")}

## Instructions
1. Analyze why the original selector broke
2. Suggest a more resilient replacement selector
3. Prefer intent-based locators (role, text, testid) over brittle CSS selectors
4. Provide a confidence score (0-100) for the suggested fix
5. Explain the reasoning

Respond with ONLY a JSON object:
{{
  ""healedSelector"": ""the new selector string"",
  ""locatorStrategy"": ""role|text|testid|css|xpath"",
  ""confidenceScore"": 0-100,
  ""summary"": ""brief explanation of what changed and why the fix works"",
  ""suggestedFix"": {{
    ""selector"": ""full selector expression"",
    ""assertion"": ""suggested assertion if applicable"",
    ""explanation"": ""detailed reasoning for the fix""
  }}
}}

JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 2000,
                Temperature = 0.2m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var result = StructuredOutputHelper.DeserializeResponse<HealAnalysisResult>(content);

            if (result != null)
            {
                _logger.LogInformation("Claude returned healing suggestion with confidence {Confidence}% for project {ProjectId}",
                    result.ConfidenceScore, projectId);
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API call failed for test healing, project {ProjectId}", projectId);
        }

        return new HealAnalysisResult
        {
            HealedSelector = request.OriginalSelector,
            ConfidenceScore = 0,
            Summary = "Could not determine a healed selector."
        };
    }
}

// Request/Response Models

public class TestHealingRequest
{
    public string TestFilePath { get; set; } = "";
    public string OriginalSelector { get; set; } = "";
    public string FailureReason { get; set; } = "";
    public string? LocatorStrategy { get; set; }
    public string? ComponentName { get; set; }
    public string? PageContext { get; set; }
    public string? ComponentDiff { get; set; }
}

public class HealAnalysisResult
{
    public string HealedSelector { get; set; } = "";
    public string LocatorStrategy { get; set; } = "css";
    public int ConfidenceScore { get; set; }
    public string Summary { get; set; } = "";
    public SuggestedFix? SuggestedFix { get; set; }
}

public class SuggestedFix
{
    public string Selector { get; set; } = "";
    public string Assertion { get; set; } = "";
    public string Explanation { get; set; } = "";
}

public class TestHealingSettings
{
    public bool AutoHealEnabled { get; set; } = true;
    public int ConfidenceThreshold { get; set; } = 80;
    public bool AutoApproveHighConfidence { get; set; } = true;
    public bool NotifyOnLowConfidence { get; set; } = true;
    public string PreferredLocatorStrategy { get; set; } = "intent"; // intent, testid, role, css
    public int MaxHealingAttempts { get; set; } = 3;
}

public class TestHealingStats
{
    public int TotalAnalyzed { get; set; }
    public int AutoHealed { get; set; }
    public int NeedsReview { get; set; }
    public int Failed { get; set; }
    public int AverageConfidence { get; set; }
    public double HealingRate { get; set; }
}
