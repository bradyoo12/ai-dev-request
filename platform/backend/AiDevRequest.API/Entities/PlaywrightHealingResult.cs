namespace AiDevRequest.API.Entities;

public class PlaywrightHealingResult
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string TestFile { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public string OriginalSelector { get; set; } = string.Empty;
    public string HealedSelector { get; set; } = string.Empty;
    public string HealingStrategy { get; set; } = string.Empty; // closest-match, ai-suggest, fallback-chain
    public double Confidence { get; set; }
    public string Status { get; set; } = "healed"; // healed, failed, pending, manual-review
    public string FailureReason { get; set; } = string.Empty;
    public int HealingAttempts { get; set; }
    public double HealingTimeMs { get; set; }
    public int? DevRequestId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
