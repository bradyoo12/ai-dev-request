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

    /// <summary>
    /// Returns the provider service that supports the given model ID.
    /// Model ID format: "provider:model" (e.g., "claude:claude-sonnet-4-5-20250929")
    /// </summary>
    IModelProviderService GetProviderForModel(string modelId);

    /// <summary>
    /// Returns all registered provider services.
    /// </summary>
    IEnumerable<IModelProviderService> GetAllProviders();
}

/// <summary>
/// Default implementation of <see cref="IModelRouterService"/>.
/// Maps task categories to model tiers and provides model metadata.
/// Supports multi-provider routing for Claude and Gemini models.
/// </summary>
public class ModelRouterService : IModelRouterService
{
    private readonly ILogger<ModelRouterService> _logger;
    private readonly IEnumerable<IModelProviderService> _providers;

    public ModelRouterService(
        ILogger<ModelRouterService> logger,
        IEnumerable<IModelProviderService> providers)
    {
        _logger = logger;
        _providers = providers;
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
        // Returns provider-qualified model ID (format: "provider:model")
        return tier switch
        {
            ModelTier.Haiku => "claude:claude-haiku-4-5-20251001",
            ModelTier.Sonnet => "claude:claude-sonnet-4-5-20250929",
            ModelTier.Opus => "claude:claude-opus-4-6",
            _ => "claude:claude-sonnet-4-5-20250929"
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

    /// <inheritdoc />
    public IModelProviderService GetProviderForModel(string modelId)
    {
        // Parse provider-qualified model ID (format: "provider:model")
        var parts = modelId.Split(':', 2);
        if (parts.Length != 2)
        {
            _logger.LogWarning("Invalid model ID format: {ModelId}. Expected 'provider:model'. Falling back to Claude.", modelId);
            return _providers.FirstOrDefault(p => p.ProviderName == "claude")
                   ?? throw new InvalidOperationException("No Claude provider registered");
        }

        var providerName = parts[0];
        var provider = _providers.FirstOrDefault(p => p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase));

        if (provider == null)
        {
            _logger.LogWarning("Provider not found: {ProviderName}. Falling back to Claude.", providerName);
            return _providers.FirstOrDefault(p => p.ProviderName == "claude")
                   ?? throw new InvalidOperationException("No Claude provider registered");
        }

        return provider;
    }

    /// <inheritdoc />
    public IEnumerable<IModelProviderService> GetAllProviders()
    {
        return _providers;
    }
}
