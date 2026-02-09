using System.Security.Claims;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITechTrendService
{
    Task<List<TrendReport>> GetTrendReportsAsync(string? category = null, int limit = 10);
    Task<TrendReport> GenerateTrendReportAsync(string category);
    Task<ProjectReview?> GetProjectReviewAsync(int devRequestId, string userId);
    Task<ProjectReview> ReviewProjectAsync(int devRequestId, string userId);
    Task<List<UpdateRecommendation>> GetRecommendationsAsync(int projectReviewId, string userId);
    Task<UpdateRecommendation?> UpdateRecommendationStatusAsync(int id, string userId, string status);
    Task<List<ProjectReview>> GetUserReviewsAsync(string userId);
}

public class TechTrendService : ITechTrendService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<TechTrendService> _logger;

    public TechTrendService(AiDevRequestDbContext db, ILogger<TechTrendService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<TrendReport>> GetTrendReportsAsync(string? category = null, int limit = 10)
    {
        var query = _db.TrendReports.AsQueryable();
        if (!string.IsNullOrEmpty(category))
            query = query.Where(t => t.Category == category);
        return await query.OrderByDescending(t => t.AnalyzedAt).Take(limit).ToListAsync();
    }

    public async Task<TrendReport> GenerateTrendReportAsync(string category)
    {
        var trends = GenerateTrendsForCategory(category);
        var report = new TrendReport
        {
            Category = category,
            SummaryJson = JsonSerializer.Serialize(trends),
            TrendCount = trends.Count,
            AnalyzedAt = DateTime.UtcNow
        };

        _db.TrendReports.Add(report);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Generated trend report for category {Category} with {Count} trends",
            category, trends.Count);

        return report;
    }

    public async Task<ProjectReview?> GetProjectReviewAsync(int devRequestId, string userId)
    {
        return await _db.ProjectReviews
            .Where(r => r.DevRequestId == devRequestId && r.UserId == userId)
            .OrderByDescending(r => r.ReviewedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<ProjectReview> ReviewProjectAsync(int devRequestId, string userId)
    {
        var devRequest = await _db.DevRequests.FindAsync(devRequestId);
        if (devRequest == null || devRequest.UserId != userId)
            throw new InvalidOperationException("Project not found or unauthorized.");

        var findings = GenerateFindings(devRequest);
        var criticalCount = findings.Count(f => f.Severity == "critical");
        var highCount = findings.Count(f => f.Severity == "high");
        var mediumCount = findings.Count(f => f.Severity == "medium");
        var lowCount = findings.Count(f => f.Severity == "low");

        var healthScore = CalculateHealthScore(criticalCount, highCount, mediumCount, lowCount);

        var review = new ProjectReview
        {
            UserId = userId,
            DevRequestId = devRequestId,
            ProjectName = devRequest.Description?[..Math.Min(60, devRequest.Description.Length)] ?? "Untitled",
            HealthScore = healthScore,
            FindingsJson = JsonSerializer.Serialize(findings),
            CriticalCount = criticalCount,
            HighCount = highCount,
            MediumCount = mediumCount,
            LowCount = lowCount,
        };

        _db.ProjectReviews.Add(review);

        // Generate update recommendations from findings
        foreach (var finding in findings)
        {
            _db.UpdateRecommendations.Add(new UpdateRecommendation
            {
                ProjectReviewId = 0, // Will be set after SaveChanges
                UserId = userId,
                Category = finding.Category,
                Severity = finding.Severity,
                Title = finding.Title,
                Description = finding.Description,
                CurrentVersion = finding.CurrentVersion,
                RecommendedVersion = finding.RecommendedVersion,
                EffortEstimate = finding.Effort,
            });
        }

        await _db.SaveChangesAsync();

        // Update ProjectReviewId on recommendations
        var pendingRecs = await _db.UpdateRecommendations
            .Where(r => r.ProjectReviewId == 0 && r.UserId == userId)
            .ToListAsync();
        foreach (var rec in pendingRecs)
            rec.ProjectReviewId = review.Id;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Reviewed project {DevRequestId} for user {UserId}: score={Score}",
            devRequestId, userId, healthScore);

        return review;
    }

    public async Task<List<UpdateRecommendation>> GetRecommendationsAsync(int projectReviewId, string userId)
    {
        return await _db.UpdateRecommendations
            .Where(r => r.ProjectReviewId == projectReviewId && r.UserId == userId)
            .OrderByDescending(r => r.Severity == "critical" ? 4 : r.Severity == "high" ? 3 : r.Severity == "medium" ? 2 : 1)
            .ThenBy(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<UpdateRecommendation?> UpdateRecommendationStatusAsync(int id, string userId, string status)
    {
        var rec = await _db.UpdateRecommendations.FindAsync(id);
        if (rec == null || rec.UserId != userId) return null;

        rec.Status = status;
        await _db.SaveChangesAsync();
        return rec;
    }

    public async Task<List<ProjectReview>> GetUserReviewsAsync(string userId)
    {
        return await _db.ProjectReviews
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.ReviewedAt)
            .ToListAsync();
    }

    // -- Template-based generators --

    private static int CalculateHealthScore(int critical, int high, int medium, int low)
    {
        var deductions = (critical * 20) + (high * 10) + (medium * 5) + (low * 2);
        return Math.Max(0, Math.Min(100, 100 - deductions));
    }

    private record TrendItem(string Title, string Description, string Impact, string Link);

    private static List<TrendItem> GenerateTrendsForCategory(string category) => category switch
    {
        "ai_model" => new List<TrendItem>
        {
            new("Claude 4.5 Sonnet Released", "Latest Claude model with improved coding capabilities and 200K context window.", "high", ""),
            new("GPT-5 Preview Available", "OpenAI announced GPT-5 preview with enhanced reasoning.", "high", ""),
            new("Local LLM Performance Gains", "Llama 4 and Mistral Large 2 show 40% faster inference on consumer hardware.", "medium", ""),
        },
        "ui_framework" => new List<TrendItem>
        {
            new("React 19 Stable", "React 19 brings server components, actions, and improved hydration.", "high", ""),
            new("Tailwind CSS v4", "Tailwind v4 offers native CSS layers, lightning-fast builds, and zero-config.", "high", ""),
            new("shadcn/ui v2 Components", "New components: charts, kanban, tree-view added to shadcn/ui.", "medium", ""),
        },
        "backend" => new List<TrendItem>
        {
            new(".NET 10 Preview", ".NET 10 preview with improved AOT compilation and gRPC performance.", "medium", ""),
            new("Deno 2.1 Stable", "Deno 2.1 with full npm compatibility and built-in package manager.", "medium", ""),
            new("PostgreSQL 17", "PostgreSQL 17 brings JSON table functions and incremental backup.", "low", ""),
        },
        "security" => new List<TrendItem>
        {
            new("Critical npm Supply Chain Alert", "Multiple popular packages found with embedded cryptominers.", "critical", ""),
            new("React XSS Vulnerability Patch", "React 18.3.1 patches a DOM-based XSS in server-side rendering.", "high", ""),
            new("OWASP Top 10 2026 Draft", "Updated OWASP list includes AI-specific threats and prompt injection.", "medium", ""),
        },
        "infrastructure" => new List<TrendItem>
        {
            new("Docker Desktop 5.0", "Docker Desktop 5.0 with native Wasm support and improved resource management.", "medium", ""),
            new("Azure Container Apps GA v2", "New scaling options and built-in Dapr integration for microservices.", "medium", ""),
            new("Bun 1.2 Runtime", "Bun 1.2 with 3x faster npm install and improved Node.js compatibility.", "low", ""),
        },
        _ => new List<TrendItem>
        {
            new("General Tech Update", "Various updates across the technology landscape.", "low", ""),
        }
    };

    private record FindingItem(string Category, string Severity, string Title, string Description,
        string? CurrentVersion, string? RecommendedVersion, string Effort);

    private static List<FindingItem> GenerateFindings(DevRequest devRequest)
    {
        var findings = new List<FindingItem>();
        var desc = (devRequest.Description ?? "").ToLower();

        // Security findings (always relevant)
        findings.Add(new FindingItem(
            "security", "high",
            "Dependency Security Audit Recommended",
            "Run npm audit or dotnet list package --vulnerable to check for known vulnerabilities.",
            null, null, "low"));

        // React-specific findings
        if (desc.Contains("react") || devRequest.Framework == "react")
        {
            findings.Add(new FindingItem(
                "feature", "medium",
                "React 19 Upgrade Available",
                "React 19 brings server components, improved hydration, and better performance. Consider upgrading.",
                "18.x", "19.x", "medium"));

            findings.Add(new FindingItem(
                "quality", "low",
                "Strict Mode & TypeScript Strict",
                "Enable React Strict Mode and TypeScript strict mode for better error detection.",
                null, null, "low"));
        }

        // Tailwind findings
        if (desc.Contains("tailwind"))
        {
            findings.Add(new FindingItem(
                "performance", "medium",
                "Tailwind CSS v4 Migration",
                "Tailwind v4 offers native CSS layers and faster builds. Migration is mostly automated.",
                "3.x", "4.x", "medium"));
        }

        // Mobile findings
        if (desc.Contains("mobile") || desc.Contains("flutter") || devRequest.Framework == "flutter")
        {
            findings.Add(new FindingItem(
                "feature", "medium",
                "Flutter 3.x Latest Stable",
                "Ensure you're on the latest Flutter stable for iOS/Android compatibility improvements.",
                null, "latest", "low"));
        }

        // Performance findings (always relevant)
        findings.Add(new FindingItem(
            "performance", "low",
            "Bundle Size Optimization",
            "Consider code splitting and lazy loading to reduce initial bundle size by 15-30%.",
            null, null, "medium"));

        // AI-specific findings
        if (desc.Contains("ai") || desc.Contains("claude") || desc.Contains("gpt"))
        {
            findings.Add(new FindingItem(
                "feature", "high",
                "Newer AI Model Available",
                "Consider upgrading to the latest Claude model for improved accuracy and lower costs.",
                "claude-3", "claude-4.5-sonnet", "low"));
        }

        return findings;
    }
}
