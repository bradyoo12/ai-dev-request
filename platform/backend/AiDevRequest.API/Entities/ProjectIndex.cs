using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ProjectIndex
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Dev request / project this index belongs to
    /// </summary>
    public Guid DevRequestId { get; set; }

    /// <summary>
    /// Relative file path within the project
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = "";

    /// <summary>
    /// SHA-256 hash of file content for change detection
    /// </summary>
    [MaxLength(64)]
    public string ContentHash { get; set; } = "";

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; } = 0;

    /// <summary>
    /// Detected programming language
    /// </summary>
    [MaxLength(50)]
    public string Language { get; set; } = "";

    /// <summary>
    /// JSON array of embedding floats (vector representation)
    /// </summary>
    public string? EmbeddingJson { get; set; }

    /// <summary>
    /// JSON array of import/reference paths this file depends on
    /// </summary>
    public string? DependenciesJson { get; set; }

    /// <summary>
    /// JSON array of file paths that import/reference this file
    /// </summary>
    public string? DependentsJson { get; set; }

    /// <summary>
    /// Brief AI-generated summary of what this file does
    /// </summary>
    [MaxLength(1000)]
    public string? Summary { get; set; }

    /// <summary>
    /// Comma-separated list of exported symbols (functions, classes, types)
    /// </summary>
    [MaxLength(2000)]
    public string? ExportedSymbols { get; set; }

    /// <summary>
    /// Relevance score (0.0 - 1.0) computed during last retrieval
    /// </summary>
    public double RelevanceScore { get; set; } = 0;

    /// <summary>
    /// Whether this file has been modified by user since last AI generation
    /// </summary>
    public bool IsUserModified { get; set; } = false;

    /// <summary>
    /// Whether this file needs re-indexing
    /// </summary>
    public bool NeedsReindex { get; set; } = false;

    public DateTime IndexedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
