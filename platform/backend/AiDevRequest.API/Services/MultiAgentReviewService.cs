using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Services;

public interface IMultiAgentReviewService
{
    Task<MultiAgentReviewResult> RunParallelReviewAsync(string projectPath, string projectType, int projectId);
    int ComputeRiskScore(MultiAgentReviewResult result);
    List<TestSuggestion> GenerateTestSuggestions(MultiAgentReviewResult result);
}

public class MultiAgentReviewService : IMultiAgentReviewService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<MultiAgentReviewService> _logger;

    public MultiAgentReviewService(IConfiguration configuration, ILogger<MultiAgentReviewService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _logger = logger;
    }

    public async Task<MultiAgentReviewResult> RunParallelReviewAsync(string projectPath, string projectType, int projectId)
    {
        _logger.LogInformation("Starting multi-agent review for project {ProjectId} at {Path}", projectId, projectPath);

        var sourceFiles = ReadSourceFiles(projectPath);
        if (sourceFiles.Count == 0)
        {
            return new MultiAgentReviewResult
            {
                ProjectId = projectId,
                Status = "completed",
                CompositeRiskScore = 0,
                AgentResults = new List<AgentReviewResult>()
            };
        }

        var filesSummary = string.Join("\n\n", sourceFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        // Read project architecture context from design.md if available
        var designContext = ReadDesignContext(projectPath);

        // Run specialized agents in parallel
        var tasks = new[]
        {
            RunSecurityAgentAsync(filesSummary, designContext),
            RunPerformanceAgentAsync(filesSummary, designContext),
            RunArchitectureAgentAsync(filesSummary, designContext),
            RunTestingAgentAsync(filesSummary, designContext)
        };

        var agentResults = await Task.WhenAll(tasks);

        // Compute composite risk score
        var result = new MultiAgentReviewResult
        {
            ProjectId = projectId,
            Status = "completed",
            AgentResults = agentResults.ToList()
        };

        result.CompositeRiskScore = ComputeRiskScore(result);
        result.TestSuggestions = GenerateTestSuggestions(result);

        _logger.LogInformation(
            "Multi-agent review completed for project {ProjectId}. Risk score: {RiskScore}",
            projectId, result.CompositeRiskScore);

        return result;
    }

    private async Task<AgentReviewResult> RunSecurityAgentAsync(string filesSummary, string designContext)
    {
        var prompt = $@"You are a security-focused code review agent specializing in OWASP Top 10 and secure coding practices.

## Project Architecture Context
{designContext}

## Source Files
{filesSummary}

Review the code for security vulnerabilities:
- XSS vulnerabilities (unescaped user input)
- SQL/NoSQL injection risks
- Authentication/authorization flaws
- Sensitive data exposure (hardcoded secrets, API keys)
- CSRF vulnerabilities
- Insecure dependencies
- Missing input validation
- Weak cryptography

Respond in JSON format:
{{
  ""agentType"": ""Security"",
  ""riskScore"": 0-100,
  ""findings"": [
    {{
      ""severity"": ""critical|high|medium|low"",
      ""title"": ""short issue title"",
      ""description"": ""detailed description"",
      ""file"": ""file path"",
      ""line"": ""line number or range"",
      ""suggestion"": ""how to fix""
    }}
  ],
  ""summary"": ""brief assessment""
}}

Higher risk score = more/severe security issues found. JSON only.";

        return await ExecuteAgentAsync("Security", prompt);
    }

    private async Task<AgentReviewResult> RunPerformanceAgentAsync(string filesSummary, string designContext)
    {
        var prompt = $@"You are a performance optimization specialist reviewing code for efficiency issues.

## Project Architecture Context
{designContext}

## Source Files
{filesSummary}

Review the code for performance issues:
- N+1 query patterns
- Unnecessary re-renders (React/UI frameworks)
- Missing memoization for expensive computations
- Large bundle imports that could be tree-shaken
- Missing pagination for list queries
- Synchronous blocking operations
- Memory leaks
- Inefficient algorithms
- Unoptimized database queries

Respond in JSON format:
{{
  ""agentType"": ""Performance"",
  ""riskScore"": 0-100,
  ""findings"": [
    {{
      ""severity"": ""critical|high|medium|low"",
      ""title"": ""short issue title"",
      ""description"": ""detailed description"",
      ""file"": ""file path"",
      ""line"": ""line number or range"",
      ""suggestion"": ""how to fix""
    }}
  ],
  ""summary"": ""brief assessment""
}}

Higher risk score = more/severe performance issues found. JSON only.";

        return await ExecuteAgentAsync("Performance", prompt);
    }

    private async Task<AgentReviewResult> RunArchitectureAgentAsync(string filesSummary, string designContext)
    {
        var prompt = $@"You are a software architect reviewing code for design and architecture issues.

## Project Architecture Context
{designContext}

## Source Files
{filesSummary}

Review the code for architectural issues:
- Violation of design patterns and principles (SOLID, DRY, KISS)
- Circular dependencies
- Poor separation of concerns
- Tight coupling between modules
- Inconsistent file/folder structure
- Missing abstraction layers
- Overly complex components (high cyclomatic complexity)
- Inconsistent naming conventions
- Poor error handling architecture

Respond in JSON format:
{{
  ""agentType"": ""Architecture"",
  ""riskScore"": 0-100,
  ""findings"": [
    {{
      ""severity"": ""critical|high|medium|low"",
      ""title"": ""short issue title"",
      ""description"": ""detailed description"",
      ""file"": ""file path"",
      ""line"": ""line number or range"",
      ""suggestion"": ""how to fix""
    }}
  ],
  ""summary"": ""brief assessment""
}}

Higher risk score = more/severe architectural issues found. JSON only.";

        return await ExecuteAgentAsync("Architecture", prompt);
    }

    private async Task<AgentReviewResult> RunTestingAgentAsync(string filesSummary, string designContext)
    {
        var prompt = $@"You are a testing specialist reviewing code for test coverage and quality.

## Project Architecture Context
{designContext}

## Source Files
{filesSummary}

Review the code for testing issues:
- Missing test files for critical code paths
- Low test coverage for business logic
- Missing edge case tests
- Missing error handling tests
- Untested API endpoints
- Missing integration tests
- Incomplete mocking/stubbing
- Flaky test patterns

Identify untested code paths and suggest specific test cases to add.

Respond in JSON format:
{{
  ""agentType"": ""Testing"",
  ""riskScore"": 0-100,
  ""findings"": [
    {{
      ""severity"": ""critical|high|medium|low"",
      ""title"": ""short issue title"",
      ""description"": ""detailed description"",
      ""file"": ""file path"",
      ""line"": ""line number or range"",
      ""suggestion"": ""what tests to add""
    }}
  ],
  ""summary"": ""brief assessment"",
  ""untestedPaths"": [
    {{
      ""file"": ""file path"",
      ""function"": ""function name"",
      ""reason"": ""why this needs tests""
    }}
  ]
}}

Higher risk score = more untested code paths. JSON only.";

        return await ExecuteAgentAsync("Testing", prompt);
    }

    private async Task<AgentReviewResult> ExecuteAgentAsync(string agentType, string prompt)
    {
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

            var result = StructuredOutputHelper.DeserializeResponse<AgentReviewResult>(content);

            if (result != null)
            {
                result.AgentType = agentType;
                result.Status = "completed";
                result.CompletedAt = DateTime.UtcNow;
                _logger.LogInformation(
                    "{AgentType} agent completed: risk score {RiskScore}, {FindingsCount} findings",
                    agentType, result.RiskScore, result.Findings.Count);
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "{AgentType} agent failed", agentType);
        }

        // Return fallback result on error
        return new AgentReviewResult
        {
            AgentType = agentType,
            Status = "failed",
            RiskScore = 50,
            Findings = new List<AgentFinding>(),
            Summary = $"{agentType} review could not be completed."
        };
    }

    public int ComputeRiskScore(MultiAgentReviewResult result)
    {
        // Aggregate risk scores from all agents
        var agentScores = result.AgentResults.Select(a => a.RiskScore).ToList();
        if (!agentScores.Any()) return 0;

        // Weighted average: Security and Testing are more critical
        var securityScore = result.AgentResults.FirstOrDefault(a => a.AgentType == "Security")?.RiskScore ?? 0;
        var performanceScore = result.AgentResults.FirstOrDefault(a => a.AgentType == "Performance")?.RiskScore ?? 0;
        var architectureScore = result.AgentResults.FirstOrDefault(a => a.AgentType == "Architecture")?.RiskScore ?? 0;
        var testingScore = result.AgentResults.FirstOrDefault(a => a.AgentType == "Testing")?.RiskScore ?? 0;

        // Weights: Security 35%, Testing 30%, Architecture 20%, Performance 15%
        var compositeRisk = (int)Math.Round(
            securityScore * 0.35 +
            testingScore * 0.30 +
            architectureScore * 0.20 +
            performanceScore * 0.15
        );

        return Math.Clamp(compositeRisk, 0, 100);
    }

    public List<TestSuggestion> GenerateTestSuggestions(MultiAgentReviewResult result)
    {
        var suggestions = new List<TestSuggestion>();

        var testingAgent = result.AgentResults.FirstOrDefault(a => a.AgentType == "Testing");
        if (testingAgent?.UntestedPaths == null) return suggestions;

        foreach (var path in testingAgent.UntestedPaths)
        {
            suggestions.Add(new TestSuggestion
            {
                File = path.File,
                Function = path.Function,
                Reason = path.Reason,
                SuggestedTestCases = new List<string>
                {
                    $"Test {path.Function} with valid input",
                    $"Test {path.Function} with invalid/null input",
                    $"Test {path.Function} error handling",
                    $"Test {path.Function} edge cases"
                }
            });
        }

        return suggestions;
    }

    private Dictionary<string, string> ReadSourceFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var sourceExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".cs", ".py",
            ".vue", ".svelte", ".sql", ".graphql", ".go", ".java"
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

            // Skip test files for the review (they're analyzed separately by Testing agent)
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

    private string ReadDesignContext(string projectPath)
    {
        var designPaths = new[] { "design.md", ".claude/design.md", "docs/design.md", "DESIGN.md" };

        foreach (var designPath in designPaths)
        {
            var fullPath = Path.Combine(projectPath, designPath);
            if (File.Exists(fullPath))
            {
                try
                {
                    var content = File.ReadAllText(fullPath);
                    // Limit to first 5000 chars to avoid token limits
                    return content.Length > 5000 ? content[..5000] + "\n... (truncated)" : content;
                }
                catch { }
            }
        }

        return "No design.md found. Architecture context unavailable.";
    }
}

public class MultiAgentReviewResult
{
    public int ProjectId { get; set; }
    public string Status { get; set; } = "";
    public int CompositeRiskScore { get; set; }
    public List<AgentReviewResult> AgentResults { get; set; } = new();
    public List<TestSuggestion> TestSuggestions { get; set; } = new();
}

public class AgentReviewResult
{
    public string AgentType { get; set; } = "";
    public string Status { get; set; } = "pending";
    public int RiskScore { get; set; }
    public List<AgentFinding> Findings { get; set; } = new();
    public string Summary { get; set; } = "";
    public List<UntestedPath>? UntestedPaths { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class AgentFinding
{
    public string Severity { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? File { get; set; }
    public string? Line { get; set; }
    public string? Suggestion { get; set; }
}

public class UntestedPath
{
    public string File { get; set; } = "";
    public string Function { get; set; } = "";
    public string Reason { get; set; } = "";
}

public class TestSuggestion
{
    public string File { get; set; } = "";
    public string Function { get; set; } = "";
    public string Reason { get; set; } = "";
    public List<string> SuggestedTestCases { get; set; } = new();
}
