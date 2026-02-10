namespace AiDevRequest.API.Entities;

public class PlatformEvent
{
    public int Id { get; set; }
    public string EventType { get; set; } = string.Empty; // "visit", "register", "trial_start", "paid_conversion", "churn"
    public string? UserId { get; set; }
    public string? SessionId { get; set; }
    public string? Metadata { get; set; } // JSON for additional context
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class GrowthSnapshot
{
    public int Id { get; set; }
    public DateTime SnapshotDate { get; set; }
    public string Period { get; set; } = "daily"; // "daily", "monthly"
    public int TotalVisitors { get; set; }
    public int TotalRegistered { get; set; }
    public int TotalTrialUsers { get; set; }
    public int TotalPaidUsers { get; set; }
    public int NewRegistrations { get; set; }
    public int NewTrialStarts { get; set; }
    public int NewPaidConversions { get; set; }
    public int ChurnedUsers { get; set; }
    public decimal ConversionRate { get; set; } // trial -> paid
    public decimal ChurnRate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
