using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/mobile-app")]
[Authorize]
public class MobileAppController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public MobileAppController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException();

    [HttpGet("config/{projectId}")]
    public async Task<IActionResult> GetConfig(Guid projectId)
    {
        var userId = GetUserId();
        var config = await _db.MobileAppConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId && c.DevRequestId == projectId);

        if (config == null)
        {
            config = new MobileAppConfig
            {
                UserId = userId,
                DevRequestId = projectId,
                AppName = "My App",
                BundleId = $"com.aidevrequest.{projectId.ToString()[..8]}"
            };
            _db.MobileAppConfigs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(config));
    }

    [HttpPut("config/{projectId}")]
    public async Task<IActionResult> UpdateConfig(Guid projectId, [FromBody] UpdateMobileAppDto dto)
    {
        var userId = GetUserId();
        var config = await _db.MobileAppConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId && c.DevRequestId == projectId);

        if (config == null) return NotFound();

        if (dto.AppName != null) config.AppName = dto.AppName;
        if (dto.BundleId != null) config.BundleId = dto.BundleId;
        if (dto.Platform != null) config.Platform = dto.Platform;
        if (dto.AppDescription != null) config.AppDescription = dto.AppDescription;
        if (dto.AppVersion != null) config.AppVersion = dto.AppVersion;
        if (dto.IosEnabled.HasValue) config.IosEnabled = dto.IosEnabled.Value;
        if (dto.AndroidEnabled.HasValue) config.AndroidEnabled = dto.AndroidEnabled.Value;
        if (dto.ExpoEnabled.HasValue) config.ExpoEnabled = dto.ExpoEnabled.Value;
        config.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("build")]
    public async Task<IActionResult> TriggerBuild([FromBody] TriggerBuildDto dto)
    {
        var userId = GetUserId();
        var config = await _db.MobileAppConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId && c.DevRequestId == dto.ProjectId);

        if (config == null) return NotFound();

        config.BuildNumber++;
        config.LastBuildAt = DateTime.UtcNow;

        if (dto.Platform == "ios" || dto.Platform == "both")
            config.IosBuildStatus = "building";
        if (dto.Platform == "android" || dto.Platform == "both")
            config.AndroidBuildStatus = "building";

        var history = string.IsNullOrEmpty(config.BuildHistoryJson)
            ? new List<BuildRecord>()
            : JsonSerializer.Deserialize<List<BuildRecord>>(config.BuildHistoryJson) ?? new List<BuildRecord>();

        history.Add(new BuildRecord
        {
            BuildNumber = config.BuildNumber,
            Platform = dto.Platform,
            Status = "building",
            StartedAt = DateTime.UtcNow
        });

        if (history.Count > 50) history = history.Skip(history.Count - 50).ToList();
        config.BuildHistoryJson = JsonSerializer.Serialize(history);

        config.IosBuildStatus = "success";
        config.AndroidBuildStatus = "success";
        config.Status = "built";
        config.ExpoQrCodeUrl = $"https://expo.dev/@aidevrequest/{config.BundleId}?qr=true";
        config.PreviewUrl = $"https://expo.dev/@aidevrequest/{config.BundleId}";
        config.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new BuildResultDto
        {
            BuildNumber = config.BuildNumber,
            IosBuildStatus = config.IosBuildStatus,
            AndroidBuildStatus = config.AndroidBuildStatus,
            ExpoQrCodeUrl = config.ExpoQrCodeUrl,
            PreviewUrl = config.PreviewUrl
        });
    }

    [HttpPost("publish")]
    public async Task<IActionResult> Publish([FromBody] PublishDto dto)
    {
        var userId = GetUserId();
        var config = await _db.MobileAppConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId && c.DevRequestId == dto.ProjectId);

        if (config == null) return NotFound();

        if (dto.Store == "ios" || dto.Store == "both")
            config.IosPublishStatus = "submitted";
        if (dto.Store == "android" || dto.Store == "both")
            config.AndroidPublishStatus = "submitted";

        config.LastPublishAt = DateTime.UtcNow;

        var history = string.IsNullOrEmpty(config.PublishHistoryJson)
            ? new List<PublishRecord>()
            : JsonSerializer.Deserialize<List<PublishRecord>>(config.PublishHistoryJson) ?? new List<PublishRecord>();

        history.Add(new PublishRecord
        {
            Store = dto.Store,
            Version = config.AppVersion,
            BuildNumber = config.BuildNumber,
            Status = "submitted",
            SubmittedAt = DateTime.UtcNow
        });

        if (history.Count > 50) history = history.Skip(history.Count - 50).ToList();
        config.PublishHistoryJson = JsonSerializer.Serialize(history);
        config.Status = "published";
        config.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { success = true, store = dto.Store, status = "submitted" });
    }

    [HttpGet("screens/{projectId}")]
    public async Task<IActionResult> GetScreens(Guid projectId)
    {
        var userId = GetUserId();
        var config = await _db.MobileAppConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId && c.DevRequestId == projectId);

        if (config == null)
            return Ok(new { screens = Array.Empty<object>(), navigation = new object() });

        var screens = string.IsNullOrEmpty(config.ScreenListJson)
            ? new List<ScreenRecord>()
            : JsonSerializer.Deserialize<List<ScreenRecord>>(config.ScreenListJson) ?? new List<ScreenRecord>();

        return Ok(new { screens, totalScreens = config.TotalScreens, totalComponents = config.TotalComponents });
    }

    [HttpGet("builds/{projectId}")]
    public async Task<IActionResult> GetBuilds(Guid projectId)
    {
        var userId = GetUserId();
        var config = await _db.MobileAppConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId && c.DevRequestId == projectId);

        if (config == null)
            return Ok(new { builds = Array.Empty<object>() });

        var builds = string.IsNullOrEmpty(config.BuildHistoryJson)
            ? new List<BuildRecord>()
            : JsonSerializer.Deserialize<List<BuildRecord>>(config.BuildHistoryJson) ?? new List<BuildRecord>();

        return Ok(new { builds });
    }

    private static MobileAppDto ToDto(MobileAppConfig c) => new()
    {
        Id = c.Id,
        DevRequestId = c.DevRequestId,
        AppName = c.AppName,
        BundleId = c.BundleId,
        Platform = c.Platform,
        Framework = c.Framework,
        Status = c.Status,
        AppDescription = c.AppDescription,
        AppVersion = c.AppVersion,
        BuildNumber = c.BuildNumber,
        IconUrl = c.IconUrl,
        ExpoEnabled = c.ExpoEnabled,
        ExpoQrCodeUrl = c.ExpoQrCodeUrl,
        PreviewUrl = c.PreviewUrl,
        IosEnabled = c.IosEnabled,
        AndroidEnabled = c.AndroidEnabled,
        IosBuildStatus = c.IosBuildStatus,
        AndroidBuildStatus = c.AndroidBuildStatus,
        IosPublishStatus = c.IosPublishStatus,
        AndroidPublishStatus = c.AndroidPublishStatus,
        TotalScreens = c.TotalScreens,
        TotalComponents = c.TotalComponents,
        LastBuildAt = c.LastBuildAt,
        LastPublishAt = c.LastPublishAt,
        CreatedAt = c.CreatedAt
    };
}

public record MobileAppDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string AppName { get; init; } = "";
    public string BundleId { get; init; } = "";
    public string Platform { get; init; } = "";
    public string Framework { get; init; } = "";
    public string Status { get; init; } = "";
    public string? AppDescription { get; init; }
    public string AppVersion { get; init; } = "";
    public int BuildNumber { get; init; }
    public string? IconUrl { get; init; }
    public bool ExpoEnabled { get; init; }
    public string? ExpoQrCodeUrl { get; init; }
    public string? PreviewUrl { get; init; }
    public bool IosEnabled { get; init; }
    public bool AndroidEnabled { get; init; }
    public string? IosBuildStatus { get; init; }
    public string? AndroidBuildStatus { get; init; }
    public string? IosPublishStatus { get; init; }
    public string? AndroidPublishStatus { get; init; }
    public int TotalScreens { get; init; }
    public int TotalComponents { get; init; }
    public DateTime? LastBuildAt { get; init; }
    public DateTime? LastPublishAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record UpdateMobileAppDto
{
    public string? AppName { get; init; }
    public string? BundleId { get; init; }
    public string? Platform { get; init; }
    public string? AppDescription { get; init; }
    public string? AppVersion { get; init; }
    public bool? IosEnabled { get; init; }
    public bool? AndroidEnabled { get; init; }
    public bool? ExpoEnabled { get; init; }
}

public record TriggerBuildDto
{
    public Guid ProjectId { get; init; }
    public string Platform { get; init; } = "both";
}

public record PublishDto
{
    public Guid ProjectId { get; init; }
    public string Store { get; init; } = "both";
}

public record BuildResultDto
{
    public int BuildNumber { get; init; }
    public string? IosBuildStatus { get; init; }
    public string? AndroidBuildStatus { get; init; }
    public string? ExpoQrCodeUrl { get; init; }
    public string? PreviewUrl { get; init; }
}

public class BuildRecord
{
    public int BuildNumber { get; set; }
    public string Platform { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class PublishRecord
{
    public string Store { get; set; } = "";
    public string Version { get; set; } = "";
    public int BuildNumber { get; set; }
    public string Status { get; set; } = "";
    public DateTime SubmittedAt { get; set; }
}

public class ScreenRecord
{
    public string Name { get; set; } = "";
    public string Route { get; set; } = "";
    public string Type { get; set; } = "";
    public int ComponentCount { get; set; }
}
