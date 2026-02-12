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
public class AiModelConfigController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public AiModelConfigController(AiDevRequestDbContext db)
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
    /// Update AI model configuration (selected model, thinking budget, streaming, etc.)
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
        if (dto.ThinkingMode != null) config.ThinkingMode = dto.ThinkingMode;
        if (dto.ThinkingBudgetTokens.HasValue) config.ThinkingBudgetTokens = Math.Clamp(dto.ThinkingBudgetTokens.Value, 512, 128000);
        if (dto.StreamingEnabled.HasValue) config.StreamingEnabled = dto.StreamingEnabled.Value;
        if (dto.ShowThinkingProcess.HasValue) config.ShowThinkingProcess = dto.ShowThinkingProcess.Value;
        if (dto.DefaultTemperature.HasValue) config.DefaultTemperature = Math.Clamp(dto.DefaultTemperature.Value, 0.0, 1.0);
        if (dto.MaxOutputTokens.HasValue) config.MaxOutputTokens = Math.Clamp(dto.MaxOutputTokens.Value, 256, 128000);

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// List available models with metadata
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
                Provider = "Anthropic",
                Description = "Most capable model with extended thinking for complex reasoning, architecture design, and system-level analysis",
                CostPerInputToken = 0.015m,
                CostPerOutputToken = 0.075m,
                CostPerThinkingToken = 0.015m,
                AvgLatencyMs = 5000,
                ContextWindow = 200000,
                MaxOutputTokens = 128000,
                SupportsThinking = true,
                BestFor = new[] { "Complex reasoning", "Architecture design", "Security analysis", "System design", "Code review" },
                Tier = "premium",
            },
            new AvailableModelDto
            {
                Id = "claude-sonnet-4-5-20250929",
                Name = "Claude Sonnet 4.5",
                Provider = "Anthropic",
                Description = "Balanced performance and cost for general development tasks, code generation, and documentation",
                CostPerInputToken = 0.003m,
                CostPerOutputToken = 0.015m,
                CostPerThinkingToken = 0.003m,
                AvgLatencyMs = 2000,
                ContextWindow = 200000,
                MaxOutputTokens = 64000,
                SupportsThinking = true,
                BestFor = new[] { "Code generation", "Bug fixing", "Testing", "Documentation", "API design" },
                Tier = "standard",
            },
            new AvailableModelDto
            {
                Id = "claude-haiku-4-5-20251001",
                Name = "Claude Haiku 4.5",
                Provider = "Anthropic",
                Description = "Fastest model for quick tasks, formatting, boilerplate generation, and simple refactoring",
                CostPerInputToken = 0.0005m,
                CostPerOutputToken = 0.0025m,
                CostPerThinkingToken = 0.0005m,
                AvgLatencyMs = 500,
                ContextWindow = 200000,
                MaxOutputTokens = 32000,
                SupportsThinking = false,
                BestFor = new[] { "Formatting", "Boilerplate", "Simple edits", "Comments", "Quick answers" },
                Tier = "fast",
            },
        };
        return Ok(models);
    }

    /// <summary>
    /// Test model with a sample prompt, returns simulated response with thinking steps
    /// </summary>
    [HttpPost("test")]
    public async Task<ActionResult<TestModelResponseDto>> TestModel([FromBody] TestModelRequestDto request)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        var modelId = request.ModelId ?? config?.SelectedModel ?? "claude-opus-4-6";
        var thinkingMode = request.ThinkingMode ?? config?.ThinkingMode ?? "standard";

        // Simulated thinking steps based on thinking mode
        var thinkingSteps = thinkingMode switch
        {
            "none" => Array.Empty<string>(),
            "brief" => new[] { "Analyzing the prompt and identifying key requirements." },
            "standard" => new[]
            {
                "Analyzing the prompt and identifying key requirements.",
                "Considering the best approach for implementation.",
                "Evaluating trade-offs between different solutions.",
            },
            "extended" => new[]
            {
                "Analyzing the prompt and identifying key requirements.",
                "Breaking down the problem into sub-components.",
                "Considering the best approach for implementation.",
                "Evaluating trade-offs between different solutions.",
                "Reviewing edge cases and potential failure modes.",
                "Synthesizing the optimal solution with reasoning.",
            },
            _ => new[] { "Processing request." },
        };

        // Simulated latency based on model
        var latencyMs = modelId switch
        {
            "claude-opus-4-6" => 4200 + thinkingSteps.Length * 800,
            "claude-sonnet-4-5-20250929" => 1800 + thinkingSteps.Length * 400,
            "claude-haiku-4-5-20251001" => 400,
            _ => 2000,
        };

        var inputTokens = (request.Prompt?.Length ?? 0) / 4;
        var thinkingTokens = thinkingSteps.Length * 150;
        var outputTokens = 250;

        return Ok(new TestModelResponseDto
        {
            ModelId = modelId,
            ThinkingMode = thinkingMode,
            Prompt = request.Prompt ?? "Hello, what can you do?",
            Response = $"This is a simulated response from {modelId} using {thinkingMode} thinking mode. In production, this would connect to the Claude API and return a real response with {(thinkingMode != "none" ? "visible thinking steps" : "direct output")}.",
            ThinkingSteps = thinkingSteps,
            InputTokens = inputTokens,
            OutputTokens = outputTokens,
            ThinkingTokens = thinkingTokens,
            LatencyMs = latencyMs,
            EstimatedCost = CalculateCost(modelId, inputTokens, outputTokens, thinkingTokens),
        });
    }

    /// <summary>
    /// Get model usage statistics (tokens by model, cost, avg response time)
    /// </summary>
    [HttpGet("usage")]
    public async Task<ActionResult<AiModelUsageDto>> GetUsage()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AiModelConfigs.FirstOrDefaultAsync(c => c.UserId == userId);

        return Ok(new AiModelUsageDto
        {
            TotalRequests = config?.TotalRequests ?? 0,
            TotalTokensUsed = config?.TotalTokensUsed ?? 0,
            TotalThinkingTokensUsed = config?.TotalThinkingTokensUsed ?? 0,
            TotalCost = config?.TotalCost ?? 0,
            AvgResponseTimeMs = config?.AvgResponseTimeMs ?? 0,
            ModelUsageHistoryJson = config?.ModelUsageHistoryJson ?? "{}",
        });
    }

    /// <summary>
    /// List available thinking modes with descriptions
    /// </summary>
    [HttpGet("thinking-modes")]
    public ActionResult<IEnumerable<ThinkingModeDto>> GetThinkingModes()
    {
        var modes = new[]
        {
            new ThinkingModeDto
            {
                Id = "none",
                Name = "None",
                Description = "No thinking process - direct response for simple tasks",
                DefaultBudgetTokens = 0,
                MinBudgetTokens = 0,
                MaxBudgetTokens = 0,
            },
            new ThinkingModeDto
            {
                Id = "brief",
                Name = "Brief",
                Description = "Quick analysis before responding - suitable for straightforward tasks",
                DefaultBudgetTokens = 2000,
                MinBudgetTokens = 512,
                MaxBudgetTokens = 8000,
            },
            new ThinkingModeDto
            {
                Id = "standard",
                Name = "Standard",
                Description = "Balanced reasoning with multiple consideration steps",
                DefaultBudgetTokens = 10000,
                MinBudgetTokens = 4000,
                MaxBudgetTokens = 32000,
            },
            new ThinkingModeDto
            {
                Id = "extended",
                Name = "Extended",
                Description = "Deep reasoning with comprehensive analysis for complex problems",
                DefaultBudgetTokens = 32000,
                MinBudgetTokens = 16000,
                MaxBudgetTokens = 128000,
            },
        };
        return Ok(modes);
    }

    private static decimal CalculateCost(string modelId, int inputTokens, int outputTokens, int thinkingTokens)
    {
        return modelId switch
        {
            "claude-opus-4-6" =>
                (inputTokens * 0.015m + outputTokens * 0.075m + thinkingTokens * 0.015m) / 1000m,
            "claude-sonnet-4-5-20250929" =>
                (inputTokens * 0.003m + outputTokens * 0.015m + thinkingTokens * 0.003m) / 1000m,
            "claude-haiku-4-5-20251001" =>
                (inputTokens * 0.0005m + outputTokens * 0.0025m + thinkingTokens * 0.0005m) / 1000m,
            _ => 0m,
        };
    }

    private static AiModelConfigDto ToDto(AiModelConfig config) => new()
    {
        Id = config.Id,
        SelectedModel = config.SelectedModel,
        ThinkingMode = config.ThinkingMode,
        ThinkingBudgetTokens = config.ThinkingBudgetTokens,
        StreamingEnabled = config.StreamingEnabled,
        ShowThinkingProcess = config.ShowThinkingProcess,
        DefaultTemperature = config.DefaultTemperature,
        MaxOutputTokens = config.MaxOutputTokens,
        TotalRequests = config.TotalRequests,
        TotalTokensUsed = config.TotalTokensUsed,
        TotalThinkingTokensUsed = config.TotalThinkingTokensUsed,
        TotalCost = config.TotalCost,
        AvgResponseTimeMs = config.AvgResponseTimeMs,
        ModelUsageHistoryJson = config.ModelUsageHistoryJson,
        CreatedAt = config.CreatedAt,
        UpdatedAt = config.UpdatedAt,
    };
}

// --- DTOs ---

public class AiModelConfigDto
{
    public Guid Id { get; set; }
    public string SelectedModel { get; set; } = "";
    public string ThinkingMode { get; set; } = "";
    public int ThinkingBudgetTokens { get; set; }
    public bool StreamingEnabled { get; set; }
    public bool ShowThinkingProcess { get; set; }
    public double DefaultTemperature { get; set; }
    public int MaxOutputTokens { get; set; }
    public int TotalRequests { get; set; }
    public long TotalTokensUsed { get; set; }
    public long TotalThinkingTokensUsed { get; set; }
    public decimal TotalCost { get; set; }
    public double AvgResponseTimeMs { get; set; }
    public string ModelUsageHistoryJson { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateAiModelConfigDto
{
    public string? SelectedModel { get; set; }
    public string? ThinkingMode { get; set; }
    public int? ThinkingBudgetTokens { get; set; }
    public bool? StreamingEnabled { get; set; }
    public bool? ShowThinkingProcess { get; set; }
    public double? DefaultTemperature { get; set; }
    public int? MaxOutputTokens { get; set; }
}

public class AvailableModelDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Provider { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal CostPerInputToken { get; set; }
    public decimal CostPerOutputToken { get; set; }
    public decimal CostPerThinkingToken { get; set; }
    public int AvgLatencyMs { get; set; }
    public int ContextWindow { get; set; }
    public int MaxOutputTokens { get; set; }
    public bool SupportsThinking { get; set; }
    public string[] BestFor { get; set; } = [];
    public string Tier { get; set; } = "";
}

public class TestModelRequestDto
{
    public string? ModelId { get; set; }
    public string? ThinkingMode { get; set; }
    public string? Prompt { get; set; }
}

public class TestModelResponseDto
{
    public string ModelId { get; set; } = "";
    public string ThinkingMode { get; set; } = "";
    public string Prompt { get; set; } = "";
    public string Response { get; set; } = "";
    public string[] ThinkingSteps { get; set; } = [];
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public int ThinkingTokens { get; set; }
    public int LatencyMs { get; set; }
    public decimal EstimatedCost { get; set; }
}

public class AiModelUsageDto
{
    public int TotalRequests { get; set; }
    public long TotalTokensUsed { get; set; }
    public long TotalThinkingTokensUsed { get; set; }
    public decimal TotalCost { get; set; }
    public double AvgResponseTimeMs { get; set; }
    public string ModelUsageHistoryJson { get; set; } = "";
}

public class ThinkingModeDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int DefaultBudgetTokens { get; set; }
    public int MinBudgetTokens { get; set; }
    public int MaxBudgetTokens { get; set; }
}
