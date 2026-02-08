using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class SubscriptionRecord
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public SubscriptionPlan PlanType { get; set; } = SubscriptionPlan.Free;

    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CanceledAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum SubscriptionStatus
{
    Active,
    Canceled,
    Paused,
    Expired
}

public class SubscriptionEvent
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [MaxLength(255)]
    public string? UserEmail { get; set; }

    public SubscriptionEventType EventType { get; set; }

    public SubscriptionPlan? FromPlan { get; set; }

    public SubscriptionPlan? ToPlan { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum SubscriptionEventType
{
    Created,
    Upgraded,
    Downgraded,
    Canceled,
    Renewed,
    Reactivated
}

public class ChurnMetricSnapshot
{
    public int Id { get; set; }

    public DateTime PeriodStart { get; set; }

    public DateTime PeriodEnd { get; set; }

    public int TotalSubscribers { get; set; }

    public int NewSubscribers { get; set; }

    public int ChurnedSubscribers { get; set; }

    public decimal ChurnRate { get; set; }

    public decimal Mrr { get; set; }

    public int NetGrowth { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
