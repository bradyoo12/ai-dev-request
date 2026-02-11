using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

/// <summary>
/// Performance profiling result for a generated project with multi-dimensional scores and optimization suggestions.
/// </summary>
public class PerformanceProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(100)]
    public string UserId { get; set; } = "";

    /// <summary>Bundle size score (0-100)</summary>
    public int BundleScore { get; set; }

    /// <summary>Rendering performance score (0-100)</summary>
    public int RenderingScore { get; set; }

    /// <summary>Data loading / query efficiency score (0-100)</summary>
    public int DataLoadingScore { get; set; }

    /// <summary>Accessibility compliance score (0-100)</summary>
    public int AccessibilityScore { get; set; }

    /// <summary>SEO readiness score (0-100)</summary>
    public int SeoScore { get; set; }

    /// <summary>Overall weighted score (0-100)</summary>
    public int OverallScore { get; set; }

    /// <summary>Estimated bundle size in KB</summary>
    public int EstimatedBundleSizeKb { get; set; }

    /// <summary>Number of optimization suggestions generated</summary>
    public int SuggestionCount { get; set; }

    /// <summary>Number of optimizations applied</summary>
    public int OptimizationsApplied { get; set; }

    /// <summary>JSON array of optimization suggestions with impact and effort</summary>
    public string SuggestionsJson { get; set; } = "[]";

    /// <summary>JSON object with detailed metrics per dimension</summary>
    public string MetricsJson { get; set; } = "{}";

    [MaxLength(50)]
    public string Status { get; set; } = "profiling";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? OptimizedAt { get; set; }
}
