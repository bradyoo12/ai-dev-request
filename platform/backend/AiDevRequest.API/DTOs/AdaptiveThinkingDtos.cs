namespace AiDevRequest.API.DTOs;

/// <summary>
/// Adaptive thinking effort levels for Claude AI models.
/// Maps to Anthropic SDK adaptive thinking parameters.
/// </summary>
public enum ThinkingEffortLevel
{
    /// <summary>
    /// Low effort - Quick, straightforward tasks (e.g., scaffolding, simple code generation)
    /// </summary>
    Low = 0,

    /// <summary>
    /// Medium effort - Moderate complexity tasks (e.g., proposals, feature implementation)
    /// </summary>
    Medium = 1,

    /// <summary>
    /// High effort - Complex reasoning tasks (e.g., analysis, code review, architecture)
    /// </summary>
    High = 2
}

/// <summary>
/// Configuration mapping task types to their recommended effort levels.
/// </summary>
public class TaskTypeEffortConfig
{
    /// <summary>
    /// Task type identifier: "analysis", "proposal", "production", "code_review", "test_generation"
    /// </summary>
    public required string TaskType { get; set; }

    /// <summary>
    /// Recommended effort level for this task type
    /// </summary>
    public ThinkingEffortLevel EffortLevel { get; set; }

    /// <summary>
    /// Human-readable description of why this effort level is appropriate
    /// </summary>
    public string? Description { get; set; }
}

/// <summary>
/// DTO for returning effort level configuration to API clients.
/// </summary>
public record EffortLevelConfigDto
{
    /// <summary>
    /// Collection of task type to effort level mappings
    /// </summary>
    public required List<TaskTypeEffortConfig> TaskConfigs { get; init; }

    /// <summary>
    /// Whether structured outputs are enabled globally
    /// </summary>
    public bool StructuredOutputsEnabled { get; init; }

    /// <summary>
    /// Last updated timestamp
    /// </summary>
    public DateTime UpdatedAt { get; init; }
}

/// <summary>
/// DTO for updating effort level configuration.
/// </summary>
public record UpdateEffortLevelConfigDto
{
    /// <summary>
    /// Collection of task type to effort level mappings to update
    /// </summary>
    public required List<TaskTypeEffortConfig> TaskConfigs { get; init; }

    /// <summary>
    /// Whether to enable or disable structured outputs globally
    /// </summary>
    public bool? StructuredOutputsEnabled { get; init; }
}
