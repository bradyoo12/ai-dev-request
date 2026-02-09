using System.Globalization;
using System.Text;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/churn")]
public class AdminChurnController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<AdminChurnController> _logger;

    public AdminChurnController(AiDevRequestDbContext context, ILogger<AdminChurnController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/admin/churn/overview - Current metrics snapshot
    /// </summary>
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        try
        {
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var prevMonthStart = monthStart.AddMonths(-1);

            // Current period
            var activeSubscribers = await _context.SubscriptionRecords
                .CountAsync(s => s.Status == SubscriptionStatus.Active);

            var churnedThisMonth = await _context.SubscriptionEvents
                .CountAsync(e => e.EventType == SubscriptionEventType.Canceled && e.CreatedAt >= monthStart);

            var newThisMonth = await _context.SubscriptionEvents
                .CountAsync(e => e.EventType == SubscriptionEventType.Created && e.CreatedAt >= monthStart);

            var subscribersAtStart = activeSubscribers - newThisMonth + churnedThisMonth;
            var churnRate = subscribersAtStart > 0
                ? Math.Round((decimal)churnedThisMonth / subscribersAtStart * 100, 2)
                : 0m;

            var mrr = await CalculateMrr();

            // Previous period for comparison
            var prevChurned = await _context.SubscriptionEvents
                .CountAsync(e => e.EventType == SubscriptionEventType.Canceled
                    && e.CreatedAt >= prevMonthStart && e.CreatedAt < monthStart);

            var prevNew = await _context.SubscriptionEvents
                .CountAsync(e => e.EventType == SubscriptionEventType.Created
                    && e.CreatedAt >= prevMonthStart && e.CreatedAt < monthStart);

            var prevActiveCount = subscribersAtStart - prevNew + prevChurned;
            var prevChurnRate = prevActiveCount > 0
                ? Math.Round((decimal)prevChurned / prevActiveCount * 100, 2)
                : 0m;

            var netGrowth = newThisMonth - churnedThisMonth;
            var prevNetGrowth = prevNew - prevChurned;

            return Ok(new ChurnOverviewDto
            {
                ActiveSubscribers = activeSubscribers,
                ChurnRate = churnRate,
                Mrr = mrr,
                NetGrowth = netGrowth,
                ChurnRateChange = churnRate - prevChurnRate,
                NetGrowthPrevious = prevNetGrowth,
                NewThisMonth = newThisMonth,
                ChurnedThisMonth = churnedThisMonth
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get churn overview");
            return Ok(new ChurnOverviewDto());
        }
    }

    /// <summary>
    /// GET /api/admin/churn/trends?months=12 - Historical trend data
    /// </summary>
    [HttpGet("trends")]
    public async Task<IActionResult> GetTrends([FromQuery] int months = 12)
    {
        try
        {
            months = Math.Clamp(months, 1, 24);
            var now = DateTime.UtcNow;
            var trends = new List<ChurnTrendDto>();

            for (int i = months - 1; i >= 0; i--)
            {
                var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-i);
                var periodEnd = periodStart.AddMonths(1);

                // Check for pre-computed snapshot first
                var snapshot = await _context.ChurnMetricSnapshots
                    .FirstOrDefaultAsync(s => s.PeriodStart == periodStart);

                if (snapshot != null)
                {
                    trends.Add(new ChurnTrendDto
                    {
                        Period = periodStart.ToString("yyyy-MM"),
                        TotalSubscribers = snapshot.TotalSubscribers,
                        NewSubscribers = snapshot.NewSubscribers,
                        ChurnedSubscribers = snapshot.ChurnedSubscribers,
                        ChurnRate = snapshot.ChurnRate,
                        Mrr = snapshot.Mrr,
                        NetGrowth = snapshot.NetGrowth
                    });
                    continue;
                }

                // Compute from events
                var created = await _context.SubscriptionEvents
                    .CountAsync(e => e.EventType == SubscriptionEventType.Created
                        && e.CreatedAt >= periodStart && e.CreatedAt < periodEnd);

                var churned = await _context.SubscriptionEvents
                    .CountAsync(e => e.EventType == SubscriptionEventType.Canceled
                        && e.CreatedAt >= periodStart && e.CreatedAt < periodEnd);

                var activeAtEnd = await _context.SubscriptionRecords
                    .CountAsync(s => s.StartedAt < periodEnd
                        && (s.Status == SubscriptionStatus.Active || s.CanceledAt >= periodEnd));

                var activeAtStart = activeAtEnd - created + churned;
                var rate = activeAtStart > 0
                    ? Math.Round((decimal)churned / activeAtStart * 100, 2)
                    : 0m;

                trends.Add(new ChurnTrendDto
                {
                    Period = periodStart.ToString("yyyy-MM"),
                    TotalSubscribers = activeAtEnd,
                    NewSubscribers = created,
                    ChurnedSubscribers = churned,
                    ChurnRate = rate,
                    Mrr = 0,
                    NetGrowth = created - churned
                });
            }

            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get churn trends");
            return Ok(new List<ChurnTrendDto>());
        }
    }

    /// <summary>
    /// GET /api/admin/churn/by-plan - Churn breakdown by plan
    /// </summary>
    [HttpGet("by-plan")]
    public async Task<IActionResult> GetByPlan()
    {
        try
        {
            var now = DateTime.UtcNow;
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var plans = Enum.GetValues<SubscriptionPlan>();
            var pricingMap = GetPlanPricing();
            var result = new List<ChurnByPlanDto>();

            foreach (var plan in plans)
            {
                var active = await _context.SubscriptionRecords
                    .CountAsync(s => s.PlanType == plan && s.Status == SubscriptionStatus.Active);

                var churned = await _context.SubscriptionEvents
                    .CountAsync(e => e.EventType == SubscriptionEventType.Canceled
                        && e.FromPlan == plan && e.CreatedAt >= monthStart);

                var subscribersAtStart = active + churned;
                var churnRate = subscribersAtStart > 0
                    ? Math.Round((decimal)churned / subscribersAtStart * 100, 2)
                    : 0m;

                var monthlyPrice = pricingMap.GetValueOrDefault(plan, 0);
                var revenueLost = churned * monthlyPrice;

                result.Add(new ChurnByPlanDto
                {
                    Plan = plan.ToString(),
                    ActiveSubscribers = active,
                    ChurnedSubscribers = churned,
                    ChurnRate = churnRate,
                    RevenueLost = revenueLost
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get churn by plan");
            return Ok(new List<ChurnByPlanDto>());
        }
    }

    /// <summary>
    /// GET /api/admin/churn/events - Paginated subscription event log
    /// </summary>
    [HttpGet("events")]
    public async Task<IActionResult> GetEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? eventType = null,
        [FromQuery] string? plan = null)
    {
        try
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.SubscriptionEvents.AsQueryable();

            if (!string.IsNullOrEmpty(eventType) && eventType != "all"
                && Enum.TryParse<SubscriptionEventType>(eventType, true, out var parsedType))
            {
                query = query.Where(e => e.EventType == parsedType);
            }

            if (!string.IsNullOrEmpty(plan) && plan != "all"
                && Enum.TryParse<SubscriptionPlan>(plan, true, out var parsedPlan))
            {
                query = query.Where(e => e.FromPlan == parsedPlan || e.ToPlan == parsedPlan);
            }

            var total = await query.CountAsync();

            var events = await query
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new SubscriptionEventDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    UserEmail = e.UserEmail,
                    EventType = e.EventType.ToString(),
                    FromPlan = e.FromPlan != null ? e.FromPlan.ToString()! : null,
                    ToPlan = e.ToPlan != null ? e.ToPlan.ToString()! : null,
                    Reason = e.Reason,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(new SubscriptionEventListDto
            {
                Items = events,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get subscription events");
            return Ok(new SubscriptionEventListDto { Items = new List<SubscriptionEventDto>() });
        }
    }

    /// <summary>
    /// GET /api/admin/churn/export - CSV export
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv()
    {
        try
        {
            var events = await _context.SubscriptionEvents
                .OrderByDescending(e => e.CreatedAt)
                .Take(5000)
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("Id,UserId,UserEmail,EventType,FromPlan,ToPlan,Reason,CreatedAt");

            foreach (var e in events)
            {
                csv.AppendLine(string.Join(",",
                    e.Id,
                    CsvEscape(e.UserId),
                    CsvEscape(e.UserEmail ?? ""),
                    e.EventType,
                    e.FromPlan?.ToString() ?? "",
                    e.ToPlan?.ToString() ?? "",
                    CsvEscape(e.Reason ?? ""),
                    e.CreatedAt.ToString("o", CultureInfo.InvariantCulture)
                ));
            }

            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "churn-events.csv");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to export churn data");
            return StatusCode(500, "Export failed");
        }
    }

    private async Task<decimal> CalculateMrr()
    {
        var pricingMap = GetPlanPricing();
        var records = await _context.SubscriptionRecords
            .Where(s => s.Status == SubscriptionStatus.Active)
            .GroupBy(s => s.PlanType)
            .Select(g => new { Plan = g.Key, Count = g.Count() })
            .ToListAsync();

        return records.Sum(r => r.Count * pricingMap.GetValueOrDefault(r.Plan, 0));
    }

    private static Dictionary<SubscriptionPlan, long> GetPlanPricing()
    {
        return new Dictionary<SubscriptionPlan, long>
        {
            { SubscriptionPlan.Free, 0 },
            { SubscriptionPlan.Starter, 49000 },
            { SubscriptionPlan.Pro, 149000 },
            { SubscriptionPlan.Enterprise, 500000 }
        };
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}

// DTOs
public record ChurnOverviewDto
{
    public int ActiveSubscribers { get; init; }
    public decimal ChurnRate { get; init; }
    public decimal Mrr { get; init; }
    public int NetGrowth { get; init; }
    public decimal ChurnRateChange { get; init; }
    public int NetGrowthPrevious { get; init; }
    public int NewThisMonth { get; init; }
    public int ChurnedThisMonth { get; init; }
}

public record ChurnTrendDto
{
    public string Period { get; init; } = "";
    public int TotalSubscribers { get; init; }
    public int NewSubscribers { get; init; }
    public int ChurnedSubscribers { get; init; }
    public decimal ChurnRate { get; init; }
    public decimal Mrr { get; init; }
    public int NetGrowth { get; init; }
}

public record ChurnByPlanDto
{
    public string Plan { get; init; } = "";
    public int ActiveSubscribers { get; init; }
    public int ChurnedSubscribers { get; init; }
    public decimal ChurnRate { get; init; }
    public long RevenueLost { get; init; }
}

public record SubscriptionEventDto
{
    public int Id { get; init; }
    public string UserId { get; init; } = "";
    public string? UserEmail { get; init; }
    public string EventType { get; init; } = "";
    public string? FromPlan { get; init; }
    public string? ToPlan { get; init; }
    public string? Reason { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record SubscriptionEventListDto
{
    public List<SubscriptionEventDto> Items { get; init; } = new();
    public int Total { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
