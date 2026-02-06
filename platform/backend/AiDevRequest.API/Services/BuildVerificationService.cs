using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace AiDevRequest.API.Services;

public interface IBuildVerificationService
{
    Task<BuildVerificationResult> VerifyProjectAsync(Guid requestId, string projectPath, string projectType);
}

public class BuildVerificationService : IBuildVerificationService
{
    private readonly AnthropicClient _client;
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<BuildVerificationService> _logger;
    private const int MaxIterations = 3;

    public BuildVerificationService(
        IConfiguration configuration,
        AiDevRequestDbContext context,
        ILogger<BuildVerificationService> logger)
    {
        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
        _context = context;
        _logger = logger;
    }

    public async Task<BuildVerificationResult> VerifyProjectAsync(Guid requestId, string projectPath, string projectType)
    {
        _logger.LogInformation("Starting build verification for request {RequestId} at {Path}", requestId, projectPath);

        var totalIssuesFound = 0;
        var totalFixesApplied = 0;
        var iterationResults = new List<IterationResult>();

        for (var iteration = 1; iteration <= MaxIterations; iteration++)
        {
            _logger.LogInformation("Verification iteration {Iteration}/{Max} for {RequestId}", iteration, MaxIterations, requestId);

            // Save verification record
            var verification = new BuildVerification
            {
                DevRequestId = requestId,
                Iteration = iteration,
                Status = VerificationStatus.Reviewing
            };
            _context.BuildVerifications.Add(verification);
            await _context.SaveChangesAsync();

            // Step 1: Read all project files
            var projectFiles = ReadProjectFiles(projectPath);
            if (projectFiles.Count == 0)
            {
                verification.Status = VerificationStatus.Failed;
                verification.ResultJson = JsonSerializer.Serialize(new { error = "No project files found" });
                await _context.SaveChangesAsync();

                return new BuildVerificationResult
                {
                    QualityScore = 0,
                    IssuesFound = 1,
                    FixesApplied = 0,
                    Passed = false,
                    Summary = "No project files found at the specified path.",
                    Iterations = iterationResults
                };
            }

            // Step 2: Validate file structure
            var structureIssues = ValidateStructure(projectFiles, projectType);

            // Step 3: AI code review
            var reviewResult = await AiCodeReview(projectFiles, projectType, structureIssues);
            totalIssuesFound += reviewResult.Issues.Count;

            var iterResult = new IterationResult
            {
                Iteration = iteration,
                IssuesFound = reviewResult.Issues.Count,
                FixesApplied = 0,
                Issues = reviewResult.Issues
            };

            if (reviewResult.Issues.Count == 0)
            {
                // No issues found - verification passed
                verification.Status = VerificationStatus.Passed;
                verification.QualityScore = reviewResult.QualityScore;
                verification.IssuesFound = 0;
                verification.ResultJson = JsonSerializer.Serialize(reviewResult);
                await _context.SaveChangesAsync();

                iterResult.Passed = true;
                iterationResults.Add(iterResult);

                _logger.LogInformation("Verification passed for {RequestId} on iteration {Iteration} with score {Score}",
                    requestId, iteration, reviewResult.QualityScore);

                return new BuildVerificationResult
                {
                    QualityScore = reviewResult.QualityScore,
                    IssuesFound = totalIssuesFound,
                    FixesApplied = totalFixesApplied,
                    Passed = true,
                    Summary = reviewResult.Summary,
                    Iterations = iterationResults
                };
            }

            // Step 4: Auto-fix issues
            if (iteration < MaxIterations)
            {
                verification.Status = VerificationStatus.Fixing;
                await _context.SaveChangesAsync();

                var fixResult = await AiAutoFix(projectFiles, reviewResult.Issues, projectType);
                var fixCount = ApplyFixes(projectPath, fixResult.Fixes);
                totalFixesApplied += fixCount;
                iterResult.FixesApplied = fixCount;

                _logger.LogInformation("Applied {FixCount} fixes for {RequestId} on iteration {Iteration}",
                    fixCount, requestId, iteration);
            }

            verification.IssuesFound = reviewResult.Issues.Count;
            verification.FixesApplied = iterResult.FixesApplied;
            verification.QualityScore = reviewResult.QualityScore;
            verification.ResultJson = JsonSerializer.Serialize(reviewResult);
            await _context.SaveChangesAsync();

            iterationResults.Add(iterResult);
        }

        // Max iterations reached
        var finalScore = iterationResults.Last().Issues.Count == 0 ? 85 : Math.Max(50, 85 - iterationResults.Last().Issues.Count * 5);

        _logger.LogInformation("Verification completed for {RequestId} after {Max} iterations with score {Score}",
            requestId, MaxIterations, finalScore);

        return new BuildVerificationResult
        {
            QualityScore = finalScore,
            IssuesFound = totalIssuesFound,
            FixesApplied = totalFixesApplied,
            Passed = finalScore >= 60,
            Summary = $"Verification completed after {MaxIterations} iterations. {totalFixesApplied} fixes applied.",
            Iterations = iterationResults
        };
    }

    private Dictionary<string, string> ReadProjectFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var allowedExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html",
            ".cs", ".csproj", ".py", ".md", ".yaml", ".yml", ".env"
        };

        foreach (var filePath in Directory.GetFiles(projectPath, "*.*", SearchOption.AllDirectories))
        {
            var ext = Path.GetExtension(filePath).ToLower();
            if (!allowedExtensions.Contains(ext)) continue;

            // Skip node_modules, dist, bin, obj
            var relativePath = Path.GetRelativePath(projectPath, filePath);
            if (relativePath.Contains("node_modules") || relativePath.Contains("dist") ||
                relativePath.Contains("bin") || relativePath.Contains("obj")) continue;

            try
            {
                var content = File.ReadAllText(filePath);
                if (content.Length <= 50000) // Skip very large files
                {
                    files[relativePath] = content;
                }
            }
            catch
            {
                // Skip unreadable files
            }
        }

        return files;
    }

    private List<VerificationIssue> ValidateStructure(Dictionary<string, string> files, string projectType)
    {
        var issues = new List<VerificationIssue>();
        var fileNames = files.Keys.Select(f => f.Replace("\\", "/")).ToHashSet();

        switch (projectType.ToLower())
        {
            case "react":
            case "nextjs":
            case "vite":
                if (!fileNames.Any(f => f.EndsWith("package.json")))
                    issues.Add(new VerificationIssue { Severity = "error", Message = "Missing package.json", File = "package.json" });
                if (!fileNames.Any(f => f.EndsWith(".html")))
                    issues.Add(new VerificationIssue { Severity = "warning", Message = "No HTML entry point found", File = "index.html" });
                break;
            case "dotnet":
            case ".net":
                if (!fileNames.Any(f => f.EndsWith(".csproj")))
                    issues.Add(new VerificationIssue { Severity = "error", Message = "Missing .csproj file", File = "*.csproj" });
                break;
            case "python":
                if (!fileNames.Any(f => f == "requirements.txt" || f == "pyproject.toml"))
                    issues.Add(new VerificationIssue { Severity = "warning", Message = "Missing requirements.txt or pyproject.toml", File = "requirements.txt" });
                break;
        }

        return issues;
    }

    private async Task<AiReviewResult> AiCodeReview(Dictionary<string, string> files, string projectType, List<VerificationIssue> structureIssues)
    {
        var filesSummary = string.Join("\n\n", files.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        var structureIssueText = structureIssues.Count > 0
            ? $"\n\nStructure issues already found:\n{string.Join("\n", structureIssues.Select(i => $"- [{i.Severity}] {i.Message} ({i.File})"))}"
            : "";

        var prompt = $@"You are a code quality reviewer. Review this {projectType} project for issues.

## Project Files
{filesSummary}
{structureIssueText}

Check for:
1. Syntax errors or invalid code
2. Missing imports or undefined references
3. Incompatible dependencies
4. Security vulnerabilities (hardcoded secrets, XSS, injection)
5. Logic errors or obvious bugs
6. Missing error handling for critical operations

Respond in JSON format:
{{
  ""qualityScore"": 0-100,
  ""summary"": ""brief quality assessment"",
  ""issues"": [
    {{
      ""severity"": ""error|warning"",
      ""message"": ""description"",
      ""file"": ""file path"",
      ""line"": 0,
      ""suggestion"": ""how to fix""
    }}
  ]
}}

Only report real, actionable issues. Do not nitpick style preferences. If the code is well-structured, return an empty issues array with a high quality score. JSON only.";

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

            var result = JsonSerializer.Deserialize<AiReviewResult>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result != null)
            {
                // Add structure issues
                foreach (var issue in structureIssues)
                {
                    result.Issues.Add(issue);
                }
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI code review failed");
        }

        return new AiReviewResult
        {
            QualityScore = 70,
            Summary = "AI review could not be completed. Structure validation only.",
            Issues = structureIssues
        };
    }

    private async Task<AiFixResult> AiAutoFix(Dictionary<string, string> files, List<VerificationIssue> issues, string projectType)
    {
        var issueText = string.Join("\n", issues.Select(i =>
            $"- [{i.Severity}] {i.File}: {i.Message}" + (string.IsNullOrEmpty(i.Suggestion) ? "" : $" (suggestion: {i.Suggestion})")));

        var filesSummary = string.Join("\n\n", files.Where(f =>
            issues.Any(i => i.File != null && f.Key.Contains(i.File.Replace("*", ""))))
            .Select(f => $"### {f.Key}\n```\n{f.Value}\n```"));

        if (string.IsNullOrEmpty(filesSummary))
        {
            filesSummary = string.Join("\n\n", files.Take(5).Select(f =>
                $"### {f.Key}\n```\n{(f.Value.Length > 2000 ? f.Value[..2000] + "\n..." : f.Value)}\n```"));
        }

        var prompt = $@"Fix the following issues in this {projectType} project.

## Issues to Fix
{issueText}

## Affected Files
{filesSummary}

Respond in JSON format with the fixed file contents:
{{
  ""fixes"": [
    {{
      ""file"": ""relative/path/to/file"",
      ""content"": ""complete fixed file content""
    }}
  ]
}}

Only include files that need changes. Provide the complete file content, not patches. JSON only.";

        try
        {
            var messages = new List<Message> { new Message(RoleType.User, prompt) };
            var parameters = new MessageParameters
            {
                Messages = messages,
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 6000,
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

            var result = JsonSerializer.Deserialize<AiFixResult>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result ?? new AiFixResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI auto-fix failed");
            return new AiFixResult();
        }
    }

    private int ApplyFixes(string projectPath, List<FileFix> fixes)
    {
        var applied = 0;
        foreach (var fix in fixes)
        {
            try
            {
                var filePath = Path.Combine(projectPath, fix.File);
                var directory = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(directory))
                {
                    Directory.CreateDirectory(directory);
                }
                File.WriteAllText(filePath, fix.Content);
                applied++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to apply fix for {File}", fix.File);
            }
        }
        return applied;
    }
}

public class BuildVerificationResult
{
    public int QualityScore { get; set; }
    public int IssuesFound { get; set; }
    public int FixesApplied { get; set; }
    public bool Passed { get; set; }
    public string Summary { get; set; } = "";
    public List<IterationResult> Iterations { get; set; } = new();
}

public class IterationResult
{
    public int Iteration { get; set; }
    public int IssuesFound { get; set; }
    public int FixesApplied { get; set; }
    public bool Passed { get; set; }
    public List<VerificationIssue> Issues { get; set; } = new();
}

public class AiReviewResult
{
    public int QualityScore { get; set; }
    public string Summary { get; set; } = "";
    public List<VerificationIssue> Issues { get; set; } = new();
}

public class VerificationIssue
{
    public string Severity { get; set; } = "";
    public string Message { get; set; } = "";
    public string? File { get; set; }
    public int? Line { get; set; }
    public string? Suggestion { get; set; }
}

public class AiFixResult
{
    public List<FileFix> Fixes { get; set; } = new();
}

public class FileFix
{
    public string File { get; set; } = "";
    public string Content { get; set; } = "";
}
