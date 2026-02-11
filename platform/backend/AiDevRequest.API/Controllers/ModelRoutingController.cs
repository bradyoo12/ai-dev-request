using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/model-routing")]
[Authorize]
public class ModelRoutingController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public ModelRoutingController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create the user's model routing configuration
    /// </summary>
    [HttpGet("config")]
    public async Task<ActionResult<ModelRoutingConfigDto>> GetConfig()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.ModelRoutingConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new ModelRoutingConfig { UserId = userId };
            _db.ModelRoutingConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Update model routing configuration
    /// </summary>
    [HttpPut("config")]
    public async Task<ActionResult<ModelRoutingConfigDto>> UpdateConfig([FromBody] UpdateModelRoutingDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.ModelRoutingConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new ModelRoutingConfig { UserId = userId };
            _db.ModelRoutingConfigs.Add(config);
        }

        if (dto.Enabled.HasValue) config.Enabled = dto.Enabled.Value;
        if (dto.DefaultTier != null) config.DefaultTier = dto.DefaultTier;
        if (dto.TaskRoutingJson != null) config.TaskRoutingJson = dto.TaskRoutingJson;
        if (dto.MonthlyBudget.HasValue) config.MonthlyBudget = Math.Max(0, dto.MonthlyBudget.Value);

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Get model routing usage statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<RoutingStatsDto>> GetStats()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.ModelRoutingConfigs.FirstOrDefaultAsync(c => c.UserId == userId);

        return Ok(new RoutingStatsDto
        {
            FastTierTokens = config?.FastTierTokens ?? 0,
            StandardTierTokens = config?.StandardTierTokens ?? 0,
            PremiumTierTokens = config?.PremiumTierTokens ?? 0,
            TotalRoutingDecisions = config?.TotalRoutingDecisions ?? 0,
            CurrentMonthCost = config?.CurrentMonthCost ?? 0,
            MonthlyBudget = config?.MonthlyBudget ?? 0,
            EstimatedSavings = config?.EstimatedSavings ?? 0,
        });
    }

    /// <summary>
    /// Get available model tiers and their capabilities
    /// </summary>
    [HttpGet("tiers")]
    public ActionResult<IEnumerable<ModelTierDto>> GetTiers()
    {
        var tiers = new[]
        {
            new ModelTierDto
            {
                Id = "fast",
                Name = "Fast",
                Model = "Claude Haiku",
                Description = "Quick responses for simple tasks",
                CostPer1kTokens = 0.00025m,
                AvgLatencyMs = 500,
                BestFor = new[] { "formatting", "naming", "boilerplate", "comments", "simple-refactor" },
            },
            new ModelTierDto
            {
                Id = "standard",
                Name = "Standard",
                Model = "Claude Sonnet",
                Description = "Balanced quality and speed for general development",
                CostPer1kTokens = 0.003m,
                AvgLatencyMs = 2000,
                BestFor = new[] { "code-generation", "bug-fixing", "testing", "documentation", "api-design" },
            },
            new ModelTierDto
            {
                Id = "premium",
                Name = "Premium",
                Model = "Claude Opus",
                Description = "Highest quality for complex architecture and security",
                CostPer1kTokens = 0.015m,
                AvgLatencyMs = 5000,
                BestFor = new[] { "architecture", "security-review", "complex-refactor", "system-design", "optimization" },
            },
        };
        return Ok(tiers);
    }

    /// <summary>
    /// Get supported task types for routing configuration
    /// </summary>
    [HttpGet("task-types")]
    public ActionResult<IEnumerable<TaskTypeDto>> GetTaskTypes()
    {
        var taskTypes = new[]
        {
            new TaskTypeDto { Id = "formatting", Name = "Code Formatting", DefaultTier = "fast" },
            new TaskTypeDto { Id = "naming", Name = "Variable/Function Naming", DefaultTier = "fast" },
            new TaskTypeDto { Id = "boilerplate", Name = "Boilerplate Generation", DefaultTier = "fast" },
            new TaskTypeDto { Id = "comments", Name = "Code Comments", DefaultTier = "fast" },
            new TaskTypeDto { Id = "simple-refactor", Name = "Simple Refactoring", DefaultTier = "fast" },
            new TaskTypeDto { Id = "code-generation", Name = "Code Generation", DefaultTier = "standard" },
            new TaskTypeDto { Id = "bug-fixing", Name = "Bug Fixing", DefaultTier = "standard" },
            new TaskTypeDto { Id = "testing", Name = "Test Generation", DefaultTier = "standard" },
            new TaskTypeDto { Id = "documentation", Name = "Documentation", DefaultTier = "standard" },
            new TaskTypeDto { Id = "api-design", Name = "API Design", DefaultTier = "standard" },
            new TaskTypeDto { Id = "architecture", Name = "Architecture Design", DefaultTier = "premium" },
            new TaskTypeDto { Id = "security-review", Name = "Security Review", DefaultTier = "premium" },
            new TaskTypeDto { Id = "complex-refactor", Name = "Complex Refactoring", DefaultTier = "premium" },
            new TaskTypeDto { Id = "system-design", Name = "System Design", DefaultTier = "premium" },
            new TaskTypeDto { Id = "optimization", Name = "Performance Optimization", DefaultTier = "premium" },
        };
        return Ok(taskTypes);
    }

    private static ModelRoutingConfigDto ToDto(ModelRoutingConfig config) => new()
    {
        Id = config.Id,
        Enabled = config.Enabled,
        DefaultTier = config.DefaultTier,
        TaskRoutingJson = config.TaskRoutingJson,
        MonthlyBudget = config.MonthlyBudget,
        CurrentMonthCost = config.CurrentMonthCost,
        FastTierTokens = config.FastTierTokens,
        StandardTierTokens = config.StandardTierTokens,
        PremiumTierTokens = config.PremiumTierTokens,
        TotalRoutingDecisions = config.TotalRoutingDecisions,
        EstimatedSavings = config.EstimatedSavings,
        CreatedAt = config.CreatedAt,
        UpdatedAt = config.UpdatedAt,
    };
}

public class ModelRoutingConfigDto
{
    public Guid Id { get; set; }
    public bool Enabled { get; set; }
    public string DefaultTier { get; set; } = "";
    public string? TaskRoutingJson { get; set; }
    public decimal MonthlyBudget { get; set; }
    public decimal CurrentMonthCost { get; set; }
    public long FastTierTokens { get; set; }
    public long StandardTierTokens { get; set; }
    public long PremiumTierTokens { get; set; }
    public int TotalRoutingDecisions { get; set; }
    public decimal EstimatedSavings { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateModelRoutingDto
{
    public bool? Enabled { get; set; }
    public string? DefaultTier { get; set; }
    public string? TaskRoutingJson { get; set; }
    public decimal? MonthlyBudget { get; set; }
}

public class RoutingStatsDto
{
    public long FastTierTokens { get; set; }
    public long StandardTierTokens { get; set; }
    public long PremiumTierTokens { get; set; }
    public int TotalRoutingDecisions { get; set; }
    public decimal CurrentMonthCost { get; set; }
    public decimal MonthlyBudget { get; set; }
    public decimal EstimatedSavings { get; set; }
}

public class ModelTierDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Model { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal CostPer1kTokens { get; set; }
    public int AvgLatencyMs { get; set; }
    public string[] BestFor { get; set; } = [];
}

public class TaskTypeDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string DefaultTier { get; set; } = "";
}
