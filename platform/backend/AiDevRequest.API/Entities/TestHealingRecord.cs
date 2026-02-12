namespace AiDevRequest.API.Entities;

public class TestHealingRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ProjectId { get; set; }
    public string Status { get; set; } = "pending"; // pending, analyzing, healed, failed, needs_review
    public string TestFilePath { get; set; } = "";
    public string OriginalSelector { get; set; } = "";
    public string HealedSelector { get; set; } = "";
    public string FailureReason { get; set; } = "";
    public string HealingSummary { get; set; } = "";
    public int ConfidenceScore { get; set; } // 0-100
    public string LocatorStrategy { get; set; } = "css"; // css, xpath, text, role, testid, intent
    public string? DiffJson { get; set; } // JSON: { before, after, componentName }
    public string? SuggestedFixJson { get; set; } // JSON: { selector, assertion, explanation }
    public bool IsApproved { get; set; }
    public bool IsRejected { get; set; }
    public int HealingVersion { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? HealedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
