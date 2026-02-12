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
