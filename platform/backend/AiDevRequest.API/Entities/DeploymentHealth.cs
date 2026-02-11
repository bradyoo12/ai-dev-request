using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class DeploymentHealth
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Dev request / project this health check belongs to
    /// </summary>
    public Guid DevRequestId { get; set; }

    /// <summary>
    /// Deployment URL being monitored
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string DeploymentUrl { get; set; } = "";

    /// <summary>
    /// Current status: up, degraded, down
    /// </summary>
    [MaxLength(20)]
    public string Status { get; set; } = "unknown";

    /// <summary>
    /// Whether monitoring is enabled for this deployment
    /// </summary>
    public bool MonitoringEnabled { get; set; } = true;

    /// <summary>
    /// Health check interval in seconds
    /// </summary>
    public int CheckIntervalSeconds { get; set; } = 60;

    /// <summary>
    /// Error rate threshold (0.0 - 1.0) to trigger rollback
    /// </summary>
    public double ErrorRateThreshold { get; set; } = 0.1;

    /// <summary>
    /// Response time P95 threshold in ms to mark as degraded
    /// </summary>
    public int LatencyThresholdMs { get; set; } = 5000;

    /// <summary>
    /// Total number of health checks performed
    /// </summary>
    public int TotalChecks { get; set; } = 0;

    /// <summary>
    /// Number of successful checks
    /// </summary>
    public int SuccessfulChecks { get; set; } = 0;

    /// <summary>
    /// Number of failed checks
    /// </summary>
    public int FailedChecks { get; set; } = 0;

    /// <summary>
    /// Current error rate (0.0 - 1.0)
    /// </summary>
    public double CurrentErrorRate { get; set; } = 0;

    /// <summary>
    /// Average response time in ms (P50)
    /// </summary>
    public double AvgResponseTimeMs { get; set; } = 0;

    /// <summary>
    /// P95 response time in ms
    /// </summary>
    public double P95ResponseTimeMs { get; set; } = 0;

    /// <summary>
    /// P99 response time in ms
    /// </summary>
    public double P99ResponseTimeMs { get; set; } = 0;

    /// <summary>
    /// Uptime percentage (0.0 - 100.0)
    /// </summary>
    public double UptimePercentage { get; set; } = 100;

    /// <summary>
    /// Number of auto-rollbacks triggered
    /// </summary>
    public int RollbackCount { get; set; } = 0;

    /// <summary>
    /// Whether auto-rollback is enabled
    /// </summary>
    public bool AutoRollbackEnabled { get; set; } = false;

    /// <summary>
    /// Version ID of last known good deployment
    /// </summary>
    public Guid? LastGoodVersionId { get; set; }

    /// <summary>
    /// JSON array of recent health check events [{timestamp, status, responseTimeMs, error}]
    /// </summary>
    public string? HealthEventsJson { get; set; }

    /// <summary>
    /// JSON array of incident records [{startedAt, resolvedAt, type, description}]
    /// </summary>
    public string? IncidentsJson { get; set; }

    public DateTime? LastCheckAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
