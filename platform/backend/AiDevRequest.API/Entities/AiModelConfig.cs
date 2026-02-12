using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

/// <summary>
/// Per-user AI model configuration with Claude Opus 4.6 extended thinking support.
/// Tracks model selection, thinking budget, streaming preferences, and usage statistics.
/// </summary>
public class AiModelConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Selected model ID: "claude-opus-4-6", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string SelectedModel { get; set; } = "claude-opus-4-6";

    /// <summary>
    /// Thinking mode: "none", "brief", "standard", "extended"
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string ThinkingMode { get; set; } = "standard";

    /// <summary>
    /// Maximum token budget for thinking process (512 - 128000)
    /// </summary>
    public int ThinkingBudgetTokens { get; set; } = 10000;

    /// <summary>
    /// Whether to stream responses as they are generated
    /// </summary>
    public bool StreamingEnabled { get; set; } = true;

    /// <summary>
    /// Whether to display the thinking/reasoning process to the user
    /// </summary>
    public bool ShowThinkingProcess { get; set; } = true;

    /// <summary>
    /// Default temperature for model responses (0.0 - 1.0)
    /// </summary>
    public double DefaultTemperature { get; set; } = 0.7;

    /// <summary>
    /// Maximum output tokens for model responses
    /// </summary>
    public int MaxOutputTokens { get; set; } = 4096;

    /// <summary>
    /// Total number of API requests made
    /// </summary>
    public int TotalRequests { get; set; } = 0;

    /// <summary>
    /// Total tokens consumed across all requests
    /// </summary>
    public long TotalTokensUsed { get; set; } = 0;

    /// <summary>
    /// Total tokens used specifically for extended thinking
    /// </summary>
    public long TotalThinkingTokensUsed { get; set; } = 0;

    /// <summary>
    /// Total cost in USD across all model usage
    /// </summary>
    public decimal TotalCost { get; set; } = 0;

    /// <summary>
    /// Average response time in milliseconds
    /// </summary>
    public double AvgResponseTimeMs { get; set; } = 0;

    /// <summary>
    /// JSON object with per-model usage breakdown:
    /// e.g. {"claude-opus-4-6":{"requests":10,"tokens":5000,"thinkingTokens":2000,"cost":0.15}}
    /// </summary>
    public string ModelUsageHistoryJson { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
