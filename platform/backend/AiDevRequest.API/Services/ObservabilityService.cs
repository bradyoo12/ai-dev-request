using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IObservabilityService
{
    Task<ObservabilityTrace> StartTraceAsync(string userId, Guid? requestId = null, string? model = null);
    Task<ObservabilitySpan> AddSpanAsync(string traceId, string spanName, string? model, int inputTokens, int outputTokens, decimal cost, long latencyMs);
    Task<ObservabilityTrace> EndTraceAsync(string traceId);
    Task<ObservabilityTrace?> GetTraceAsync(string traceId);
    Task<List<ObservabilitySpan>> GetSpansForTraceAsync(int traceDbId);
    Task<(List<ObservabilityTrace> Traces, int TotalCount)> GetTracesAsync(string userId, int page = 1, int pageSize = 20, string? status = null, string? model = null);
    Task<List<ObservabilityTrace>> GetTracesForRequestAsync(Guid requestId);
    Task<CostAnalyticsResult> GetCostAnalyticsAsync(string userId, DateTime startDate, DateTime endDate, string granularity = "daily");
    Task<PerformanceMetricsResult> GetPromptPerformanceAsync(string userId);
    Task<UsageAnalyticsResult> GetUsageAnalyticsAsync(string userId, DateTime startDate, DateTime endDate, string granularity = "daily");
}

public class ObservabilityService : IObservabilityService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ObservabilityService> _logger;

    public ObservabilityService(AiDevRequestDbContext context, ILogger<ObservabilityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ObservabilityTrace> StartTraceAsync(string userId, Guid? requestId = null, string? model = null)
    {
        var trace = new ObservabilityTrace
        {
            UserId = userId,
            DevRequestId = requestId,
            TraceId = Guid.NewGuid().ToString("N"),
            Model = model,
            Status = "running",
        };

        _context.ObservabilityTraces.Add(trace);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Trace started: {TraceId} for user {UserId}", trace.TraceId, userId);
        return trace;
    }

    public async Task<ObservabilitySpan> AddSpanAsync(
        string traceId, string spanName, string? model,
        int inputTokens, int outputTokens, decimal cost, long latencyMs)
    {
        var trace = await _context.ObservabilityTraces
            .FirstOrDefaultAsync(t => t.TraceId == traceId)
            ?? throw new InvalidOperationException($"Trace {traceId} not found.");

        var span = new ObservabilitySpan
        {
            TraceId = trace.Id,
            SpanName = spanName,
            Model = model,
            InputTokens = inputTokens,
            OutputTokens = outputTokens,
            TotalTokens = inputTokens + outputTokens,
            Cost = cost,
            LatencyMs = latencyMs,
            Status = "completed",
            CompletedAt = DateTime.UtcNow,
        };

        _context.ObservabilitySpans.Add(span);
        await _context.SaveChangesAsync();

        return span;
    }

    public async Task<ObservabilityTrace> EndTraceAsync(string traceId)
    {
        var trace = await _context.ObservabilityTraces
            .FirstOrDefaultAsync(t => t.TraceId == traceId)
            ?? throw new InvalidOperationException($"Trace {traceId} not found.");

        var spans = await _context.ObservabilitySpans
            .Where(s => s.TraceId == trace.Id)
            .ToListAsync();

        trace.TotalTokens = spans.Sum(s => s.TotalTokens);
        trace.TotalCost = spans.Sum(s => s.Cost);
        trace.LatencyMs = spans.Sum(s => s.LatencyMs);
        trace.Status = spans.Any(s => s.Status == "error") ? "error" : "completed";
        trace.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Trace ended: {TraceId}, tokens={Tokens}, cost={Cost}",
            traceId, trace.TotalTokens, trace.TotalCost);
        return trace;
    }

    public async Task<ObservabilityTrace?> GetTraceAsync(string traceId)
    {
        return await _context.ObservabilityTraces
            .FirstOrDefaultAsync(t => t.TraceId == traceId);
    }

    public async Task<List<ObservabilitySpan>> GetSpansForTraceAsync(int traceDbId)
    {
        return await _context.ObservabilitySpans
            .Where(s => s.TraceId == traceDbId)
            .OrderBy(s => s.StartedAt)
            .ToListAsync();
    }

    public async Task<(List<ObservabilityTrace> Traces, int TotalCount)> GetTracesAsync(
        string userId, int page = 1, int pageSize = 20, string? status = null, string? model = null)
    {
        var query = _context.ObservabilityTraces.Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(t => t.Status == status);
        if (!string.IsNullOrEmpty(model))
            query = query.Where(t => t.Model == model);

        var totalCount = await query.CountAsync();
        var traces = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (traces, totalCount);
    }

    public async Task<List<ObservabilityTrace>> GetTracesForRequestAsync(Guid requestId)
    {
        return await _context.ObservabilityTraces
            .Where(t => t.DevRequestId == requestId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<CostAnalyticsResult> GetCostAnalyticsAsync(
        string userId, DateTime startDate, DateTime endDate, string granularity = "daily")
    {
        var traces = await _context.ObservabilityTraces
            .Where(t => t.UserId == userId && t.CreatedAt >= startDate && t.CreatedAt <= endDate)
            .ToListAsync();

        var buckets = GroupByGranularity(traces, granularity, t => t.CreatedAt);

        var result = new CostAnalyticsResult
        {
            TotalCost = traces.Sum(t => t.TotalCost),
            TotalTraces = traces.Count,
            Buckets = buckets.Select(g => new CostBucket
            {
                Date = g.Key,
                Cost = g.Value.Sum(t => t.TotalCost),
                TraceCount = g.Value.Count,
            }).OrderBy(b => b.Date).ToList(),
            CostByModel = traces
                .Where(t => t.Model != null)
                .GroupBy(t => t.Model!)
                .Select(g => new ModelCostBreakdown
                {
                    Model = g.Key,
                    Cost = g.Sum(t => t.TotalCost),
                    TraceCount = g.Count(),
                    TotalTokens = g.Sum(t => t.TotalTokens),
                }).OrderByDescending(m => m.Cost).ToList(),
        };

        return result;
    }

    public async Task<PerformanceMetricsResult> GetPromptPerformanceAsync(string userId)
    {
        var traces = await _context.ObservabilityTraces
            .Where(t => t.UserId == userId && t.Status == "completed")
            .OrderByDescending(t => t.CreatedAt)
            .Take(500)
            .ToListAsync();

        if (traces.Count == 0)
        {
            return new PerformanceMetricsResult();
        }

        var latencies = traces.Select(t => t.LatencyMs).OrderBy(l => l).ToList();
        var allTraces = await _context.ObservabilityTraces
            .Where(t => t.UserId == userId)
            .CountAsync();
        var errorTraces = await _context.ObservabilityTraces
            .Where(t => t.UserId == userId && t.Status == "error")
            .CountAsync();

        return new PerformanceMetricsResult
        {
            TotalTraces = allTraces,
            SuccessRate = allTraces > 0 ? (double)(allTraces - errorTraces) / allTraces * 100 : 0,
            AvgLatencyMs = (long)latencies.Average(),
            P50LatencyMs = Percentile(latencies, 50),
            P95LatencyMs = Percentile(latencies, 95),
            P99LatencyMs = Percentile(latencies, 99),
            AvgTokensPerTrace = (int)traces.Average(t => t.TotalTokens),
            ErrorCount = errorTraces,
        };
    }

    public async Task<UsageAnalyticsResult> GetUsageAnalyticsAsync(
        string userId, DateTime startDate, DateTime endDate, string granularity = "daily")
    {
        var spans = await _context.ObservabilitySpans
            .Join(_context.ObservabilityTraces,
                s => s.TraceId,
                t => t.Id,
                (s, t) => new { Span = s, Trace = t })
            .Where(x => x.Trace.UserId == userId && x.Span.StartedAt >= startDate && x.Span.StartedAt <= endDate)
            .Select(x => x.Span)
            .ToListAsync();

        var buckets = GroupByGranularity(spans, granularity, s => s.StartedAt);

        return new UsageAnalyticsResult
        {
            TotalInputTokens = spans.Sum(s => s.InputTokens),
            TotalOutputTokens = spans.Sum(s => s.OutputTokens),
            TotalTokens = spans.Sum(s => s.TotalTokens),
            Buckets = buckets.Select(g => new UsageBucket
            {
                Date = g.Key,
                InputTokens = g.Value.Sum(s => s.InputTokens),
                OutputTokens = g.Value.Sum(s => s.OutputTokens),
                TotalTokens = g.Value.Sum(s => s.TotalTokens),
                SpanCount = g.Value.Count,
            }).OrderBy(b => b.Date).ToList(),
            UsageByModel = spans
                .Where(s => s.Model != null)
                .GroupBy(s => s.Model!)
                .Select(g => new ModelUsageBreakdown
                {
                    Model = g.Key,
                    InputTokens = g.Sum(s => s.InputTokens),
                    OutputTokens = g.Sum(s => s.OutputTokens),
                    TotalTokens = g.Sum(s => s.TotalTokens),
                    SpanCount = g.Count(),
                }).OrderByDescending(m => m.TotalTokens).ToList(),
        };
    }

    private static Dictionary<string, List<T>> GroupByGranularity<T>(
        List<T> items, string granularity, Func<T, DateTime> dateSelector)
    {
        return granularity switch
        {
            "weekly" => items.GroupBy(i => {
                var d = dateSelector(i);
                var startOfWeek = d.AddDays(-(int)d.DayOfWeek);
                return startOfWeek.ToString("yyyy-MM-dd");
            }).ToDictionary(g => g.Key, g => g.ToList()),
            "monthly" => items.GroupBy(i => dateSelector(i).ToString("yyyy-MM"))
                .ToDictionary(g => g.Key, g => g.ToList()),
            _ => items.GroupBy(i => dateSelector(i).ToString("yyyy-MM-dd"))
                .ToDictionary(g => g.Key, g => g.ToList()),
        };
    }

    private static long Percentile(List<long> sorted, int percentile)
    {
        if (sorted.Count == 0) return 0;
        var index = (int)Math.Ceiling(percentile / 100.0 * sorted.Count) - 1;
        return sorted[Math.Max(0, Math.Min(index, sorted.Count - 1))];
    }
}

#region DTOs

public class CostAnalyticsResult
{
    public decimal TotalCost { get; set; }
    public int TotalTraces { get; set; }
    public List<CostBucket> Buckets { get; set; } = [];
    public List<ModelCostBreakdown> CostByModel { get; set; } = [];
}

public class CostBucket
{
    public string Date { get; set; } = "";
    public decimal Cost { get; set; }
    public int TraceCount { get; set; }
}

public class ModelCostBreakdown
{
    public string Model { get; set; } = "";
    public decimal Cost { get; set; }
    public int TraceCount { get; set; }
    public int TotalTokens { get; set; }
}

public class PerformanceMetricsResult
{
    public int TotalTraces { get; set; }
    public double SuccessRate { get; set; }
    public long AvgLatencyMs { get; set; }
    public long P50LatencyMs { get; set; }
    public long P95LatencyMs { get; set; }
    public long P99LatencyMs { get; set; }
    public int AvgTokensPerTrace { get; set; }
    public int ErrorCount { get; set; }
}

public class UsageAnalyticsResult
{
    public int TotalInputTokens { get; set; }
    public int TotalOutputTokens { get; set; }
    public int TotalTokens { get; set; }
    public List<UsageBucket> Buckets { get; set; } = [];
    public List<ModelUsageBreakdown> UsageByModel { get; set; } = [];
}

public class UsageBucket
{
    public string Date { get; set; } = "";
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int TotalTokens { get; set; }
    public int SpanCount { get; set; }
}

public class ModelUsageBreakdown
{
    public string Model { get; set; } = "";
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int TotalTokens { get; set; }
    public int SpanCount { get; set; }
}

#endregion
