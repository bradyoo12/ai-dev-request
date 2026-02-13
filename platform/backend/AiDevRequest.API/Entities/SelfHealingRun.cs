namespace AiDevRequest.API.Entities;

public class SelfHealingRun
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TestCommand { get; set; } = string.Empty;
    public string BrowserType { get; set; } = "chromium"; // chromium, firefox, webkit
    public string Status { get; set; } = "pending"; // pending, running, testing, healing, passed, failed
    public int CurrentAttempt { get; set; }
    public int MaxAttempts { get; set; } = 3;
    public string ErrorsJson { get; set; } = "[]"; // JSON array of detected errors
    public string FixesJson { get; set; } = "[]"; // JSON array of applied fixes
    public double TestDurationMs { get; set; }
    public double HealingDurationMs { get; set; }
    public double TotalDurationMs { get; set; }
    public int TestsPassed { get; set; }
    public int TestsFailed { get; set; }
    public int TestsTotal { get; set; }
    public string FinalResult { get; set; } = string.Empty; // passed, failed, partial
    public int? DevRequestId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
