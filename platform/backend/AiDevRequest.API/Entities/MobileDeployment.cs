using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class MobileDeployment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public Guid DevRequestId { get; set; }

    [MaxLength(50)]
    public string DeploymentType { get; set; } = "testflight";

    [MaxLength(30)]
    public string Status { get; set; } = "pending";

    [MaxLength(200)]
    public string? AppDescription { get; set; }

    public string? GeneratedCodeJson { get; set; }

    public string? ExpoQrCodeUrl { get; set; }

    [MaxLength(500)]
    public string? TestFlightUrl { get; set; }

    [MaxLength(200)]
    public string? AppleBundleId { get; set; }

    [MaxLength(200)]
    public string? AppleTeamId { get; set; }

    [MaxLength(20)]
    public string? AppVersion { get; set; }

    public int? BuildNumber { get; set; }

    public string? BuildLogsJson { get; set; }

    public string? ErrorMessage { get; set; }

    public string? MetadataJson { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
