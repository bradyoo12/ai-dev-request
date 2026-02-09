namespace AiDevRequest.API.Entities;

/// <summary>
/// Registered AI agent with its capabilities and auth info.
/// </summary>
public class AgentCard
{
    public int Id { get; set; }
    public required string AgentKey { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string OwnerId { get; set; }
    public string? InputSchemaJson { get; set; }
    public string? OutputSchemaJson { get; set; }
    public string? Scopes { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecretHash { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// A2A task representing a request from one agent to another.
/// </summary>
public class A2ATask
{
    public int Id { get; set; }
    public required string TaskUid { get; set; }
    public int FromAgentId { get; set; }
    public int ToAgentId { get; set; }
    public required string UserId { get; set; }
    public int? ConsentId { get; set; }
    public A2ATaskStatus Status { get; set; } = A2ATaskStatus.Submitted;
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public enum A2ATaskStatus
{
    Submitted,
    Working,
    Completed,
    Failed,
    Cancelled
}

/// <summary>
/// Data artifact exchanged between agents within a task.
/// </summary>
public class A2AArtifact
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public required string ArtifactType { get; set; }
    public string SchemaVersion { get; set; } = "1.0";
    public required string DataJson { get; set; }
    public string Direction { get; set; } = "request";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// User consent record for data sharing between agents.
/// </summary>
public class A2AConsent
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public int FromAgentId { get; set; }
    public int ToAgentId { get; set; }
    public required string Scopes { get; set; }
    public bool IsGranted { get; set; } = true;
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Audit log for all A2A communication events.
/// </summary>
public class A2AAuditLog
{
    public int Id { get; set; }
    public int? TaskId { get; set; }
    public int? FromAgentId { get; set; }
    public int? ToAgentId { get; set; }
    public string? UserId { get; set; }
    public required string Action { get; set; }
    public string? DetailJson { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
