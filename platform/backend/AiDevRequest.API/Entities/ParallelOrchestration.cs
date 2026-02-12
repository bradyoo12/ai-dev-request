namespace AiDevRequest.API.Entities;

public class ParallelOrchestration
{
    public int Id { get; set; }
    public Guid DevRequestId { get; set; }

    // Status: pending, running, completed, failed
    public string Status { get; set; } = "pending";

    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int FailedTasks { get; set; }

    // Task dependency graph (JSON array)
    public string DependencyGraphJson { get; set; } = "[]";

    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int TotalDurationMs { get; set; }

    // Detected merge conflicts (JSON)
    public string? MergeConflictsJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    // public DevRequest? DevRequest { get; set; }  // Removed due to FK type mismatch in codebase
    public List<SubagentTask> Tasks { get; set; } = new();
}
