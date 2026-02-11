using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class DevPipeline
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// JSON array of pipeline step definitions
    /// </summary>
    [Required]
    public required string StepsJson { get; set; }

    public PipelineStatus Status { get; set; } = PipelineStatus.Draft;

    public bool IsTemplate { get; set; } = false;

    [MaxLength(50)]
    public string? TemplateCategory { get; set; }

    public int ExecutionCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum PipelineStatus
{
    Draft,
    Active,
    Archived
}
