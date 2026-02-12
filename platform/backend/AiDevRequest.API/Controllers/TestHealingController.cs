using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId:int}/test-healing")]
public class TestHealingController : ControllerBase
{
    private readonly ITestHealingService _healingService;
    private readonly ILogger<TestHealingController> _logger;

    public TestHealingController(ITestHealingService healingService, ILogger<TestHealingController> logger)
    {
        _healingService = healingService;
        _logger = logger;
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeFailure(int projectId, [FromBody] TestHealingRequest request)
    {
        try
        {
            var result = await _healingService.AnalyzeFailureAsync(projectId, request);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(int projectId)
    {
        var history = await _healingService.GetHealingHistoryAsync(projectId);
        return Ok(history.Select(MapDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetRecord(int projectId, Guid id)
    {
        var record = await _healingService.GetHealingRecordAsync(id);
        if (record == null) return NotFound();
        return Ok(MapDto(record));
    }

    [HttpGet("review-queue")]
    public async Task<IActionResult> GetReviewQueue(int projectId)
    {
        var queue = await _healingService.GetReviewQueueAsync(projectId);
        return Ok(queue.Select(MapDto));
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> ApproveHealing(int projectId, Guid id)
    {
        var record = await _healingService.ApproveHealingAsync(id);
        if (record == null) return NotFound();
        return Ok(MapDto(record));
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> RejectHealing(int projectId, Guid id)
    {
        var record = await _healingService.RejectHealingAsync(id);
        if (record == null) return NotFound();
        return Ok(MapDto(record));
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(int projectId)
    {
        var settings = await _healingService.GetSettingsAsync(projectId);
        return Ok(settings);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings(int projectId, [FromBody] TestHealingSettings settings)
    {
        var updated = await _healingService.UpdateSettingsAsync(projectId, settings);
        return Ok(updated);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(int projectId)
    {
        var stats = await _healingService.GetStatsAsync(projectId);
        return Ok(stats);
    }

    private static TestHealingDto MapDto(Entities.TestHealingRecord r) => new()
    {
        Id = r.Id,
        ProjectId = r.ProjectId,
        Status = r.Status,
        TestFilePath = r.TestFilePath,
        OriginalSelector = r.OriginalSelector,
        HealedSelector = r.HealedSelector,
        FailureReason = r.FailureReason,
        HealingSummary = r.HealingSummary,
        ConfidenceScore = r.ConfidenceScore,
        LocatorStrategy = r.LocatorStrategy,
        DiffJson = r.DiffJson,
        SuggestedFixJson = r.SuggestedFixJson,
        IsApproved = r.IsApproved,
        IsRejected = r.IsRejected,
        HealingVersion = r.HealingVersion,
        CreatedAt = r.CreatedAt,
        HealedAt = r.HealedAt,
        ReviewedAt = r.ReviewedAt,
    };
}

public record TestHealingDto
{
    public Guid Id { get; init; }
    public int ProjectId { get; init; }
    public string Status { get; init; } = "";
    public string TestFilePath { get; init; } = "";
    public string OriginalSelector { get; init; } = "";
    public string HealedSelector { get; init; } = "";
    public string FailureReason { get; init; } = "";
    public string HealingSummary { get; init; } = "";
    public int ConfidenceScore { get; init; }
    public string LocatorStrategy { get; init; } = "";
    public string? DiffJson { get; init; }
    public string? SuggestedFixJson { get; init; }
    public bool IsApproved { get; init; }
    public bool IsRejected { get; init; }
    public int HealingVersion { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? HealedAt { get; init; }
    public DateTime? ReviewedAt { get; init; }
}
