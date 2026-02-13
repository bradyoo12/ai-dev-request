using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AiDevRequest.API.DTOs;

namespace AiDevRequest.API.Services;

/// <summary>
/// Google Gemini AI provider implementation using REST API.
/// Supports Gemini 1.5 Flash, Gemini 1.5 Pro, and Gemini 2.0 Flash models.
/// API Reference: https://ai.google.dev/api/rest/v1beta/models/generateContent
/// </summary>
public class GeminiProviderService : IModelProviderService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly ILogger<GeminiProviderService> _logger;

    private static readonly Dictionary<string, decimal> ModelCosts = new()
    {
        { "gemini-1.5-flash", 0.5m },        // Fast tier (~$0.50 per 1M tokens)
        { "gemini-1.5-pro", 3.5m },          // Balanced tier (~$3.50 per 1M tokens)
        { "gemini-2.0-flash-exp", 3.5m }     // Advanced tier (~$3.50 per 1M tokens, experimental)
    };

    private static readonly string[] SupportedModels = new[]
    {
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp"
    };

    public GeminiProviderService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GeminiProviderService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("GeminiClient");
        _apiKey = configuration["AiProviders:Gemini:ApiKey"]
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY")
            ?? throw new InvalidOperationException("Gemini API key not configured");
        _logger = logger;

        var baseUrl = configuration["AiProviders:Gemini:BaseUrl"]
            ?? "https://generativelanguage.googleapis.com";
        _httpClient.BaseAddress = new Uri(baseUrl);
    }

    public string ProviderName => "gemini";

    public async Task<string> GenerateAsync(
        string prompt,
        string modelId,
        ThinkingEffortLevel? effortLevel = null,
        string? outputSchema = null,
        CancellationToken ct = default)
    {
        if (!SupportsModel(modelId))
        {
            throw new ArgumentException($"Model '{modelId}' is not supported by Gemini provider", nameof(modelId));
        }

        try
        {
            _logger.LogInformation("Gemini API call: model={Model}, effortLevel={EffortLevel}, hasSchema={HasSchema}",
                modelId, effortLevel, outputSchema != null);

            // Note: Gemini may have different parameters for thinking and structured outputs
            // These parameters would be added to the request as needed
            if (effortLevel.HasValue)
            {
                _logger.LogInformation("Gemini: Effort level specified but not yet implemented in Gemini provider");
            }

            if (!string.IsNullOrWhiteSpace(outputSchema))
            {
                _logger.LogInformation("Gemini: Output schema specified but not yet implemented in Gemini provider");
            }

            var requestBody = new GeminiGenerateContentRequest
            {
                Contents = new[]
                {
                    new GeminiContent
                    {
                        Parts = new[] { new GeminiPart { Text = prompt } }
                    }
                },
                GenerationConfig = new GeminiGenerationConfig
                {
                    Temperature = 0.7f,
                    MaxOutputTokens = 4096,
                }
            };

            var jsonContent = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");
            var url = $"/v1beta/models/{modelId}:generateContent?key={_apiKey}";

            var response = await _httpClient.PostAsync(url, httpContent, ct);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Gemini API error: status={Status}, body={Body}", response.StatusCode, errorContent);
                throw new HttpRequestException($"Gemini API returned {response.StatusCode}: {errorContent}");
            }

            var responseContent = await response.Content.ReadAsStringAsync(ct);
            var result = JsonSerializer.Deserialize<GeminiGenerateContentResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var generatedText = result?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text ?? "";

            if (string.IsNullOrEmpty(generatedText))
            {
                _logger.LogWarning("Gemini API returned empty response: model={Model}", modelId);
                throw new InvalidOperationException("Gemini API returned empty response");
            }

            _logger.LogInformation("Gemini API success: model={Model}, responseLength={Length}", modelId, generatedText.Length);
            return generatedText;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Gemini API HTTP error: model={Model}", modelId);
            throw new InvalidOperationException($"Gemini API request failed: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini API error: model={Model}", modelId);
            throw new InvalidOperationException($"Gemini API request failed: {ex.Message}", ex);
        }
    }

    public bool SupportsModel(string modelId)
    {
        return SupportedModels.Contains(modelId);
    }

    public decimal GetCostPerToken(string modelId)
    {
        return ModelCosts.TryGetValue(modelId, out var cost) ? cost : 3.5m; // Default to Pro cost
    }

    public IEnumerable<string> GetAvailableModels()
    {
        return SupportedModels;
    }
}

// Gemini API DTOs
internal class GeminiGenerateContentRequest
{
    public GeminiContent[]? Contents { get; set; }
    public GeminiGenerationConfig? GenerationConfig { get; set; }
}

internal class GeminiContent
{
    public GeminiPart[]? Parts { get; set; }
    public string? Role { get; set; }
}

internal class GeminiPart
{
    public string? Text { get; set; }
}

internal class GeminiGenerationConfig
{
    public float? Temperature { get; set; }
    public int? MaxOutputTokens { get; set; }
    public float? TopP { get; set; }
    public int? TopK { get; set; }
}

internal class GeminiGenerateContentResponse
{
    public GeminiCandidate[]? Candidates { get; set; }
    public GeminiPromptFeedback? PromptFeedback { get; set; }
}

internal class GeminiCandidate
{
    public GeminiContent? Content { get; set; }
    public string? FinishReason { get; set; }
    public int Index { get; set; }
}

internal class GeminiPromptFeedback
{
    public string? BlockReason { get; set; }
}
