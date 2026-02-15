using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ILiveBrowserTestRunner
{
    Task<BrowserTestSession> RunVisionTestAsync(Guid executionId, string targetUrl, int iterationNumber);
    Task<List<BrowserTestSession>> GetSessionsAsync(Guid executionId);
    Task<VisionAnalysisResult> AnalyzeScreenshotAsync(string screenshotBase64, string pageUrl, string? previousIssues = null);
}

public class LiveBrowserTestRunner : ILiveBrowserTestRunner
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<LiveBrowserTestRunner> _logger;

    public LiveBrowserTestRunner(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<LiveBrowserTestRunner> logger)
    {
        _context = context;
        _logger = logger;

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<BrowserTestSession> RunVisionTestAsync(Guid executionId, string targetUrl, int iterationNumber)
    {
        var session = new BrowserTestSession
        {
            ExecutionId = executionId,
            IterationNumber = iterationNumber,
            PageUrl = targetUrl,
            Status = "navigating",
        };

        _context.BrowserTestSessions.Add(session);
        await _context.SaveChangesAsync();

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            _logger.LogInformation(
                "Starting vision test for execution {ExecutionId}, iteration {Iteration}, URL: {Url}",
                executionId, iterationNumber, targetUrl);

            // Step 1: Capture screenshot via Playwright headless browser
            session.Status = "screenshotting";
            await _context.SaveChangesAsync();

            var screenshotBase64 = await CaptureScreenshotAsync(targetUrl);
            session.ScreenshotBase64 = screenshotBase64;

            // Step 2: Analyze with Claude Vision API
            session.Status = "analyzing";
            await _context.SaveChangesAsync();

            var analysis = await AnalyzeScreenshotAsync(screenshotBase64, targetUrl);
            session.VisionAnalysisJson = JsonSerializer.Serialize(analysis);
            session.IssuesJson = JsonSerializer.Serialize(analysis.Issues);
            session.IssuesFound = analysis.Issues.Count;
            session.ConfidenceScore = analysis.OverallConfidence;

            // Step 3: Generate fixes if issues found
            if (analysis.Issues.Count > 0)
            {
                session.Status = "fixing";
                await _context.SaveChangesAsync();

                var fixes = await GenerateFixesAsync(analysis.Issues, targetUrl);
                session.FixesJson = JsonSerializer.Serialize(fixes);
                session.IssuesResolved = fixes.Count(f => f.Confidence >= 70);
            }

            session.Status = "completed";
            stopwatch.Stop();
            session.DurationMs = stopwatch.ElapsedMilliseconds;
            session.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Vision test completed for execution {ExecutionId}, iteration {Iteration}: {IssuesFound} issues found, {IssuesResolved} resolved",
                executionId, iterationNumber, session.IssuesFound, session.IssuesResolved);

            return session;
        }
        catch (Exception ex)
        {
            session.Status = "failed";
            stopwatch.Stop();
            session.DurationMs = stopwatch.ElapsedMilliseconds;
            await _context.SaveChangesAsync();

            _logger.LogError(ex,
                "Vision test failed for execution {ExecutionId}, iteration {Iteration}",
                executionId, iterationNumber);

            throw;
        }
    }

    public async Task<List<BrowserTestSession>> GetSessionsAsync(Guid executionId)
    {
        return await _context.BrowserTestSessions
            .Where(s => s.ExecutionId == executionId)
            .OrderBy(s => s.IterationNumber)
            .ToListAsync();
    }

    public async Task<VisionAnalysisResult> AnalyzeScreenshotAsync(
        string screenshotBase64,
        string pageUrl,
        string? previousIssues = null)
    {
        var previousContext = !string.IsNullOrEmpty(previousIssues)
            ? $"\n\n## Previously Detected Issues (check if fixed)\n{previousIssues}"
            : "";

        var prompt = $@"You are an expert UI/UX quality analyst. Analyze this screenshot of a web application at URL: {pageUrl}

Detect ALL visual and functional issues including:
1. **Layout Issues**: Overlapping elements, broken alignment, missing spacing, overflow
2. **Visual Bugs**: Wrong colors, missing images, broken icons, text truncation
3. **Accessibility**: Missing contrast, too-small text, no focus indicators
4. **Responsive Issues**: Elements not fitting viewport, horizontal scroll
5. **Functional Concerns**: Empty states, loading spinners stuck, error messages visible
6. **UI/UX Problems**: Confusing navigation, inconsistent styling, poor hierarchy{previousContext}

Respond with ONLY a JSON object:
{{
  ""overallScore"": 0-100,
  ""overallConfidence"": 0-100,
  ""summary"": ""brief summary of findings"",
  ""issues"": [
    {{
      ""id"": ""unique issue id"",
      ""severity"": ""critical|high|medium|low"",
      ""category"": ""layout|visual|accessibility|responsive|functional|ux"",
      ""description"": ""what the issue is"",
      ""location"": ""where on the page (e.g., top-right nav, hero section)"",
      ""suggestedFix"": ""how to fix it in code"",
      ""confidence"": 0-100
    }}
  ],
  ""passedChecks"": [""list of things that look correct""]
}}

Be thorough but realistic. Only report actual issues visible in the screenshot. JSON only.";

        try
        {
            var imageContent = new ImageContent
            {
                Source = new ImageSource
                {
                    Type = "base64",
                    MediaType = "image/png",
                    Data = screenshotBase64
                }
            };

            var textContent = new TextContent { Text = prompt };
            var message = new Message(RoleType.User, new List<ContentBase> { imageContent, textContent });

            var parameters = new MessageParameters
            {
                Messages = new List<Message> { message },
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 4000,
                Temperature = 0.2m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var analysis = StructuredOutputHelper.DeserializeResponse<VisionAnalysisResult>(content);

            if (analysis != null)
            {
                _logger.LogInformation(
                    "Vision analysis completed: score {Score}, {IssueCount} issues found",
                    analysis.OverallScore, analysis.Issues.Count);
                return analysis;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude Vision API analysis failed for URL {Url}", pageUrl);
        }

        return new VisionAnalysisResult
        {
            Summary = "Vision analysis could not be completed.",
            OverallScore = 0,
            OverallConfidence = 0,
        };
    }

    private async Task<string> CaptureScreenshotAsync(string targetUrl)
    {
        // In production, this would use Playwright to capture a real screenshot.
        // For now, we generate a placeholder to demonstrate the pipeline.
        _logger.LogInformation("Capturing screenshot for URL: {Url}", targetUrl);

        // Simulate Playwright screenshot capture
        await Task.Delay(100); // Simulate browser navigation time

        // Return a minimal 1x1 PNG as placeholder
        // In production: var browser = await playwright.Chromium.LaunchAsync();
        // var page = await browser.NewPageAsync(); await page.GotoAsync(targetUrl);
        // var screenshot = await page.ScreenshotAsync(new() { FullPage = true });
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    private async Task<List<AutoFix>> GenerateFixesAsync(List<VisionIssue> issues, string pageUrl)
    {
        var issuesSummary = string.Join("\n", issues.Select((i, idx) =>
            $"{idx + 1}. [{i.Severity}] {i.Category}: {i.Description} (at {i.Location})\n   Suggested: {i.SuggestedFix}"));

        var prompt = $@"You are an expert frontend developer. Generate code fixes for the following UI issues detected on {pageUrl}:

{issuesSummary}

For each issue, provide a concrete code fix. Respond with ONLY a JSON array:
[
  {{
    ""issueId"": ""matching issue id"",
    ""fixType"": ""css|html|component|layout"",
    ""description"": ""what the fix does"",
    ""codeChange"": ""the actual code change"",
    ""filePath"": ""likely file path"",
    ""confidence"": 0-100
  }}
]

Only generate fixes you are confident about. JSON only.";

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
            var content = response.Content.FirstOrDefault()?.ToString() ?? "[]";

            var fixes = StructuredOutputHelper.DeserializeResponse<List<AutoFix>>(content);
            return fixes ?? new List<AutoFix>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fix generation failed for {IssueCount} issues", issues.Count);
            return new List<AutoFix>();
        }
    }
}

public class VisionAnalysisResult
{
    public int OverallScore { get; set; }
    public decimal OverallConfidence { get; set; }
    public string Summary { get; set; } = "";
    public List<VisionIssue> Issues { get; set; } = new();
    public List<string> PassedChecks { get; set; } = new();
}

public class VisionIssue
{
    public string Id { get; set; } = "";
    public string Severity { get; set; } = ""; // critical, high, medium, low
    public string Category { get; set; } = ""; // layout, visual, accessibility, responsive, functional, ux
    public string Description { get; set; } = "";
    public string Location { get; set; } = "";
    public string SuggestedFix { get; set; } = "";
    public int Confidence { get; set; }
}

public class AutoFix
{
    public string IssueId { get; set; } = "";
    public string FixType { get; set; } = ""; // css, html, component, layout
    public string Description { get; set; } = "";
    public string CodeChange { get; set; } = "";
    public string FilePath { get; set; } = "";
    public int Confidence { get; set; }
}
