using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Referral
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string ReferrerId { get; set; }

    [MaxLength(100)]
    public string? ReferredUserId { get; set; }

    [Required]
    [MaxLength(50)]
    public required string ReferralCode { get; set; }

    public ReferralStatus Status { get; set; } = ReferralStatus.Pending;

    public int SignupCreditAmount { get; set; } = 50;

    public decimal PaymentBonusPercent { get; set; } = 10m;

    public int TotalCreditsEarned { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? SignedUpAt { get; set; }

    public DateTime? ConvertedAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum ReferralStatus
{
    Pending,
    SignedUp,
    Converted
}
