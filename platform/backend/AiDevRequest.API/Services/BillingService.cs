using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IBillingService
{
    Task<BillingOverview> GetBillingOverviewAsync(string userId);
    Task<AutoTopUpConfig> GetOrCreateAutoTopUpConfigAsync(string userId);
    Task<AutoTopUpConfig> UpdateAutoTopUpConfigAsync(string userId, AutoTopUpConfigUpdate update);
    Task<AutoTopUpResult?> TryAutoTopUpAsync(string userId, int currentBalance);
}

public class BillingService : IBillingService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IPaymentService _paymentService;
    private readonly ILogger<BillingService> _logger;

    public BillingService(
        AiDevRequestDbContext context,
        IPaymentService paymentService,
        ILogger<BillingService> logger)
    {
        _context = context;
        _paymentService = paymentService;
        _logger = logger;
    }

    public async Task<BillingOverview> GetBillingOverviewAsync(string userId)
    {
        var config = await GetOrCreateAutoTopUpConfigAsync(userId);
        var recentPayments = await _context.Set<Payment>()
            .Where(p => p.UserId == userId && p.Status == PaymentStatus.Succeeded)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .ToListAsync();

        // In simulation mode, provide simulated payment methods
        var paymentMethods = new List<PaymentMethodInfo>();
        if (recentPayments.Any())
        {
            paymentMethods.Add(new PaymentMethodInfo
            {
                Id = "sim_pm_default",
                Brand = "Visa",
                Last4 = "4242",
                ExpMonth = 12,
                ExpYear = 2028,
                IsDefault = true,
            });
        }

        return new BillingOverview
        {
            PaymentMethods = paymentMethods,
            AutoTopUp = config,
            IsSimulation = true,
        };
    }

    public async Task<AutoTopUpConfig> GetOrCreateAutoTopUpConfigAsync(string userId)
    {
        var config = await _context.Set<AutoTopUpConfig>()
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (config != null) return config;

        config = new AutoTopUpConfig
        {
            UserId = userId,
            IsEnabled = false,
            Threshold = 100,
            TokenPackageId = 2, // 1,000 tokens / $10 default
        };
        _context.Set<AutoTopUpConfig>().Add(config);
        await _context.SaveChangesAsync();
        return config;
    }

    public async Task<AutoTopUpConfig> UpdateAutoTopUpConfigAsync(string userId, AutoTopUpConfigUpdate update)
    {
        var config = await GetOrCreateAutoTopUpConfigAsync(userId);

        config.IsEnabled = update.IsEnabled;
        config.Threshold = update.Threshold;
        config.TokenPackageId = update.TokenPackageId;
        config.MonthlyLimitUsd = update.MonthlyLimitUsd;
        config.UpdatedAt = DateTime.UtcNow;

        // Clear failure state when re-enabling
        if (update.IsEnabled && config.LastFailedAt.HasValue)
        {
            config.LastFailedAt = null;
            config.FailureReason = null;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Auto top-up config updated for user {UserId}: enabled={Enabled}, threshold={Threshold}",
            userId, config.IsEnabled, config.Threshold);

        return config;
    }

    public async Task<AutoTopUpResult?> TryAutoTopUpAsync(string userId, int currentBalance)
    {
        var config = await _context.Set<AutoTopUpConfig>()
            .FirstOrDefaultAsync(c => c.UserId == userId && c.IsEnabled);

        if (config == null) return null;
        if (currentBalance >= config.Threshold) return null;

        // Cooldown: prevent rapid-fire charges (1 minute)
        if (config.LastTriggeredAt.HasValue &&
            (DateTime.UtcNow - config.LastTriggeredAt.Value).TotalMinutes < 1)
        {
            return null;
        }

        // Check monthly limit
        var package_ = await _context.TokenPackages.FindAsync(config.TokenPackageId);
        if (package_ == null || !package_.IsActive)
        {
            _logger.LogWarning("Auto top-up package {PackageId} not found for user {UserId}", config.TokenPackageId, userId);
            return null;
        }

        if (config.MonthlyLimitUsd.HasValue &&
            config.MonthlySpentUsd + package_.PriceUsd > config.MonthlyLimitUsd.Value)
        {
            _logger.LogInformation("Auto top-up skipped for user {UserId}: monthly limit reached", userId);
            return null;
        }

        try
        {
            // In simulation mode: directly credit tokens
            var balance = await _context.TokenBalances.FirstOrDefaultAsync(b => b.UserId == userId);
            if (balance == null) return null;

            balance.Balance += package_.TokenAmount;
            balance.TotalEarned += package_.TokenAmount;
            balance.UpdatedAt = DateTime.UtcNow;

            _context.TokenTransactions.Add(new TokenTransaction
            {
                UserId = userId,
                Type = "credit",
                Amount = package_.TokenAmount,
                Action = "auto_topup",
                Description = $"Auto top-up: {package_.Name}",
                BalanceAfter = balance.Balance
            });

            // Record payment
            _context.Set<Payment>().Add(new Payment
            {
                UserId = userId,
                Type = PaymentType.TokenPurchase,
                AmountUsd = package_.PriceUsd,
                Currency = "usd",
                Status = PaymentStatus.Succeeded,
                Description = $"Auto top-up: {package_.Name}",
                TokensAwarded = package_.TokenAmount,
            });

            config.LastTriggeredAt = DateTime.UtcNow;
            config.MonthlySpentUsd += package_.PriceUsd;
            config.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Auto top-up completed for user {UserId}: +{Tokens} tokens, ${Amount}",
                userId, package_.TokenAmount, package_.PriceUsd);

            return new AutoTopUpResult
            {
                Success = true,
                TokensAdded = package_.TokenAmount,
                AmountCharged = package_.PriceUsd,
                NewBalance = balance.Balance,
                PackageName = package_.Name,
            };
        }
        catch (Exception ex)
        {
            config.LastFailedAt = DateTime.UtcNow;
            config.FailureReason = ex.Message;
            config.IsEnabled = false; // Pause on failure
            config.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Auto top-up failed for user {UserId}", userId);

            return new AutoTopUpResult
            {
                Success = false,
                FailureReason = ex.Message,
            };
        }
    }
}

public class BillingOverview
{
    public List<PaymentMethodInfo> PaymentMethods { get; set; } = [];
    public AutoTopUpConfig AutoTopUp { get; set; } = null!;
    public bool IsSimulation { get; set; }
}

public class PaymentMethodInfo
{
    public string Id { get; set; } = "";
    public string Brand { get; set; } = "";
    public string Last4 { get; set; } = "";
    public int ExpMonth { get; set; }
    public int ExpYear { get; set; }
    public bool IsDefault { get; set; }
}

public class AutoTopUpConfigUpdate
{
    public bool IsEnabled { get; set; }
    public int Threshold { get; set; } = 100;
    public int TokenPackageId { get; set; } = 2;
    public decimal? MonthlyLimitUsd { get; set; }
}

public class AutoTopUpResult
{
    public bool Success { get; set; }
    public int TokensAdded { get; set; }
    public decimal AmountCharged { get; set; }
    public int NewBalance { get; set; }
    public string? PackageName { get; set; }
    public string? FailureReason { get; set; }
}
