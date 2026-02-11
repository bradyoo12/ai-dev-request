using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class GenerationVariant
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DevRequestId { get; set; }

    [Required]
    [MaxLength(100)]
    public string UserId { get; set; } = "";

    /// <summary>
    /// Sequential variant number (1, 2, 3)
    /// </summary>
    public int VariantNumber { get; set; }

    /// <summary>
    /// Approach label: "minimal", "balanced", "feature-rich"
    /// </summary>
    [MaxLength(100)]
    public string Approach { get; set; } = "balanced";

    /// <summary>
    /// Human-readable description of this variant's approach
    /// </summary>
    [MaxLength(500)]
    public string Description { get; set; } = "";

    /// <summary>
    /// Generated code files as JSON array [{path, content}]
    /// </summary>
    public string FilesJson { get; set; } = "[]";

    public int FileCount { get; set; }

    /// <summary>
    /// Total lines of code across all files
    /// </summary>
    public int LinesOfCode { get; set; }

    /// <summary>
    /// Total number of dependencies detected
    /// </summary>
    public int DependencyCount { get; set; }

    /// <summary>
    /// Estimated bundle size in KB
    /// </summary>
    public int EstimatedBundleSizeKb { get; set; }

    /// <summary>
    /// AI model tier used for generation
    /// </summary>
    [MaxLength(50)]
    public string ModelTier { get; set; } = "Sonnet";

    /// <summary>
    /// Tokens used for generation
    /// </summary>
    public int TokensUsed { get; set; }

    /// <summary>
    /// User rating (0 = unrated, 1-5)
    /// </summary>
    public int Rating { get; set; }

    /// <summary>
    /// Whether this variant was selected as the winner
    /// </summary>
    public bool IsSelected { get; set; }

    /// <summary>
    /// Status: generating, ready, selected, rejected
    /// </summary>
    [MaxLength(50)]
    public string Status { get; set; } = "generating";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
