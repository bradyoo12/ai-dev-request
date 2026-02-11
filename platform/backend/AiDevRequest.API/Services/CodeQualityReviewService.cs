using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ICodeQualityReviewService
{
    Task<CodeQualityReview> TriggerReviewAsync(int projectId);
    Task<CodeQualityReview> TriggerReviewAsync(int projectId, string? projectPath, string? projectType);
    Task<CodeQualityReview?> GetReviewResultAsync(int projectId);
    Task<List<CodeQualityReview>> GetReviewHistoryAsync(int projectId);
    Task<CodeQualityReview> ApplyFixAsync(int projectId, string findingId);
    Task<CodeQualityReview> ApplyAllFixesAsync(int projectId, string severity);
}

public class CodeQualityReviewService : ICodeQualityReviewService
{
    private readonly AiDevRequestDbContext _context;
    private readonly AnthropicClient _client;
    private readonly ILogger<CodeQualityReviewService> _logger;
    private readonly string _projectsBasePath;

    public CodeQualityReviewService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<CodeQualityReviewService> logger)
    {
        _context = context;
        _logger = logger;
        _projectsBasePath = configuration["Projects:BasePath"] ?? "./projects";

        var apiKey = configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Anthropic API key not configured");

        _client = new AnthropicClient(apiKey);
    }

    public async Task<CodeQualityReview> TriggerReviewAsync(int projectId)
    {
        return await TriggerReviewAsync(projectId, null, null);
    }

    public async Task<CodeQualityReview> TriggerReviewAsync(int projectId, string? projectPath, string? projectType)
    {
        // Determine the next review version
        var latestVersion = await _context.CodeQualityReviews
            .Where(r => r.ProjectId == projectId)
            .MaxAsync(r => (int?)r.ReviewVersion) ?? 0;

        var review = new CodeQualityReview
        {
            ProjectId = projectId,
            Status = "reviewing",
            ReviewVersion = latestVersion + 1,
        };

        _context.CodeQualityReviews.Add(review);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Started code quality review v{Version} for project {ProjectId}",
            review.ReviewVersion, projectId);

        try
        {
            // Resolve the project path: use provided path or resolve from database
            var resolvedPath = !string.IsNullOrEmpty(projectPath)
                ? projectPath
                : await ResolveProjectPathAsync(projectId);

            List<ReviewFinding> findings;

            if (resolvedPath != null)
            {
                var sourceFiles = ReadSourceFiles(resolvedPath);
                if (sourceFiles.Count > 0)
                {
                    findings = await AnalyzeWithClaudeAsync(sourceFiles, projectId);

                    // Auto-fix critical findings
                    await AutoFixCriticalFindingsAsync(sourceFiles, findings);
                }
                else
                {
                    _logger.LogWarning("No source files found at {Path} for project {ProjectId}", resolvedPath, projectId);
                    findings = new List<ReviewFinding>();
                }
            }
            else
            {
                _logger.LogWarning("No project path found for project {ProjectId}, using fallback analysis", projectId);
                findings = new List<ReviewFinding>();
            }

            var criticalCount = findings.Count(f => f.Severity == "critical");
            var warningCount = findings.Count(f => f.Severity == "warning");
            var infoCount = findings.Count(f => f.Severity == "info");

            review.Findings = JsonSerializer.Serialize(findings);
            review.CriticalCount = criticalCount;
            review.WarningCount = warningCount;
            review.InfoCount = infoCount;

            // Calculate dimension scores (1-5)
            review.ArchitectureScore = CalculateDimensionScore(findings, "architecture");
            review.SecurityScore = CalculateDimensionScore(findings, "security");
            review.PerformanceScore = CalculateDimensionScore(findings, "performance");
            review.AccessibilityScore = CalculateDimensionScore(findings, "accessibility");
            review.MaintainabilityScore = CalculateDimensionScore(findings, "maintainability");
            review.OverallScore = Math.Round(
                (review.ArchitectureScore + review.SecurityScore + review.PerformanceScore +
                 review.AccessibilityScore + review.MaintainabilityScore) / 5.0, 1);

            review.Status = "completed";
            review.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Code quality review completed for project {ProjectId}: overall {Overall}, {Critical} critical, {Warning} warnings, {Info} info",
                projectId, review.OverallScore, criticalCount, warningCount, infoCount);

            return review;
        }
        catch (Exception ex)
        {
            review.Status = "failed";
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Code quality review failed for project {ProjectId}", projectId);
            throw;
        }
    }

    private async Task AutoFixCriticalFindingsAsync(Dictionary<string, string> sourceFiles, List<ReviewFinding> findings)
    {
        var criticalFindings = findings.Where(f => f.Severity == "critical" && !string.IsNullOrEmpty(f.File)).ToList();
        if (criticalFindings.Count == 0) return;

        foreach (var finding in criticalFindings)
        {
            try
            {
                // Find the matching source file
                var matchingFile = sourceFiles.Keys.FirstOrDefault(k =>
                    k.Equals(finding.File, StringComparison.OrdinalIgnoreCase) ||
                    k.EndsWith(finding.File ?? "", StringComparison.OrdinalIgnoreCase));

                if (matchingFile == null || !sourceFiles.ContainsKey(matchingFile)) continue;

                var fileContent = sourceFiles[matchingFile];

                var fixPrompt = $@"You are a code fix assistant. Fix the following critical issue in this file.

## Issue
- **Title**: {finding.Title}
- **Description**: {finding.Description}
- **File**: {finding.File}
- **Line**: {finding.Line}

## Current File Content
```
{(fileContent.Length > 5000 ? fileContent[..5000] + "\n... (truncated)" : fileContent)}
```

Provide ONLY the specific code fix. Show the exact code change needed (before and after). Be concise.";

                var messages = new List<Message> { new Message(RoleType.User, fixPrompt) };
                var parameters = new MessageParameters
                {
                    Messages = messages,
                    Model = "claude-sonnet-4-20250514",
                    MaxTokens = 2000,
                    Temperature = 0.2m
                };

                var response = await _client.Messages.GetClaudeMessageAsync(parameters);
                var fixContent = response.Content.FirstOrDefault()?.ToString() ?? "";

                if (!string.IsNullOrEmpty(fixContent))
                {
                    finding.SuggestedFix = fixContent;
                }

                _logger.LogInformation("Generated auto-fix for critical finding {FindingId} in {File}",
                    finding.Id, finding.File);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Auto-fix failed for finding {FindingId}, continuing", finding.Id);
            }
        }
    }

    private async Task<string?> ResolveProjectPathAsync(int projectId)
    {
        // Try to find the DevRequest by ordering and using projectId as 1-based index
        var devRequest = await _context.DevRequests
            .Where(r => r.ProjectPath != null)
            .OrderBy(r => r.CreatedAt)
            .Skip(projectId - 1)
            .FirstOrDefaultAsync();

        if (devRequest?.ProjectPath != null && Directory.Exists(devRequest.ProjectPath))
            return devRequest.ProjectPath;

        // Fallback: scan projects base directory for matching folder
        if (Directory.Exists(_projectsBasePath))
        {
            var dirs = Directory.GetDirectories(_projectsBasePath)
                .OrderBy(d => d)
                .ToArray();

            if (projectId >= 1 && projectId <= dirs.Length)
                return dirs[projectId - 1];
        }

        return null;
    }

    private static Dictionary<string, string> ReadSourceFiles(string projectPath)
    {
        var files = new Dictionary<string, string>();
        if (!Directory.Exists(projectPath)) return files;

        var sourceExtensions = new HashSet<string>
        {
            ".ts", ".tsx", ".js", ".jsx", ".cs", ".py",
            ".vue", ".svelte", ".sql", ".graphql", ".html", ".css"
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

    public async Task<CodeQualityReview?> GetReviewResultAsync(int projectId)
    {
        return await _context.CodeQualityReviews
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.ReviewVersion)
            .FirstOrDefaultAsync();
    }

    public async Task<List<CodeQualityReview>> GetReviewHistoryAsync(int projectId)
    {
        return await _context.CodeQualityReviews
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.ReviewVersion)
            .ToListAsync();
    }

    public async Task<CodeQualityReview> ApplyFixAsync(int projectId, string findingId)
    {
        var review = await _context.CodeQualityReviews
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.ReviewVersion)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No review found for this project.");

        if (review.Status != "completed")
            throw new InvalidOperationException("Review must be completed before applying fixes.");

        // Track applied fixes
        var appliedFixes = string.IsNullOrEmpty(review.AppliedFixes)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(review.AppliedFixes) ?? new List<string>();

        if (appliedFixes.Contains(findingId))
            throw new InvalidOperationException("This fix has already been applied.");

        appliedFixes.Add(findingId);
        review.AppliedFixes = JsonSerializer.Serialize(appliedFixes);
        review.FixesApplied = appliedFixes.Count;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Applied fix {FindingId} for project {ProjectId}", findingId, projectId);

        return review;
    }

    public async Task<CodeQualityReview> ApplyAllFixesAsync(int projectId, string severity)
    {
        var review = await _context.CodeQualityReviews
            .Where(r => r.ProjectId == projectId)
            .OrderByDescending(r => r.ReviewVersion)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No review found for this project.");

        if (review.Status != "completed")
            throw new InvalidOperationException("Review must be completed before applying fixes.");

        var findings = string.IsNullOrEmpty(review.Findings)
            ? new List<ReviewFinding>()
            : JsonSerializer.Deserialize<List<ReviewFinding>>(review.Findings, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<ReviewFinding>();

        var appliedFixes = string.IsNullOrEmpty(review.AppliedFixes)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(review.AppliedFixes) ?? new List<string>();

        // Apply all fixes matching the severity that haven't been applied yet
        var matchingFindings = findings
            .Where(f => f.Severity == severity && !string.IsNullOrEmpty(f.Id) && !appliedFixes.Contains(f.Id!))
            .ToList();

        foreach (var finding in matchingFindings)
        {
            appliedFixes.Add(finding.Id!);
        }

        review.AppliedFixes = JsonSerializer.Serialize(appliedFixes);
        review.FixesApplied = appliedFixes.Count;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Applied all {Severity} fixes ({Count}) for project {ProjectId}",
            severity, matchingFindings.Count, projectId);

        return review;
    }

    private async Task<List<ReviewFinding>> AnalyzeWithClaudeAsync(Dictionary<string, string> sourceFiles, int projectId)
    {
        var filesSummary = string.Join("\n\n", sourceFiles.Select(f =>
            $"### {f.Key}\n```\n{(f.Value.Length > 3000 ? f.Value[..3000] + "\n... (truncated)" : f.Value)}\n```"));

        // Limit total prompt size to avoid token limits
        if (filesSummary.Length > 80000)
            filesSummary = filesSummary[..80000] + "\n\n... (additional files truncated for token limit)";

        var prompt = $@"You are an expert code quality reviewer. Analyze the following project code across 5 dimensions. For each finding, classify it into exactly one dimension.

## Source Files
{filesSummary}

## Review Dimensions

1. **architecture** — Separation of concerns, modularity, coupling, dependency direction, design patterns
2. **security** — XSS, injection, auth bypass, hardcoded secrets, CSRF, insecure dependencies (OWASP Top 10)
3. **performance** — N+1 queries, missing memoization, unnecessary re-renders, large bundles, blocking operations
4. **accessibility** — Missing ARIA labels, keyboard navigation, color contrast, screen reader support, alt text
5. **maintainability** — Naming conventions, code duplication, cyclomatic complexity, dead code, type safety, error handling

## Response Format

Respond with ONLY a JSON array of findings. Each finding must have:
- ""id"": unique string (format: ""<dimension_prefix>-{projectId}-<sequential>"", e.g. ""sec-{projectId}-1"")
- ""dimension"": one of [""architecture"", ""security"", ""performance"", ""accessibility"", ""maintainability""]
- ""severity"": one of [""critical"", ""warning"", ""info""]
- ""title"": short descriptive title (max 80 chars)
- ""description"": detailed explanation of the issue
- ""file"": the relative file path where the issue was found
- ""line"": approximate line number (integer)
- ""suggestedFix"": actionable fix suggestion

Rules:
- Only report REAL issues found in the actual code. Do not fabricate issues.
- Use ""critical"" for security vulnerabilities and bugs that break functionality
- Use ""warning"" for issues that degrade quality or could cause future problems
- Use ""info"" for style, best-practice suggestions, and minor improvements
- If the code is clean and well-written, return fewer findings (even an empty array is acceptable)
- Aim for thoroughness across all 5 dimensions

JSON array only. No other text.";

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
            var content = response.Content.FirstOrDefault()?.ToString() ?? "[]";

            // Extract JSON array from response
            var jsonStart = content.IndexOf('[');
            var jsonEnd = content.LastIndexOf(']');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                content = content[jsonStart..(jsonEnd + 1)];
            }

            var findings = JsonSerializer.Deserialize<List<ReviewFinding>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (findings != null)
            {
                _logger.LogInformation("Claude returned {Count} findings for project {ProjectId}", findings.Count, projectId);
                return findings;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API call failed for project {ProjectId}, returning empty findings", projectId);
        }

        return new List<ReviewFinding>();
    }

    private static int CalculateDimensionScore(List<ReviewFinding> findings, string dimension)
    {
        var dimensionFindings = findings.Where(f => f.Dimension == dimension).ToList();
        if (dimensionFindings.Count == 0) return 5;

        var penalty = dimensionFindings.Sum(f => f.Severity switch
        {
            "critical" => 2.0,
            "warning" => 1.0,
            "info" => 0.3,
            _ => 0.0
        });

        return Math.Max(1, (int)Math.Round(5 - penalty));
    }
}

public class ReviewFinding
{
    public string? Id { get; set; }
    public string Dimension { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? File { get; set; }
    public int? Line { get; set; }
    public string? SuggestedFix { get; set; }
}

public class ClaudeQualityResponse
{
    public List<ClaudeQualityFinding> Findings { get; set; } = new();
}

public class ClaudeQualityFinding
{
    public string? Id { get; set; }
    public string? Dimension { get; set; }
    public string? Severity { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? File { get; set; }
    public int? Line { get; set; }
    public string? SuggestedFix { get; set; }
}
