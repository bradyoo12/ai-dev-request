using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/observability")]
public class ObservabilityController : ControllerBase
{
    private readonly IObservabilityService _observabilityService;

    public ObservabilityController(IObservabilityService observabilityService)
    {
        _observabilityService = observabilityService;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpGet("traces")]
    public async Task<ActionResult<TraceListDto>> GetTraces(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null, [FromQuery] string? model = null)
    {
        var userId = GetUserId();
        var (traces, totalCount) = await _observabilityService.GetTracesAsync(userId, page, pageSize, status, model);

        return Ok(new TraceListDto
        {
            Traces = traces.Select(t => new TraceDto
            {
                Id = t.Id,
                TraceId = t.TraceId,
                DevRequestId = t.DevRequestId,
                TotalTokens = t.TotalTokens,
                TotalCost = t.TotalCost,
                LatencyMs = t.LatencyMs,
                Model = t.Model,
                Status = t.Status,
                CreatedAt = t.CreatedAt,
                CompletedAt = t.CompletedAt,
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        });
    }

    [HttpGet("traces/{traceId}")]
    public async Task<ActionResult<TraceDetailDto>> GetTrace(string traceId)
    {
        var trace = await _observabilityService.GetTraceAsync(traceId);
        if (trace == null)
            return NotFound(new { error = "Trace not found." });

        if (trace.UserId != GetUserId())
            return Forbid();

        var spans = await _observabilityService.GetSpansForTraceAsync(trace.Id);

        return Ok(new TraceDetailDto
        {
            Id = trace.Id,
            TraceId = trace.TraceId,
            DevRequestId = trace.DevRequestId,
            TotalTokens = trace.TotalTokens,
            TotalCost = trace.TotalCost,
            LatencyMs = trace.LatencyMs,
            Model = trace.Model,
            Status = trace.Status,
            CreatedAt = trace.CreatedAt,
            CompletedAt = trace.CompletedAt,
            Spans = spans.Select(s => new SpanDto
            {
                Id = s.Id,
                SpanName = s.SpanName,
                Model = s.Model,
                InputTokens = s.InputTokens,
                OutputTokens = s.OutputTokens,
                TotalTokens = s.TotalTokens,
                Cost = s.Cost,
                LatencyMs = s.LatencyMs,
                Status = s.Status,
                StartedAt = s.StartedAt,
                CompletedAt = s.CompletedAt,
            }).ToList(),
        });
    }

    [HttpGet("analytics/cost")]
    public async Task<ActionResult<CostAnalyticsResult>> GetCostAnalytics(
        [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null,
        [FromQuery] string granularity = "daily")
    {
        var userId = GetUserId();
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        var result = await _observabilityService.GetCostAnalyticsAsync(userId, start, end, granularity);
        return Ok(result);
    }

    [HttpGet("analytics/performance")]
    public async Task<ActionResult<PerformanceMetricsResult>> GetPerformanceMetrics()
    {
        var userId = GetUserId();
        var result = await _observabilityService.GetPromptPerformanceAsync(userId);
        return Ok(result);
    }

    [HttpGet("analytics/usage")]
    public async Task<ActionResult<UsageAnalyticsResult>> GetUsageAnalytics(
        [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null,
        [FromQuery] string granularity = "daily")
    {
        var userId = GetUserId();
        var start = startDate ?? DateTime.UtcNow.AddDays(-30);
        var end = endDate ?? DateTime.UtcNow;

        var result = await _observabilityService.GetUsageAnalyticsAsync(userId, start, end, granularity);
        return Ok(result);
    }
}

#region DTOs

public record TraceDto
{
    public int Id { get; init; }
    public string TraceId { get; init; } = "";
    public Guid? DevRequestId { get; init; }
    public int TotalTokens { get; init; }
    public decimal TotalCost { get; init; }
    public long LatencyMs { get; init; }
    public string? Model { get; init; }
    public string Status { get; init; } = "";
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record SpanDto
{
    public int Id { get; init; }
    public string SpanName { get; init; } = "";
    public string? Model { get; init; }
    public int InputTokens { get; init; }
    public int OutputTokens { get; init; }
    public int TotalTokens { get; init; }
    public decimal Cost { get; init; }
    public long LatencyMs { get; init; }
    public string Status { get; init; } = "";
    public DateTime StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record TraceListDto
{
    public List<TraceDto> Traces { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public record TraceDetailDto
{
    public int Id { get; init; }
    public string TraceId { get; init; } = "";
    public Guid? DevRequestId { get; init; }
    public int TotalTokens { get; init; }
    public decimal TotalCost { get; init; }
    public long LatencyMs { get; init; }
    public string? Model { get; init; }
    public string Status { get; init; } = "";
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public List<SpanDto> Spans { get; init; } = [];
}

#endregion
