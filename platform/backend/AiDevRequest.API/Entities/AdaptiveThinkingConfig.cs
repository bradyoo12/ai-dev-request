using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class AdaptiveThinkingConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Whether adaptive thinking is enabled (uses thinking: {type: "adaptive"})
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Effort level for scaffold tasks: "low", "medium", "high"
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string ScaffoldEffort { get; set; } = "low";

    /// <summary>
    /// Effort level for analyze tasks: "low", "medium", "high"
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string AnalyzeEffort { get; set; } = "high";

    /// <summary>
    /// Effort level for review tasks: "low", "medium", "high"
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string ReviewEffort { get; set; } = "medium";

    /// <summary>
    /// Effort level for generate tasks: "low", "medium", "high"
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string GenerateEffort { get; set; } = "medium";

    /// <summary>
    /// Whether structured outputs are enabled (JSON schema-constrained responses)
    /// </summary>
    public bool StructuredOutputsEnabled { get; set; } = true;

    /// <summary>
    /// Total requests using low effort
    /// </summary>
    public int TotalLowEffortRequests { get; set; } = 0;

    /// <summary>
    /// Total requests using medium effort
    /// </summary>
    public int TotalMediumEffortRequests { get; set; } = 0;

    /// <summary>
    /// Total requests using high effort
    /// </summary>
    public int TotalHighEffortRequests { get; set; } = 0;

    /// <summary>
    /// Total thinking tokens consumed
    /// </summary>
    public long TotalThinkingTokens { get; set; } = 0;

    /// <summary>
    /// Estimated cost savings from adaptive thinking vs always-high in USD
    /// </summary>
    public decimal EstimatedSavings { get; set; } = 0;

    /// <summary>
    /// JSON object with per-task-type override settings
    /// </summary>
    public string? TaskOverridesJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
