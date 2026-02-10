using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ICodeQualityReviewService
{
    Task<CodeQualityReview> TriggerReviewAsync(int projectId);
    Task<CodeQualityReview?> GetReviewResultAsync(int projectId);
    Task<List<CodeQualityReview>> GetReviewHistoryAsync(int projectId);
    Task<CodeQualityReview> ApplyFixAsync(int projectId, string findingId);
    Task<CodeQualityReview> ApplyAllFixesAsync(int projectId, string severity);
}

public class CodeQualityReviewService : ICodeQualityReviewService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<CodeQualityReviewService> _logger;

    public CodeQualityReviewService(AiDevRequestDbContext context, ILogger<CodeQualityReviewService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CodeQualityReview> TriggerReviewAsync(int projectId)
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
            // Simulate AI-powered code quality analysis
            // In production, this would call Claude API to analyze the project files
            var findings = GenerateSimulatedFindings(projectId);
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

    private static List<ReviewFinding> GenerateSimulatedFindings(int projectId)
    {
        // In production, this would be replaced with actual AI analysis via Claude API
        return new List<ReviewFinding>
        {
            new()
            {
                Id = $"arch-{projectId}-1",
                Dimension = "architecture",
                Severity = "warning",
                Title = "Tight coupling between components",
                Description = "Several components directly import and depend on concrete implementations rather than abstractions.",
                File = "src/services/DataService.ts",
                Line = 15,
                SuggestedFix = "Introduce dependency injection or use interfaces to decouple components."
            },
            new()
            {
                Id = $"sec-{projectId}-1",
                Dimension = "security",
                Severity = "critical",
                Title = "Potential XSS vulnerability",
                Description = "User input is rendered without sanitization using dangerouslySetInnerHTML.",
                File = "src/components/UserContent.tsx",
                Line = 42,
                SuggestedFix = "Use DOMPurify to sanitize user input before rendering."
            },
            new()
            {
                Id = $"perf-{projectId}-1",
                Dimension = "performance",
                Severity = "warning",
                Title = "Missing memoization",
                Description = "Expensive computation in render path without useMemo.",
                File = "src/pages/Dashboard.tsx",
                Line = 28,
                SuggestedFix = "Wrap the computation in useMemo with appropriate dependencies."
            },
            new()
            {
                Id = $"a11y-{projectId}-1",
                Dimension = "accessibility",
                Severity = "warning",
                Title = "Missing ARIA labels",
                Description = "Interactive elements lack proper ARIA labels for screen readers.",
                File = "src/components/NavBar.tsx",
                Line = 10,
                SuggestedFix = "Add aria-label attributes to all interactive elements."
            },
            new()
            {
                Id = $"maint-{projectId}-1",
                Dimension = "maintainability",
                Severity = "info",
                Title = "Large function complexity",
                Description = "Function exceeds recommended cyclomatic complexity threshold.",
                File = "src/utils/parser.ts",
                Line = 55,
                SuggestedFix = "Break down into smaller, focused helper functions."
            },
            new()
            {
                Id = $"sec-{projectId}-2",
                Dimension = "security",
                Severity = "info",
                Title = "Consider Content Security Policy",
                Description = "No Content Security Policy headers detected in the application configuration.",
                File = "src/index.html",
                Line = 1,
                SuggestedFix = "Add CSP meta tag or configure CSP headers on the server."
            }
        };
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
