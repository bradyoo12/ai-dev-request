namespace AiDevRequest.API.Entities;

/// <summary>
/// Configuration for a locally-hosted AI model running on Azure Container Apps with serverless GPU.
/// </summary>
public class LocalModelConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Model identifier (e.g., "llama-3-70b", "codellama-34b").
    /// </summary>
    public required string ModelName { get; set; }

    /// <summary>
    /// The inference endpoint URL for the model container.
    /// </summary>
    public required string Endpoint { get; set; }

    /// <summary>
    /// Human-friendly display name shown in the UI.
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Where the model is hosted: LocalGPU, AzureServerless, ExternalAPI.
    /// </summary>
    public string ModelLocation { get; set; } = "LocalGPU";

    /// <summary>
    /// GPU type used by the container (e.g., nvidia-t4, nvidia-a100).
    /// </summary>
    public string? GpuType { get; set; }

    /// <summary>
    /// Number of GPUs allocated to this model.
    /// </summary>
    public int GpuCount { get; set; } = 1;

    /// <summary>
    /// Whether this model is currently active and available for routing.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Cost per second of inference in USD.
    /// </summary>
    public decimal CostPerSecond { get; set; } = 0;

    /// <summary>
    /// Maximum token limit for a single inference request.
    /// </summary>
    public int MaxTokens { get; set; } = 8192;

    /// <summary>
    /// JSON array of model capabilities (e.g., ["code","chat","reasoning"]).
    /// </summary>
    public string? CapabilitiesJson { get; set; }

    /// <summary>
    /// Health check URL for monitoring model availability.
    /// </summary>
    public string? HealthCheckUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
