namespace AiDevRequest.API.Entities;

public class GeneratedAgent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string AgentType { get; set; } // slack-bot, telegram-bot, webhook, custom
    public required string SpecificationText { get; set; } // Original user specification
    public string? GeneratedCodeJson { get; set; } // JSON containing generated code files
    public string? ConfigurationJson { get; set; } // JSON containing agent configuration (API keys, webhooks, etc.)
    public string Status { get; set; } = "draft"; // draft, active, archived
    public string? DeploymentUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
