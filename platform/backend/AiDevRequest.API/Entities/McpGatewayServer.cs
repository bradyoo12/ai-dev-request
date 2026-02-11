namespace AiDevRequest.API.Entities;

public class McpGatewayServer
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ServerName { get; set; } = string.Empty;
    public string ServerUrl { get; set; } = string.Empty;
    public string TransportType { get; set; } = "stdio"; // stdio, sse, http
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "custom"; // custom, database, api, design, devops, ai
    public string IconUrl { get; set; } = string.Empty;
    public string Status { get; set; } = "disconnected"; // connected, disconnected, error
    public bool IsEnabled { get; set; } = true;
    public string ToolsJson { get; set; } = "[]";
    public string ResourcesJson { get; set; } = "[]";
    public int ToolCount { get; set; }
    public int ResourceCount { get; set; }
    public int TotalExecutions { get; set; }
    public int SuccessfulExecutions { get; set; }
    public int FailedExecutions { get; set; }
    public double AvgLatencyMs { get; set; }
    public DateTime LastHealthCheck { get; set; } = DateTime.UtcNow;
    public string HealthMessage { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
