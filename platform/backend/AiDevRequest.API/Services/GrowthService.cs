using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IGrowthService
{
    Task<GrowthOverviewDto> GetOverviewAsync();
    Task<List<GrowthTrendDto>> GetTrendsAsync(int months);
    Task<List<FunnelStepDto>> GetFunnelAsync();
    Task<PlatformEvent> RecordEventAsync(string eventType, string? userId, string? sessionId, string? metadata = null);
    Task<GrowthSnapshot> GenerateSnapshotAsync(DateTime date);
}

public class GrowthService : IGrowthService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<GrowthService> _logger;

    public GrowthService(AiDevRequestDbContext db, ILogger<GrowthService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<GrowthOverviewDto> GetOverviewAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var prevMonthStart = monthStart.AddMonths(-1);

        var hasEvents = await _db.PlatformEvents.AnyAsync();

        if (!hasEvents)
        {
            // Return demo data when no real data exists
            return new GrowthOverviewDto
            {
                TotalVisitors = 12450,
                TotalRegistered = 3200,
                TotalTrialUsers = 840,
                TotalPaidUsers = 210,
                MonthlyGrowthRate = 15.3m,
                ConversionRate = 25.0m,
                ChurnRate = 3.2m
            };
        }

        var totalVisitors = await _db.PlatformEvents
            .Where(e => e.EventType == "visit")
            .Select(e => e.SessionId)
            .Distinct()
            .CountAsync();

        var totalRegistered = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "register");

        var totalTrialUsers = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "trial_start");

        var totalPaidUsers = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "paid_conversion");

        var churnedUsers = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "churn");

        // Current month registrations
        var currentMonthReg = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "register" && e.CreatedAt >= monthStart);

        // Previous month registrations
        var prevMonthReg = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "register" && e.CreatedAt >= prevMonthStart && e.CreatedAt < monthStart);

        var monthlyGrowthRate = prevMonthReg > 0
            ? Math.Round((decimal)(currentMonthReg - prevMonthReg) / prevMonthReg * 100, 1)
            : 0m;

        var conversionRate = totalTrialUsers > 0
            ? Math.Round((decimal)totalPaidUsers / totalTrialUsers * 100, 1)
            : 0m;

        var churnRate = totalPaidUsers > 0
            ? Math.Round((decimal)churnedUsers / (totalPaidUsers + churnedUsers) * 100, 1)
            : 0m;

        return new GrowthOverviewDto
        {
            TotalVisitors = totalVisitors,
            TotalRegistered = totalRegistered,
            TotalTrialUsers = totalTrialUsers,
            TotalPaidUsers = totalPaidUsers,
            MonthlyGrowthRate = monthlyGrowthRate,
            ConversionRate = conversionRate,
            ChurnRate = churnRate
        };
    }

    public async Task<List<GrowthTrendDto>> GetTrendsAsync(int months)
    {
        months = Math.Clamp(months, 1, 24);
        var now = DateTime.UtcNow;
        var trends = new List<GrowthTrendDto>();

        // Check if we have snapshot data
        var hasSnapshots = await _db.GrowthSnapshots.AnyAsync(s => s.Period == "monthly");
        var hasEvents = await _db.PlatformEvents.AnyAsync();

        if (!hasSnapshots && !hasEvents)
        {
            // Return demo data
            var demoMonths = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            var baseVisitors = 800;
            var baseRegistered = 200;
            var baseTrial = 50;
            var basePaid = 10;

            for (int i = 0; i < months && i < 12; i++)
            {
                var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1 - i));
                var growth = 1.0 + (i * 0.12);
                trends.Add(new GrowthTrendDto
                {
                    Month = periodStart.ToString("yyyy-MM"),
                    Visitors = (int)(baseVisitors * growth),
                    Registered = (int)(baseRegistered * growth),
                    TrialUsers = (int)(baseTrial * growth),
                    PaidUsers = (int)(basePaid * growth)
                });
            }
            return trends;
        }

        for (int i = months - 1; i >= 0; i--)
        {
            var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-i);
            var periodEnd = periodStart.AddMonths(1);

            // Check for pre-computed snapshot first
            var snapshot = await _db.GrowthSnapshots
                .FirstOrDefaultAsync(s => s.SnapshotDate == periodStart && s.Period == "monthly");

            if (snapshot != null)
            {
                trends.Add(new GrowthTrendDto
                {
                    Month = periodStart.ToString("yyyy-MM"),
                    Visitors = snapshot.TotalVisitors,
                    Registered = snapshot.TotalRegistered,
                    TrialUsers = snapshot.TotalTrialUsers,
                    PaidUsers = snapshot.TotalPaidUsers
                });
                continue;
            }

            // Compute from events
            var visitors = await _db.PlatformEvents
                .Where(e => e.EventType == "visit" && e.CreatedAt >= periodStart && e.CreatedAt < periodEnd)
                .Select(e => e.SessionId)
                .Distinct()
                .CountAsync();

            var registered = await _db.PlatformEvents
                .CountAsync(e => e.EventType == "register" && e.CreatedAt >= periodStart && e.CreatedAt < periodEnd);

            var trialUsers = await _db.PlatformEvents
                .CountAsync(e => e.EventType == "trial_start" && e.CreatedAt >= periodStart && e.CreatedAt < periodEnd);

            var paidUsers = await _db.PlatformEvents
                .CountAsync(e => e.EventType == "paid_conversion" && e.CreatedAt >= periodStart && e.CreatedAt < periodEnd);

            trends.Add(new GrowthTrendDto
            {
                Month = periodStart.ToString("yyyy-MM"),
                Visitors = visitors,
                Registered = registered,
                TrialUsers = trialUsers,
                PaidUsers = paidUsers
            });
        }

        return trends;
    }

    public async Task<List<FunnelStepDto>> GetFunnelAsync()
    {
        var hasEvents = await _db.PlatformEvents.AnyAsync();

        int visitors, registered, trialUsers, paidUsers;

        if (!hasEvents)
        {
            // Demo data
            visitors = 12450;
            registered = 3200;
            trialUsers = 840;
            paidUsers = 210;
        }
        else
        {
            visitors = await _db.PlatformEvents
                .Where(e => e.EventType == "visit")
                .Select(e => e.SessionId)
                .Distinct()
                .CountAsync();

            registered = await _db.PlatformEvents
                .CountAsync(e => e.EventType == "register");

            trialUsers = await _db.PlatformEvents
                .CountAsync(e => e.EventType == "trial_start");

            paidUsers = await _db.PlatformEvents
                .CountAsync(e => e.EventType == "paid_conversion");
        }

        var maxCount = Math.Max(visitors, 1);

        return new List<FunnelStepDto>
        {
            new() { Stage = "Visitors", Count = visitors, Percentage = 100m },
            new() { Stage = "Registered", Count = registered, Percentage = Math.Round((decimal)registered / maxCount * 100, 1) },
            new() { Stage = "Trial Users", Count = trialUsers, Percentage = Math.Round((decimal)trialUsers / maxCount * 100, 1) },
            new() { Stage = "Paid Users", Count = paidUsers, Percentage = Math.Round((decimal)paidUsers / maxCount * 100, 1) }
        };
    }

    public async Task<PlatformEvent> RecordEventAsync(string eventType, string? userId, string? sessionId, string? metadata = null)
    {
        var evt = new PlatformEvent
        {
            EventType = eventType,
            UserId = userId,
            SessionId = sessionId,
            Metadata = metadata,
            CreatedAt = DateTime.UtcNow
        };

        _db.PlatformEvents.Add(evt);
        await _db.SaveChangesAsync();
        return evt;
    }

    public async Task<GrowthSnapshot> GenerateSnapshotAsync(DateTime date)
    {
        var dayStart = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var visitors = await _db.PlatformEvents
            .Where(e => e.EventType == "visit" && e.CreatedAt >= dayStart && e.CreatedAt < dayEnd)
            .Select(e => e.SessionId)
            .Distinct()
            .CountAsync();

        var newRegistrations = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "register" && e.CreatedAt >= dayStart && e.CreatedAt < dayEnd);

        var newTrialStarts = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "trial_start" && e.CreatedAt >= dayStart && e.CreatedAt < dayEnd);

        var newPaidConversions = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "paid_conversion" && e.CreatedAt >= dayStart && e.CreatedAt < dayEnd);

        var churnedUsers = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "churn" && e.CreatedAt >= dayStart && e.CreatedAt < dayEnd);

        var totalRegistered = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "register" && e.CreatedAt < dayEnd);

        var totalTrialUsers = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "trial_start" && e.CreatedAt < dayEnd);

        var totalPaidUsers = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "paid_conversion" && e.CreatedAt < dayEnd);

        var conversionRate = totalTrialUsers > 0
            ? Math.Round((decimal)totalPaidUsers / totalTrialUsers * 100, 2)
            : 0m;

        var totalChurned = await _db.PlatformEvents
            .CountAsync(e => e.EventType == "churn" && e.CreatedAt < dayEnd);

        var churnRate = (totalPaidUsers + totalChurned) > 0
            ? Math.Round((decimal)totalChurned / (totalPaidUsers + totalChurned) * 100, 2)
            : 0m;

        // Check for existing snapshot and update or create
        var existing = await _db.GrowthSnapshots
            .FirstOrDefaultAsync(s => s.SnapshotDate == dayStart && s.Period == "daily");

        if (existing != null)
        {
            existing.TotalVisitors = visitors;
            existing.TotalRegistered = totalRegistered;
            existing.TotalTrialUsers = totalTrialUsers;
            existing.TotalPaidUsers = totalPaidUsers;
            existing.NewRegistrations = newRegistrations;
            existing.NewTrialStarts = newTrialStarts;
            existing.NewPaidConversions = newPaidConversions;
            existing.ChurnedUsers = churnedUsers;
            existing.ConversionRate = conversionRate;
            existing.ChurnRate = churnRate;
            await _db.SaveChangesAsync();
            return existing;
        }

        var snapshot = new GrowthSnapshot
        {
            SnapshotDate = dayStart,
            Period = "daily",
            TotalVisitors = visitors,
            TotalRegistered = totalRegistered,
            TotalTrialUsers = totalTrialUsers,
            TotalPaidUsers = totalPaidUsers,
            NewRegistrations = newRegistrations,
            NewTrialStarts = newTrialStarts,
            NewPaidConversions = newPaidConversions,
            ChurnedUsers = churnedUsers,
            ConversionRate = conversionRate,
            ChurnRate = churnRate
        };

        _db.GrowthSnapshots.Add(snapshot);
        await _db.SaveChangesAsync();
        return snapshot;
    }
}

// DTOs
public record GrowthOverviewDto
{
    public int TotalVisitors { get; init; }
    public int TotalRegistered { get; init; }
    public int TotalTrialUsers { get; init; }
    public int TotalPaidUsers { get; init; }
    public decimal MonthlyGrowthRate { get; init; }
    public decimal ConversionRate { get; init; }
    public decimal ChurnRate { get; init; }
}

public record GrowthTrendDto
{
    public string Month { get; init; } = "";
    public int Visitors { get; init; }
    public int Registered { get; init; }
    public int TrialUsers { get; init; }
    public int PaidUsers { get; init; }
}

public record FunnelStepDto
{
    public string Stage { get; init; } = "";
    public int Count { get; init; }
    public decimal Percentage { get; init; }
}
