using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Suggestion
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Title { get; set; }

    [Required]
    [MaxLength(5000)]
    public required string Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = "feature_request"; // feature_request, inquiry, bug_report, improvement

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, reviewing, in_progress, approved, implemented, resolved, on_hold, closed

    public int UpvoteCount { get; set; } = 0;

    public int CommentCount { get; set; } = 0;

    public int TokenReward { get; set; } = 0;

    public Guid? DevRequestId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class SuggestionVote
{
    public int Id { get; set; }

    public int SuggestionId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public bool IsUpvote { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class SuggestionComment
{
    public int Id { get; set; }

    public int SuggestionId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(5000)]
    public required string Content { get; set; }

    public bool IsAdminReply { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class SuggestionStatusHistory
{
    public int Id { get; set; }

    public int SuggestionId { get; set; }

    [Required]
    [MaxLength(50)]
    public required string FromStatus { get; set; }

    [Required]
    [MaxLength(50)]
    public required string ToStatus { get; set; }

    [Required]
    [MaxLength(100)]
    public required string ChangedByUserId { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
