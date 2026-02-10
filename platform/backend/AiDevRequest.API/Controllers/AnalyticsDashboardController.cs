using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/analytics")]
public class AnalyticsDashboardController : ControllerBase
{
    private readonly IAnalyticsDashboardService _analyticsService;
    private readonly ILogger<AnalyticsDashboardController> _logger;

    public AnalyticsDashboardController(IAnalyticsDashboardService analyticsService, ILogger<AnalyticsDashboardController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>Record an analytics event</summary>
    [HttpPost("events")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecordEvent([FromBody] RecordAnalyticsEventDto dto)
    {
        try
        {
            var analyticsEvent = new AnalyticsEvent
            {
                UserId = dto.UserId,
                EventType = dto.EventType,
                EventData = dto.EventData,
                SessionId = dto.SessionId,
                Page = dto.Page,
                Referrer = dto.Referrer,
                UserAgent = dto.UserAgent,
            };

            await _analyticsService.RecordEventAsync(analyticsEvent);
            return Created();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record analytics event");
            return BadRequest(new { error = "Failed to record event" });
        }
    }

    /// <summary>Get aggregated dashboard metrics</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(DashboardMetricsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardMetricsDto>> GetDashboard([FromQuery] string period = "weekly")
    {
        var metrics = await _analyticsService.GetDashboardAsync(period);
        return Ok(new DashboardMetricsDto
        {
            ActiveUsers = metrics.ActiveUsers,
            TotalRequests = metrics.TotalRequests,
            CompletionRate = metrics.CompletionRate,
            AvgBuildTimeMinutes = metrics.AvgBuildTimeMinutes,
            TotalEvents = metrics.TotalEvents,
            Period = metrics.Period,
        });
    }

    /// <summary>Get funnel conversion data</summary>
    [HttpGet("funnel")]
    [ProducesResponseType(typeof(FunnelDataDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<FunnelDataDto>> GetFunnel([FromQuery] string period = "weekly")
    {
        var funnel = await _analyticsService.GetFunnelAsync(period);
        return Ok(new FunnelDataDto
        {
            Stages = funnel.Stages.Select(s => new FunnelStageDto
            {
                Name = s.Name,
                Count = s.Count,
                ConversionRate = s.ConversionRate,
                DropOffRate = s.DropOffRate,
            }).ToList(),
            Period = funnel.Period,
        });
    }

    /// <summary>Get feature usage breakdown</summary>
    [HttpGet("usage")]
    [ProducesResponseType(typeof(List<UsageBreakdownDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UsageBreakdownDto>>> GetUsageBreakdown([FromQuery] string period = "weekly")
    {
        var breakdown = await _analyticsService.GetUsageBreakdownAsync(period);
        return Ok(breakdown.Select(b => new UsageBreakdownDto
        {
            EventType = b.EventType,
            Count = b.Count,
            UniqueUsers = b.UniqueUsers,
        }).ToList());
    }

    /// <summary>Get time-series trends for a specific metric</summary>
    [HttpGet("trends")]
    [ProducesResponseType(typeof(List<TrendPointDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<TrendPointDto>>> GetTrends(
        [FromQuery] string period = "weekly",
        [FromQuery] string metric = "total_events")
    {
        var trends = await _analyticsService.GetTrendsAsync(period, metric);
        return Ok(trends.Select(t => new TrendPointDto
        {
            Date = t.Date,
            Value = t.Value,
        }).ToList());
    }
}

// === DTOs ===

public record RecordAnalyticsEventDto
{
    public int? UserId { get; init; }
    public string EventType { get; init; } = "";
    public string? EventData { get; init; }
    public string? SessionId { get; init; }
    public string? Page { get; init; }
    public string? Referrer { get; init; }
    public string? UserAgent { get; init; }
}

public record DashboardMetricsDto
{
    public int ActiveUsers { get; init; }
    public int TotalRequests { get; init; }
    public double CompletionRate { get; init; }
    public double AvgBuildTimeMinutes { get; init; }
    public int TotalEvents { get; init; }
    public string Period { get; init; } = "";
}

public record FunnelDataDto
{
    public List<FunnelStageDto> Stages { get; init; } = [];
    public string Period { get; init; } = "";
}

public record FunnelStageDto
{
    public string Name { get; init; } = "";
    public int Count { get; init; }
    public double ConversionRate { get; init; }
    public double DropOffRate { get; init; }
}

public record UsageBreakdownDto
{
    public string EventType { get; init; } = "";
    public int Count { get; init; }
    public int UniqueUsers { get; init; }
}

public record TrendPointDto
{
    public string Date { get; init; } = "";
    public double Value { get; init; }
}
