using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface IAccessibilityService
{
    Task<AccessibilityResult> AuditProjectAsync(string projectPath, string projectType);
}

public class AccessibilityService : IAccessibilityService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<AccessibilityService> _logger;

    public AccessibilityService(IConfiguration configuration, ILogger<AccessibilityService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _logger = logger;
    }

    public async Task<AccessibilityResult> AuditProjectAsync(string projectPath, string projectType)
    {
        _logger.LogInformation("Starting accessibility audit for project at {Path}", projectPath);

        var uiFiles = ReadUiFiles(projectPath);
        if (uiFiles.Count == 0)
        {
            return new AccessibilityResult
            {
                Score = 100,
                Summary = "No UI files found to audit.",
                Issues = new List<AccessibilityIssue>()
            };
        }

        var filesSummary = string.Join("\n\n", uiFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 4000 ? f.Value[..4000] + "\n... (truncated)" : f.Value)}\n```"));

        var prompt = $@"You are a WCAG 2.2 Level AA accessibility auditor. Audit the following {projectType} project UI files for accessibility issues.

## UI Files
{filesSummary}

Check for these WCAG 2.2 Level AA criteria:
1. Images without alt text
2. Color contrast issues (4.5:1 for normal text, 3:1 for large text)
3. Missing form labels
4. Interactive elements not keyboard accessible
5. Incorrect heading hierarchy (h1→h2→h3)
6. Missing or incorrect ARIA attributes
7. No visible focus indicators
8. Missing lang attribute on html element
9. Missing skip navigation for SPAs

Respond in JSON format:
{{
  ""score"": 0-100,
  ""summary"": ""brief accessibility assessment"",
  ""issues"": [
    {{
      ""severity"": ""critical|serious|moderate|minor"",
      ""wcagCriteria"": ""e.g. 1.1.1 Non-text Content"",
      ""message"": ""description of the issue"",
      ""file"": ""file path"",
      ""suggestion"": ""how to fix""
    }}
  ]
}}

Be thorough but only report real issues. Score 90-100 for excellent accessibility, 70-89 for good, 50-69 for needs improvement, below 50 for poor. JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 3000,
                Temperature = 0.2m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "{}";

            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                content = content[jsonStart..(jsonEnd + 1)];
            }

            var result = JsonSerializer.Deserialize<AccessibilityResult>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result != null)
            {
                _logger.LogInformation("Accessibility audit completed: score {Score}, {IssueCount} issues",
                    result.Score, result.Issues.Count);
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Accessibility audit failed");
        }

        return new AccessibilityResult
        {
            Score = 70,
            Summary = "Accessibility audit could not be completed.",
            Issues = new List<AccessibilityIssue>()
        };
    }

    private Dictionary<string, string> ReadUiFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var uiExtensions = new HashSet<string> { ".tsx", ".jsx", ".html", ".vue", ".svelte", ".css" };

        foreach (var filePath in Directory.GetFiles(projectPath, "*.*", SearchOption.AllDirectories))
        {
            var ext = Path.GetExtension(filePath).ToLower();
            if (!uiExtensions.Contains(ext)) continue;

            var relativePath = Path.GetRelativePath(projectPath, filePath);
            if (relativePath.Contains("node_modules") || relativePath.Contains("dist")) continue;

            try
            {
                var content = File.ReadAllText(filePath);
                if (content.Length <= 50000)
                {
                    files[relativePath] = content;
                }
            }
            catch { }
        }

        return files;
    }
}

public class AccessibilityResult
{
    public int Score { get; set; }
    public string Summary { get; set; } = "";
    public List<AccessibilityIssue> Issues { get; set; } = new();
}

public class AccessibilityIssue
{
    public string Severity { get; set; } = "";
    public string WcagCriteria { get; set; } = "";
    public string Message { get; set; } = "";
    public string? File { get; set; }
    public string? Suggestion { get; set; }
}
