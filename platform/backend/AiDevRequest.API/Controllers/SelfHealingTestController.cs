using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{id:guid}/tests/heal")]
public class SelfHealingTestController : ControllerBase
{
    private readonly ISelfHealingTestService _selfHealingService;
    private readonly ILogger<SelfHealingTestController> _logger;

    public SelfHealingTestController(ISelfHealingTestService selfHealingService, ILogger<SelfHealingTestController> logger)
    {
        _selfHealingService = selfHealingService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> TriggerSelfHealing(Guid id)
    {
        try
        {
            var result = await _selfHealingService.RunSelfHealingAnalysis(id);
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults(Guid id)
    {
        var result = await _selfHealingService.GetLatestResult(id);
        if (result == null) return NotFound();
        return Ok(MapDto(result));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(Guid id)
    {
        var history = await _selfHealingService.GetHistory(id);
        return Ok(history.Select(MapDto));
    }

    [HttpPost("repair-locators")]
    public async Task<IActionResult> RepairLocators(Guid id, [FromBody] RepairLocatorsRequest request)
    {
        try
        {
            var result = await _selfHealingService.RepairLocatorsAsync(id, request.BrokenLocators);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("timeline")]
    public async Task<IActionResult> GetHealingTimeline(Guid id)
    {
        var timeline = await _selfHealingService.GetHealingTimelineAsync(id);
        return Ok(timeline);
    }

    private static SelfHealingTestResultDto MapDto(Entities.SelfHealingTestResult r) => new()
    {
        Id = r.Id,
        DevRequestId = r.DevRequestId,
        Status = r.Status,
        TotalTests = r.TotalTests,
        FailedTests = r.FailedTests,
        HealedTests = r.HealedTests,
        SkippedTests = r.SkippedTests,
        ConfidenceScore = r.ConfidenceScore,
        HealedTestsJson = r.HealedTestsJson,
        FailedTestDetailsJson = r.FailedTestDetailsJson,
        AnalysisVersion = r.AnalysisVersion,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt,
    };
}

public record SelfHealingTestResultDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string Status { get; init; } = "";
    public int TotalTests { get; init; }
    public int FailedTests { get; init; }
    public int HealedTests { get; init; }
    public int SkippedTests { get; init; }
    public decimal ConfidenceScore { get; init; }
    public string? HealedTestsJson { get; init; }
    public string? FailedTestDetailsJson { get; init; }
    public int AnalysisVersion { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record RepairLocatorsRequest
{
    public List<BrokenLocatorInput> BrokenLocators { get; init; } = new();
}

public record BrokenLocatorInput
{
    public string TestFile { get; init; } = "";
    public string TestName { get; init; } = "";
    public string OriginalLocator { get; init; } = "";
    public string? ErrorMessage { get; init; }
}

public record LocatorRepairResult
{
    public List<RepairedLocator> RepairedLocators { get; init; } = new();
    public int TotalRepaired { get; init; }
    public int TotalFailed { get; init; }
    public decimal OverallConfidence { get; init; }
    public string Summary { get; init; } = "";
}

public record RepairedLocator
{
    public string TestFile { get; init; } = "";
    public string TestName { get; init; } = "";
    public string OriginalLocator { get; init; } = "";
    public string RepairedLocatorValue { get; init; } = "";
    public string Strategy { get; init; } = "";
    public int Confidence { get; init; }
    public string Reason { get; init; } = "";
}

public record HealingTimelineEntry
{
    public Guid Id { get; init; }
    public DateTime Timestamp { get; init; }
    public string Action { get; init; } = ""; // healed, failed, skipped
    public string TestName { get; init; } = "";
    public string? OriginalLocator { get; init; }
    public string? HealedLocator { get; init; }
    public int Confidence { get; init; }
    public string? Reason { get; init; }
    public int AnalysisVersion { get; init; }
}
