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
    public string Status { get; set; } = "pending"; // pending, approved, implemented, closed

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
