namespace AiDevRequest.API.Entities;

public class AgentDeployment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public Guid AgentSkillId { get; set; }
    public required string Platform { get; set; } // "slack", "telegram", "webhook", "scheduled"
    public required string Status { get; set; } // "active", "paused", "failed"
    public string? ConfigJson { get; set; } // Platform-specific config (tokens, webhooks, etc.)
    public string? MetricsJson { get; set; } // Usage metrics (messages processed, errors, etc.)
    public DateTime DeployedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastActiveAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
