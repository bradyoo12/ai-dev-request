using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface ICodeReviewService
{
    Task<CodeReviewResult> ReviewProjectAsync(string projectPath, string projectType);
}

public class CodeReviewService : ICodeReviewService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<CodeReviewService> _logger;

    public CodeReviewService(IConfiguration configuration, ILogger<CodeReviewService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _logger = logger;
    }

    public async Task<CodeReviewResult> ReviewProjectAsync(string projectPath, string projectType)
    {
        _logger.LogInformation("Starting AI code review for project at {Path} (type: {Type})", projectPath, projectType);

        var sourceFiles = ReadSourceFiles(projectPath);
        if (sourceFiles.Count == 0)
        {
            return new CodeReviewResult
            {
                OverallScore = 100,
                SecurityScore = 100,
                PerformanceScore = 100,
                QualityScore = 100,
                Summary = "No source files found to review."
            };
        }

        var filesSummary = string.Join("\n\n", sourceFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        var prompt = $@"You are a senior code reviewer specializing in security, performance, and code quality. Review the following {projectType} project thoroughly.

## Source Files
{filesSummary}

## Review Criteria

### Security (OWASP Top 10)
- XSS vulnerabilities (unescaped user input in HTML)
- SQL/NoSQL injection risks
- Insecure authentication patterns
- Sensitive data exposure (hardcoded secrets, API keys)
- CSRF vulnerabilities
- Insecure dependencies or imports

### Performance
- N+1 query patterns
- Unnecessary re-renders (React)
- Missing memoization for expensive computations
- Large bundle imports that could be tree-shaken
- Missing pagination for list queries
- Synchronous blocking operations

### Code Quality
- Dead code or unused imports
- Inconsistent naming conventions
- Missing error handling or empty catch blocks
- Code duplication
- Overly complex functions (high cyclomatic complexity)
- Missing type safety

Respond in JSON format:
{{
  ""overallScore"": 0-100,
  ""securityScore"": 0-100,
  ""performanceScore"": 0-100,
  ""qualityScore"": 0-100,
  ""summary"": ""brief overall assessment"",
  ""issues"": [
    {{
      ""category"": ""security|performance|quality"",
      ""severity"": ""critical|high|medium|low"",
      ""title"": ""short issue title"",
      ""description"": ""detailed description"",
      ""file"": ""file path"",
      ""line"": ""approximate line number or range"",
      ""suggestion"": ""how to fix""
    }}
  ]
}}

Be thorough but practical. Only report real issues found in the code. JSON only.";

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

            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                content = content[jsonStart..(jsonEnd + 1)];
            }

            var result = JsonSerializer.Deserialize<CodeReviewResult>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result != null)
            {
                _logger.LogInformation(
                    "Code review completed: overall {Overall}, security {Security}, performance {Perf}, quality {Quality}, {IssueCount} issues",
                    result.OverallScore, result.SecurityScore, result.PerformanceScore,
                    result.QualityScore, result.Issues.Count);
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Code review failed");
        }

        return new CodeReviewResult
        {
            OverallScore = 70,
            SecurityScore = 70,
            PerformanceScore = 70,
            QualityScore = 70,
            Summary = "Code review could not be completed."
        };
    }

    private Dictionary<string, string> ReadSourceFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var sourceExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".cs", ".py",
            ".vue", ".svelte", ".sql", ".graphql"
        };

        var excludeDirs = new HashSet<string>
        {
            "node_modules", "dist", "build", ".next", "bin", "obj",
            "__pycache__", ".pytest_cache", "coverage"
        };

        foreach (var filePath in Directory.GetFiles(projectPath, "*.*", SearchOption.AllDirectories))
        {
            var ext = Path.GetExtension(filePath).ToLower();
            if (!sourceExtensions.Contains(ext)) continue;

            var relativePath = Path.GetRelativePath(projectPath, filePath);
            if (excludeDirs.Any(d => relativePath.Contains(d, StringComparison.OrdinalIgnoreCase))) continue;

            // Skip test files for the review (they have their own quality criteria)
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
            catch { }
        }

        return files;
    }
}

public class CodeReviewResult
{
    public int OverallScore { get; set; }
    public int SecurityScore { get; set; }
    public int PerformanceScore { get; set; }
    public int QualityScore { get; set; }
    public string Summary { get; set; } = "";
    public List<CodeReviewIssue> Issues { get; set; } = new();
}

public class CodeReviewIssue
{
    public string Category { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? File { get; set; }
    public string? Line { get; set; }
    public string? Suggestion { get; set; }
}
