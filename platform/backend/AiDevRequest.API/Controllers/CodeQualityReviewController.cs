using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:int}/review")]
public class CodeQualityReviewController : ControllerBase
{
    private readonly ICodeQualityReviewService _reviewService;
    private readonly ILogger<CodeQualityReviewController> _logger;

    public CodeQualityReviewController(ICodeQualityReviewService reviewService, ILogger<CodeQualityReviewController> logger)
    {
        _reviewService = reviewService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> TriggerReview(int projectId)
    {
        try
        {
            var result = await _reviewService.TriggerReviewAsync(projectId);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetReviewResults(int projectId)
    {
        var result = await _reviewService.GetReviewResultAsync(projectId);
        if (result == null) return NotFound();
        return Ok(MapDto(result));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetReviewHistory(int projectId)
    {
        var history = await _reviewService.GetReviewHistoryAsync(projectId);
        return Ok(history.Select(MapDto));
    }

    [HttpPost("fix/{findingId}")]
    public async Task<IActionResult> ApplyFix(int projectId, string findingId)
    {
        try
        {
            var result = await _reviewService.ApplyFixAsync(projectId, findingId);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("fix-all")]
    public async Task<IActionResult> ApplyAllFixes(int projectId, [FromBody] ApplyAllFixesDto dto)
    {
        try
        {
            var result = await _reviewService.ApplyAllFixesAsync(projectId, dto.Severity);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static CodeQualityReviewDto MapDto(Entities.CodeQualityReview r) => new()
    {
        Id = r.Id,
        ProjectId = r.ProjectId,
        Status = r.Status,
        ArchitectureScore = r.ArchitectureScore,
        SecurityScore = r.SecurityScore,
        PerformanceScore = r.PerformanceScore,
        AccessibilityScore = r.AccessibilityScore,
        MaintainabilityScore = r.MaintainabilityScore,
        OverallScore = r.OverallScore,
        Findings = r.Findings,
        CriticalCount = r.CriticalCount,
        WarningCount = r.WarningCount,
        InfoCount = r.InfoCount,
        AppliedFixes = r.AppliedFixes,
        FixesApplied = r.FixesApplied,
        ReviewVersion = r.ReviewVersion,
        CreatedAt = r.CreatedAt,
        CompletedAt = r.CompletedAt,
    };
}

// === DTOs ===

public record ApplyAllFixesDto
{
    public string Severity { get; init; } = "";
}

public record CodeQualityReviewDto
{
    public Guid Id { get; init; }
    public int ProjectId { get; init; }
    public string Status { get; init; } = "";
    public int ArchitectureScore { get; init; }
    public int SecurityScore { get; init; }
    public int PerformanceScore { get; init; }
    public int AccessibilityScore { get; init; }
    public int MaintainabilityScore { get; init; }
    public double OverallScore { get; init; }
    public string? Findings { get; init; }
    public int CriticalCount { get; init; }
    public int WarningCount { get; init; }
    public int InfoCount { get; init; }
    public string? AppliedFixes { get; init; }
    public int FixesApplied { get; init; }
    public int ReviewVersion { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}
