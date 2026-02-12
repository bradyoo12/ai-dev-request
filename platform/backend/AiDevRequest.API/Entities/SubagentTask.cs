namespace AiDevRequest.API.Entities;

public class SubagentTask
{
    public int Id { get; set; }
    public Guid DevRequestId { get; set; }
    public int? ParentOrchestrationId { get; set; }

    // Task type: frontend, backend, tests, docs, schema
    public string TaskType { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";

    // Specialized context/prompt for this agent (JSON)
    public string ContextJson { get; set; } = "{}";

    // Status: pending, running, completed, failed
    public string Status { get; set; } = "pending";

    // Generated files, errors, metrics (JSON)
    public string? OutputJson { get; set; }

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int DurationMs { get; set; }
    public int TokensUsed { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    // public DevRequest? DevRequest { get; set; }  // Removed due to FK type mismatch in codebase
    public ParallelOrchestration? ParentOrchestration { get; set; }
}
