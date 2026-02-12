using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IUsageMeteringService
{
    Task<UsageMeter> RecordUsage(string userId, string meterType, decimal units, string outcome, Guid? devRequestId);
    Task<UsageMeteringSummaryResult> GetUsageSummary(string userId, DateTime? from, DateTime? to);
    Task<List<UsageMeter>> GetUsageHistory(string userId, int limit);
    Task<ProjectCostBreakdownResult> GetProjectCostBreakdown(Guid devRequestId);
    Task<SpendingAlertResult> GetSpendingAlerts(string userId);
}

public class UsageMeteringService : IUsageMeteringService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<UsageMeteringService> _logger;

    // Unit costs per meter type
    private static readonly Dictionary<string, decimal> UnitCosts = new()
    {
        { "ai_compute", 0.003m },      // $0.003 per AI compute unit (token batch)
        { "build_minutes", 0.01m },     // $0.01 per build minute
        { "test_runs", 0.005m },        // $0.005 per test run
        { "preview_deploys", 0.02m },   // $0.02 per preview deploy
    };

    // Outcome multipliers - failed builds cost less
    private static readonly Dictionary<string, decimal> OutcomeMultipliers = new()
    {
        { "success", 1.0m },
        { "failed", 0.5m },    // 50% cost for failed outcomes
        { "partial", 0.75m },  // 75% cost for partial outcomes
    };

    public UsageMeteringService(
        AiDevRequestDbContext context,
        ILogger<UsageMeteringService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UsageMeter> RecordUsage(string userId, string meterType, decimal units, string outcome, Guid? devRequestId)
    {
        var unitCost = UnitCosts.GetValueOrDefault(meterType, 0.01m);
        var outcomeMultiplier = OutcomeMultipliers.GetValueOrDefault(outcome, 1.0m);
        var totalCost = units * unitCost * outcomeMultiplier;

        var meter = new UsageMeter
        {
            UserId = userId,
            DevRequestId = devRequestId,
            MeterType = meterType,
            Units = units,
            UnitCost = unitCost,
            TotalCost = totalCost,
            Status = "pending",
            Outcome = outcome,
            MetadataJson = JsonSerializer.Serialize(new
            {
                meterType,
                units,
                unitCost,
                outcomeMultiplier,
                totalCost,
                recordedAt = DateTime.UtcNow,
            }),
        };

        _context.UsageMeters.Add(meter);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Recorded usage for user {UserId}: type={MeterType}, units={Units}, outcome={Outcome}, cost=${TotalCost}",
            userId, meterType, units, outcome, totalCost);

        return meter;
    }

    public async Task<UsageMeteringSummaryResult> GetUsageSummary(string userId, DateTime? from, DateTime? to)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;

        var meters = await _context.UsageMeters
            .Where(m => m.UserId == userId && m.CreatedAt >= fromDate && m.CreatedAt <= toDate)
            .ToListAsync();

        var totalSpend = meters.Sum(m => m.TotalCost);
        var aiComputeCost = meters.Where(m => m.MeterType == "ai_compute").Sum(m => m.TotalCost);
        var buildMinutesCost = meters.Where(m => m.MeterType == "build_minutes").Sum(m => m.TotalCost);
        var testRunsCost = meters.Where(m => m.MeterType == "test_runs").Sum(m => m.TotalCost);
        var previewDeploysCost = meters.Where(m => m.MeterType == "preview_deploys").Sum(m => m.TotalCost);

        var aiComputeUnits = meters.Where(m => m.MeterType == "ai_compute").Sum(m => m.Units);
        var buildMinutesUnits = meters.Where(m => m.MeterType == "build_minutes").Sum(m => m.Units);
        var testRunsUnits = meters.Where(m => m.MeterType == "test_runs").Sum(m => m.Units);
        var previewDeploysUnits = meters.Where(m => m.MeterType == "preview_deploys").Sum(m => m.Units);

        var successCount = meters.Count(m => m.Outcome == "success");
        var failedCount = meters.Count(m => m.Outcome == "failed");
        var partialCount = meters.Count(m => m.Outcome == "partial");

        return new UsageMeteringSummaryResult
        {
            TotalSpend = totalSpend,
            AiComputeCost = aiComputeCost,
            BuildMinutesCost = buildMinutesCost,
            TestRunsCost = testRunsCost,
            PreviewDeploysCost = previewDeploysCost,
            AiComputeUnits = aiComputeUnits,
            BuildMinutesUnits = buildMinutesUnits,
            TestRunsUnits = testRunsUnits,
            PreviewDeploysUnits = previewDeploysUnits,
            SuccessCount = successCount,
            FailedCount = failedCount,
            PartialCount = partialCount,
            TotalRecords = meters.Count,
            FromDate = fromDate,
            ToDate = toDate,
        };
    }

    public async Task<List<UsageMeter>> GetUsageHistory(string userId, int limit)
    {
        return await _context.UsageMeters
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit > 0 ? limit : 50)
            .ToListAsync();
    }

    public async Task<ProjectCostBreakdownResult> GetProjectCostBreakdown(Guid devRequestId)
    {
        var meters = await _context.UsageMeters
            .Where(m => m.DevRequestId == devRequestId)
            .ToListAsync();

        var totalCost = meters.Sum(m => m.TotalCost);

        var byType = meters
            .GroupBy(m => m.MeterType)
            .Select(g => new MeterTypeCost
            {
                MeterType = g.Key,
                Units = g.Sum(m => m.Units),
                TotalCost = g.Sum(m => m.TotalCost),
                Count = g.Count(),
            })
            .ToList();

        var byOutcome = meters
            .GroupBy(m => m.Outcome)
            .Select(g => new OutcomeCost
            {
                Outcome = g.Key,
                TotalCost = g.Sum(m => m.TotalCost),
                Count = g.Count(),
            })
            .ToList();

        return new ProjectCostBreakdownResult
        {
            DevRequestId = devRequestId,
            TotalCost = totalCost,
            ByType = byType,
            ByOutcome = byOutcome,
            TotalRecords = meters.Count,
        };
    }

    public async Task<SpendingAlertResult> GetSpendingAlerts(string userId)
    {
        // Check spending for current month
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var currentMonthMeters = await _context.UsageMeters
            .Where(m => m.UserId == userId && m.CreatedAt >= monthStart)
            .ToListAsync();

        var monthlySpend = currentMonthMeters.Sum(m => m.TotalCost);

        // Default spending limits
        const decimal warningThreshold = 50m;
        const decimal criticalThreshold = 100m;

        var alerts = new List<SpendingAlert>();

        if (monthlySpend >= criticalThreshold)
        {
            alerts.Add(new SpendingAlert
            {
                Level = "critical",
                Message = $"Monthly spending has reached ${monthlySpend:F2}, exceeding the ${criticalThreshold:F2} limit.",
                CurrentSpend = monthlySpend,
                Threshold = criticalThreshold,
            });
        }
        else if (monthlySpend >= warningThreshold)
        {
            alerts.Add(new SpendingAlert
            {
                Level = "warning",
                Message = $"Monthly spending is ${monthlySpend:F2}, approaching the ${criticalThreshold:F2} limit.",
                CurrentSpend = monthlySpend,
                Threshold = warningThreshold,
            });
        }

        // Check daily rate
        var daysInMonth = DateTime.DaysInMonth(DateTime.UtcNow.Year, DateTime.UtcNow.Month);
        var dayOfMonth = DateTime.UtcNow.Day;
        var projectedMonthly = dayOfMonth > 0 ? monthlySpend / dayOfMonth * daysInMonth : 0;

        if (projectedMonthly > criticalThreshold && monthlySpend < criticalThreshold)
        {
            alerts.Add(new SpendingAlert
            {
                Level = "info",
                Message = $"Projected monthly spending is ${projectedMonthly:F2} based on current usage rate.",
                CurrentSpend = monthlySpend,
                Threshold = criticalThreshold,
            });
        }

        return new SpendingAlertResult
        {
            MonthlySpend = monthlySpend,
            ProjectedMonthly = projectedMonthly,
            WarningThreshold = warningThreshold,
            CriticalThreshold = criticalThreshold,
            Alerts = alerts,
        };
    }
}

public class UsageMeteringSummaryResult
{
    public decimal TotalSpend { get; set; }
    public decimal AiComputeCost { get; set; }
    public decimal BuildMinutesCost { get; set; }
    public decimal TestRunsCost { get; set; }
    public decimal PreviewDeploysCost { get; set; }
    public decimal AiComputeUnits { get; set; }
    public decimal BuildMinutesUnits { get; set; }
    public decimal TestRunsUnits { get; set; }
    public decimal PreviewDeploysUnits { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int PartialCount { get; set; }
    public int TotalRecords { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}

public class ProjectCostBreakdownResult
{
    public Guid DevRequestId { get; set; }
    public decimal TotalCost { get; set; }
    public List<MeterTypeCost> ByType { get; set; } = [];
    public List<OutcomeCost> ByOutcome { get; set; } = [];
    public int TotalRecords { get; set; }
}

public class MeterTypeCost
{
    public string MeterType { get; set; } = "";
    public decimal Units { get; set; }
    public decimal TotalCost { get; set; }
    public int Count { get; set; }
}

public class OutcomeCost
{
    public string Outcome { get; set; } = "";
    public decimal TotalCost { get; set; }
    public int Count { get; set; }
}

public class SpendingAlertResult
{
    public decimal MonthlySpend { get; set; }
    public decimal ProjectedMonthly { get; set; }
    public decimal WarningThreshold { get; set; }
    public decimal CriticalThreshold { get; set; }
    public List<SpendingAlert> Alerts { get; set; } = [];
}

public class SpendingAlert
{
    public string Level { get; set; } = ""; // info, warning, critical
    public string Message { get; set; } = "";
    public decimal CurrentSpend { get; set; }
    public decimal Threshold { get; set; }
}
