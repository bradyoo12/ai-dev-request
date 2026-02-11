using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ModelRoutingConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Enable intelligent model routing (false = always use default model)
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Default model tier: "fast", "standard", "premium"
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string DefaultTier { get; set; } = "standard";

    /// <summary>
    /// JSON object mapping task types to model tiers
    /// e.g. {"formatting":"fast","architecture":"premium","boilerplate":"fast"}
    /// </summary>
    public string? TaskRoutingJson { get; set; }

    /// <summary>
    /// Maximum monthly AI cost budget in USD (0 = unlimited)
    /// </summary>
    public decimal MonthlyBudget { get; set; } = 0;

    /// <summary>
    /// Current month's AI cost in USD
    /// </summary>
    public decimal CurrentMonthCost { get; set; } = 0;

    /// <summary>
    /// Total tokens used via fast tier
    /// </summary>
    public long FastTierTokens { get; set; } = 0;

    /// <summary>
    /// Total tokens used via standard tier
    /// </summary>
    public long StandardTierTokens { get; set; } = 0;

    /// <summary>
    /// Total tokens used via premium tier
    /// </summary>
    public long PremiumTierTokens { get; set; } = 0;

    /// <summary>
    /// Total number of routing decisions made
    /// </summary>
    public int TotalRoutingDecisions { get; set; } = 0;

    /// <summary>
    /// Estimated cost savings from routing (vs all-premium) in USD
    /// </summary>
    public decimal EstimatedSavings { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
