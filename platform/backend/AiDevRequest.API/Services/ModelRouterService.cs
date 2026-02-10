namespace AiDevRequest.API.Services;

/// <summary>
/// Defines the AI model performance/cost tiers available for task routing.
/// </summary>
public enum ModelTier
{
    /// <summary>Fastest and cheapest — suitable for lightweight tasks.</summary>
    Haiku,

    /// <summary>Balanced performance and cost — suitable for standard generation.</summary>
    Sonnet,

    /// <summary>Highest capability — suitable for complex generation and review.</summary>
    Opus
}

/// <summary>
/// Categorises the type of AI task to determine the appropriate model tier.
/// </summary>
public enum TaskCategory
{
    Planning,
    Analysis,
    StandardGeneration,
    ComplexGeneration,
    Review,
    Scaffolding
}

/// <summary>
/// Routes AI tasks to the most cost-effective model tier while maintaining quality.
/// </summary>
public interface IModelRouterService
{
    /// <summary>
    /// Returns the recommended model tier for a given task category.
    /// </summary>
    ModelTier GetRecommendedTier(TaskCategory category);

    /// <summary>
    /// Returns the Claude model identifier string for a given tier.
    /// </summary>
    string GetModelId(ModelTier tier);

    /// <summary>
    /// Returns the estimated cost per 1 million tokens for a given tier (USD).
    /// </summary>
    decimal GetEstimatedCostPerToken(ModelTier tier);
}

/// <summary>
/// Default implementation of <see cref="IModelRouterService"/>.
/// Maps task categories to model tiers and provides model metadata.
/// </summary>
public class ModelRouterService : IModelRouterService
{
    private readonly ILogger<ModelRouterService> _logger;

    public ModelRouterService(ILogger<ModelRouterService> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public ModelTier GetRecommendedTier(TaskCategory category)
    {
        var tier = category switch
        {
            TaskCategory.Planning => ModelTier.Haiku,
            TaskCategory.Analysis => ModelTier.Haiku,
            TaskCategory.Scaffolding => ModelTier.Haiku,
            TaskCategory.StandardGeneration => ModelTier.Sonnet,
            TaskCategory.ComplexGeneration => ModelTier.Opus,
            TaskCategory.Review => ModelTier.Opus,
            _ => ModelTier.Sonnet
        };

        _logger.LogDebug("Model router: {Category} → {Tier}", category, tier);
        return tier;
    }

    /// <inheritdoc />
    public string GetModelId(ModelTier tier)
    {
        return tier switch
        {
            ModelTier.Haiku => "claude-haiku-4-5-20251001",
            ModelTier.Sonnet => "claude-sonnet-4-5-20250929",
            ModelTier.Opus => "claude-opus-4-6",
            _ => "claude-sonnet-4-5-20250929"
        };
    }

    /// <inheritdoc />
    public decimal GetEstimatedCostPerToken(ModelTier tier)
    {
        // Estimated cost per 1M tokens (USD)
        return tier switch
        {
            ModelTier.Haiku => 1.00m,
            ModelTier.Sonnet => 3.00m,
            ModelTier.Opus => 15.00m,
            _ => 3.00m
        };
    }
}
