using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class SupportPost
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Title { get; set; }

    [Required]
    [MaxLength(10000)]
    public required string Content { get; set; }

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = "inquiry"; // complaint, request, inquiry, other

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "open"; // open, in_review, resolved, closed

    public decimal? RewardCredit { get; set; }

    [MaxLength(100)]
    public string? RewardedByUserId { get; set; }

    public DateTime? RewardedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
