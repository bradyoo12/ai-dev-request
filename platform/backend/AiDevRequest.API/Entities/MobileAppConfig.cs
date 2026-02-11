using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class MobileAppConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public Guid DevRequestId { get; set; }

    [MaxLength(200)]
    public string AppName { get; set; } = "";

    [MaxLength(100)]
    public string BundleId { get; set; } = "";

    [MaxLength(20)]
    public string Platform { get; set; } = "both";

    [MaxLength(20)]
    public string Framework { get; set; } = "react-native";

    [MaxLength(20)]
    public string Status { get; set; } = "draft";

    [MaxLength(500)]
    public string? AppDescription { get; set; }

    [MaxLength(20)]
    public string AppVersion { get; set; } = "1.0.0";

    public int BuildNumber { get; set; } = 1;

    [MaxLength(500)]
    public string? IconUrl { get; set; }

    [MaxLength(500)]
    public string? SplashScreenUrl { get; set; }

    public bool ExpoEnabled { get; set; } = true;

    [MaxLength(500)]
    public string? ExpoQrCodeUrl { get; set; }

    [MaxLength(500)]
    public string? PreviewUrl { get; set; }

    public bool IosEnabled { get; set; } = true;

    public bool AndroidEnabled { get; set; } = true;

    [MaxLength(20)]
    public string? IosBuildStatus { get; set; }

    [MaxLength(20)]
    public string? AndroidBuildStatus { get; set; }

    [MaxLength(20)]
    public string? IosPublishStatus { get; set; }

    [MaxLength(20)]
    public string? AndroidPublishStatus { get; set; }

    public int TotalScreens { get; set; } = 0;

    public int TotalComponents { get; set; } = 0;

    public string? NavigationStructureJson { get; set; }

    public string? ScreenListJson { get; set; }

    public string? BuildHistoryJson { get; set; }

    public string? PublishHistoryJson { get; set; }

    public DateTime? LastBuildAt { get; set; }

    public DateTime? LastPublishAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
