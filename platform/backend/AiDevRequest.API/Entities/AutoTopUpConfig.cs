namespace AiDevRequest.API.Entities;

public class AutoTopUpConfig
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public bool IsEnabled { get; set; }
    public int Threshold { get; set; } = 100;
    public int TokenPackageId { get; set; }
    public decimal? MonthlyLimitUsd { get; set; }
    public decimal MonthlySpentUsd { get; set; }
    public DateTime? LastTriggeredAt { get; set; }
    public DateTime? LastFailedAt { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
