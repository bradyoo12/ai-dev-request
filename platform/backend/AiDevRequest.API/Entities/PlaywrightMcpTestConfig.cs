namespace AiDevRequest.API.Entities;

public class PlaywrightMcpTestConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = "";
    public Guid? ProjectId { get; set; }

    public string TestScenario { get; set; } = "";
    public string? GeneratedTestCode { get; set; }
    public string? HealingHistoryJson { get; set; } // JSON array of healing events
    public string Status { get; set; } = "pending"; // pending, generating, completed, failed

    public double SuccessRate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
