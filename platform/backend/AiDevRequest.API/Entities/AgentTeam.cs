namespace AiDevRequest.API.Entities;

public class AgentTeam
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }

    // Strategy: parallel, sequential, pipeline
    public string Strategy { get; set; } = "parallel";

    // JSON array of team member definitions: [{ "skillId": "...", "role": "frontend", "config": {...} }]
    public string MembersJson { get; set; } = "[]";

    // Template name if created from a preset (full-stack, frontend-only, api-only, review-team)
    public string? Template { get; set; }

    // Status of last execution: idle, running, completed, failed
    public string Status { get; set; } = "idle";

    // Last execution stats (JSON: { "totalTasks", "completedTasks", "failedTasks", "durationMs" })
    public string? LastExecutionJson { get; set; }

    public bool IsPublic { get; set; }
    public int ExecutionCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
