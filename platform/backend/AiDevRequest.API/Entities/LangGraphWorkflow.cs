namespace AiDevRequest.API.Entities;

public class LangGraphWorkflow
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string WorkflowName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string GraphDefinitionJson { get; set; } = "{}"; // nodes, edges, state schema
    public string Status { get; set; } = "draft"; // draft, running, completed, failed, paused
    public string NodesJson { get; set; } = "[]"; // array of agent nodes with type, config, status
    public string EdgesJson { get; set; } = "[]"; // array of connections between nodes
    public string ExecutionStateJson { get; set; } = "{}"; // current state data flowing through graph
    public int TotalNodes { get; set; }
    public int CompletedNodes { get; set; }
    public int FailedNodes { get; set; }
    public bool StampedeProtectionEnabled { get; set; }
    public int CacheHitsCount { get; set; }
    public int TotalExecutions { get; set; }
    public double AvgExecutionTimeMs { get; set; }
    public int? DevRequestId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
