using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

/// <summary>
/// Organizational memory with vector embeddings for semantic search.
/// Leverages .NET 10's native pgvector support for high-performance similarity search.
/// </summary>
public class OrganizationalMemory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    public required string Content { get; set; }

    /// <summary>
    /// Vector embedding for semantic similarity search.
    /// In .NET 10, EF Core has native pgvector support via vector type.
    /// Using string with Json suffix as fallback for compatibility.
    /// </summary>
    public string? EmbeddingVectorJson { get; set; }

    /// <summary>
    /// Additional metadata (JSON-serialized).
    /// </summary>
    public string? MetadataJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
