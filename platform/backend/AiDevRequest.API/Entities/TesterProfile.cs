using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class TesterProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Tier { get; set; } = "Bronze"; // Bronze, Silver, Gold

    public int ContributionPoints { get; set; } = 0;

    public int TotalCreditsEarned { get; set; } = 0;

    public int BugsFound { get; set; } = 0;

    public int ReviewsWritten { get; set; } = 0;

    public int TestsCompleted { get; set; } = 0;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
