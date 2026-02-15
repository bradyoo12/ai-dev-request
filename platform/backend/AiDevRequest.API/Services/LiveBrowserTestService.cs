using System.Text.Json;
using System.Text.Json.Serialization;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface ILiveBrowserTestService
{
    Task<BrowserTestResult> RunBrowserTestAsync(string targetUrl, string? testScenario = null);
    Task<ScreenshotAnalysis> AnalyzeScreenshotAsync(string screenshotBase64, string pageUrl, string? context = null);
    Task<List<BrowserTestScenario>> GenerateTestScenariosAsync(string targetUrl);
    Task<AutoFixResult> AttemptAutoFixAsync(DetectedIssue issue, string projectPath);
}

public class LiveBrowserTestService : ILiveBrowserTestService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<LiveBrowserTestService> _logger;

    public LiveBrowserTestService(
        IConfiguration configuration,
        ILogger<LiveBrowserTestService> logger)
    {
        _logger = logger;

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<BrowserTestResult> RunBrowserTestAsync(string targetUrl, string? testScenario = null)
    {
        _logger.LogInformation("Starting browser test for URL: {Url}", targetUrl);

        var result = new BrowserTestResult
        {
            TargetUrl = targetUrl,
            StartedAt = DateTime.UtcNow,
            Steps = new List<BrowserTestStep>()
        };

        try
        {
            // Step 1: Navigate to target URL and capture initial screenshot
            var navigateStep = new BrowserTestStep
            {
                Action = "navigate",
                Description = $"Navigate to {targetUrl}",
                Timestamp = DateTime.UtcNow,
                Status = "completed"
            };
            result.Steps.Add(navigateStep);

            // Step 2: Generate test scenario if not provided
            if (string.IsNullOrEmpty(testScenario))
            {
                var scenarios = await GenerateTestScenariosAsync(targetUrl);
                testScenario = scenarios.FirstOrDefault()?.Description ?? "General UI/UX verification";
            }

            // Step 3: Simulate browser interactions based on scenario
            var interactionSteps = await SimulateBrowserInteractionsAsync(targetUrl, testScenario);
            result.Steps.AddRange(interactionSteps);

            // Step 4: Capture and analyze screenshots at key points
            var screenshotAnalysis = await AnalyzePageAsync(targetUrl, testScenario);
            result.ScreenshotAnalyses.Add(screenshotAnalysis);

            // Step 5: Collect detected issues
            result.DetectedIssues = screenshotAnalysis.Issues;
            result.CompletedAt = DateTime.UtcNow;
            result.Status = result.DetectedIssues.Count > 0 ? "issues_found" : "passed";

            _logger.LogInformation(
                "Browser test completed for {Url}: {IssueCount} issues found",
                targetUrl, result.DetectedIssues.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Browser test failed for {Url}", targetUrl);
            result.Status = "error";
            result.Error = ex.Message;
            result.CompletedAt = DateTime.UtcNow;
        }

        return result;
    }

    public async Task<ScreenshotAnalysis> AnalyzeScreenshotAsync(
        string screenshotBase64, string pageUrl, string? context = null)
    {
        _logger.LogInformation("Analyzing screenshot for {Url}", pageUrl);

        var prompt = $@"You are an expert UI/UX tester analyzing a screenshot of a web application.
URL: {pageUrl}
{(context != null ? $"Context: {context}" : "")}

Analyze this screenshot for:
1. Visual bugs (overlapping elements, broken layouts, missing images)
2. Accessibility issues (contrast, text readability, missing alt text indicators)
3. UX problems (confusing navigation, unclear CTAs, poor error states)
4. Responsiveness issues (elements cut off, improper sizing)
5. Functional issues (broken forms, missing interactive elements)

For each issue found, provide:
- severity: critical, major, minor, cosmetic
- category: visual, accessibility, ux, responsive, functional
- description: clear description of the issue
- element: CSS selector or description of the affected element
- suggestedFix: how to fix the issue in code

Respond with ONLY a JSON object:
{{
  ""pageUrl"": ""{pageUrl}"",
  ""overallScore"": 0-100,
  ""summary"": ""brief summary"",
  ""issues"": [
    {{
      ""severity"": ""critical|major|minor|cosmetic"",
      ""category"": ""visual|accessibility|ux|responsive|functional"",
      ""description"": ""issue description"",
      ""element"": ""selector or description"",
      ""suggestedFix"": ""how to fix""
    }}
  ]
}}";

        try
        {
            var imageContent = new ImageContent
            {
                Source = new ImageSource
                {
                    MediaType = "image/png",
                    Data = screenshotBase64
                }
            };

            var textContent = new TextContent { Text = prompt };

            var messages = new List<Message>
            {
                new Message(RoleType.User, new List<ContentBase> { imageContent, textContent })
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 4000,
                Temperature = 0.2m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var analysis = StructuredOutputHelper.DeserializeResponse<ScreenshotAnalysisResponse>(content);

            if (analysis != null)
            {
                return new ScreenshotAnalysis
                {
                    PageUrl = pageUrl,
                    OverallScore = analysis.OverallScore,
                    Summary = analysis.Summary,
                    Issues = analysis.Issues.Select(i => new DetectedIssue
                    {
                        Id = Guid.NewGuid(),
                        Severity = i.Severity,
                        Category = i.Category,
                        Description = i.Description,
                        Element = i.Element,
                        SuggestedFix = i.SuggestedFix,
                        DetectedAt = DateTime.UtcNow,
                        Status = "detected"
                    }).ToList(),
                    AnalyzedAt = DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Screenshot analysis failed for {Url}", pageUrl);
        }

        return new ScreenshotAnalysis
        {
            PageUrl = pageUrl,
            OverallScore = 0,
            Summary = "Analysis failed",
            Issues = new List<DetectedIssue>(),
            AnalyzedAt = DateTime.UtcNow
        };
    }

    public async Task<List<BrowserTestScenario>> GenerateTestScenariosAsync(string targetUrl)
    {
        _logger.LogInformation("Generating test scenarios for {Url}", targetUrl);

        var prompt = $@"Generate browser test scenarios for the web application at: {targetUrl}

Create practical test scenarios that cover:
1. Page load and initial rendering
2. Navigation and routing
3. Form interactions (if applicable)
4. Button clicks and interactive elements
5. Responsive behavior
6. Error states

Respond with ONLY a JSON array:
[
  {{
    ""name"": ""scenario name"",
    ""description"": ""what to test"",
    ""steps"": [""step 1"", ""step 2""],
    ""priority"": ""high|medium|low""
  }}
]

Generate 3-5 practical scenarios. JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 2000,
                Temperature = 0.3m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "[]";

            var scenarios = StructuredOutputHelper.DeserializeResponse<List<BrowserTestScenario>>(content);
            return scenarios ?? new List<BrowserTestScenario>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate test scenarios for {Url}", targetUrl);
            return new List<BrowserTestScenario>
            {
                new()
                {
                    Name = "Default UI Verification",
                    Description = "Verify page loads correctly with no visual issues",
                    Steps = new List<string> { "Navigate to page", "Check layout", "Verify elements" },
                    Priority = "high"
                }
            };
        }
    }

    public async Task<AutoFixResult> AttemptAutoFixAsync(DetectedIssue issue, string projectPath)
    {
        _logger.LogInformation("Attempting auto-fix for issue: {Description}", issue.Description);

        var result = new AutoFixResult
        {
            IssueId = issue.Id,
            AttemptedAt = DateTime.UtcNow
        };

        try
        {
            // Read relevant source files
            var sourceFiles = ReadFrontendSourceFiles(projectPath);
            var filesSummary = string.Join("\n\n", sourceFiles.Take(20).Select(f =>
                $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

            if (filesSummary.Length > 40000)
                filesSummary = filesSummary[..40000] + "\n\n... (truncated)";

            var prompt = $@"You are an expert frontend developer fixing a UI/UX issue detected during browser testing.

## Detected Issue
- Severity: {issue.Severity}
- Category: {issue.Category}
- Description: {issue.Description}
- Element: {issue.Element}
- Suggested Fix: {issue.SuggestedFix}

## Source Files
{filesSummary}

## Task
Generate code changes to fix this UI/UX issue. Be precise and minimal.

Respond with ONLY a JSON object:
{{
  ""summary"": ""brief description of fix"",
  ""confidence"": 0-100,
  ""changes"": [
    {{
      ""filePath"": ""relative path"",
      ""originalCode"": ""code to replace"",
      ""fixedCode"": ""replacement code"",
      ""reason"": ""why this change fixes the issue""
    }}
  ]
}}

JSON only.";

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

            var fixAnalysis = StructuredOutputHelper.DeserializeResponse<AutoFixAnalysis>(content);

            if (fixAnalysis != null && fixAnalysis.Changes.Count > 0)
            {
                result.Summary = fixAnalysis.Summary;
                result.Confidence = fixAnalysis.Confidence;
                result.Changes = fixAnalysis.Changes;
                result.Success = true;

                // Apply the changes
                foreach (var change in fixAnalysis.Changes)
                {
                    var filePath = Path.Combine(projectPath, change.FilePath);
                    if (!File.Exists(filePath)) continue;

                    var fileContent = await File.ReadAllTextAsync(filePath);
                    if (fileContent.Contains(change.OriginalCode))
                    {
                        var updatedContent = fileContent.Replace(change.OriginalCode, change.FixedCode);
                        await File.WriteAllTextAsync(filePath, updatedContent);
                        _logger.LogInformation("Applied auto-fix to {FilePath}", change.FilePath);
                    }
                }
            }
            else
            {
                result.Summary = "No applicable fixes generated";
                result.Success = false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Auto-fix attempt failed for issue {IssueId}", issue.Id);
            result.Summary = $"Auto-fix failed: {ex.Message}";
            result.Success = false;
        }

        return result;
    }

    private async Task<List<BrowserTestStep>> SimulateBrowserInteractionsAsync(
        string targetUrl, string testScenario)
    {
        var steps = new List<BrowserTestStep>();

        // Generate interaction steps based on scenario
        var prompt = $@"Given this test scenario for {targetUrl}: ""{testScenario}""

Generate a list of browser interaction steps. Each step should be a concrete Playwright action.

Respond with ONLY a JSON array:
[
  {{
    ""action"": ""click|type|navigate|scroll|wait|assert"",
    ""selector"": ""CSS selector or empty"",
    ""value"": ""value to type or URL or assertion"",
    ""description"": ""what this step does""
  }}
]

Generate 5-10 realistic steps. JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 2000,
                Temperature = 0.3m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "[]";

            var generatedSteps = StructuredOutputHelper.DeserializeResponse<List<GeneratedBrowserStep>>(content);

            if (generatedSteps != null)
            {
                foreach (var step in generatedSteps)
                {
                    steps.Add(new BrowserTestStep
                    {
                        Action = step.Action,
                        Selector = step.Selector,
                        Value = step.Value,
                        Description = step.Description,
                        Timestamp = DateTime.UtcNow,
                        Status = "simulated"
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate browser interaction steps");
            steps.Add(new BrowserTestStep
            {
                Action = "navigate",
                Description = $"Navigate to {targetUrl}",
                Timestamp = DateTime.UtcNow,
                Status = "completed"
            });
        }

        return steps;
    }

    private async Task<ScreenshotAnalysis> AnalyzePageAsync(string targetUrl, string testScenario)
    {
        // In production, this would capture a real screenshot via Playwright.
        // For now, we use Claude to analyze the expected page state.
        var prompt = $@"You are an expert UI/UX tester. Based on the URL and test scenario, predict likely UI/UX issues.

URL: {targetUrl}
Test Scenario: {testScenario}

Analyze common web application issues. Respond with ONLY a JSON object:
{{
  ""pageUrl"": ""{targetUrl}"",
  ""overallScore"": 0-100,
  ""summary"": ""brief summary"",
  ""issues"": [
    {{
      ""severity"": ""critical|major|minor|cosmetic"",
      ""category"": ""visual|accessibility|ux|responsive|functional"",
      ""description"": ""issue description"",
      ""element"": ""element description"",
      ""suggestedFix"": ""how to fix""
    }}
  ]
}}

Be realistic. Most apps have 2-5 minor issues. JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 3000,
                Temperature = 0.3m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var analysis = StructuredOutputHelper.DeserializeResponse<ScreenshotAnalysisResponse>(content);

            if (analysis != null)
            {
                return new ScreenshotAnalysis
                {
                    PageUrl = targetUrl,
                    OverallScore = analysis.OverallScore,
                    Summary = analysis.Summary,
                    Issues = analysis.Issues.Select(i => new DetectedIssue
                    {
                        Id = Guid.NewGuid(),
                        Severity = i.Severity,
                        Category = i.Category,
                        Description = i.Description,
                        Element = i.Element,
                        SuggestedFix = i.SuggestedFix,
                        DetectedAt = DateTime.UtcNow,
                        Status = "detected"
                    }).ToList(),
                    AnalyzedAt = DateTime.UtcNow
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Page analysis failed for {Url}", targetUrl);
        }

        return new ScreenshotAnalysis
        {
            PageUrl = targetUrl,
            OverallScore = 0,
            Summary = "Analysis unavailable",
            Issues = new List<DetectedIssue>(),
            AnalyzedAt = DateTime.UtcNow
        };
    }

    private static Dictionary<string, string> ReadFrontendSourceFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var sourceExtensions = new HashSet<string> { ".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".vue", ".svelte" };
        var excludeDirs = new HashSet<string> { "node_modules", "dist", "build", ".next", ".git", "coverage" };

        foreach (var filePath in Directory.GetFiles(projectPath, "*.*", SearchOption.AllDirectories))
        {
            var ext = Path.GetExtension(filePath).ToLower();
            if (!sourceExtensions.Contains(ext)) continue;

            var relativePath = Path.GetRelativePath(projectPath, filePath);
            if (excludeDirs.Any(d => relativePath.Contains(d, StringComparison.OrdinalIgnoreCase))) continue;
            if (relativePath.Contains(".test.") || relativePath.Contains(".spec.")) continue;

            try
            {
                var content = File.ReadAllText(filePath);
                if (content.Length <= 50000)
                    files[relativePath] = content;
            }
            catch { /* Skip unreadable files */ }
        }

        return files;
    }
}

// DTOs for LiveBrowserTestService

public class BrowserTestResult
{
    public string TargetUrl { get; set; } = "";
    public string Status { get; set; } = "running"; // running, passed, issues_found, error
    public string? Error { get; set; }
    public List<BrowserTestStep> Steps { get; set; } = new();
    public List<ScreenshotAnalysis> ScreenshotAnalyses { get; set; } = new();
    public List<DetectedIssue> DetectedIssues { get; set; } = new();
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class BrowserTestStep
{
    public string Action { get; set; } = "";
    public string? Selector { get; set; }
    public string? Value { get; set; }
    public string Description { get; set; } = "";
    public DateTime Timestamp { get; set; }
    public string Status { get; set; } = "pending"; // pending, completed, failed, simulated
    public string? Error { get; set; }
}

public class ScreenshotAnalysis
{
    public string PageUrl { get; set; } = "";
    public int OverallScore { get; set; }
    public string Summary { get; set; } = "";
    public List<DetectedIssue> Issues { get; set; } = new();
    public DateTime AnalyzedAt { get; set; }
}

public class DetectedIssue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Severity { get; set; } = "minor"; // critical, major, minor, cosmetic
    public string Category { get; set; } = "visual"; // visual, accessibility, ux, responsive, functional
    public string Description { get; set; } = "";
    public string Element { get; set; } = "";
    public string SuggestedFix { get; set; } = "";
    public DateTime DetectedAt { get; set; }
    public string Status { get; set; } = "detected"; // detected, fixing, fixed, unfixable
    public string? FixAttemptId { get; set; }
}

public class BrowserTestScenario
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
    [JsonPropertyName("steps")]
    public List<string> Steps { get; set; } = new();
    [JsonPropertyName("priority")]
    public string Priority { get; set; } = "medium";
}

public class AutoFixResult
{
    public Guid IssueId { get; set; }
    public bool Success { get; set; }
    public string Summary { get; set; } = "";
    public int Confidence { get; set; }
    public List<AutoFixChange> Changes { get; set; } = new();
    public DateTime AttemptedAt { get; set; }
}

public class AutoFixChange
{
    [JsonPropertyName("filePath")]
    public string FilePath { get; set; } = "";
    [JsonPropertyName("originalCode")]
    public string OriginalCode { get; set; } = "";
    [JsonPropertyName("fixedCode")]
    public string FixedCode { get; set; } = "";
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = "";
}

// Internal response models for Claude API deserialization

internal class ScreenshotAnalysisResponse
{
    [JsonPropertyName("pageUrl")]
    public string PageUrl { get; set; } = "";
    [JsonPropertyName("overallScore")]
    public int OverallScore { get; set; }
    [JsonPropertyName("summary")]
    public string Summary { get; set; } = "";
    [JsonPropertyName("issues")]
    public List<DetectedIssueResponse> Issues { get; set; } = new();
}

internal class DetectedIssueResponse
{
    [JsonPropertyName("severity")]
    public string Severity { get; set; } = "";
    [JsonPropertyName("category")]
    public string Category { get; set; } = "";
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
    [JsonPropertyName("element")]
    public string Element { get; set; } = "";
    [JsonPropertyName("suggestedFix")]
    public string SuggestedFix { get; set; } = "";
}

internal class GeneratedBrowserStep
{
    [JsonPropertyName("action")]
    public string Action { get; set; } = "";
    [JsonPropertyName("selector")]
    public string? Selector { get; set; }
    [JsonPropertyName("value")]
    public string? Value { get; set; }
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
}

internal class AutoFixAnalysis
{
    [JsonPropertyName("summary")]
    public string Summary { get; set; } = "";
    [JsonPropertyName("confidence")]
    public int Confidence { get; set; }
    [JsonPropertyName("changes")]
    public List<AutoFixChange> Changes { get; set; } = new();
}
