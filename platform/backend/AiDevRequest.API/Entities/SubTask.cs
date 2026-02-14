using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class SubTask
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    [Required]
    [MaxLength(500)]
    public required string Title { get; set; }

    [MaxLength(5000)]
    public string? Description { get; set; }

    public SubTaskStatus Status { get; set; } = SubTaskStatus.Pending;

    public int Order { get; set; }

    public int? EstimatedCredits { get; set; }

    public Guid? DependsOnSubTaskId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public DevRequest? DevRequest { get; set; }
    public SubTask? DependsOnSubTask { get; set; }
    public ICollection<SubTask>? DependentSubTasks { get; set; }
}

public enum SubTaskStatus
{
    Pending,
    Approved,
    Rejected,
    InProgress,
    Completed,
    Cancelled
}
