using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ICryptoPaymentService
{
    Task<CryptoCheckoutResult> CreateCryptoCheckoutAsync(string userId, int packageId, string successUrl, string cancelUrl);
    Task HandleCoinbaseWebhookAsync(string payload, string signature);
}

public class CryptoCheckoutResult
{
    public string CheckoutUrl { get; set; } = "";
    public bool IsSimulation { get; set; }
    public string ChargeId { get; set; } = "";
}

public class CoinbaseCryptoPaymentService : ICryptoPaymentService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CoinbaseCryptoPaymentService> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly IHttpClientFactory _httpClientFactory;

    public CoinbaseCryptoPaymentService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<CoinbaseCryptoPaymentService> logger,
        IWebHostEnvironment environment,
        IHttpClientFactory httpClientFactory)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
        _environment = environment;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<CryptoCheckoutResult> CreateCryptoCheckoutAsync(
        string userId, int packageId, string successUrl, string cancelUrl)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        var package = await context.TokenPackages.FindAsync(packageId)
            ?? throw new InvalidOperationException("Token package not found.");

        if (!package.IsActive)
            throw new InvalidOperationException("Token package is not active.");

        var apiKey = _configuration["Coinbase:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            if (!_environment.IsDevelopment())
            {
                throw new InvalidOperationException("Coinbase API key must be configured in non-development environments.");
            }
            _logger.LogWarning("Coinbase API key not configured. Running in simulation mode.");
            return await SimulateCryptoCheckoutAsync(context, userId, package);
        }

        // Create Coinbase Commerce charge
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-CC-Api-Key", apiKey);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var chargeRequest = new
        {
            name = package.Name,
            description = $"{package.TokenAmount} tokens for AI Dev Request",
            pricing_type = "fixed_price",
            local_price = new
            {
                amount = package.PriceUsd.ToString("F2"),
                currency = "USD"
            },
            metadata = new
            {
                userId,
                packageId = packageId.ToString(),
                tokenAmount = package.TokenAmount.ToString()
            },
            redirect_url = successUrl,
            cancel_url = cancelUrl
        };

        var json = JsonSerializer.Serialize(chargeRequest);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("https://api.commerce.coinbase.com/charges", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Coinbase Commerce charge creation failed: {Status} {Body}",
                response.StatusCode, responseBody);
            throw new InvalidOperationException("Failed to create crypto payment session.");
        }

        var chargeResponse = JsonSerializer.Deserialize<CoinbaseChargeResponse>(responseBody);
        var chargeData = chargeResponse?.Data;

        if (chargeData == null)
            throw new InvalidOperationException("Invalid response from Coinbase Commerce.");

        // Record the payment as pending
        var payment = new Payment
        {
            UserId = userId,
            Provider = PaymentProvider.CoinbaseCommerce,
            CryptoChargeId = chargeData.Id,
            Type = PaymentType.TokenPurchase,
            AmountUsd = package.PriceUsd,
            Status = PaymentStatus.Pending,
            Description = $"Crypto purchase: {package.Name}",
            TokenPackageId = packageId,
            TokensAwarded = package.TokenAmount,
        };

        context.Payments.Add(payment);
        await context.SaveChangesAsync();

        _logger.LogInformation("Coinbase charge created: {ChargeId} for user {UserId}, package {PackageId}",
            chargeData.Id, userId, packageId);

        return new CryptoCheckoutResult
        {
            CheckoutUrl = chargeData.HostedUrl ?? "",
            IsSimulation = false,
            ChargeId = chargeData.Id ?? "",
        };
    }

    public async Task HandleCoinbaseWebhookAsync(string payload, string signature)
    {
        var webhookSecret = _configuration["Coinbase:WebhookSecret"];

        if (string.IsNullOrEmpty(webhookSecret))
        {
            _logger.LogWarning("Coinbase WebhookSecret not configured. Skipping webhook processing.");
            return;
        }

        // Verify webhook signature
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computedSignature = Convert.ToHexString(computedHash).ToLowerInvariant();

        if (computedSignature != signature.ToLowerInvariant())
        {
            _logger.LogError("Coinbase webhook signature verification failed");
            throw new InvalidOperationException("Invalid webhook signature.");
        }

        var webhookEvent = JsonSerializer.Deserialize<CoinbaseWebhookEvent>(payload);
        if (webhookEvent?.Event?.Data == null) return;

        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        var chargeId = webhookEvent.Event.Data.Id;
        var eventType = webhookEvent.Event.Type;

        _logger.LogInformation("Coinbase webhook: {EventType} for charge {ChargeId}", eventType, chargeId);

        switch (eventType)
        {
            case "charge:confirmed":
                await HandleChargeConfirmedAsync(context, chargeId, webhookEvent.Event.Data);
                break;
            case "charge:failed":
                await HandleChargeFailedAsync(context, chargeId);
                break;
            default:
                _logger.LogInformation("Unhandled Coinbase event type: {EventType}", eventType);
                break;
        }
    }

    private async Task HandleChargeConfirmedAsync(
        AiDevRequestDbContext context, string? chargeId, CoinbaseChargeData chargeData)
    {
        if (chargeId == null) return;

        var payment = await context.Payments
            .FirstOrDefaultAsync(p => p.CryptoChargeId == chargeId);

        if (payment == null)
        {
            _logger.LogWarning("Payment not found for Coinbase charge {ChargeId}", chargeId);
            return;
        }

        if (payment.Status == PaymentStatus.Succeeded)
        {
            _logger.LogInformation("Payment already processed: {ChargeId}", chargeId);
            return;
        }

        payment.Status = PaymentStatus.Succeeded;
        payment.UpdatedAt = DateTime.UtcNow;

        // Capture crypto transaction details from the first payment
        var cryptoPayment = chargeData.Payments?.FirstOrDefault();
        if (cryptoPayment != null)
        {
            payment.CryptoTransactionHash = cryptoPayment.TransactionId;
            payment.CryptoCurrency = cryptoPayment.Network;
            if (decimal.TryParse(cryptoPayment.Value?.Crypto?.Amount, out var cryptoAmt))
                payment.CryptoAmount = cryptoAmt;
            if (decimal.TryParse(cryptoPayment.Value?.Local?.Amount, out var localAmt) && payment.CryptoAmount > 0)
                payment.ExchangeRateUsd = localAmt / payment.CryptoAmount;
        }

        // Credit tokens
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
            else
            {
                balance = new TokenBalance
                {
                    UserId = userId,
                    Balance = tokensToAdd,
                    TotalEarned = tokensToAdd,
                };
                context.TokenBalances.Add(balance);
            }

            context.TokenTransactions.Add(new TokenTransaction
            {
                UserId = userId,
                Type = "credit",
                Amount = tokensToAdd,
                Action = "purchase",
                Description = payment.Description ?? "Crypto token purchase",
                ReferenceId = payment.Id.ToString(),
                BalanceAfter = balance.Balance,
            });
        }

        await context.SaveChangesAsync();

        _logger.LogInformation(
            "Coinbase charge confirmed: {ChargeId}, tokens: {Tokens}, user: {UserId}",
            chargeId, tokensToAdd, userId);
    }

    private async Task HandleChargeFailedAsync(AiDevRequestDbContext context, string? chargeId)
    {
        if (chargeId == null) return;

        var payment = await context.Payments
            .FirstOrDefaultAsync(p => p.CryptoChargeId == chargeId);

        if (payment != null)
        {
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        _logger.LogWarning("Coinbase charge failed: {ChargeId}", chargeId);
    }

    private async Task<CryptoCheckoutResult> SimulateCryptoCheckoutAsync(
        AiDevRequestDbContext context, string userId, TokenPackage package)
    {
        var chargeId = $"sim_crypto_{Guid.NewGuid():N}";

        var payment = new Payment
        {
            UserId = userId,
            Provider = PaymentProvider.CoinbaseCommerce,
            CryptoChargeId = chargeId,
            CryptoCurrency = "ETH",
            CryptoAmount = package.PriceUsd / 2500m, // Simulated ETH rate
            ExchangeRateUsd = 2500m,
            Type = PaymentType.TokenPurchase,
            AmountUsd = package.PriceUsd,
            Status = PaymentStatus.Succeeded,
            Description = $"[SIMULATION] Crypto purchase: {package.Name}",
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
        else
        {
            balance = new TokenBalance
            {
                UserId = userId,
                Balance = package.TokenAmount,
                TotalEarned = package.TokenAmount,
            };
            context.TokenBalances.Add(balance);
        }

        context.TokenTransactions.Add(new TokenTransaction
        {
            UserId = userId,
            Type = "credit",
            Amount = package.TokenAmount,
            Action = "purchase",
            Description = $"[SIMULATION] Crypto: {package.Name}",
            ReferenceId = payment.Id.ToString(),
            BalanceAfter = balance.Balance,
        });

        await context.SaveChangesAsync();

        _logger.LogInformation("[SIMULATION] Crypto purchase completed for user {UserId}: {Tokens} tokens",
            userId, package.TokenAmount);

        return new CryptoCheckoutResult
        {
            CheckoutUrl = $"SIMULATION_SUCCESS:{package.TokenAmount}",
            IsSimulation = true,
            ChargeId = chargeId,
        };
    }
}

// Coinbase Commerce API response models
public class CoinbaseChargeResponse
{
    [JsonPropertyName("data")]
    public CoinbaseChargeData? Data { get; set; }
}

public class CoinbaseChargeData
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("hosted_url")]
    public string? HostedUrl { get; set; }

    [JsonPropertyName("payments")]
    public List<CoinbasePaymentInfo>? Payments { get; set; }
}

public class CoinbasePaymentInfo
{
    [JsonPropertyName("network")]
    public string? Network { get; set; }

    [JsonPropertyName("transaction_id")]
    public string? TransactionId { get; set; }

    [JsonPropertyName("value")]
    public CoinbasePaymentValue? Value { get; set; }
}

public class CoinbasePaymentValue
{
    [JsonPropertyName("crypto")]
    public CoinbaseAmount? Crypto { get; set; }

    [JsonPropertyName("local")]
    public CoinbaseAmount? Local { get; set; }
}

public class CoinbaseAmount
{
    [JsonPropertyName("amount")]
    public string? Amount { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }
}

public class CoinbaseWebhookEvent
{
    [JsonPropertyName("event")]
    public CoinbaseEventPayload? Event { get; set; }
}

public class CoinbaseEventPayload
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("data")]
    public CoinbaseChargeData? Data { get; set; }
}
