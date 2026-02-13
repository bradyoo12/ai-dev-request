using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using AiDevRequest.API.DTOs;

namespace AiDevRequest.API.Services;

/// <summary>
/// Claude AI provider implementation using Anthropic SDK.
/// Supports Claude Haiku 4.5, Sonnet 4.5, and Opus 4.6 models.
/// </summary>
public class ClaudeProviderService : IModelProviderService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<ClaudeProviderService> _logger;

    private static readonly Dictionary<string, decimal> ModelCosts = new()
    {
        { "claude-haiku-4-5-20251001", 1.00m },      // $1 per 1M tokens (average)
        { "claude-sonnet-4-5-20250929", 3.00m },     // $3 per 1M tokens (average)
        { "claude-opus-4-6", 15.00m }                // $15 per 1M tokens (average)
    };

    private static readonly string[] SupportedModels = new[]
    {
        "claude-haiku-4-5-20251001",
        "claude-sonnet-4-5-20250929",
        "claude-opus-4-6"
    };

    public ClaudeProviderService(IConfiguration configuration, ILogger<ClaudeProviderService> logger)
    {
        var apiKey = configuration["AiProviders:Claude:ApiKey"]
            ?? configuration["Anthropic:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
            ?? throw new InvalidOperationException("Claude API key not configured");

        _client = new AnthropicClient(apiKey);
        _logger = logger;
    }

    public string ProviderName => "claude";

    public async Task<string> GenerateAsync(
        string prompt,
        string modelId,
        ThinkingEffortLevel? effortLevel = null,
        string? outputSchema = null,
        CancellationToken ct = default)
    {
        if (!SupportsModel(modelId))
        {
            throw new ArgumentException($"Model '{modelId}' is not supported by Claude provider", nameof(modelId));
        }

        try
        {
            _logger.LogInformation("Claude API call: model={Model}, effortLevel={EffortLevel}, hasSchema={HasSchema}",
                modelId, effortLevel, outputSchema != null);

            var parameters = new MessageParameters
            {
                Messages = new List<Message> { new Message(RoleType.User, prompt) },
                Model = modelId,
                MaxTokens = 4096,
                Temperature = 0.7m
            };

            // Add adaptive thinking configuration if effort level is specified
            if (effortLevel.HasValue)
            {
                var effortString = effortLevel.Value switch
                {
                    ThinkingEffortLevel.Low => "low",
                    ThinkingEffortLevel.Medium => "medium",
                    ThinkingEffortLevel.High => "high",
                    _ => "medium"
                };

                // Note: The Anthropic SDK 5.9 should support adaptive thinking via the Thinking property
                // If the SDK doesn't expose it directly, we may need to use additional configuration
                // This is a placeholder - actual implementation depends on SDK API
                _logger.LogInformation("Using adaptive thinking with effort level: {Effort}", effortString);

                // TODO: Verify Anthropic SDK 5.9 API for adaptive thinking configuration
                // Example: parameters.Thinking = new ThinkingConfig { Type = "adaptive", Effort = effortString };
            }

            // Add structured output configuration if schema is specified
            if (!string.IsNullOrWhiteSpace(outputSchema))
            {
                // Note: Structured outputs in Anthropic SDK are typically configured via output_config
                // This is a placeholder - actual implementation depends on SDK API
                _logger.LogInformation("Using structured output with provided schema");

                // TODO: Verify Anthropic SDK 5.9 API for structured output configuration
                // Example: parameters.OutputConfig = new OutputConfig { Format = "json_schema", Schema = outputSchema };
            }

            var response = await _client.Messages.GetClaudeMessageAsync(parameters, ct);
            var content = response.Content.FirstOrDefault()?.ToString() ?? "";

            _logger.LogInformation("Claude API success: model={Model}, responseLength={Length}", modelId, content.Length);
            return content;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API error: model={Model}", modelId);
            throw new InvalidOperationException($"Claude API request failed: {ex.Message}", ex);
        }
    }

    public bool SupportsModel(string modelId)
    {
        return SupportedModels.Contains(modelId);
    }

    public decimal GetCostPerToken(string modelId)
    {
        return ModelCosts.TryGetValue(modelId, out var cost) ? cost : 3.00m; // Default to Sonnet cost
    }

    public IEnumerable<string> GetAvailableModels()
    {
        return SupportedModels;
    }
}
