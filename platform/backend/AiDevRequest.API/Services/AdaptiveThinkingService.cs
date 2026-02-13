using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

/// <summary>
/// Defines the effort levels for adaptive thinking.
/// Maps to Claude API thinking: {type: "adaptive", effort: "low" | "medium" | "high"}
/// </summary>
public enum ThinkingEffort
{
    Low,
    Medium,
    High
}

/// <summary>
/// Categorises the type of AI task for adaptive thinking effort selection.
/// </summary>
public enum AdaptiveTaskType
{
    /// <summary>Simple scaffolding and boilerplate — low effort is sufficient.</summary>
    Scaffold,

    /// <summary>Complex architecture analysis — high effort for accuracy.</summary>
    Analyze,

    /// <summary>Code review and quality checks — medium effort.</summary>
    Review,

    /// <summary>Standard code generation — medium effort.</summary>
    Generate
}

/// <summary>
/// Manages adaptive thinking configuration per task type.
/// Determines the appropriate thinking effort level for each AI request.
/// </summary>
public interface IAdaptiveThinkingService
{
    /// <summary>
    /// Returns the recommended thinking effort for a given task type and user.
    /// </summary>
    Task<ThinkingEffort> GetEffortForTaskAsync(string userId, AdaptiveTaskType taskType);

    /// <summary>
    /// Returns the effort level string for the Claude API ("low", "medium", "high").
    /// </summary>
    string GetEffortString(ThinkingEffort effort);

    /// <summary>
    /// Returns the default effort level for a task type (no user override).
    /// </summary>
    ThinkingEffort GetDefaultEffort(AdaptiveTaskType taskType);

    /// <summary>
    /// Estimates cost savings from using adaptive thinking vs always-high effort.
    /// Returns estimated percentage savings (0-100).
    /// </summary>
    decimal EstimateCostSavingsPercent(AdaptiveThinkingConfig config);
}

/// <summary>
/// Default implementation of <see cref="IAdaptiveThinkingService"/>.
/// Maps task types to thinking effort levels based on user configuration.
/// </summary>
public class AdaptiveThinkingService : IAdaptiveThinkingService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<AdaptiveThinkingService> _logger;

    public AdaptiveThinkingService(
        AiDevRequestDbContext db,
        ILogger<AdaptiveThinkingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ThinkingEffort> GetEffortForTaskAsync(string userId, AdaptiveTaskType taskType)
    {
        var config = await _db.AdaptiveThinkingConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (config == null || !config.Enabled)
        {
            _logger.LogDebug("No adaptive thinking config for user {UserId}, using defaults", userId);
            return GetDefaultEffort(taskType);
        }

        var effortStr = taskType switch
        {
            AdaptiveTaskType.Scaffold => config.ScaffoldEffort,
            AdaptiveTaskType.Analyze => config.AnalyzeEffort,
            AdaptiveTaskType.Review => config.ReviewEffort,
            AdaptiveTaskType.Generate => config.GenerateEffort,
            _ => "medium"
        };

        var effort = ParseEffort(effortStr);
        _logger.LogDebug("Adaptive thinking: {TaskType} -> {Effort} for user {UserId}", taskType, effort, userId);
        return effort;
    }

    /// <inheritdoc />
    public string GetEffortString(ThinkingEffort effort)
    {
        return effort switch
        {
            ThinkingEffort.Low => "low",
            ThinkingEffort.Medium => "medium",
            ThinkingEffort.High => "high",
            _ => "medium"
        };
    }

    /// <inheritdoc />
    public ThinkingEffort GetDefaultEffort(AdaptiveTaskType taskType)
    {
        return taskType switch
        {
            AdaptiveTaskType.Scaffold => ThinkingEffort.Low,
            AdaptiveTaskType.Analyze => ThinkingEffort.High,
            AdaptiveTaskType.Review => ThinkingEffort.Medium,
            AdaptiveTaskType.Generate => ThinkingEffort.Medium,
            _ => ThinkingEffort.Medium
        };
    }

    /// <inheritdoc />
    public decimal EstimateCostSavingsPercent(AdaptiveThinkingConfig config)
    {
        var totalRequests = config.TotalLowEffortRequests + config.TotalMediumEffortRequests + config.TotalHighEffortRequests;
        if (totalRequests == 0) return 0;

        // Cost weights: low = 0.3x, medium = 0.6x, high = 1.0x
        var actualCostWeight =
            config.TotalLowEffortRequests * 0.3m +
            config.TotalMediumEffortRequests * 0.6m +
            config.TotalHighEffortRequests * 1.0m;

        var allHighCostWeight = totalRequests * 1.0m;

        if (allHighCostWeight == 0) return 0;
        return Math.Round((1 - actualCostWeight / allHighCostWeight) * 100, 1);
    }

    private static ThinkingEffort ParseEffort(string effort)
    {
        return effort.ToLowerInvariant() switch
        {
            "low" => ThinkingEffort.Low,
            "medium" => ThinkingEffort.Medium,
            "high" => ThinkingEffort.High,
            _ => ThinkingEffort.Medium
        };
    }
}
