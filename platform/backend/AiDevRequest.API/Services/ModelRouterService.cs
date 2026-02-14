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
/// Describes where a model is hosted for routing decisions.
/// </summary>
public enum ModelLocation
{
    /// <summary>External cloud API (e.g., Anthropic, Google).</summary>
    ExternalAPI,

    /// <summary>Azure Container Apps with serverless GPU.</summary>
    AzureServerless,

    /// <summary>Self-hosted model on local GPU infrastructure.</summary>
    LocalGPU
}

/// <summary>
/// Represents a routing decision including the model location and cost estimate.
/// </summary>
public class ModelRoutingDecision
{
    public ModelTier Tier { get; set; }
    public string ModelId { get; set; } = "";
    public ModelLocation Location { get; set; } = ModelLocation.ExternalAPI;
    public decimal EstimatedCostPerToken { get; set; }
    public bool UseLocalModel { get; set; }
    public string? LocalModelName { get; set; }
    public string Reason { get; set; } = "";
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

    /// <summary>
    /// Returns a routing decision that considers both external and local models
    /// for optimal cost and performance.
    /// </summary>
    /// <param name="category">The task category</param>
    /// <param name="availableLocalModels">Local model names currently available</param>
    /// <returns>A routing decision with model selection and rationale</returns>
    ModelRoutingDecision GetRoutingDecision(TaskCategory category, IEnumerable<string>? availableLocalModels = null);
}

/// <summary>
/// Default implementation of <see cref="IModelRouterService"/>.
/// Maps task categories to model tiers and provides model metadata.
/// Supports multi-provider routing for Claude, Gemini, and local GPU models.
/// </summary>
public class ModelRouterService : IModelRouterService
{
    private readonly ILogger<ModelRouterService> _logger;
    private readonly IEnumerable<IModelProviderService> _providers;

    /// <summary>
    /// Task categories that can be offloaded to local models for cost savings.
    /// Complex generation and review are kept on external APIs for quality.
    /// </summary>
    private static readonly HashSet<TaskCategory> LocalEligibleCategories = new()
    {
        TaskCategory.Planning,
        TaskCategory.Analysis,
        TaskCategory.Scaffolding,
        TaskCategory.StandardGeneration
    };

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

    /// <inheritdoc />
    public ModelRoutingDecision GetRoutingDecision(TaskCategory category, IEnumerable<string>? availableLocalModels = null)
    {
        var tier = GetRecommendedTier(category);
        var externalModelId = GetModelId(tier);
        var externalCost = GetEstimatedCostPerToken(tier);

        // Check if this category is eligible for local model offloading
        var localModels = availableLocalModels?.ToList();
        if (localModels != null && localModels.Count > 0 && LocalEligibleCategories.Contains(category))
        {
            // Local models are significantly cheaper for eligible tasks
            var localModelName = localModels.First();
            _logger.LogInformation(
                "Routing {Category} to local model '{LocalModel}' instead of {ExternalModel} (cost optimization).",
                category, localModelName, externalModelId);

            return new ModelRoutingDecision
            {
                Tier = tier,
                ModelId = $"local:{localModelName}",
                Location = ModelLocation.LocalGPU,
                EstimatedCostPerToken = 0.10m, // Local models are much cheaper
                UseLocalModel = true,
                LocalModelName = localModelName,
                Reason = $"Local model selected for {category} task (cost optimization, local GPU available)."
            };
        }

        // Fallback to external API
        _logger.LogDebug(
            "Routing {Category} to external model {ModelId} (no local model available or task requires external API).",
            category, externalModelId);

        return new ModelRoutingDecision
        {
            Tier = tier,
            ModelId = externalModelId,
            Location = ModelLocation.ExternalAPI,
            EstimatedCostPerToken = externalCost,
            UseLocalModel = false,
            Reason = localModels == null || localModels.Count == 0
                ? $"No local models available; using external {tier} tier."
                : $"Task category {category} requires external API quality."
        };
    }
}
