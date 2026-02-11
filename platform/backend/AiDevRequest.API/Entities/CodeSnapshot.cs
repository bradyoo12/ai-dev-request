using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class CodeSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Associated dev request ID
    /// </summary>
    public Guid DevRequestId { get; set; }

    /// <summary>
    /// File path relative to project root (e.g. "src/App.tsx")
    /// </summary>
    [Required]
    [MaxLength(500)]
    public required string FilePath { get; set; }

    /// <summary>
    /// The AI-generated baseline code content
    /// </summary>
    [Required]
    public required string BaselineContent { get; set; }

    /// <summary>
    /// The user-modified content (null if user hasn't modified)
    /// </summary>
    public string? UserContent { get; set; }

    /// <summary>
    /// Whether the user has locked this file from AI regeneration
    /// </summary>
    public bool IsLocked { get; set; } = false;

    /// <summary>
    /// Generation version number (increments on each AI regeneration)
    /// </summary>
    public int Version { get; set; } = 1;

    public SnapshotStatus Status { get; set; } = SnapshotStatus.Synced;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum SnapshotStatus
{
    Synced,
    UserModified,
    Conflicted,
    Merged,
}
