using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/usage")]
public class UsageMeteringController : ControllerBase
{
    private readonly IUsageMeteringService _usageMeteringService;
    private readonly ILogger<UsageMeteringController> _logger;

    public UsageMeteringController(IUsageMeteringService usageMeteringService, ILogger<UsageMeteringController> logger)
    {
        _usageMeteringService = usageMeteringService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpGet("summary")]
    [ProducesResponseType(typeof(UsageMeteringSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UsageMeteringSummaryDto>> GetUsageSummary(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var userId = GetUserId();
        var summary = await _usageMeteringService.GetUsageSummary(userId, from, to);
        return Ok(new UsageMeteringSummaryDto
        {
            TotalSpend = summary.TotalSpend,
            AiComputeCost = summary.AiComputeCost,
            BuildMinutesCost = summary.BuildMinutesCost,
            TestRunsCost = summary.TestRunsCost,
            PreviewDeploysCost = summary.PreviewDeploysCost,
            AiComputeUnits = summary.AiComputeUnits,
            BuildMinutesUnits = summary.BuildMinutesUnits,
            TestRunsUnits = summary.TestRunsUnits,
            PreviewDeploysUnits = summary.PreviewDeploysUnits,
            SuccessCount = summary.SuccessCount,
            FailedCount = summary.FailedCount,
            PartialCount = summary.PartialCount,
            TotalRecords = summary.TotalRecords,
            FromDate = summary.FromDate,
            ToDate = summary.ToDate,
        });
    }

    [HttpGet("history")]
    [ProducesResponseType(typeof(List<UsageMeterDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UsageMeterDto>>> GetUsageHistory([FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var history = await _usageMeteringService.GetUsageHistory(userId, limit);
        return Ok(history.Select(MapDto).ToList());
    }

    [HttpGet("projects/{id:guid}/costs")]
    [ProducesResponseType(typeof(ProjectCostBreakdownDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProjectCostBreakdownDto>> GetProjectCostBreakdown(Guid id)
    {
        var breakdown = await _usageMeteringService.GetProjectCostBreakdown(id);
        return Ok(new ProjectCostBreakdownDto
        {
            DevRequestId = breakdown.DevRequestId,
            TotalCost = breakdown.TotalCost,
            ByType = breakdown.ByType.Select(t => new MeterTypeCostDto
            {
                MeterType = t.MeterType,
                Units = t.Units,
                TotalCost = t.TotalCost,
                Count = t.Count,
            }).ToList(),
            ByOutcome = breakdown.ByOutcome.Select(o => new OutcomeCostDto
            {
                Outcome = o.Outcome,
                TotalCost = o.TotalCost,
                Count = o.Count,
            }).ToList(),
            TotalRecords = breakdown.TotalRecords,
        });
    }

    [HttpGet("spending-alerts")]
    [ProducesResponseType(typeof(SpendingAlertResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SpendingAlertResultDto>> GetSpendingAlerts()
    {
        var userId = GetUserId();
        var alerts = await _usageMeteringService.GetSpendingAlerts(userId);
        return Ok(new SpendingAlertResultDto
        {
            MonthlySpend = alerts.MonthlySpend,
            ProjectedMonthly = alerts.ProjectedMonthly,
            WarningThreshold = alerts.WarningThreshold,
            CriticalThreshold = alerts.CriticalThreshold,
            Alerts = alerts.Alerts.Select(a => new SpendingAlertDto
            {
                Level = a.Level,
                Message = a.Message,
                CurrentSpend = a.CurrentSpend,
                Threshold = a.Threshold,
            }).ToList(),
        });
    }

    private static UsageMeterDto MapDto(Entities.UsageMeter m) => new()
    {
        Id = m.Id,
        UserId = m.UserId,
        DevRequestId = m.DevRequestId,
        MeterType = m.MeterType,
        Units = m.Units,
        UnitCost = m.UnitCost,
        TotalCost = m.TotalCost,
        Status = m.Status,
        Outcome = m.Outcome,
        MetadataJson = m.MetadataJson,
        CreatedAt = m.CreatedAt,
        BilledAt = m.BilledAt,
    };
}

// === DTOs ===

public record UsageMeterDto
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = "";
    public Guid? DevRequestId { get; init; }
    public string MeterType { get; init; } = "";
    public decimal Units { get; init; }
    public decimal UnitCost { get; init; }
    public decimal TotalCost { get; init; }
    public string Status { get; init; } = "";
    public string Outcome { get; init; } = "";
    public string? MetadataJson { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? BilledAt { get; init; }
}

public record UsageMeteringSummaryDto
{
    public decimal TotalSpend { get; init; }
    public decimal AiComputeCost { get; init; }
    public decimal BuildMinutesCost { get; init; }
    public decimal TestRunsCost { get; init; }
    public decimal PreviewDeploysCost { get; init; }
    public decimal AiComputeUnits { get; init; }
    public decimal BuildMinutesUnits { get; init; }
    public decimal TestRunsUnits { get; init; }
    public decimal PreviewDeploysUnits { get; init; }
    public int SuccessCount { get; init; }
    public int FailedCount { get; init; }
    public int PartialCount { get; init; }
    public int TotalRecords { get; init; }
    public DateTime FromDate { get; init; }
    public DateTime ToDate { get; init; }
}

public record ProjectCostBreakdownDto
{
    public Guid DevRequestId { get; init; }
    public decimal TotalCost { get; init; }
    public List<MeterTypeCostDto> ByType { get; init; } = [];
    public List<OutcomeCostDto> ByOutcome { get; init; } = [];
    public int TotalRecords { get; init; }
}

public record MeterTypeCostDto
{
    public string MeterType { get; init; } = "";
    public decimal Units { get; init; }
    public decimal TotalCost { get; init; }
    public int Count { get; init; }
}

public record OutcomeCostDto
{
    public string Outcome { get; init; } = "";
    public decimal TotalCost { get; init; }
    public int Count { get; init; }
}

public record SpendingAlertResultDto
{
    public decimal MonthlySpend { get; init; }
    public decimal ProjectedMonthly { get; init; }
    public decimal WarningThreshold { get; init; }
    public decimal CriticalThreshold { get; init; }
    public List<SpendingAlertDto> Alerts { get; init; } = [];
}

public record SpendingAlertDto
{
    public string Level { get; init; } = "";
    public string Message { get; init; } = "";
    public decimal CurrentSpend { get; init; }
    public decimal Threshold { get; init; }
}
