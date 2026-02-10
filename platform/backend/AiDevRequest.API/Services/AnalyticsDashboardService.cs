using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IAnalyticsDashboardService
{
    Task RecordEventAsync(AnalyticsEvent analyticsEvent);
    Task<DashboardMetrics> GetDashboardAsync(string period);
    Task<FunnelData> GetFunnelAsync(string period);
    Task<List<UsageBreakdownItem>> GetUsageBreakdownAsync(string period);
    Task<List<TrendPoint>> GetTrendsAsync(string period, string metric);
}

public class AnalyticsDashboardService : IAnalyticsDashboardService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<AnalyticsDashboardService> _logger;

    public AnalyticsDashboardService(AiDevRequestDbContext context, ILogger<AnalyticsDashboardService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task RecordEventAsync(AnalyticsEvent analyticsEvent)
    {
        analyticsEvent.Id = Guid.NewGuid();
        analyticsEvent.CreatedAt = DateTime.UtcNow;

        _context.AnalyticsEvents.Add(analyticsEvent);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Recorded analytics event: {EventType} for user {UserId}",
            analyticsEvent.EventType, analyticsEvent.UserId);
    }

    public async Task<DashboardMetrics> GetDashboardAsync(string period)
    {
        var since = GetPeriodStart(period);

        var events = await _context.AnalyticsEvents
            .Where(e => e.CreatedAt >= since)
            .ToListAsync();

        var activeUsers = events
            .Where(e => e.UserId.HasValue)
            .Select(e => e.UserId!.Value)
            .Distinct()
            .Count();

        var totalRequests = events.Count(e => e.EventType == "request_created");

        var buildStarted = events.Count(e => e.EventType == "build_started");
        var buildCompleted = events.Count(e => e.EventType == "build_completed");
        var completionRate = buildStarted > 0
            ? Math.Round((double)buildCompleted / buildStarted * 100, 1)
            : 0;

        // Calculate average build time from event data
        var buildCompletedEvents = events
            .Where(e => e.EventType == "build_completed" && !string.IsNullOrEmpty(e.EventData))
            .ToList();

        double avgBuildTimeMinutes = 0;
        if (buildCompletedEvents.Any())
        {
            var durations = new List<double>();
            foreach (var evt in buildCompletedEvents)
            {
                try
                {
                    var data = JsonSerializer.Deserialize<JsonElement>(evt.EventData!);
                    if (data.TryGetProperty("durationMinutes", out var dur) && dur.TryGetDouble(out var minutes))
                    {
                        durations.Add(minutes);
                    }
                }
                catch
                {
                    // Skip malformed event data
                }
            }
            if (durations.Any())
                avgBuildTimeMinutes = Math.Round(durations.Average(), 1);
        }

        return new DashboardMetrics
        {
            ActiveUsers = activeUsers,
            TotalRequests = totalRequests,
            CompletionRate = completionRate,
            AvgBuildTimeMinutes = avgBuildTimeMinutes,
            TotalEvents = events.Count,
            Period = period,
        };
    }

    public async Task<FunnelData> GetFunnelAsync(string period)
    {
        var since = GetPeriodStart(period);

        var events = await _context.AnalyticsEvents
            .Where(e => e.CreatedAt >= since)
            .ToListAsync();

        var requestCreated = events.Count(e => e.EventType == "request_created");
        var analysisCompleted = events.Count(e => e.EventType == "analysis_completed");
        var proposalViewed = events.Count(e => e.EventType == "proposal_viewed");
        var buildStarted = events.Count(e => e.EventType == "build_started");
        var buildCompleted = events.Count(e => e.EventType == "build_completed");
        var previewDeployed = events.Count(e => e.EventType == "preview_deployed");

        var stages = new List<FunnelStage>
        {
            BuildStage("Request Created", requestCreated, requestCreated),
            BuildStage("Analysis Completed", analysisCompleted, requestCreated),
            BuildStage("Proposal Viewed", proposalViewed, requestCreated),
            BuildStage("Build Started", buildStarted, requestCreated),
            BuildStage("Build Completed", buildCompleted, requestCreated),
            BuildStage("Preview Deployed", previewDeployed, requestCreated),
        };

        return new FunnelData
        {
            Stages = stages,
            Period = period,
        };
    }

    public async Task<List<UsageBreakdownItem>> GetUsageBreakdownAsync(string period)
    {
        var since = GetPeriodStart(period);

        var breakdown = await _context.AnalyticsEvents
            .Where(e => e.CreatedAt >= since)
            .GroupBy(e => e.EventType)
            .Select(g => new UsageBreakdownItem
            {
                EventType = g.Key,
                Count = g.Count(),
                UniqueUsers = g.Where(e => e.UserId.HasValue).Select(e => e.UserId!.Value).Distinct().Count(),
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        return breakdown;
    }

    public async Task<List<TrendPoint>> GetTrendsAsync(string period, string metric)
    {
        var since = GetPeriodStart(period);

        var events = await _context.AnalyticsEvents
            .Where(e => e.CreatedAt >= since)
            .ToListAsync();

        // Group by date
        var grouped = events
            .GroupBy(e => e.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .ToList();

        var points = grouped.Select(g =>
        {
            double value = metric switch
            {
                "active_users" => g.Where(e => e.UserId.HasValue).Select(e => e.UserId!.Value).Distinct().Count(),
                "total_events" => g.Count(),
                "requests" => g.Count(e => e.EventType == "request_created"),
                "builds" => g.Count(e => e.EventType == "build_started"),
                "deployments" => g.Count(e => e.EventType == "preview_deployed"),
                _ => g.Count(),
            };

            return new TrendPoint
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Value = value,
            };
        }).ToList();

        return points;
    }

    private static DateTime GetPeriodStart(string period) => period switch
    {
        "daily" => DateTime.UtcNow.AddDays(-1),
        "weekly" => DateTime.UtcNow.AddDays(-7),
        "monthly" => DateTime.UtcNow.AddDays(-30),
        _ => DateTime.UtcNow.AddDays(-7),
    };

    private static FunnelStage BuildStage(string name, int count, int total)
    {
        var conversionRate = total > 0 ? Math.Round((double)count / total * 100, 1) : 0;
        var dropOffRate = total > 0 ? Math.Round(100 - conversionRate, 1) : 0;

        return new FunnelStage
        {
            Name = name,
            Count = count,
            ConversionRate = conversionRate,
            DropOffRate = dropOffRate,
        };
    }
}

// === Supporting Types ===

public class DashboardMetrics
{
    public int ActiveUsers { get; set; }
    public int TotalRequests { get; set; }
    public double CompletionRate { get; set; }
    public double AvgBuildTimeMinutes { get; set; }
    public int TotalEvents { get; set; }
    public string Period { get; set; } = "";
}

public class FunnelData
{
    public List<FunnelStage> Stages { get; set; } = [];
    public string Period { get; set; } = "";
}

public class FunnelStage
{
    public string Name { get; set; } = "";
    public int Count { get; set; }
    public double ConversionRate { get; set; }
    public double DropOffRate { get; set; }
}

public class UsageBreakdownItem
{
    public string EventType { get; set; } = "";
    public int Count { get; set; }
    public int UniqueUsers { get; set; }
}

public class TrendPoint
{
    public string Date { get; set; } = "";
    public double Value { get; set; }
}
