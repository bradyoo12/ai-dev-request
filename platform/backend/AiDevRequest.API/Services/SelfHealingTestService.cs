using System.Text.Json;
using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISelfHealingTestService
{
    Task<SelfHealingTestResult> RunSelfHealingAnalysis(Guid devRequestId);
    Task<SelfHealingTestResult?> GetLatestResult(Guid devRequestId);
    Task<List<SelfHealingTestResult>> GetHistory(Guid devRequestId);
    Task<LocatorRepairResult> RepairLocatorsAsync(Guid devRequestId, List<BrokenLocatorInput> brokenLocators);
    Task<List<HealingTimelineEntry>> GetHealingTimelineAsync(Guid devRequestId);
}

public class SelfHealingTestService : ISelfHealingTestService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<SelfHealingTestService> _logger;
    private readonly string _projectsBasePath;

    public SelfHealingTestService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<SelfHealingTestService> logger)
    {
        _context = context;
        _logger = logger;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<SelfHealingTestResult> RunSelfHealingAnalysis(Guid devRequestId)
    {
        var latestVersion = await _context.SelfHealingTestResults
            .Where(r => r.DevRequestId == devRequestId)
            .MaxAsync(r => (int?)r.AnalysisVersion) ?? 0;

        var result = new SelfHealingTestResult
        {
            DevRequestId = devRequestId,
            Status = "analyzing",
            AnalysisVersion = latestVersion + 1,
        };

        _context.SelfHealingTestResults.Add(result);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Started self-healing test analysis v{Version} for dev request {DevRequestId}",
            result.AnalysisVersion, devRequestId);

        try
        {
            var projectPath = await ResolveProjectPathAsync(devRequestId);

            if (projectPath != null)
            {
                var sourceFiles = ReadSourceFiles(projectPath);
                var testFiles = ReadTestFiles(projectPath);

                if (sourceFiles.Count > 0 && testFiles.Count > 0)
                {
                    var analysis = await AnalyzeWithClaudeAsync(sourceFiles, testFiles, devRequestId);

                    result.TotalTests = analysis.TotalTests;
                    result.FailedTests = analysis.FailedTests;
                    result.HealedTests = analysis.HealedTests;
                    result.SkippedTests = analysis.SkippedTests;
                    result.ConfidenceScore = analysis.OverallConfidence;
                    result.HealedTestsJson = JsonSerializer.Serialize(analysis.HealedTests_Details);
                    result.FailedTestDetailsJson = JsonSerializer.Serialize(analysis.FailedTests_Details);
                }
                else
                {
                    _logger.LogWarning("No source or test files found for dev request {DevRequestId}", devRequestId);
                    result.FailedTestDetailsJson = JsonSerializer.Serialize(new[]
                    {
                        new FailedTestDetail
                        {
                            TestName = "N/A",
                            ErrorMessage = sourceFiles.Count == 0
                                ? "No source files found to analyze."
                                : "No test files found to analyze."
                        }
                    });
                }
            }
            else
            {
                _logger.LogWarning("No project path found for dev request {DevRequestId}", devRequestId);
                result.FailedTestDetailsJson = JsonSerializer.Serialize(new[]
                {
                    new FailedTestDetail
                    {
                        TestName = "N/A",
                        ErrorMessage = "Project path could not be resolved."
                    }
                });
            }

            result.Status = "completed";
            result.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Self-healing analysis completed for dev request {DevRequestId}: {Total} total, {Failed} failed, {Healed} healed, confidence {Confidence}%",
                devRequestId, result.TotalTests, result.FailedTests, result.HealedTests, result.ConfidenceScore);

            return result;
        }
        catch (Exception ex)
        {
            result.Status = "failed";
            result.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Self-healing analysis failed for dev request {DevRequestId}", devRequestId);
            throw;
        }
    }

    public async Task<SelfHealingTestResult?> GetLatestResult(Guid devRequestId)
    {
        return await _context.SelfHealingTestResults
            .Where(r => r.DevRequestId == devRequestId)
            .OrderByDescending(r => r.AnalysisVersion)
            .FirstOrDefaultAsync();
    }

    public async Task<List<SelfHealingTestResult>> GetHistory(Guid devRequestId)
    {
        return await _context.SelfHealingTestResults
            .Where(r => r.DevRequestId == devRequestId)
            .OrderByDescending(r => r.AnalysisVersion)
            .ToListAsync();
    }

    public async Task<LocatorRepairResult> RepairLocatorsAsync(Guid devRequestId, List<BrokenLocatorInput> brokenLocators)
    {
        _logger.LogInformation("Repairing {Count} broken locators for dev request {DevRequestId}",
            brokenLocators.Count, devRequestId);

        var locatorsSummary = string.Join("\n", brokenLocators.Select(l =>
            $"- Test: {l.TestName} in {l.TestFile}\n  Broken locator: {l.OriginalLocator}\n  Error: {l.ErrorMessage ?? "N/A"}"));

        var prompt = $@"You are a Playwright MCP expert specializing in self-healing test locators. Repair the following broken locators using intelligent alternatives.

## Broken Locators
{locatorsSummary}

## Repair Strategy Priority
1. Use data-testid attributes (most stable)
2. Use ARIA roles and labels (getByRole, getByLabel)
3. Use visible text content (getByText)
4. Use semantic selectors (heading, button, link)
5. Fall back to CSS selectors with structural context

## Requirements
- Each repaired locator must be a valid Playwright locator
- Include confidence score (0-100) for each repair
- Explain the repair strategy used
- Prefer resilient locators that survive UI changes

Respond with ONLY a JSON object:
{{
  ""repairedLocators"": [
    {{
      ""testFile"": ""file path"",
      ""testName"": ""test name"",
      ""originalLocator"": ""broken locator"",
      ""repairedLocatorValue"": ""new Playwright locator"",
      ""strategy"": ""strategy name (data-testid, role, text, css, etc.)"",
      ""confidence"": 0-100,
      ""reason"": ""explanation of repair""
    }}
  ],
  ""totalRepaired"": number,
  ""totalFailed"": number,
  ""overallConfidence"": 0-100,
  ""summary"": ""brief summary""
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
                Temperature = 0.3m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var repairResult = StructuredOutputHelper.DeserializeResponse<LocatorRepairResult>(content);
            if (repairResult != null)
            {
                _logger.LogInformation("Repaired {Count} locators with {Confidence}% confidence",
                    repairResult.TotalRepaired, repairResult.OverallConfidence);
                return repairResult;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Locator repair failed for dev request {DevRequestId}", devRequestId);
        }

        return new LocatorRepairResult
        {
            Summary = "Locator repair could not be completed.",
        };
    }

    public async Task<List<HealingTimelineEntry>> GetHealingTimelineAsync(Guid devRequestId)
    {
        var results = await _context.SelfHealingTestResults
            .Where(r => r.DevRequestId == devRequestId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .ToListAsync();

        var timeline = new List<HealingTimelineEntry>();

        foreach (var result in results)
        {
            // Parse healed tests
            if (!string.IsNullOrEmpty(result.HealedTestsJson))
            {
                try
                {
                    var healed = JsonSerializer.Deserialize<List<HealedTestDetail>>(result.HealedTestsJson);
                    if (healed != null)
                    {
                        foreach (var h in healed)
                        {
                            timeline.Add(new HealingTimelineEntry
                            {
                                Id = Guid.NewGuid(),
                                Timestamp = result.UpdatedAt ?? result.CreatedAt,
                                Action = "healed",
                                TestName = h.TestName,
                                OriginalLocator = h.OriginalCode,
                                HealedLocator = h.FixedCode,
                                Confidence = h.Confidence,
                                Reason = h.Reason,
                                AnalysisVersion = result.AnalysisVersion,
                            });
                        }
                    }
                }
                catch { /* Skip malformed JSON */ }
            }

            // Parse failed tests
            if (!string.IsNullOrEmpty(result.FailedTestDetailsJson))
            {
                try
                {
                    var failed = JsonSerializer.Deserialize<List<FailedTestDetail>>(result.FailedTestDetailsJson);
                    if (failed != null)
                    {
                        foreach (var f in failed)
                        {
                            timeline.Add(new HealingTimelineEntry
                            {
                                Id = Guid.NewGuid(),
                                Timestamp = result.UpdatedAt ?? result.CreatedAt,
                                Action = "failed",
                                TestName = f.TestName,
                                OriginalLocator = null,
                                HealedLocator = null,
                                Confidence = 0,
                                Reason = f.ErrorMessage,
                                AnalysisVersion = result.AnalysisVersion,
                            });
                        }
                    }
                }
                catch { /* Skip malformed JSON */ }
            }
        }

        return timeline.OrderByDescending(t => t.Timestamp).ToList();
    }

    private async Task<string?> ResolveProjectPathAsync(Guid devRequestId)
    {
        var devRequest = await _context.DevRequests
            .Where(r => r.Id == devRequestId)
            .FirstOrDefaultAsync();

        if (devRequest?.ProjectPath != null && Directory.Exists(devRequest.ProjectPath))
            return devRequest.ProjectPath;

        // Fallback: find any dev request with a project path
        var fallback = await _context.DevRequests
            .Where(r => r.ProjectPath != null)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (fallback?.ProjectPath != null && Directory.Exists(fallback.ProjectPath))
            return fallback.ProjectPath;

        if (Directory.Exists(_projectsBasePath))
        {
            var dirs = Directory.GetDirectories(_projectsBasePath)
                .OrderBy(d => d)
                .ToArray();

            if (dirs.Length > 0)
                return dirs[0];
        }

        return null;
    }

    private async Task<SelfHealingAnalysis> AnalyzeWithClaudeAsync(
        Dictionary<string, string> sourceFiles,
        Dictionary<string, string> testFiles,
        Guid devRequestId)
    {
        var sourceSummary = string.Join("\n\n", sourceFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        var testSummary = string.Join("\n\n", testFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        if (sourceSummary.Length > 40000)
            sourceSummary = sourceSummary[..40000] + "\n\n... (additional files truncated)";
        if (testSummary.Length > 40000)
            testSummary = testSummary[..40000] + "\n\n... (additional test files truncated)";

        var prompt = $@"You are a senior test engineer specializing in self-healing test automation with Playwright MCP integration. Analyze the following source code and test files to identify failing or fragile tests and generate fixes.

## Source Files
{sourceSummary}

## Test Files
{testSummary}

## Analysis Requirements
1. Identify tests that are likely failing due to:
   - Changed selectors or locators (use intent-based locators instead)
   - Modified API responses or data structures
   - Updated component props or state
   - Renamed functions or variables
   - Changed DOM structure
2. For each failing test, generate a fixed version with:
   - Intent-based test locators (data-testid, aria-label, role)
   - Updated assertions matching current code
   - Confidence score (0-100) for the fix
3. Identify tests that should be skipped (e.g., testing removed features)

Respond with ONLY a JSON object:
{{
  ""totalTests"": <number of total tests found>,
  ""failedTests"": <number of tests likely failing>,
  ""healedTests"": <number of tests you can fix>,
  ""skippedTests"": <number of tests that should be skipped>,
  ""overallConfidence"": <0-100 overall confidence score>,
  ""healedTestsDetails"": [
    {{
      ""testName"": ""test name"",
      ""filePath"": ""relative file path"",
      ""originalCode"": ""original test code snippet"",
      ""fixedCode"": ""fixed test code"",
      ""confidence"": <0-100>,
      ""reason"": ""explanation of what was fixed""
    }}
  ],
  ""failedTestsDetails"": [
    {{
      ""testName"": ""test name"",
      ""filePath"": ""relative file path"",
      ""errorMessage"": ""likely error message"",
      ""stackTrace"": ""likely stack trace or location""
    }}
  ]
}}

Be realistic - only report issues you actually detect in the code. JSON only.";

        try
        {
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

            var analysis = StructuredOutputHelper.DeserializeResponse<SelfHealingAnalysis>(content);

            if (analysis != null)
            {
                _logger.LogInformation("Claude returned analysis for dev request {DevRequestId}: {Healed} healed tests",
                    devRequestId, analysis.HealedTests);
                return analysis;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API call failed for self-healing analysis, dev request {DevRequestId}", devRequestId);
        }

        return new SelfHealingAnalysis();
    }

    private static Dictionary<string, string> ReadSourceFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var sourceExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".cs", ".py",
            ".vue", ".svelte", ".html", ".css"
        };

        var excludeDirs = new HashSet<string>
        {
            "node_modules", "dist", "build", ".next", "bin", "obj",
            "__pycache__", ".pytest_cache", "coverage", ".git"
        };

        foreach (var filePath in Directory.GetFiles(projectPath, "*.*", SearchOption.AllDirectories))
        {
            var ext = Path.GetExtension(filePath).ToLower();
            if (!sourceExtensions.Contains(ext)) continue;

            var relativePath = Path.GetRelativePath(projectPath, filePath);
            if (excludeDirs.Any(d => relativePath.Contains(d, StringComparison.OrdinalIgnoreCase))) continue;

            // Skip test files
            if (relativePath.Contains(".test.") || relativePath.Contains(".spec.") ||
                relativePath.Contains("__tests__")) continue;

            try
            {
                var content = File.ReadAllText(filePath);
                if (content.Length <= 50000)
                {
                    files[relativePath] = content;
                }
            }
            catch { /* Skip files that can't be read */ }
        }

        return files;
    }

    private static Dictionary<string, string> ReadTestFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var testExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".cs", ".py"
        };

        var excludeDirs = new HashSet<string>
        {
            "node_modules", "dist", "build", ".next", "bin", "obj",
            "__pycache__", ".pytest_cache", "coverage", ".git"
        };

        foreach (var filePath in Directory.GetFiles(projectPath, "*.*", SearchOption.AllDirectories))
        {
            var ext = Path.GetExtension(filePath).ToLower();
            if (!testExtensions.Contains(ext)) continue;

            var relativePath = Path.GetRelativePath(projectPath, filePath);
            if (excludeDirs.Any(d => relativePath.Contains(d, StringComparison.OrdinalIgnoreCase))) continue;

            // Only include test files
            if (!relativePath.Contains(".test.") && !relativePath.Contains(".spec.") &&
                !relativePath.Contains("__tests__")) continue;

            try
            {
                var content = File.ReadAllText(filePath);
                if (content.Length <= 50000)
                {
                    files[relativePath] = content;
                }
            }
            catch { /* Skip files that can't be read */ }
        }

        return files;
    }
}

public class SelfHealingAnalysis
{
    public int TotalTests { get; set; }
    public int FailedTests { get; set; }
    public int HealedTests { get; set; }
    public int SkippedTests { get; set; }
    public decimal OverallConfidence { get; set; }
    public List<HealedTestDetail> HealedTests_Details { get; set; } = new();
    public List<FailedTestDetail> FailedTests_Details { get; set; } = new();
}

public class HealedTestDetail
{
    public string TestName { get; set; } = "";
    public string FilePath { get; set; } = "";
    public string OriginalCode { get; set; } = "";
    public string FixedCode { get; set; } = "";
    public int Confidence { get; set; }
    public string Reason { get; set; } = "";
}

public class FailedTestDetail
{
    public string TestName { get; set; } = "";
    public string FilePath { get; set; } = "";
    public string ErrorMessage { get; set; } = "";
    public string StackTrace { get; set; } = "";
}
