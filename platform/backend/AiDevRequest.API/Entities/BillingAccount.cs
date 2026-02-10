namespace AiDevRequest.API.Entities;

public class BillingAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = "";
    public string Plan { get; set; } = "free"; // free, pro, team
    public string Status { get; set; } = "active"; // active, past_due, cancelled, trialing
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }

    // Usage tracking
    public int RequestsThisPeriod { get; set; }
    public int RequestsLimit { get; set; } = 3; // free: 3, pro: 20, team: 100
    public int TokensUsedThisPeriod { get; set; }
    public decimal OverageCharges { get; set; }
    public decimal MonthlyRate { get; set; } // 0, 29, 99
    public decimal PerRequestOverageRate { get; set; } // 0, 0.50, 0.30

    // Period tracking
    public DateTime PeriodStart { get; set; } = DateTime.UtcNow;
    public DateTime PeriodEnd { get; set; } = DateTime.UtcNow.AddMonths(1);

    // Invoice history
    public string? InvoiceHistory { get; set; } // JSON array

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
