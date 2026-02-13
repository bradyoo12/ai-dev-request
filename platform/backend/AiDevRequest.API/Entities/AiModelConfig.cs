using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class AiModelConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Selected AI model identifier (provider-qualified): "claude:claude-sonnet-4-5-20250929" or "gemini:gemini-1.5-pro"
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string SelectedModel { get; set; } = "claude-sonnet-4-5";

    /// <summary>
    /// Preferred AI provider: "claude", "gemini", etc.
    /// </summary>
    [MaxLength(50)]
    public string? PreferredProvider { get; set; }

    /// <summary>
    /// Whether extended thinking is enabled (only available for Opus 4.6)
    /// </summary>
    public bool ExtendedThinkingEnabled { get; set; } = false;

    /// <summary>
    /// Token budget for extended thinking (1000-50000)
    /// </summary>
    public int ThinkingBudgetTokens { get; set; } = 10000;

    /// <summary>
    /// Whether to stream thinking indicators to the client
    /// </summary>
    public bool StreamThinkingEnabled { get; set; } = true;

    /// <summary>
    /// Automatically select model based on task complexity
    /// </summary>
    public bool AutoModelSelection { get; set; } = false;

    /// <summary>
    /// Total requests made using Opus 4.6
    /// </summary>
    public int TotalRequestsOpus { get; set; } = 0;

    /// <summary>
    /// Total requests made using Sonnet 4.5
    /// </summary>
    public int TotalRequestsSonnet { get; set; } = 0;

    /// <summary>
    /// Total thinking tokens consumed (extended thinking)
    /// </summary>
    public long TotalThinkingTokens { get; set; } = 0;

    /// <summary>
    /// Total output tokens consumed across all models
    /// </summary>
    public long TotalOutputTokens { get; set; } = 0;

    /// <summary>
    /// Estimated total cost in USD
    /// </summary>
    public decimal EstimatedCost { get; set; } = 0;

    /// <summary>
    /// JSON array of model usage history entries
    /// </summary>
    public string? ModelHistoryJson { get; set; }

    /// <summary>
    /// JSON array of task type effort level configurations
    /// Format: [{"TaskType":"analysis","EffortLevel":2,"Description":"..."},...]
    /// </summary>
    public string? EffortLevelConfigJson { get; set; }

    /// <summary>
    /// Whether structured outputs are enabled for AI model responses
    /// </summary>
    public bool StructuredOutputsEnabled { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
