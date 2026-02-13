namespace AiDevRequest.API.Entities;

public class RefinementMessage
{
    public int Id { get; set; }

    public Guid DevRequestId { get; set; }

    public string Role { get; set; } = "user"; // "user" or "assistant"

    public string Content { get; set; } = "";

    /// <summary>
    /// JSON serialized list of file changes applied in this iteration.
    /// Format: [{"file": "path/to/file", "operation": "modify|create|delete", "linesChanged": 10}]
    /// </summary>
    public string? FileChangesJson { get; set; }

    /// <summary>
    /// Status of file changes: pending, accepted, or reverted
    /// </summary>
    public string Status { get; set; } = "pending"; // pending | accepted | reverted

    public int? TokensUsed { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum MessageStatus
{
    Pending,
    Accepted,
    Reverted
}
