namespace AiDevRequest.API.Entities;

public class WorkflowExecution
{
    public int Id { get; set; }
    public int DevRequestId { get; set; }
    public required string WorkflowType { get; set; }
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Pending;
    public required string StepsJson { get; set; }
    public int RetryCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public enum WorkflowStatus
{
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled
}
