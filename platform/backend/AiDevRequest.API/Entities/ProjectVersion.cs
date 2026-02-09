using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ProjectVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DevRequestId { get; set; }

    /// <summary>
    /// Sequential version number (1, 2, 3, ...)
    /// </summary>
    public int VersionNumber { get; set; }

    /// <summary>
    /// Human-readable label (e.g. "Initial build", "Added Stripe payments")
    /// </summary>
    [MaxLength(255)]
    public string Label { get; set; } = "";

    /// <summary>
    /// How this version was created: "build", "rebuild", "rollback"
    /// </summary>
    [MaxLength(50)]
    public string Source { get; set; } = "build";

    /// <summary>
    /// Number of files in this snapshot
    /// </summary>
    public int FileCount { get; set; }

    /// <summary>
    /// Path to the snapshot archive (zip) on disk
    /// </summary>
    [MaxLength(500)]
    public string? SnapshotPath { get; set; }

    /// <summary>
    /// JSON list of files changed from previous version
    /// </summary>
    public string? ChangedFilesJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
