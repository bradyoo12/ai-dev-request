using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/trends")]
[Authorize]
public class TechTrendController : ControllerBase
{
    private readonly ITechTrendService _trendService;

    public TechTrendController(ITechTrendService trendService)
    {
        _trendService = trendService;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException();

    // GET /api/trends/reports
    [HttpGet("reports")]
    public async Task<IActionResult> GetTrendReports([FromQuery] string? category, [FromQuery] int limit = 10)
    {
        var reports = await _trendService.GetTrendReportsAsync(category, limit);
        return Ok(reports.Select(r => new TrendReportDto
        {
            Id = r.Id,
            AnalyzedAt = r.AnalyzedAt,
            Category = r.Category,
            SummaryJson = r.SummaryJson,
            TrendCount = r.TrendCount,
        }));
    }

    // POST /api/trends/reports/generate
    [HttpPost("reports/generate")]
    public async Task<IActionResult> GenerateTrendReport([FromBody] GenerateTrendDto dto)
    {
        var report = await _trendService.GenerateTrendReportAsync(dto.Category);
        return Ok(new TrendReportDto
        {
            Id = report.Id,
            AnalyzedAt = report.AnalyzedAt,
            Category = report.Category,
            SummaryJson = report.SummaryJson,
            TrendCount = report.TrendCount,
        });
    }

    // GET /api/trends/reviews
    [HttpGet("reviews")]
    public async Task<IActionResult> GetUserReviews()
    {
        var userId = GetUserId();
        var reviews = await _trendService.GetUserReviewsAsync(userId);
        return Ok(reviews.Select(r => new ProjectReviewDto
        {
            Id = r.Id,
            DevRequestId = r.DevRequestId,
            ProjectName = r.ProjectName,
            ReviewedAt = r.ReviewedAt,
            HealthScore = r.HealthScore,
            CriticalCount = r.CriticalCount,
            HighCount = r.HighCount,
            MediumCount = r.MediumCount,
            LowCount = r.LowCount,
        }));
    }

    // POST /api/trends/reviews/{devRequestId}
    [HttpPost("reviews/{devRequestId}")]
    public async Task<IActionResult> ReviewProject(int devRequestId)
    {
        var userId = GetUserId();
        try
        {
            var review = await _trendService.ReviewProjectAsync(devRequestId, userId);
            return Ok(new ProjectReviewDto
            {
                Id = review.Id,
                DevRequestId = review.DevRequestId,
                ProjectName = review.ProjectName,
                ReviewedAt = review.ReviewedAt,
                HealthScore = review.HealthScore,
                FindingsJson = review.FindingsJson,
                CriticalCount = review.CriticalCount,
                HighCount = review.HighCount,
                MediumCount = review.MediumCount,
                LowCount = review.LowCount,
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/trends/reviews/{reviewId}/recommendations
    [HttpGet("reviews/{reviewId}/recommendations")]
    public async Task<IActionResult> GetRecommendations(int reviewId)
    {
        var userId = GetUserId();
        var recs = await _trendService.GetRecommendationsAsync(reviewId, userId);
        return Ok(recs.Select(r => new UpdateRecommendationDto
        {
            Id = r.Id,
            Category = r.Category,
            Severity = r.Severity,
            Title = r.Title,
            Description = r.Description,
            CurrentVersion = r.CurrentVersion,
            RecommendedVersion = r.RecommendedVersion,
            EffortEstimate = r.EffortEstimate,
            Status = r.Status,
            CreatedAt = r.CreatedAt,
        }));
    }

    // PATCH /api/trends/recommendations/{id}/status
    [HttpPatch("recommendations/{id}/status")]
    public async Task<IActionResult> UpdateRecommendationStatus(int id, [FromBody] UpdateRecStatusDto dto)
    {
        var userId = GetUserId();
        var rec = await _trendService.UpdateRecommendationStatusAsync(id, userId, dto.Status);
        if (rec == null) return NotFound(new { error = "Recommendation not found." });
        return Ok(new UpdateRecommendationDto
        {
            Id = rec.Id,
            Category = rec.Category,
            Severity = rec.Severity,
            Title = rec.Title,
            Description = rec.Description,
            CurrentVersion = rec.CurrentVersion,
            RecommendedVersion = rec.RecommendedVersion,
            EffortEstimate = rec.EffortEstimate,
            Status = rec.Status,
            CreatedAt = rec.CreatedAt,
        });
    }
}

// DTOs
public record TrendReportDto
{
    public int Id { get; init; }
    public DateTime AnalyzedAt { get; init; }
    public required string Category { get; init; }
    public required string SummaryJson { get; init; }
    public int TrendCount { get; init; }
}

public record ProjectReviewDto
{
    public int Id { get; init; }
    public int DevRequestId { get; init; }
    public required string ProjectName { get; init; }
    public DateTime ReviewedAt { get; init; }
    public int HealthScore { get; init; }
    public string? FindingsJson { get; init; }
    public int CriticalCount { get; init; }
    public int HighCount { get; init; }
    public int MediumCount { get; init; }
    public int LowCount { get; init; }
}

public record UpdateRecommendationDto
{
    public int Id { get; init; }
    public required string Category { get; init; }
    public required string Severity { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public string? CurrentVersion { get; init; }
    public string? RecommendedVersion { get; init; }
    public required string EffortEstimate { get; init; }
    public required string Status { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record GenerateTrendDto
{
    public required string Category { get; init; }
}

public record UpdateRecStatusDto
{
    public required string Status { get; init; }
}
