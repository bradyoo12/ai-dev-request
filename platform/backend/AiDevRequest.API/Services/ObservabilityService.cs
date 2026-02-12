using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IObservabilityService
{
    Task<ObservabilityTrace> StartTraceAsync(string userId, Guid? requestId = null, string? model = null);
    Task<ObservabilityTrace> StartSpanAsync(string userId, string operationName, string? parentSpanId = null);
    Task CompleteSpanAsync(int traceId, int inputTokens, int outputTokens, string? error = null);
    Task<ObservabilitySpan> AddSpanAsync(string traceId, string spanName, string? model, int inputTokens, int outputTokens, decimal cost, long latencyMs);
    Task<ObservabilityTrace> EndTraceAsync(string traceId);
    Task<ObservabilityTrace?> GetTraceAsync(string traceId);
    Task<List<ObservabilitySpan>> GetSpansForTraceAsync(int traceDbId);
    Task<(List<ObservabilityTrace> Traces, int TotalCount)> GetTracesAsync(string userId, int page = 1, int pageSize = 20, string? status = null, string? model = null, string? operation = null);
    Task<List<ObservabilityTrace>> GetTracesForRequestAsync(Guid requestId);
    Task<ObservabilityStatsDto> GetStatsAsync(string userId);
    Task<ObservabilityTrace> RecordTraceAsync(string userId, RecordTraceRequest request);
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
            SpanId = Guid.NewGuid().ToString("N")[..16],
            Model = model,
            Status = "running",
        };

        _context.ObservabilityTraces.Add(trace);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Trace started: {TraceId} for user {UserId}", trace.TraceId, userId);
        return trace;
    }

    public async Task<ObservabilityTrace> StartSpanAsync(string userId, string operationName, string? parentSpanId = null)
    {
        var trace = new ObservabilityTrace
        {
            UserId = userId,
            TraceId = Guid.NewGuid().ToString("N"),
            SpanId = Guid.NewGuid().ToString("N")[..16],
            ParentSpanId = parentSpanId,
            OperationName = operationName,
            Status = "running",
            StartedAt = DateTime.UtcNow,
        };

        _context.ObservabilityTraces.Add(trace);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Span started: {TraceId} operation={Operation} for user {UserId}",
            trace.TraceId, operationName, userId);
        return trace;
    }

    public async Task CompleteSpanAsync(int traceId, int inputTokens, int outputTokens, string? error = null)
    {
        var trace = await _context.ObservabilityTraces
            .FirstOrDefaultAsync(t => t.Id == traceId)
            ?? throw new InvalidOperationException($"Trace with Id {traceId} not found.");

        var now = DateTime.UtcNow;
        trace.InputTokens = inputTokens;
        trace.OutputTokens = outputTokens;
        trace.TotalTokens = inputTokens + outputTokens;
        trace.DurationMs = (int)(now - trace.StartedAt).TotalMilliseconds;
        trace.LatencyMs = trace.DurationMs;
        trace.CompletedAt = now;

        if (!string.IsNullOrEmpty(error))
        {
            trace.Status = "error";
            trace.ErrorMessage = error;
        }
        else
        {
            trace.Status = "ok";
        }

        // Estimate cost based on model tier
        trace.EstimatedCost = EstimateCost(trace.ModelTier, inputTokens, outputTokens);
        trace.TotalCost = trace.EstimatedCost;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Span completed: {TraceId}, tokens={Tokens}, duration={Duration}ms",
            trace.TraceId, trace.TotalTokens, trace.DurationMs);
    }

    public async Task<ObservabilityTrace> RecordTraceAsync(string userId, RecordTraceRequest request)
    {
        var trace = new ObservabilityTrace
        {
            UserId = userId,
            TraceId = Guid.NewGuid().ToString("N"),
            SpanId = Guid.NewGuid().ToString("N")[..16],
            ParentSpanId = request.ParentSpanId,
            OperationName = request.OperationName,
            InputTokens = request.InputTokens,
            OutputTokens = request.OutputTokens,
            TotalTokens = request.InputTokens + request.OutputTokens,
            DurationMs = request.DurationMs,
            LatencyMs = request.DurationMs,
            Model = request.Model,
            ModelTier = request.ModelTier,
            Status = request.Error != null ? "error" : "ok",
            ErrorMessage = request.Error,
            AttributesJson = request.AttributesJson,
            StartedAt = DateTime.UtcNow.AddMilliseconds(-request.DurationMs),
            CompletedAt = DateTime.UtcNow,
        };

        trace.EstimatedCost = EstimateCost(trace.ModelTier, trace.InputTokens, trace.OutputTokens);
        trace.TotalCost = trace.EstimatedCost;

        _context.ObservabilityTraces.Add(trace);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Trace recorded: {TraceId} operation={Operation} for user {UserId}",
            trace.TraceId, request.OperationName, userId);
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
        trace.InputTokens = spans.Sum(s => s.InputTokens);
        trace.OutputTokens = spans.Sum(s => s.OutputTokens);
        trace.TotalCost = spans.Sum(s => s.Cost);
        trace.LatencyMs = spans.Sum(s => s.LatencyMs);
        trace.DurationMs = (int)(DateTime.UtcNow - trace.StartedAt).TotalMilliseconds;
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
        string userId, int page = 1, int pageSize = 20, string? status = null, string? model = null, string? operation = null)
    {
        var query = _context.ObservabilityTraces.Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(t => t.Status == status);
        if (!string.IsNullOrEmpty(model))
            query = query.Where(t => t.Model == model);
        if (!string.IsNullOrEmpty(operation))
            query = query.Where(t => t.OperationName == operation);

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

    public async Task<ObservabilityStatsDto> GetStatsAsync(string userId)
    {
        var allTraces = await _context.ObservabilityTraces
            .Where(t => t.UserId == userId)
            .ToListAsync();

        if (allTraces.Count == 0)
        {
            return new ObservabilityStatsDto
            {
                TotalTraces = 0,
                TotalTokens = 0,
                TotalCost = 0,
                AvgDurationMs = 0,
                ErrorRate = 0,
                TracesByOperation = new Dictionary<string, int>(),
            };
        }

        var errorCount = allTraces.Count(t => t.Status == "error");
        var completedTraces = allTraces.Where(t => t.DurationMs > 0 || t.LatencyMs > 0).ToList();
        var avgDuration = completedTraces.Count > 0
            ? completedTraces.Average(t => t.DurationMs > 0 ? t.DurationMs : t.LatencyMs)
            : 0;

        var tracesByOp = allTraces
            .Where(t => !string.IsNullOrEmpty(t.OperationName))
            .GroupBy(t => t.OperationName!)
            .ToDictionary(g => g.Key, g => g.Count());

        return new ObservabilityStatsDto
        {
            TotalTraces = allTraces.Count,
            TotalTokens = allTraces.Sum(t => t.TotalTokens),
            TotalCost = allTraces.Sum(t => t.TotalCost),
            AvgDurationMs = (long)avgDuration,
            ErrorRate = allTraces.Count > 0 ? (double)errorCount / allTraces.Count * 100 : 0,
            TracesByOperation = tracesByOp,
        };
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
            .Where(t => t.UserId == userId && (t.Status == "completed" || t.Status == "ok"))
            .OrderByDescending(t => t.CreatedAt)
            .Take(500)
            .ToListAsync();

        if (traces.Count == 0)
        {
            return new PerformanceMetricsResult();
        }

        var latencies = traces.Select(t => t.LatencyMs > 0 ? t.LatencyMs : (long)t.DurationMs).OrderBy(l => l).ToList();
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

    private static decimal EstimateCost(string? modelTier, int inputTokens, int outputTokens)
    {
        // Cost per 1M tokens (input/output)
        var (inputRate, outputRate) = (modelTier?.ToLower()) switch
        {
            "haiku" => (0.25m, 1.25m),
            "sonnet" => (3.0m, 15.0m),
            "opus" => (15.0m, 75.0m),
            _ => (3.0m, 15.0m), // default to sonnet pricing
        };

        return (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000m;
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

public class ObservabilityStatsDto
{
    public int TotalTraces { get; set; }
    public int TotalTokens { get; set; }
    public decimal TotalCost { get; set; }
    public long AvgDurationMs { get; set; }
    public double ErrorRate { get; set; }
    public Dictionary<string, int> TracesByOperation { get; set; } = new();
}

public class RecordTraceRequest
{
    public string OperationName { get; set; } = "";
    public string? ParentSpanId { get; set; }
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int DurationMs { get; set; }
    public string? Model { get; set; }
    public string? ModelTier { get; set; }
    public string? Error { get; set; }
    public string? AttributesJson { get; set; }
}

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
