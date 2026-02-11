using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ReviewPipelineConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Enable automatic code review after generation
    /// </summary>
    public bool AutoReviewEnabled { get; set; } = true;

    /// <summary>
    /// Enable security vulnerability scanning
    /// </summary>
    public bool SecurityCheckEnabled { get; set; } = true;

    /// <summary>
    /// Enable performance analysis
    /// </summary>
    public bool PerformanceCheckEnabled { get; set; } = true;

    /// <summary>
    /// Enable accessibility compliance checking
    /// </summary>
    public bool AccessibilityCheckEnabled { get; set; } = true;

    /// <summary>
    /// Enable architecture pattern validation
    /// </summary>
    public bool ArchitectureCheckEnabled { get; set; } = true;

    /// <summary>
    /// Enable maintainability and code quality analysis
    /// </summary>
    public bool MaintainabilityCheckEnabled { get; set; } = true;

    /// <summary>
    /// Automatically apply safe fixes for common issues
    /// </summary>
    public bool AutoFixEnabled { get; set; } = false;

    /// <summary>
    /// Generate test files for every reviewed file
    /// </summary>
    public bool TestGenerationEnabled { get; set; } = false;

    /// <summary>
    /// Minimum quality score threshold (0-100) to pass review
    /// </summary>
    public int QualityThreshold { get; set; } = 70;

    // Aggregate statistics
    public int TotalReviews { get; set; } = 0;
    public int TotalAutoFixes { get; set; } = 0;
    public int TotalTestsGenerated { get; set; } = 0;
    public decimal AvgQualityScore { get; set; } = 0;

    /// <summary>
    /// JSON array of review history entries
    /// </summary>
    public string? ReviewHistoryJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
