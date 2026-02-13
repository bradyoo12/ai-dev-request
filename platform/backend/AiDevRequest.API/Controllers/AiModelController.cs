using AiDevRequest.API.Data;
using AiDevRequest.API.DTOs;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/ai-model")]
[Authorize]
public class AiModelController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly IModelRouterService _modelRouter;

    public AiModelController(AiDevRequestDbContext db, IModelRouterService modelRouter)
    {
        _db = db;
        _modelRouter = modelRouter;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get list of available AI providers
    /// </summary>
    [HttpGet("providers")]
    public ActionResult<IEnumerable<ProviderDto>> GetProviders()
    {
        var providers = _modelRouter.GetAllProviders()
            .Select(p => new ProviderDto
            {
                Name = p.ProviderName,
                ModelCount = p.GetAvailableModels().Count()
            });

        return Ok(providers);
    }

    /// <summary>
    /// Get list of available models for a specific provider
    /// </summary>
    [HttpGet("models")]
    public ActionResult<IEnumerable<ProviderModelDto>> GetModels([FromQuery] string? provider = null)
    {
        IEnumerable<IModelProviderService> providers;

        if (string.IsNullOrWhiteSpace(provider))
        {
            // Return models from all providers
            providers = _modelRouter.GetAllProviders();
        }
        else
        {
            // Return models from specific provider
            providers = _modelRouter.GetAllProviders()
                .Where(p => p.ProviderName.Equals(provider, StringComparison.OrdinalIgnoreCase));
        }

        var models = providers.SelectMany(p => p.GetAvailableModels().Select(modelId => new ProviderModelDto
        {
            Provider = p.ProviderName,
            ModelId = modelId,
            QualifiedModelId = $"{p.ProviderName}:{modelId}",
            CostPerToken = p.GetCostPerToken(modelId)
        }));

        return Ok(models);
    }

    /// <summary>
    /// Get or create the user's AI model configuration
    /// </summary>
    [HttpGet("config")]
    public async Task<ActionResult<AiModelConfigDto>> GetConfig()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AiModelConfig { UserId = userId };
            _db.AiModelConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Update AI model preferences
    /// </summary>
    [HttpPut("config")]
    public async Task<ActionResult<AiModelConfigDto>> UpdateConfig([FromBody] UpdateAiModelConfigDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AiModelConfig { UserId = userId };
            _db.AiModelConfigs.Add(config);
        }

        if (dto.SelectedModel != null) config.SelectedModel = dto.SelectedModel;
        if (dto.PreferredProvider != null) config.PreferredProvider = dto.PreferredProvider;
        if (dto.ExtendedThinkingEnabled.HasValue) config.ExtendedThinkingEnabled = dto.ExtendedThinkingEnabled.Value;
        if (dto.ThinkingBudgetTokens.HasValue) config.ThinkingBudgetTokens = Math.Clamp(dto.ThinkingBudgetTokens.Value, 1000, 50000);
        if (dto.StreamThinkingEnabled.HasValue) config.StreamThinkingEnabled = dto.StreamThinkingEnabled.Value;
        if (dto.AutoModelSelection.HasValue) config.AutoModelSelection = dto.AutoModelSelection.Value;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Estimate cost for a task given input text
    /// </summary>
    [HttpPost("estimate")]
    public ActionResult<AiModelCostEstimateDto> EstimateCost([FromBody] CostEstimateRequestDto request)
    {
        // Rough token estimation: ~4 chars per token for English text
        var estimatedInputTokens = (int)Math.Ceiling((request.InputText?.Length ?? 0) / 4.0);
        var estimatedOutputTokens = request.ExpectedOutputTokens > 0 ? request.ExpectedOutputTokens : 2000;

        var opusInputCost = estimatedInputTokens / 1000.0m * 0.015m;
        var opusOutputCost = estimatedOutputTokens / 1000.0m * 0.075m;
        var opusThinkingCost = request.IncludeThinking ? (request.ThinkingBudget / 1000.0m * 0.075m) : 0m;

        var sonnetInputCost = estimatedInputTokens / 1000.0m * 0.003m;
        var sonnetOutputCost = estimatedOutputTokens / 1000.0m * 0.015m;

        return Ok(new AiModelCostEstimateDto
        {
            EstimatedInputTokens = estimatedInputTokens,
            EstimatedOutputTokens = estimatedOutputTokens,
            OpusCost = opusInputCost + opusOutputCost + opusThinkingCost,
            SonnetCost = sonnetInputCost + sonnetOutputCost,
            OpusThinkingCost = opusThinkingCost,
            Savings = (opusInputCost + opusOutputCost + opusThinkingCost) - (sonnetInputCost + sonnetOutputCost),
        });
    }

    /// <summary>
    /// Get AI model usage statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AiModelStatsDto>> GetStats()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == userId);

        return Ok(new AiModelStatsDto
        {
            TotalRequests = (config?.TotalRequestsOpus ?? 0) + (config?.TotalRequestsSonnet ?? 0),
            TotalRequestsOpus = config?.TotalRequestsOpus ?? 0,
            TotalRequestsSonnet = config?.TotalRequestsSonnet ?? 0,
            TotalThinkingTokens = config?.TotalThinkingTokens ?? 0,
            TotalOutputTokens = config?.TotalOutputTokens ?? 0,
            EstimatedCost = config?.EstimatedCost ?? 0,
        });
    }

    /// <summary>
    /// Get effort level configuration for different task types
    /// </summary>
    [HttpGet("effort-levels")]
    public async Task<ActionResult<EffortLevelConfigDto>> GetEffortLevels()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            // Return default configuration
            return Ok(GetDefaultEffortLevelConfig());
        }

        // Deserialize from JSON or return defaults
        var taskConfigs = string.IsNullOrWhiteSpace(config.EffortLevelConfigJson)
            ? GetDefaultTaskConfigs()
            : JsonSerializer.Deserialize<List<TaskTypeEffortConfig>>(config.EffortLevelConfigJson) ?? GetDefaultTaskConfigs();

        return Ok(new EffortLevelConfigDto
        {
            TaskConfigs = taskConfigs,
            StructuredOutputsEnabled = config.StructuredOutputsEnabled,
            UpdatedAt = config.UpdatedAt
        });
    }

    /// <summary>
    /// Update effort level configuration for different task types
    /// </summary>
    [HttpPut("effort-levels")]
    public async Task<ActionResult<EffortLevelConfigDto>> UpdateEffortLevels([FromBody] UpdateEffortLevelConfigDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AiModelConfig { UserId = userId };
            _db.AiModelConfigs.Add(config);
        }

        // Update effort level configuration
        config.EffortLevelConfigJson = JsonSerializer.Serialize(dto.TaskConfigs);

        // Update structured outputs setting if provided
        if (dto.StructuredOutputsEnabled.HasValue)
        {
            config.StructuredOutputsEnabled = dto.StructuredOutputsEnabled.Value;
        }

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new EffortLevelConfigDto
        {
            TaskConfigs = dto.TaskConfigs,
            StructuredOutputsEnabled = config.StructuredOutputsEnabled,
            UpdatedAt = config.UpdatedAt
        });
    }

    private static EffortLevelConfigDto GetDefaultEffortLevelConfig() => new()
    {
        TaskConfigs = GetDefaultTaskConfigs(),
        StructuredOutputsEnabled = true,
        UpdatedAt = DateTime.UtcNow
    };

    private static List<TaskTypeEffortConfig> GetDefaultTaskConfigs() => new()
    {
        new() { TaskType = "analysis", EffortLevel = ThinkingEffortLevel.High, Description = "Complex reasoning for requirement analysis" },
        new() { TaskType = "proposal", EffortLevel = ThinkingEffortLevel.Medium, Description = "Moderate effort for solution proposals" },
        new() { TaskType = "production", EffortLevel = ThinkingEffortLevel.Low, Description = "Quick code generation for scaffolding" },
        new() { TaskType = "code_review", EffortLevel = ThinkingEffortLevel.High, Description = "Thorough analysis for code review" },
        new() { TaskType = "test_generation", EffortLevel = ThinkingEffortLevel.Low, Description = "Simple test case generation" }
    };

    private static AiModelConfigDto ToDto(AiModelConfig config) => new()
    {
        Id = config.Id,
        SelectedModel = config.SelectedModel,
        PreferredProvider = config.PreferredProvider,
        ExtendedThinkingEnabled = config.ExtendedThinkingEnabled,
        ThinkingBudgetTokens = config.ThinkingBudgetTokens,
        StreamThinkingEnabled = config.StreamThinkingEnabled,
        AutoModelSelection = config.AutoModelSelection,
        TotalRequestsOpus = config.TotalRequestsOpus,
        TotalRequestsSonnet = config.TotalRequestsSonnet,
        TotalThinkingTokens = config.TotalThinkingTokens,
        TotalOutputTokens = config.TotalOutputTokens,
        EstimatedCost = config.EstimatedCost,
        ModelHistoryJson = config.ModelHistoryJson,
        EffortLevelConfigJson = config.EffortLevelConfigJson,
        StructuredOutputsEnabled = config.StructuredOutputsEnabled,
        CreatedAt = config.CreatedAt,
        UpdatedAt = config.UpdatedAt,
    };
}

public class ProviderDto
{
    public string Name { get; set; } = "";
    public int ModelCount { get; set; }
}

public class ProviderModelDto
{
    public string Provider { get; set; } = "";
    public string ModelId { get; set; } = "";
    public string QualifiedModelId { get; set; } = "";
    public decimal CostPerToken { get; set; }
}

public class AiModelConfigDto
{
    public Guid Id { get; set; }
    public string SelectedModel { get; set; } = "";
    public string? PreferredProvider { get; set; }
    public bool ExtendedThinkingEnabled { get; set; }
    public int ThinkingBudgetTokens { get; set; }
    public bool StreamThinkingEnabled { get; set; }
    public bool AutoModelSelection { get; set; }
    public int TotalRequestsOpus { get; set; }
    public int TotalRequestsSonnet { get; set; }
    public long TotalThinkingTokens { get; set; }
    public long TotalOutputTokens { get; set; }
    public decimal EstimatedCost { get; set; }
    public string? ModelHistoryJson { get; set; }
    public string? EffortLevelConfigJson { get; set; }
    public bool StructuredOutputsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateAiModelConfigDto
{
    public string? SelectedModel { get; set; }
    public string? PreferredProvider { get; set; }
    public bool? ExtendedThinkingEnabled { get; set; }
    public int? ThinkingBudgetTokens { get; set; }
    public bool? StreamThinkingEnabled { get; set; }
    public bool? AutoModelSelection { get; set; }
}

public class CostEstimateRequestDto
{
    public string? InputText { get; set; }
    public int ExpectedOutputTokens { get; set; }
    public bool IncludeThinking { get; set; }
    public int ThinkingBudget { get; set; } = 10000;
}

public class AiModelCostEstimateDto
{
    public int EstimatedInputTokens { get; set; }
    public int EstimatedOutputTokens { get; set; }
    public decimal OpusCost { get; set; }
    public decimal SonnetCost { get; set; }
    public decimal OpusThinkingCost { get; set; }
    public decimal Savings { get; set; }
}

public class AiModelStatsDto
{
    public int TotalRequests { get; set; }
    public int TotalRequestsOpus { get; set; }
    public int TotalRequestsSonnet { get; set; }
    public long TotalThinkingTokens { get; set; }
    public long TotalOutputTokens { get; set; }
    public decimal EstimatedCost { get; set; }
}
