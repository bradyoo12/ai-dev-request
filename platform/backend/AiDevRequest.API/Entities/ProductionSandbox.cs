namespace AiDevRequest.API.Entities;

public class ProductionSandbox
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string SandboxName { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty; // azure, aws, vercel
    public string Status { get; set; } = "pending"; // pending, provisioning, running, stopped, error
    public string EnvVarsJson { get; set; } = "[]"; // JSON array of imported env vars (names only, not values)
    public int EnvVarCount { get; set; }
    public string ServicesJson { get; set; } = "[]"; // JSON array of connected services
    public int ServiceCount { get; set; }
    public string Region { get; set; } = string.Empty;
    public bool OAuthConnected { get; set; }
    public double UptimeMinutes { get; set; }
    public double CostUsd { get; set; }
    public int? DevRequestId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
