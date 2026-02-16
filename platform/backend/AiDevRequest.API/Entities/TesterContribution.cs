using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class TesterContribution
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TesterProfileId { get; set; }

    [Required]
    [MaxLength(50)]
    public required string Type { get; set; } // feature_review, bug_report, critical_bug_report, test_completion, monthly_bonus

    [Required]
    [MaxLength(2000)]
    public required string Description { get; set; }

    public int PointsAwarded { get; set; }

    public int CreditsAwarded { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
