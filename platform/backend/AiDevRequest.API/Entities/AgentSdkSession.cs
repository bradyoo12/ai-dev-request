namespace AiDevRequest.API.Entities;

public class AgentSdkSession
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TaskDescription { get; set; } = string.Empty;
    public int ToolCallsTotal { get; set; }
    public int ToolCallsSucceeded { get; set; }
    public int SubagentsSpawned { get; set; }
    public int SkillsInvoked { get; set; }
    public int McpServersConnected { get; set; }
    public int ContextTokensUsed { get; set; }
    public int ContextCompressions { get; set; }
    public int RetryAttempts { get; set; }
    public double SuccessRate { get; set; }
    public int DurationMs { get; set; }
    public string AgentModel { get; set; } = "claude-opus-4-6"; // claude-opus-4-6, claude-sonnet-4-5
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
