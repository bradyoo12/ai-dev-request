using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/adaptive-thinking")]
[Authorize]
public class AdaptiveThinkingController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly IAdaptiveThinkingService _thinkingService;

    public AdaptiveThinkingController(AiDevRequestDbContext db, IAdaptiveThinkingService thinkingService)
    {
        _db = db;
        _thinkingService = thinkingService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create the user's adaptive thinking configuration
    /// </summary>
    [HttpGet("config")]
    public async Task<ActionResult<AdaptiveThinkingConfigDto>> GetConfig()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AdaptiveThinkingConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AdaptiveThinkingConfig { UserId = userId };
            _db.AdaptiveThinkingConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Update adaptive thinking configuration
    /// </summary>
    [HttpPut("config")]
    public async Task<ActionResult<AdaptiveThinkingConfigDto>> UpdateConfig([FromBody] UpdateAdaptiveThinkingDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AdaptiveThinkingConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AdaptiveThinkingConfig { UserId = userId };
            _db.AdaptiveThinkingConfigs.Add(config);
        }

        if (dto.Enabled.HasValue) config.Enabled = dto.Enabled.Value;
        if (dto.ScaffoldEffort != null) config.ScaffoldEffort = ValidateEffort(dto.ScaffoldEffort);
        if (dto.AnalyzeEffort != null) config.AnalyzeEffort = ValidateEffort(dto.AnalyzeEffort);
        if (dto.ReviewEffort != null) config.ReviewEffort = ValidateEffort(dto.ReviewEffort);
        if (dto.GenerateEffort != null) config.GenerateEffort = ValidateEffort(dto.GenerateEffort);
        if (dto.StructuredOutputsEnabled.HasValue) config.StructuredOutputsEnabled = dto.StructuredOutputsEnabled.Value;
        if (dto.TaskOverridesJson != null) config.TaskOverridesJson = dto.TaskOverridesJson;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Get adaptive thinking usage statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<AdaptiveThinkingStatsDto>> GetStats()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.AdaptiveThinkingConfigs.FirstOrDefaultAsync(c => c.UserId == userId);

        var savingsPercent = config != null ? _thinkingService.EstimateCostSavingsPercent(config) : 0;

        return Ok(new AdaptiveThinkingStatsDto
        {
            TotalLowEffortRequests = config?.TotalLowEffortRequests ?? 0,
            TotalMediumEffortRequests = config?.TotalMediumEffortRequests ?? 0,
            TotalHighEffortRequests = config?.TotalHighEffortRequests ?? 0,
            TotalThinkingTokens = config?.TotalThinkingTokens ?? 0,
            EstimatedSavings = config?.EstimatedSavings ?? 0,
            CostSavingsPercent = savingsPercent,
        });
    }

    /// <summary>
    /// Get available task types and their default effort levels
    /// </summary>
    [HttpGet("task-types")]
    public ActionResult<IEnumerable<AdaptiveTaskTypeDto>> GetTaskTypes()
    {
        var taskTypes = new[]
        {
            new AdaptiveTaskTypeDto
            {
                Id = "scaffold",
                Name = "Scaffolding",
                Description = "Simple boilerplate and project structure generation",
                DefaultEffort = "low",
                EstimatedCostMultiplier = 0.3m,
            },
            new AdaptiveTaskTypeDto
            {
                Id = "analyze",
                Name = "Architecture Analysis",
                Description = "Complex architecture analysis and system design",
                DefaultEffort = "high",
                EstimatedCostMultiplier = 1.0m,
            },
            new AdaptiveTaskTypeDto
            {
                Id = "review",
                Name = "Code Review",
                Description = "Code quality review, security checks, and best practices",
                DefaultEffort = "medium",
                EstimatedCostMultiplier = 0.6m,
            },
            new AdaptiveTaskTypeDto
            {
                Id = "generate",
                Name = "Code Generation",
                Description = "Standard feature implementation and code generation",
                DefaultEffort = "medium",
                EstimatedCostMultiplier = 0.6m,
            },
        };
        return Ok(taskTypes);
    }

    /// <summary>
    /// Get available effort levels
    /// </summary>
    [HttpGet("effort-levels")]
    public ActionResult<IEnumerable<EffortLevelDto>> GetEffortLevels()
    {
        var levels = new[]
        {
            new EffortLevelDto
            {
                Id = "low",
                Name = "Low",
                Description = "Minimal thinking — fastest and cheapest, best for simple tasks",
                CostMultiplier = 0.3m,
                AvgLatencyMs = 500,
            },
            new EffortLevelDto
            {
                Id = "medium",
                Name = "Medium",
                Description = "Balanced thinking — good quality with reasonable cost",
                CostMultiplier = 0.6m,
                AvgLatencyMs = 2000,
            },
            new EffortLevelDto
            {
                Id = "high",
                Name = "High",
                Description = "Deep thinking — most accurate, best for complex analysis",
                CostMultiplier = 1.0m,
                AvgLatencyMs = 5000,
            },
        };
        return Ok(levels);
    }

    private static string ValidateEffort(string effort)
    {
        return effort.ToLowerInvariant() switch
        {
            "low" => "low",
            "medium" => "medium",
            "high" => "high",
            _ => "medium"
        };
    }

    private static AdaptiveThinkingConfigDto ToDto(AdaptiveThinkingConfig config) => new()
    {
        Id = config.Id,
        Enabled = config.Enabled,
        ScaffoldEffort = config.ScaffoldEffort,
        AnalyzeEffort = config.AnalyzeEffort,
        ReviewEffort = config.ReviewEffort,
        GenerateEffort = config.GenerateEffort,
        StructuredOutputsEnabled = config.StructuredOutputsEnabled,
        TotalLowEffortRequests = config.TotalLowEffortRequests,
        TotalMediumEffortRequests = config.TotalMediumEffortRequests,
        TotalHighEffortRequests = config.TotalHighEffortRequests,
        TotalThinkingTokens = config.TotalThinkingTokens,
        EstimatedSavings = config.EstimatedSavings,
        TaskOverridesJson = config.TaskOverridesJson,
        CreatedAt = config.CreatedAt,
        UpdatedAt = config.UpdatedAt,
    };
}

public class AdaptiveThinkingConfigDto
{
    public Guid Id { get; set; }
    public bool Enabled { get; set; }
    public string ScaffoldEffort { get; set; } = "";
    public string AnalyzeEffort { get; set; } = "";
    public string ReviewEffort { get; set; } = "";
    public string GenerateEffort { get; set; } = "";
    public bool StructuredOutputsEnabled { get; set; }
    public int TotalLowEffortRequests { get; set; }
    public int TotalMediumEffortRequests { get; set; }
    public int TotalHighEffortRequests { get; set; }
    public long TotalThinkingTokens { get; set; }
    public decimal EstimatedSavings { get; set; }
    public string? TaskOverridesJson { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateAdaptiveThinkingDto
{
    public bool? Enabled { get; set; }
    public string? ScaffoldEffort { get; set; }
    public string? AnalyzeEffort { get; set; }
    public string? ReviewEffort { get; set; }
    public string? GenerateEffort { get; set; }
    public bool? StructuredOutputsEnabled { get; set; }
    public string? TaskOverridesJson { get; set; }
}

public class AdaptiveThinkingStatsDto
{
    public int TotalLowEffortRequests { get; set; }
    public int TotalMediumEffortRequests { get; set; }
    public int TotalHighEffortRequests { get; set; }
    public long TotalThinkingTokens { get; set; }
    public decimal EstimatedSavings { get; set; }
    public decimal CostSavingsPercent { get; set; }
}

public class AdaptiveTaskTypeDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string DefaultEffort { get; set; } = "";
    public decimal EstimatedCostMultiplier { get; set; }
}

public class EffortLevelDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal CostMultiplier { get; set; }
    public int AvgLatencyMs { get; set; }
}
