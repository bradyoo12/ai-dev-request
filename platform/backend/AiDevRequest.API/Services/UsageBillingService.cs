using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IUsageBillingService
{
    Task<BillingAccount> GetAccountAsync(string userId);
    Task<BillingAccount> SubscribeAsync(string userId, string plan);
    Task<BillingAccount> CancelSubscriptionAsync(string userId);
    Task<BillingAccount> RecordUsageAsync(string userId, int tokensUsed);
    Task<UsageSummary> GetUsageSummaryAsync(string userId);
    Task<List<InvoiceRecord>> GetInvoicesAsync(string userId);
    List<PricingPlan> GetPlansAsync();
    Task<PortalSession> CreatePortalSessionAsync(string userId);
}

public class UsageBillingService : IUsageBillingService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<UsageBillingService> _logger;

    private static readonly List<PricingPlan> Plans =
    [
        new()
        {
            Id = "free",
            Name = "Free",
            MonthlyRate = 0,
            RequestsLimit = 3,
            PerRequestOverageRate = 0,
            Features = ["3 AI dev requests/month", "Basic analysis", "Community support"]
        },
        new()
        {
            Id = "pro",
            Name = "Pro",
            MonthlyRate = 29,
            RequestsLimit = 20,
            PerRequestOverageRate = 0.50m,
            Features = ["20 AI dev requests/month", "Advanced analysis & proposals", "Priority support", "$0.50/request overage"]
        },
        new()
        {
            Id = "team",
            Name = "Team",
            MonthlyRate = 99,
            RequestsLimit = 100,
            PerRequestOverageRate = 0.30m,
            Features = ["100 AI dev requests/month", "Full build pipeline", "Dedicated support", "$0.30/request overage", "Team collaboration"]
        }
    ];

    public UsageBillingService(AiDevRequestDbContext context, ILogger<UsageBillingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<BillingAccount> GetAccountAsync(string userId)
    {
        var account = await _context.BillingAccounts
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (account != null) return account;

        // Create default free account
        account = new BillingAccount
        {
            UserId = userId,
            Plan = "free",
            Status = "active",
            RequestsLimit = 3,
            MonthlyRate = 0,
            PerRequestOverageRate = 0,
        };

        _context.BillingAccounts.Add(account);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created default billing account for user {UserId}", userId);

        return account;
    }

    public async Task<BillingAccount> SubscribeAsync(string userId, string plan)
    {
        var planConfig = Plans.FirstOrDefault(p => p.Id == plan)
            ?? throw new InvalidOperationException($"Unknown plan: {plan}");

        var account = await GetAccountAsync(userId);

        var oldPlan = account.Plan;
        account.Plan = plan;
        account.Status = "active";
        account.RequestsLimit = planConfig.RequestsLimit;
        account.MonthlyRate = planConfig.MonthlyRate;
        account.PerRequestOverageRate = planConfig.PerRequestOverageRate;
        account.UpdatedAt = DateTime.UtcNow;

        // Reset period on plan change
        account.RequestsThisPeriod = 0;
        account.TokensUsedThisPeriod = 0;
        account.OverageCharges = 0;
        account.PeriodStart = DateTime.UtcNow;
        account.PeriodEnd = DateTime.UtcNow.AddMonths(1);

        // Add invoice record for subscription change
        var invoices = DeserializeInvoices(account.InvoiceHistory);
        invoices.Add(new InvoiceRecord
        {
            Id = Guid.NewGuid().ToString(),
            Date = DateTime.UtcNow,
            Amount = planConfig.MonthlyRate,
            Status = "paid",
            Description = $"Subscription: {oldPlan} -> {plan}",
            PlanName = planConfig.Name,
        });
        account.InvoiceHistory = JsonSerializer.Serialize(invoices);

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} subscribed to {Plan} from {OldPlan}", userId, plan, oldPlan);

        return account;
    }

    public async Task<BillingAccount> CancelSubscriptionAsync(string userId)
    {
        var account = await GetAccountAsync(userId);

        account.Status = "cancelled";
        account.UpdatedAt = DateTime.UtcNow;

        // Add invoice record for cancellation
        var invoices = DeserializeInvoices(account.InvoiceHistory);
        invoices.Add(new InvoiceRecord
        {
            Id = Guid.NewGuid().ToString(),
            Date = DateTime.UtcNow,
            Amount = 0,
            Status = "cancelled",
            Description = $"Subscription cancelled: {account.Plan}",
            PlanName = account.Plan,
        });
        account.InvoiceHistory = JsonSerializer.Serialize(invoices);

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} cancelled subscription ({Plan})", userId, account.Plan);

        return account;
    }

    public async Task<BillingAccount> RecordUsageAsync(string userId, int tokensUsed)
    {
        var account = await GetAccountAsync(userId);

        // Auto-reset period if expired
        if (DateTime.UtcNow >= account.PeriodEnd)
        {
            account.RequestsThisPeriod = 0;
            account.TokensUsedThisPeriod = 0;
            account.OverageCharges = 0;
            account.PeriodStart = DateTime.UtcNow;
            account.PeriodEnd = DateTime.UtcNow.AddMonths(1);
        }

        account.RequestsThisPeriod++;
        account.TokensUsedThisPeriod += tokensUsed;

        // Calculate overage if over limit
        if (account.RequestsThisPeriod > account.RequestsLimit && account.PerRequestOverageRate > 0)
        {
            account.OverageCharges += account.PerRequestOverageRate;
        }

        account.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Recorded usage for user {UserId}: request #{Count}, {Tokens} tokens",
            userId, account.RequestsThisPeriod, tokensUsed);

        return account;
    }

    public async Task<UsageSummary> GetUsageSummaryAsync(string userId)
    {
        var account = await GetAccountAsync(userId);

        return new UsageSummary
        {
            Plan = account.Plan,
            Status = account.Status,
            RequestsUsed = account.RequestsThisPeriod,
            RequestsLimit = account.RequestsLimit,
            TokensUsed = account.TokensUsedThisPeriod,
            OverageCharges = account.OverageCharges,
            MonthlyRate = account.MonthlyRate,
            TotalEstimated = account.MonthlyRate + account.OverageCharges,
            PeriodStart = account.PeriodStart,
            PeriodEnd = account.PeriodEnd,
            DaysRemaining = Math.Max(0, (int)(account.PeriodEnd - DateTime.UtcNow).TotalDays),
        };
    }

    public async Task<List<InvoiceRecord>> GetInvoicesAsync(string userId)
    {
        var account = await GetAccountAsync(userId);
        return DeserializeInvoices(account.InvoiceHistory);
    }

    public List<PricingPlan> GetPlansAsync()
    {
        return Plans;
    }

    public async Task<PortalSession> CreatePortalSessionAsync(string userId)
    {
        var account = await GetAccountAsync(userId);

        // In simulation mode, return a mock portal URL
        return new PortalSession
        {
            Url = $"https://billing.stripe.com/p/session/sim_{account.Id}",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        };
    }

    private static List<InvoiceRecord> DeserializeInvoices(string? json)
    {
        if (string.IsNullOrEmpty(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<InvoiceRecord>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}

// === Supporting Types ===

public class UsageSummary
{
    public string Plan { get; set; } = "";
    public string Status { get; set; } = "";
    public int RequestsUsed { get; set; }
    public int RequestsLimit { get; set; }
    public int TokensUsed { get; set; }
    public decimal OverageCharges { get; set; }
    public decimal MonthlyRate { get; set; }
    public decimal TotalEstimated { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public int DaysRemaining { get; set; }
}

public class InvoiceRecord
{
    public string Id { get; set; } = "";
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = ""; // paid, pending, cancelled
    public string Description { get; set; } = "";
    public string PlanName { get; set; } = "";
    public string? DownloadUrl { get; set; }
}

public class PricingPlan
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public decimal MonthlyRate { get; set; }
    public int RequestsLimit { get; set; }
    public decimal PerRequestOverageRate { get; set; }
    public List<string> Features { get; set; } = [];
}

public class PortalSession
{
    public string Url { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
}
