using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Subtask
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Parent dev request this subtask belongs to.</summary>
    public Guid DevRequestId { get; set; }

    /// <summary>Optional parent subtask for nested subtasks.</summary>
    public Guid? ParentSubtaskId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>Display order within the parent request (0-based).</summary>
    public int OrderIndex { get; set; }

    /// <summary>Priority (0 = highest).</summary>
    public int Priority { get; set; }

    [Required]
    [MaxLength(500)]
    public required string Title { get; set; }

    [MaxLength(5000)]
    public string? Description { get; set; }

    /// <summary>Estimated hours to complete this subtask.</summary>
    public decimal? EstimatedHours { get; set; }

    public SubtaskStatus Status { get; set; } = SubtaskStatus.Pending;

    /// <summary>JSON array of Guid IDs this subtask depends on.</summary>
    [MaxLength(2000)]
    public string? DependsOnSubtaskIdsJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum SubtaskStatus
{
    Pending,        // 대기 중
    Approved,       // 승인됨
    InProgress,     // 진행 중
    Completed,      // 완료
    Blocked         // 차단됨
}
