using AiDevRequest.API.DTOs;

namespace AiDevRequest.API.Services;

/// <summary>
/// Defines the contract for AI model provider services.
/// Supports multiple AI providers (Claude, Gemini, etc.) with a unified interface.
/// </summary>
public interface IModelProviderService
{
    /// <summary>
    /// Provider name identifier: "claude" | "gemini"
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Generate AI response for the given prompt using the specified model.
    /// </summary>
    /// <param name="prompt">The input prompt text</param>
    /// <param name="modelId">The model identifier (e.g., "claude-opus-4-6", "gemini-1.5-pro")</param>
    /// <param name="effortLevel">Optional adaptive thinking effort level (Low, Medium, High)</param>
    /// <param name="outputSchema">Optional JSON schema for structured outputs</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Generated text response</returns>
    Task<string> GenerateAsync(
        string prompt,
        string modelId,
        ThinkingEffortLevel? effortLevel = null,
        string? outputSchema = null,
        CancellationToken ct = default);

    /// <summary>
    /// Check if this provider supports the specified model.
    /// </summary>
    /// <param name="modelId">Model identifier to check</param>
    /// <returns>True if supported, false otherwise</returns>
    bool SupportsModel(string modelId);

    /// <summary>
    /// Get the cost per token for the specified model (in USD per 1M tokens).
    /// </summary>
    /// <param name="modelId">Model identifier</param>
    /// <returns>Cost per 1M tokens in USD</returns>
    decimal GetCostPerToken(string modelId);

    /// <summary>
    /// Get all available model identifiers for this provider.
    /// </summary>
    /// <returns>Collection of model IDs</returns>
    IEnumerable<string> GetAvailableModels();
}
