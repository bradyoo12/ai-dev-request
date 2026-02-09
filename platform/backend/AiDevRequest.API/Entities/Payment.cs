namespace AiDevRequest.API.Entities;

public class Payment
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string? StripeCheckoutSessionId { get; set; }
    public PaymentProvider Provider { get; set; } = PaymentProvider.Stripe;
    public string? CryptoChargeId { get; set; }
    public string? CryptoTransactionHash { get; set; }
    public string? CryptoCurrency { get; set; }
    public decimal? CryptoAmount { get; set; }
    public decimal? ExchangeRateUsd { get; set; }
    public PaymentType Type { get; set; } = PaymentType.TokenPurchase;
    public decimal AmountUsd { get; set; }
    public string Currency { get; set; } = "usd";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? Description { get; set; }
    public int? TokenPackageId { get; set; }
    public int? TokensAwarded { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum PaymentType
{
    TokenPurchase,
    DomainPurchase,
    Subscription
}

public enum PaymentStatus
{
    Pending,
    Succeeded,
    Failed,
    Refunded,
    Cancelled
}

public enum PaymentProvider
{
    Stripe,
    CoinbaseCommerce
}
