namespace AiDevRequest.API.Entities;

public class CodeReviewAgent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReviewId { get; set; }
    public string AgentType { get; set; } = ""; // Security, Performance, Architecture, Testing
    public string Status { get; set; } = "pending"; // pending, running, completed, failed

    // Agent-specific findings (JSON array)
    public string? Findings { get; set; }

    // Agent-specific risk contribution (0-100)
    public int RiskScore { get; set; }

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
