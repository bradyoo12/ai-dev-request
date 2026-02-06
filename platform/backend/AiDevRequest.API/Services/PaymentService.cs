using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace AiDevRequest.API.Services;

public interface IPaymentService
{
    Task<string> CreateCheckoutSessionAsync(string userId, int packageId, string successUrl, string cancelUrl);
    Task HandleWebhookAsync(string payload, string signature);
    Task<List<Payment>> GetPaymentHistoryAsync(string userId, int page = 1, int pageSize = 20);
    Task<int> GetPaymentCountAsync(string userId);
}

public class StripePaymentService : IPaymentService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripePaymentService> _logger;

    public StripePaymentService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<StripePaymentService> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;

        var secretKey = _configuration["Stripe:SecretKey"];
        if (!string.IsNullOrEmpty(secretKey))
        {
            StripeConfiguration.ApiKey = secretKey;
        }
    }

    public async Task<string> CreateCheckoutSessionAsync(string userId, int packageId, string successUrl, string cancelUrl)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        var package = await context.TokenPackages.FindAsync(packageId)
            ?? throw new InvalidOperationException("Token package not found.");

        if (!package.IsActive)
            throw new InvalidOperationException("Token package is not active.");

        var secretKey = _configuration["Stripe:SecretKey"];
        if (string.IsNullOrEmpty(secretKey))
        {
            // Simulation mode - create a fake checkout session
            _logger.LogWarning("Stripe SecretKey not configured. Running in simulation mode.");
            return await SimulateCheckoutAsync(context, userId, package);
        }

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = ["card"],
            LineItems =
            [
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(package.PriceUsd * 100), // Stripe uses cents
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = package.Name,
                            Description = $"{package.TokenAmount} tokens for AI Dev Request",
                        },
                    },
                    Quantity = 1,
                },
            ],
            Mode = "payment",
            SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = cancelUrl,
            ClientReferenceId = userId,
            Metadata = new Dictionary<string, string>
            {
                ["userId"] = userId,
                ["packageId"] = packageId.ToString(),
                ["tokenAmount"] = package.TokenAmount.ToString(),
            },
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        // Record the payment as pending
        var payment = new Payment
        {
            UserId = userId,
            StripeCheckoutSessionId = session.Id,
            Type = PaymentType.TokenPurchase,
            AmountUsd = package.PriceUsd,
            Status = PaymentStatus.Pending,
            Description = $"Token purchase: {package.Name}",
            TokenPackageId = packageId,
            TokensAwarded = package.TokenAmount,
        };

        context.Payments.Add(payment);
        await context.SaveChangesAsync();

        _logger.LogInformation("Checkout session created: {SessionId} for user {UserId}, package {PackageId}",
            session.Id, userId, packageId);

        return session.Url!;
    }

    public async Task HandleWebhookAsync(string payload, string signature)
    {
        var webhookSecret = _configuration["Stripe:WebhookSecret"];

        if (string.IsNullOrEmpty(webhookSecret))
        {
            _logger.LogWarning("Stripe WebhookSecret not configured. Skipping webhook processing.");
            return;
        }

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(payload, signature, webhookSecret);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook signature verification failed");
            throw;
        }

        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        switch (stripeEvent.Type)
        {
            case EventTypes.CheckoutSessionCompleted:
                await HandleCheckoutCompletedAsync(context, stripeEvent);
                break;
            case EventTypes.PaymentIntentSucceeded:
                _logger.LogInformation("Payment intent succeeded: {EventId}", stripeEvent.Id);
                break;
            case EventTypes.PaymentIntentPaymentFailed:
                await HandlePaymentFailedAsync(context, stripeEvent);
                break;
            default:
                _logger.LogInformation("Unhandled Stripe event type: {EventType}", stripeEvent.Type);
                break;
        }
    }

    public async Task<List<Payment>> GetPaymentHistoryAsync(string userId, int page = 1, int pageSize = 20)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        return await context.Payments
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetPaymentCountAsync(string userId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        return await context.Payments
            .Where(p => p.UserId == userId)
            .CountAsync();
    }

    private async Task HandleCheckoutCompletedAsync(AiDevRequestDbContext context, Event stripeEvent)
    {
        var session = stripeEvent.Data.Object as Session;
        if (session == null) return;

        var payment = await context.Payments
            .FirstOrDefaultAsync(p => p.StripeCheckoutSessionId == session.Id);

        if (payment == null)
        {
            _logger.LogWarning("Payment not found for checkout session {SessionId}", session.Id);
            return;
        }

        if (payment.Status == PaymentStatus.Succeeded)
        {
            _logger.LogInformation("Payment already processed: {SessionId}", session.Id);
            return;
        }

        payment.Status = PaymentStatus.Succeeded;
        payment.StripePaymentIntentId = session.PaymentIntentId;
        payment.UpdatedAt = DateTime.UtcNow;

        // Credit tokens
        var tokenService = context.Database.GetDbConnection();
        var userId = payment.UserId;
        var tokensToAdd = payment.TokensAwarded ?? 0;

        if (tokensToAdd > 0)
        {
            var balance = await context.TokenBalances
                .FirstOrDefaultAsync(b => b.UserId == userId);

            if (balance != null)
            {
                balance.Balance += tokensToAdd;
                balance.TotalEarned += tokensToAdd;
                balance.UpdatedAt = DateTime.UtcNow;
            }

            context.TokenTransactions.Add(new TokenTransaction
            {
                UserId = userId,
                Type = "credit",
                Amount = tokensToAdd,
                Action = "purchase",
                Description = payment.Description ?? "Token purchase",
                ReferenceId = payment.Id.ToString(),
                BalanceAfter = balance?.Balance ?? tokensToAdd,
            });
        }

        await context.SaveChangesAsync();

        _logger.LogInformation(
            "Checkout completed: {SessionId}, tokens: {Tokens}, user: {UserId}",
            session.Id, tokensToAdd, userId);
    }

    private async Task HandlePaymentFailedAsync(AiDevRequestDbContext context, Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null) return;

        var payment = await context.Payments
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

        if (payment != null)
        {
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        _logger.LogWarning("Payment failed: {PaymentIntentId}", paymentIntent.Id);
    }

    private async Task<string> SimulateCheckoutAsync(AiDevRequestDbContext context, string userId, TokenPackage package)
    {
        // In simulation mode, immediately credit tokens
        var payment = new Payment
        {
            UserId = userId,
            StripeCheckoutSessionId = $"sim_{Guid.NewGuid():N}",
            Type = PaymentType.TokenPurchase,
            AmountUsd = package.PriceUsd,
            Status = PaymentStatus.Succeeded,
            Description = $"[SIMULATION] Token purchase: {package.Name}",
            TokenPackageId = package.Id,
            TokensAwarded = package.TokenAmount,
        };

        context.Payments.Add(payment);

        // Credit tokens immediately in simulation
        var balance = await context.TokenBalances
            .FirstOrDefaultAsync(b => b.UserId == userId);

        if (balance != null)
        {
            balance.Balance += package.TokenAmount;
            balance.TotalEarned += package.TokenAmount;
            balance.UpdatedAt = DateTime.UtcNow;
        }

        context.TokenTransactions.Add(new TokenTransaction
        {
            UserId = userId,
            Type = "credit",
            Amount = package.TokenAmount,
            Action = "purchase",
            Description = $"[SIMULATION] {package.Name}",
            ReferenceId = payment.Id.ToString(),
            BalanceAfter = balance?.Balance ?? package.TokenAmount,
        });

        await context.SaveChangesAsync();

        _logger.LogInformation("[SIMULATION] Token purchase completed for user {UserId}: {Tokens} tokens",
            userId, package.TokenAmount);

        // Return a special simulation URL that the frontend can detect
        return $"SIMULATION_SUCCESS:{package.TokenAmount}";
    }
}
