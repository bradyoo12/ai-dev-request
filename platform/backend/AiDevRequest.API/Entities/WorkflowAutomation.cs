using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class WorkflowAutomation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Name { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>JSON array of workflow nodes (id, type, label, position, config)</summary>
    public string NodesJson { get; set; } = "[]";

    /// <summary>JSON array of workflow edges (id, source, target, label)</summary>
    public string EdgesJson { get; set; } = "[]";

    /// <summary>Workflow trigger type: manual, schedule, webhook, event</summary>
    [MaxLength(50)]
    public string TriggerType { get; set; } = "manual";

    /// <summary>JSON configuration for the trigger (cron expression, webhook URL, event name)</summary>
    public string? TriggerConfigJson { get; set; }

    /// <summary>Current status of the workflow definition</summary>
    public WorkflowAutomationStatus Status { get; set; } = WorkflowAutomationStatus.Draft;

    /// <summary>Natural language description used to generate this workflow via AI</summary>
    public string? NaturalLanguagePrompt { get; set; }

    /// <summary>JSON metadata for additional workflow settings</summary>
    public string? MetadataJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum WorkflowAutomationStatus
{
    Draft,
    Active,
    Paused,
    Archived
}

public class WorkflowAutomationRun
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid WorkflowAutomationId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public WorkflowRunStatus Status { get; set; } = WorkflowRunStatus.Pending;

    /// <summary>JSON snapshot of the nodes at execution time</summary>
    public string NodesSnapshotJson { get; set; } = "[]";

    /// <summary>JSON map of node execution results: { nodeId: { status, output, error, startedAt, completedAt } }</summary>
    public string NodeResultsJson { get; set; } = "{}";

    /// <summary>The node currently being executed</summary>
    [MaxLength(100)]
    public string? CurrentNodeId { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    /// <summary>Error message if the run failed</summary>
    public string? Error { get; set; }
}

public enum WorkflowRunStatus
{
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled
}
