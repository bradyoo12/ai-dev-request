namespace AiDevRequest.API.Entities;

public class DomainTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DomainId { get; set; }

    public required string UserId { get; set; }

    public DomainTransactionType Type { get; set; }

    public decimal AmountUsd { get; set; }

    public DomainPaymentMethod PaymentMethod { get; set; }

    public int? TokenAmount { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum DomainTransactionType
{
    Purchase,
    Renewal,
    Refund
}

public enum DomainPaymentMethod
{
    Tokens,
    Card
}
