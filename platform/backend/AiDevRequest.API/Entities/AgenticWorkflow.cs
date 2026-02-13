namespace AiDevRequest.API.Entities;

public class AgenticWorkflow
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string WorkflowName { get; set; } = string.Empty;
    public string WorkflowVersion { get; set; } = "v1.0";
    public string DeploymentStrategy { get; set; } = string.Empty; // canary, blue-green, rolling, full
    public int RolloutPercent { get; set; }
    public double SuccessRate { get; set; }
    public double AvgLatencyMs { get; set; }
    public double CostPerRequest { get; set; }
    public int TotalRequests { get; set; }
    public int FailedRequests { get; set; }
    public bool RollbackTriggered { get; set; }
    public string RollbackReason { get; set; } = string.Empty;
    public string RollbackVersion { get; set; } = string.Empty;
    public string HealthStatus { get; set; } = "healthy"; // healthy, degraded, critical, rolled-back
    public string MonitoringAlerts { get; set; } = string.Empty; // JSON array
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
