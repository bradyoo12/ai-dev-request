using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/ai-model")]
[Authorize]
public class AiModelController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public AiModelController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

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
        if (dto.ExtendedThinkingEnabled.HasValue) config.ExtendedThinkingEnabled = dto.ExtendedThinkingEnabled.Value;
        if (dto.ThinkingBudgetTokens.HasValue) config.ThinkingBudgetTokens = Math.Clamp(dto.ThinkingBudgetTokens.Value, 1000, 50000);
        if (dto.StreamThinkingEnabled.HasValue) config.StreamThinkingEnabled = dto.StreamThinkingEnabled.Value;
        if (dto.AutoModelSelection.HasValue) config.AutoModelSelection = dto.AutoModelSelection.Value;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// List available AI models with pricing and capabilities
    /// </summary>
    [HttpGet("models")]
    public ActionResult<IEnumerable<AvailableModelDto>> GetModels()
    {
        var models = new[]
        {
            new AvailableModelDto
            {
                Id = "claude-opus-4-6",
                Name = "Claude Opus 4.6",
                ModelId = "claude-opus-4-6",
                Description = "Most capable model with extended thinking for complex reasoning",
                InputCostPer1k = 0.015m,
                OutputCostPer1k = 0.075m,
                SupportsExtendedThinking = true,
                MaxOutputTokens = 32000,
                AvgLatencyMs = 5000,
                Tier = "powerful",
                Badge = "Most Capable",
                Capabilities = new[] { "Extended thinking", "Complex reasoning", "Architecture design", "Security analysis", "System design", "Advanced debugging" },
            },
            new AvailableModelDto
            {
                Id = "claude-sonnet-4-5",
                Name = "Claude Sonnet 4.5",
                ModelId = "claude-sonnet-4-5-20250929",
                Description = "Fast and efficient model for everyday development tasks",
                InputCostPer1k = 0.003m,
                OutputCostPer1k = 0.015m,
                SupportsExtendedThinking = false,
                MaxOutputTokens = 16000,
                AvgLatencyMs = 1500,
                Tier = "fast",
                Badge = "Fastest",
                Capabilities = new[] { "Code generation", "Bug fixing", "Testing", "Documentation", "Refactoring", "Quick iterations" },
            },
        };
        return Ok(models);
    }

    /// <summary>
    /// Estimate cost for a task given input text
    /// </summary>
    [HttpPost("estimate")]
    public ActionResult<CostEstimateDto> EstimateCost([FromBody] CostEstimateRequestDto request)
    {
        // Rough token estimation: ~4 chars per token for English text
        var estimatedInputTokens = (int)Math.Ceiling((request.InputText?.Length ?? 0) / 4.0);
        var estimatedOutputTokens = request.ExpectedOutputTokens > 0 ? request.ExpectedOutputTokens : 2000;

        var opusInputCost = estimatedInputTokens / 1000.0m * 0.015m;
        var opusOutputCost = estimatedOutputTokens / 1000.0m * 0.075m;
        var opusThinkingCost = request.IncludeThinking ? (request.ThinkingBudget / 1000.0m * 0.075m) : 0m;

        var sonnetInputCost = estimatedInputTokens / 1000.0m * 0.003m;
        var sonnetOutputCost = estimatedOutputTokens / 1000.0m * 0.015m;

        return Ok(new CostEstimateDto
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

    private static AiModelConfigDto ToDto(AiModelConfig config) => new()
    {
        Id = config.Id,
        SelectedModel = config.SelectedModel,
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
        CreatedAt = config.CreatedAt,
        UpdatedAt = config.UpdatedAt,
    };
}

public class AiModelConfigDto
{
    public Guid Id { get; set; }
    public string SelectedModel { get; set; } = "";
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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateAiModelConfigDto
{
    public string? SelectedModel { get; set; }
    public bool? ExtendedThinkingEnabled { get; set; }
    public int? ThinkingBudgetTokens { get; set; }
    public bool? StreamThinkingEnabled { get; set; }
    public bool? AutoModelSelection { get; set; }
}

public class AvailableModelDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string ModelId { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal InputCostPer1k { get; set; }
    public decimal OutputCostPer1k { get; set; }
    public bool SupportsExtendedThinking { get; set; }
    public int MaxOutputTokens { get; set; }
    public int AvgLatencyMs { get; set; }
    public string Tier { get; set; } = "";
    public string Badge { get; set; } = "";
    public string[] Capabilities { get; set; } = [];
}

public class CostEstimateRequestDto
{
    public string? InputText { get; set; }
    public int ExpectedOutputTokens { get; set; }
    public bool IncludeThinking { get; set; }
    public int ThinkingBudget { get; set; } = 10000;
}

public class CostEstimateDto
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
