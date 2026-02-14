using System.Text;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

/// <summary>
/// Defines the contract for calling locally-hosted AI models on Azure Container Apps with GPU.
/// </summary>
public interface ILocalModelInferenceService
{
    /// <summary>
    /// Generate a response from a local model.
    /// </summary>
    /// <param name="prompt">The input prompt text</param>
    /// <param name="modelName">The local model name (e.g., "llama-3-70b")</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Generated text response</returns>
    Task<string> GenerateAsync(string prompt, string modelName, CancellationToken ct = default);

    /// <summary>
    /// Check whether a specific local model is available and healthy.
    /// </summary>
    /// <param name="modelName">The local model name</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>True if the model is healthy and accepting requests</returns>
    Task<bool> IsModelAvailableAsync(string modelName, CancellationToken ct = default);

    /// <summary>
    /// List all active local model configurations.
    /// </summary>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Collection of active local model configs</returns>
    Task<IEnumerable<LocalModelConfig>> GetAvailableModelsAsync(CancellationToken ct = default);

    /// <summary>
    /// Perform a health check against a specific local model endpoint.
    /// </summary>
    /// <param name="modelName">The local model name</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Health check result with status and latency</returns>
    Task<LocalModelHealthResult> CheckHealthAsync(string modelName, CancellationToken ct = default);
}

/// <summary>
/// Result of a local model health check.
/// </summary>
public class LocalModelHealthResult
{
    public string ModelName { get; set; } = "";
    public bool IsHealthy { get; set; }
    public int LatencyMs { get; set; }
    public string? Error { get; set; }
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Implementation of <see cref="ILocalModelInferenceService"/>.
/// Calls local AI model inference endpoints hosted on Azure Container Apps with serverless GPU.
/// </summary>
public class LocalModelInferenceService : ILocalModelInferenceService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<LocalModelInferenceService> _logger;

    private static readonly TimeSpan InferenceTimeout = TimeSpan.FromSeconds(120);
    private static readonly TimeSpan HealthCheckTimeout = TimeSpan.FromSeconds(10);

    public LocalModelInferenceService(
        IHttpClientFactory httpClientFactory,
        AiDevRequestDbContext db,
        ILogger<LocalModelInferenceService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _db = db;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<string> GenerateAsync(string prompt, string modelName, CancellationToken ct = default)
    {
        var config = await _db.LocalModelConfigs
            .FirstOrDefaultAsync(m => m.ModelName == modelName && m.IsActive, ct);

        if (config == null)
        {
            throw new InvalidOperationException($"Local model '{modelName}' not found or is inactive.");
        }

        var client = _httpClientFactory.CreateClient();
        client.Timeout = InferenceTimeout;

        var requestBody = new
        {
            prompt,
            max_tokens = config.MaxTokens,
            model = config.ModelName
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        try
        {
            var endpoint = config.Endpoint.TrimEnd('/') + "/v1/completions";
            _logger.LogInformation("Calling local model '{ModelName}' at {Endpoint}", modelName, endpoint);

            var response = await client.PostAsync(endpoint, content, ct);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(responseJson);

            // Support both OpenAI-compatible and simple response formats
            if (doc.RootElement.TryGetProperty("choices", out var choices) &&
                choices.GetArrayLength() > 0)
            {
                var firstChoice = choices[0];
                if (firstChoice.TryGetProperty("text", out var text))
                    return text.GetString() ?? "";
                if (firstChoice.TryGetProperty("message", out var message) &&
                    message.TryGetProperty("content", out var messageContent))
                    return messageContent.GetString() ?? "";
            }

            if (doc.RootElement.TryGetProperty("generated_text", out var generatedText))
                return generatedText.GetString() ?? "";

            if (doc.RootElement.TryGetProperty("output", out var output))
                return output.GetString() ?? "";

            return responseJson;
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("Inference request to '{ModelName}' timed out.", modelName);
            throw new TimeoutException($"Inference request to local model '{modelName}' timed out after {InferenceTimeout.TotalSeconds}s.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to call local model '{ModelName}' at {Endpoint}.", modelName, config.Endpoint);
            throw new InvalidOperationException($"Failed to reach local model '{modelName}': {ex.Message}", ex);
        }
    }

    /// <inheritdoc />
    public async Task<bool> IsModelAvailableAsync(string modelName, CancellationToken ct = default)
    {
        try
        {
            var result = await CheckHealthAsync(modelName, ct);
            return result.IsHealthy;
        }
        catch
        {
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<LocalModelConfig>> GetAvailableModelsAsync(CancellationToken ct = default)
    {
        return await _db.LocalModelConfigs
            .Where(m => m.IsActive)
            .OrderBy(m => m.ModelName)
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<LocalModelHealthResult> CheckHealthAsync(string modelName, CancellationToken ct = default)
    {
        var config = await _db.LocalModelConfigs
            .FirstOrDefaultAsync(m => m.ModelName == modelName, ct);

        if (config == null)
        {
            return new LocalModelHealthResult
            {
                ModelName = modelName,
                IsHealthy = false,
                Error = $"Model '{modelName}' not found in configuration."
            };
        }

        var healthUrl = config.HealthCheckUrl ?? (config.Endpoint.TrimEnd('/') + "/health");
        var client = _httpClientFactory.CreateClient();
        client.Timeout = HealthCheckTimeout;

        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            var response = await client.GetAsync(healthUrl, ct);
            sw.Stop();

            return new LocalModelHealthResult
            {
                ModelName = modelName,
                IsHealthy = response.IsSuccessStatusCode,
                LatencyMs = (int)sw.ElapsedMilliseconds,
                Error = response.IsSuccessStatusCode ? null : $"Health check returned {response.StatusCode}"
            };
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogWarning(ex, "Health check failed for '{ModelName}' at {Url}.", modelName, healthUrl);

            return new LocalModelHealthResult
            {
                ModelName = modelName,
                IsHealthy = false,
                LatencyMs = (int)sw.ElapsedMilliseconds,
                Error = ex.Message
            };
        }
    }
}
