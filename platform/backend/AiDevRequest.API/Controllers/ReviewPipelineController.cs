using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/review-pipeline")]
[Authorize]
public class ReviewPipelineController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public ReviewPipelineController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create the user's review pipeline configuration
    /// </summary>
    [HttpGet("config")]
    public async Task<ActionResult<ReviewPipelineConfigDto>> GetConfig()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.ReviewPipelineConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new ReviewPipelineConfig { UserId = userId };
            _db.ReviewPipelineConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Update review pipeline configuration settings
    /// </summary>
    [HttpPut("config")]
    public async Task<ActionResult<ReviewPipelineConfigDto>> UpdateConfig([FromBody] UpdateReviewPipelineConfigDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.ReviewPipelineConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new ReviewPipelineConfig { UserId = userId };
            _db.ReviewPipelineConfigs.Add(config);
        }

        if (dto.AutoReviewEnabled.HasValue) config.AutoReviewEnabled = dto.AutoReviewEnabled.Value;
        if (dto.SecurityCheckEnabled.HasValue) config.SecurityCheckEnabled = dto.SecurityCheckEnabled.Value;
        if (dto.PerformanceCheckEnabled.HasValue) config.PerformanceCheckEnabled = dto.PerformanceCheckEnabled.Value;
        if (dto.AccessibilityCheckEnabled.HasValue) config.AccessibilityCheckEnabled = dto.AccessibilityCheckEnabled.Value;
        if (dto.ArchitectureCheckEnabled.HasValue) config.ArchitectureCheckEnabled = dto.ArchitectureCheckEnabled.Value;
        if (dto.MaintainabilityCheckEnabled.HasValue) config.MaintainabilityCheckEnabled = dto.MaintainabilityCheckEnabled.Value;
        if (dto.AutoFixEnabled.HasValue) config.AutoFixEnabled = dto.AutoFixEnabled.Value;
        if (dto.TestGenerationEnabled.HasValue) config.TestGenerationEnabled = dto.TestGenerationEnabled.Value;
        if (dto.QualityThreshold.HasValue) config.QualityThreshold = dto.QualityThreshold.Value;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Trigger an AI code review on a project (simulated)
    /// </summary>
    [HttpPost("review")]
    public async Task<ActionResult<ReviewResultDto>> TriggerReview([FromBody] TriggerReviewDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.ReviewPipelineConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new ReviewPipelineConfig { UserId = userId };
            _db.ReviewPipelineConfigs.Add(config);
        }

        var rng = new Random();
        var reviewId = Guid.NewGuid();

        // Generate dimension scores based on enabled checks
        var securityScore = config.SecurityCheckEnabled ? rng.Next(55, 100) : 0;
        var performanceScore = config.PerformanceCheckEnabled ? rng.Next(55, 100) : 0;
        var accessibilityScore = config.AccessibilityCheckEnabled ? rng.Next(55, 100) : 0;
        var architectureScore = config.ArchitectureCheckEnabled ? rng.Next(55, 100) : 0;
        var maintainabilityScore = config.MaintainabilityCheckEnabled ? rng.Next(55, 100) : 0;

        var enabledCount = new[] { config.SecurityCheckEnabled, config.PerformanceCheckEnabled, config.AccessibilityCheckEnabled, config.ArchitectureCheckEnabled, config.MaintainabilityCheckEnabled }.Count(e => e);
        var overallScore = enabledCount > 0
            ? (securityScore + performanceScore + accessibilityScore + architectureScore + maintainabilityScore) / (double)enabledCount
            : 0;

        // Generate findings
        var findings = new List<ReviewFindingDto>();
        var findingTemplates = new[]
        {
            new { Dimension = "security", Severity = "critical", Title = "Hardcoded API key detected", Desc = "API key found in source code. Move to environment variable.", File = "src/config.ts", Line = 12 },
            new { Dimension = "security", Severity = "warning", Title = "Missing input validation", Desc = "User input is not sanitized before use.", File = "src/handlers/input.ts", Line = 34 },
            new { Dimension = "performance", Severity = "warning", Title = "N+1 query pattern", Desc = "Database queries inside a loop cause performance degradation.", File = "src/services/data.ts", Line = 67 },
            new { Dimension = "performance", Severity = "info", Title = "Unoptimized image assets", Desc = "Large images could be compressed for faster loading.", File = "public/images/hero.png", Line = 0 },
            new { Dimension = "accessibility", Severity = "warning", Title = "Missing alt text on images", Desc = "Images should have descriptive alt attributes for screen readers.", File = "src/components/Gallery.tsx", Line = 23 },
            new { Dimension = "accessibility", Severity = "info", Title = "Low contrast text", Desc = "Text contrast ratio is below WCAG AA standard.", File = "src/styles/theme.css", Line = 45 },
            new { Dimension = "architecture", Severity = "warning", Title = "Circular dependency detected", Desc = "Module A imports Module B which imports Module A.", File = "src/modules/auth.ts", Line = 5 },
            new { Dimension = "architecture", Severity = "info", Title = "Large component detected", Desc = "Component exceeds 300 lines. Consider splitting into smaller components.", File = "src/components/Dashboard.tsx", Line = 1 },
            new { Dimension = "maintainability", Severity = "warning", Title = "Missing type annotations", Desc = "Function parameters lack TypeScript type annotations.", File = "src/utils/helpers.ts", Line = 18 },
            new { Dimension = "maintainability", Severity = "info", Title = "Duplicated code block", Desc = "Similar code found in multiple files. Extract to shared utility.", File = "src/utils/format.ts", Line = 42 },
        };

        // Pick random findings
        var selectedFindings = findingTemplates.OrderBy(_ => rng.Next()).Take(rng.Next(3, 8)).ToList();
        foreach (var ft in selectedFindings)
        {
            findings.Add(new ReviewFindingDto
            {
                Id = Guid.NewGuid().ToString(),
                Dimension = ft.Dimension,
                Severity = ft.Severity,
                Title = ft.Title,
                Description = ft.Desc,
                File = ft.File,
                Line = ft.Line,
                SuggestedFix = $"// TODO: Fix - {ft.Title}",
                AutoFixApplied = config.AutoFixEnabled && ft.Severity != "critical",
            });
        }

        var autoFixCount = findings.Count(f => f.AutoFixApplied);
        var testsGenerated = config.TestGenerationEnabled ? rng.Next(3, 12) : 0;
        var passesThreshold = overallScore >= config.QualityThreshold;

        // Update aggregate stats
        config.TotalReviews++;
        config.TotalAutoFixes += autoFixCount;
        config.TotalTestsGenerated += testsGenerated;
        config.AvgQualityScore = config.TotalReviews > 0
            ? ((config.AvgQualityScore * (config.TotalReviews - 1)) + (decimal)overallScore) / config.TotalReviews
            : (decimal)overallScore;

        // Track in review history
        var history = string.IsNullOrEmpty(config.ReviewHistoryJson)
            ? new List<ReviewHistoryEntryDto>()
            : JsonSerializer.Deserialize<List<ReviewHistoryEntryDto>>(config.ReviewHistoryJson) ?? new List<ReviewHistoryEntryDto>();

        history.Add(new ReviewHistoryEntryDto
        {
            ReviewId = reviewId.ToString(),
            ProjectName = dto.ProjectName ?? "Untitled Project",
            OverallScore = Math.Round(overallScore, 1),
            FindingsCount = findings.Count,
            AutoFixCount = autoFixCount,
            TestsGenerated = testsGenerated,
            PassedThreshold = passesThreshold,
            ReviewedAt = DateTime.UtcNow,
        });

        if (history.Count > 50)
            history = history.Skip(history.Count - 50).ToList();

        config.ReviewHistoryJson = JsonSerializer.Serialize(history);
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new ReviewResultDto
        {
            ReviewId = reviewId,
            ProjectName = dto.ProjectName ?? "Untitled Project",
            Status = "completed",
            SecurityScore = securityScore,
            PerformanceScore = performanceScore,
            AccessibilityScore = accessibilityScore,
            ArchitectureScore = architectureScore,
            MaintainabilityScore = maintainabilityScore,
            OverallScore = Math.Round(overallScore, 1),
            Findings = findings,
            AutoFixCount = autoFixCount,
            TestsGenerated = testsGenerated,
            PassesThreshold = passesThreshold,
            QualityThreshold = config.QualityThreshold,
            ReviewedAt = DateTime.UtcNow,
        });
    }

    /// <summary>
    /// Get review results by review ID (returns from history)
    /// </summary>
    [HttpGet("results/{reviewId}")]
    public async Task<ActionResult<ReviewHistoryEntryDto>> GetReviewResults(string reviewId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.ReviewPipelineConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config?.ReviewHistoryJson == null) return NotFound();

        var history = JsonSerializer.Deserialize<List<ReviewHistoryEntryDto>>(config.ReviewHistoryJson) ?? new List<ReviewHistoryEntryDto>();
        var entry = history.FirstOrDefault(h => h.ReviewId == reviewId);
        if (entry == null) return NotFound();

        return Ok(entry);
    }

    /// <summary>
    /// List the 5 review dimensions with descriptions
    /// </summary>
    [HttpGet("dimensions")]
    public ActionResult<IEnumerable<ReviewDimensionDto>> GetDimensions()
    {
        var dimensions = new[]
        {
            new ReviewDimensionDto
            {
                Id = "security",
                Name = "Security",
                Description = "Scans for vulnerabilities, hardcoded secrets, injection risks, and insecure patterns",
                Icon = "shield",
            },
            new ReviewDimensionDto
            {
                Id = "performance",
                Name = "Performance",
                Description = "Detects N+1 queries, memory leaks, unoptimized assets, and slow algorithms",
                Icon = "zap",
            },
            new ReviewDimensionDto
            {
                Id = "accessibility",
                Name = "Accessibility",
                Description = "Checks WCAG compliance, alt text, ARIA labels, contrast ratios, and keyboard navigation",
                Icon = "eye",
            },
            new ReviewDimensionDto
            {
                Id = "architecture",
                Name = "Architecture",
                Description = "Validates design patterns, dependency structure, separation of concerns, and module boundaries",
                Icon = "layers",
            },
            new ReviewDimensionDto
            {
                Id = "maintainability",
                Name = "Maintainability",
                Description = "Analyzes code complexity, duplication, naming conventions, type safety, and documentation",
                Icon = "wrench",
            },
        };

        return Ok(dimensions);
    }

    /// <summary>
    /// Get aggregate review pipeline statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ReviewPipelineStatsDto>> GetStats()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.ReviewPipelineConfigs.FirstOrDefaultAsync(c => c.UserId == userId);

        var recentHistory = new List<ReviewHistoryEntryDto>();
        if (config?.ReviewHistoryJson != null)
        {
            recentHistory = JsonSerializer.Deserialize<List<ReviewHistoryEntryDto>>(config.ReviewHistoryJson) ?? new List<ReviewHistoryEntryDto>();
        }

        return Ok(new ReviewPipelineStatsDto
        {
            TotalReviews = config?.TotalReviews ?? 0,
            TotalAutoFixes = config?.TotalAutoFixes ?? 0,
            TotalTestsGenerated = config?.TotalTestsGenerated ?? 0,
            AvgQualityScore = config?.AvgQualityScore ?? 0,
            QualityThreshold = config?.QualityThreshold ?? 70,
            PassRate = config != null && config.TotalReviews > 0
                ? Math.Round(recentHistory.Count(h => h.PassedThreshold) / (double)recentHistory.Count * 100, 1)
                : 0,
            RecentReviews = recentHistory.TakeLast(10).Reverse().ToList(),
        });
    }

    private static ReviewPipelineConfigDto ToDto(ReviewPipelineConfig config) => new()
    {
        Id = config.Id,
        AutoReviewEnabled = config.AutoReviewEnabled,
        SecurityCheckEnabled = config.SecurityCheckEnabled,
        PerformanceCheckEnabled = config.PerformanceCheckEnabled,
        AccessibilityCheckEnabled = config.AccessibilityCheckEnabled,
        ArchitectureCheckEnabled = config.ArchitectureCheckEnabled,
        MaintainabilityCheckEnabled = config.MaintainabilityCheckEnabled,
        AutoFixEnabled = config.AutoFixEnabled,
        TestGenerationEnabled = config.TestGenerationEnabled,
        QualityThreshold = config.QualityThreshold,
        TotalReviews = config.TotalReviews,
        TotalAutoFixes = config.TotalAutoFixes,
        TotalTestsGenerated = config.TotalTestsGenerated,
        AvgQualityScore = config.AvgQualityScore,
        CreatedAt = config.CreatedAt,
        UpdatedAt = config.UpdatedAt,
    };
}

// === DTOs ===

public class ReviewPipelineConfigDto
{
    public Guid Id { get; set; }
    public bool AutoReviewEnabled { get; set; }
    public bool SecurityCheckEnabled { get; set; }
    public bool PerformanceCheckEnabled { get; set; }
    public bool AccessibilityCheckEnabled { get; set; }
    public bool ArchitectureCheckEnabled { get; set; }
    public bool MaintainabilityCheckEnabled { get; set; }
    public bool AutoFixEnabled { get; set; }
    public bool TestGenerationEnabled { get; set; }
    public int QualityThreshold { get; set; }
    public int TotalReviews { get; set; }
    public int TotalAutoFixes { get; set; }
    public int TotalTestsGenerated { get; set; }
    public decimal AvgQualityScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateReviewPipelineConfigDto
{
    public bool? AutoReviewEnabled { get; set; }
    public bool? SecurityCheckEnabled { get; set; }
    public bool? PerformanceCheckEnabled { get; set; }
    public bool? AccessibilityCheckEnabled { get; set; }
    public bool? ArchitectureCheckEnabled { get; set; }
    public bool? MaintainabilityCheckEnabled { get; set; }
    public bool? AutoFixEnabled { get; set; }
    public bool? TestGenerationEnabled { get; set; }
    public int? QualityThreshold { get; set; }
}

public class TriggerReviewDto
{
    public string? ProjectName { get; set; }
}

public class ReviewResultDto
{
    public Guid ReviewId { get; set; }
    public string ProjectName { get; set; } = "";
    public string Status { get; set; } = "";
    public int SecurityScore { get; set; }
    public int PerformanceScore { get; set; }
    public int AccessibilityScore { get; set; }
    public int ArchitectureScore { get; set; }
    public int MaintainabilityScore { get; set; }
    public double OverallScore { get; set; }
    public List<ReviewFindingDto> Findings { get; set; } = new();
    public int AutoFixCount { get; set; }
    public int TestsGenerated { get; set; }
    public bool PassesThreshold { get; set; }
    public int QualityThreshold { get; set; }
    public DateTime ReviewedAt { get; set; }
}

public class ReviewFindingDto
{
    public string Id { get; set; } = "";
    public string Dimension { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? File { get; set; }
    public int Line { get; set; }
    public string? SuggestedFix { get; set; }
    public bool AutoFixApplied { get; set; }
}

public class ReviewDimensionDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Icon { get; set; } = "";
}

public class ReviewHistoryEntryDto
{
    public string ReviewId { get; set; } = "";
    public string ProjectName { get; set; } = "";
    public double OverallScore { get; set; }
    public int FindingsCount { get; set; }
    public int AutoFixCount { get; set; }
    public int TestsGenerated { get; set; }
    public bool PassedThreshold { get; set; }
    public DateTime ReviewedAt { get; set; }
}

public class ReviewPipelineStatsDto
{
    public int TotalReviews { get; set; }
    public int TotalAutoFixes { get; set; }
    public int TotalTestsGenerated { get; set; }
    public decimal AvgQualityScore { get; set; }
    public int QualityThreshold { get; set; }
    public double PassRate { get; set; }
    public List<ReviewHistoryEntryDto> RecentReviews { get; set; } = new();
}
