using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class AgentFrameworkConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Whether the native .NET Agent Framework is enabled for this user
    /// </summary>
    public bool FrameworkEnabled { get; set; } = false;

    /// <summary>
    /// Maximum number of concurrent native agents allowed
    /// </summary>
    public int MaxConcurrentAgents { get; set; } = 5;

    /// <summary>
    /// Default AI model for native agents (e.g., "claude-sonnet-4-20250514")
    /// </summary>
    [MaxLength(100)]
    public string DefaultModel { get; set; } = "claude-sonnet-4-20250514";

    /// <summary>
    /// Middleware pipeline configuration (JSON array of middleware names)
    /// e.g., ["logging", "rate-limiting", "function-calling", "telemetry"]
    /// </summary>
    public string MiddlewarePipelineJson { get; set; } = "[]";

    /// <summary>
    /// Registered native agents (JSON array)
    /// </summary>
    public string RegisteredAgentsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
