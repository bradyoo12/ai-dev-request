using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/bidir-sync")]
[Authorize]
public class BidirectionalGitSyncController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public BidirectionalGitSyncController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create sync config for a project
    /// </summary>
    [HttpGet("config/{projectId:int}")]
    public async Task<ActionResult<BidirectionalGitSyncDto>> GetConfig(int projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.BidirectionalGitSyncs
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (config == null)
        {
            config = new BidirectionalGitSync
            {
                UserId = userId,
                DevRequestId = projectId,
                ProjectName = $"project-{projectId}",
            };
            _db.BidirectionalGitSyncs.Add(config);
            await _db.SaveChangesAsync();
        }

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Update sync settings for a project
    /// </summary>
    [HttpPut("config/{projectId:int}")]
    public async Task<ActionResult<BidirectionalGitSyncDto>> UpdateConfig(int projectId, [FromBody] UpdateBidirSyncDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.BidirectionalGitSyncs
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (config == null)
        {
            config = new BidirectionalGitSync
            {
                UserId = userId,
                DevRequestId = projectId,
                ProjectName = $"project-{projectId}",
            };
            _db.BidirectionalGitSyncs.Add(config);
        }

        if (dto.RepoOwner != null) config.RepoOwner = dto.RepoOwner;
        if (dto.RepoName != null) config.RepoName = dto.RepoName;
        if (dto.DefaultBranch != null) config.DefaultBranch = dto.DefaultBranch;
        if (dto.AiBranch != null) config.AiBranch = dto.AiBranch;
        if (dto.SyncEnabled.HasValue) config.SyncEnabled = dto.SyncEnabled.Value;
        if (dto.AutoPushEnabled.HasValue) config.AutoPushEnabled = dto.AutoPushEnabled.Value;
        if (dto.AutoPullEnabled.HasValue) config.AutoPullEnabled = dto.AutoPullEnabled.Value;
        if (dto.WebhookEnabled.HasValue) config.WebhookEnabled = dto.WebhookEnabled.Value;

        // If repo is connected, mark as synced
        if (!string.IsNullOrEmpty(config.RepoOwner) && !string.IsNullOrEmpty(config.RepoName)
            && config.Status == "disconnected")
        {
            config.Status = "synced";
            config.LastSyncAt = DateTime.UtcNow;
        }

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Push project to GitHub (simulated)
    /// </summary>
    [HttpPost("push")]
    public async Task<ActionResult<BidirPushResultDto>> Push([FromBody] BidirPushRequestDto request)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.BidirectionalGitSyncs
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == request.ProjectId);

        if (config == null) return NotFound(new { error = "Sync config not found. Connect a repository first." });
        if (string.IsNullOrEmpty(config.RepoOwner) || string.IsNullOrEmpty(config.RepoName))
            return BadRequest(new { error = "Repository not connected." });

        // Simulated push
        var commitSha = Guid.NewGuid().ToString("N")[..8];
        var filesCount = new Random().Next(3, 15);

        config.LastPushAt = DateTime.UtcNow;
        config.LastSyncAt = DateTime.UtcNow;
        config.TotalPushes++;
        config.Status = "synced";
        config.AheadCount = 0;

        // Add to history
        var history = ParseHistory(config.SyncHistoryJson);
        history.Insert(0, new SyncHistoryEntry
        {
            Operation = "push",
            Timestamp = DateTime.UtcNow.ToString("o"),
            Files = filesCount,
            Status = "success",
            CommitSha = commitSha,
        });
        if (history.Count > 50) history = history.Take(50).ToList();
        config.SyncHistoryJson = JsonSerializer.Serialize(history);

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new BidirPushResultDto
        {
            CommitSha = commitSha,
            RepoUrl = $"https://github.com/{config.RepoOwner}/{config.RepoName}",
            FilesCount = filesCount,
            Branch = config.AiBranch,
            PushedAt = config.LastPushAt.Value,
        });
    }

    /// <summary>
    /// Pull changes from GitHub (simulated)
    /// </summary>
    [HttpPost("pull")]
    public async Task<ActionResult<BidirPullResultDto>> Pull([FromBody] BidirPullRequestDto request)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.BidirectionalGitSyncs
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == request.ProjectId);

        if (config == null) return NotFound(new { error = "Sync config not found. Connect a repository first." });
        if (string.IsNullOrEmpty(config.RepoOwner) || string.IsNullOrEmpty(config.RepoName))
            return BadRequest(new { error = "Repository not connected." });

        // Simulated pull
        var changedFiles = new[]
        {
            "src/components/Header.tsx",
            "src/utils/helpers.ts",
            "package.json",
            "README.md",
            "src/styles/main.css",
        }.Take(new Random().Next(2, 6)).ToArray();

        var hasConflicts = new Random().NextDouble() < 0.2;
        var conflictFiles = hasConflicts ? new[] { changedFiles[0] } : Array.Empty<string>();

        config.LastPullAt = DateTime.UtcNow;
        config.LastSyncAt = DateTime.UtcNow;
        config.TotalPulls++;
        config.BehindCount = 0;
        config.ChangedFilesCount = changedFiles.Length;

        if (hasConflicts)
        {
            config.Status = "diverged";
            config.TotalConflicts++;
            config.ConflictFilesJson = JsonSerializer.Serialize(conflictFiles);
        }
        else
        {
            config.Status = "synced";
            config.ConflictFilesJson = "[]";
        }

        // Add to history
        var history = ParseHistory(config.SyncHistoryJson);
        history.Insert(0, new SyncHistoryEntry
        {
            Operation = "pull",
            Timestamp = DateTime.UtcNow.ToString("o"),
            Files = changedFiles.Length,
            Status = hasConflicts ? "conflict" : "success",
            CommitSha = Guid.NewGuid().ToString("N")[..8],
        });
        if (history.Count > 50) history = history.Take(50).ToList();
        config.SyncHistoryJson = JsonSerializer.Serialize(history);

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new BidirPullResultDto
        {
            ChangedFiles = changedFiles,
            ConflictFiles = conflictFiles,
            HasConflicts = hasConflicts,
            PulledAt = config.LastPullAt.Value,
        });
    }

    /// <summary>
    /// Get sync status for a project
    /// </summary>
    [HttpGet("status/{projectId:int}")]
    public async Task<ActionResult<BidirectionalGitSyncDto>> GetStatus(int projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.BidirectionalGitSyncs
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (config == null) return NotFound(new { error = "Sync config not found." });

        // Simulate status drift
        if (config.Status == "synced" && config.LastSyncAt.HasValue)
        {
            var elapsed = DateTime.UtcNow - config.LastSyncAt.Value;
            if (elapsed.TotalMinutes > 5)
            {
                var rand = new Random();
                var roll = rand.NextDouble();
                if (roll < 0.3)
                {
                    config.AheadCount = rand.Next(1, 5);
                    config.Status = "ahead";
                }
                else if (roll < 0.6)
                {
                    config.BehindCount = rand.Next(1, 8);
                    config.Status = "behind";
                }
                config.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        return Ok(ToDto(config));
    }

    /// <summary>
    /// Get sync operation history for a project
    /// </summary>
    [HttpGet("history/{projectId:int}")]
    public async Task<ActionResult<IEnumerable<SyncHistoryEntryDto>>> GetHistory(int projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var config = await _db.BidirectionalGitSyncs
            .FirstOrDefaultAsync(s => s.UserId == userId && s.DevRequestId == projectId);

        if (config == null) return Ok(Array.Empty<SyncHistoryEntryDto>());

        var history = ParseHistory(config.SyncHistoryJson);
        return Ok(history.Select(h => new SyncHistoryEntryDto
        {
            Operation = h.Operation,
            Timestamp = h.Timestamp,
            Files = h.Files,
            Status = h.Status,
            CommitSha = h.CommitSha,
        }));
    }

    /// <summary>
    /// Get aggregate sync stats
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<BidirSyncStatsDto>> GetStats()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var configs = await _db.BidirectionalGitSyncs
            .Where(s => s.UserId == userId)
            .ToListAsync();

        return Ok(new BidirSyncStatsDto
        {
            TotalSyncs = configs.Sum(c => c.TotalPushes + c.TotalPulls),
            TotalPushes = configs.Sum(c => c.TotalPushes),
            TotalPulls = configs.Sum(c => c.TotalPulls),
            TotalConflicts = configs.Sum(c => c.TotalConflicts),
            ConflictsResolved = configs.Sum(c => c.ConflictsResolved),
            ConnectedRepos = configs.Count(c => c.Status != "disconnected"),
            Status = configs.Any(c => c.Status == "diverged") ? "diverged"
                : configs.Any(c => c.Status == "behind") ? "behind"
                : configs.Any(c => c.Status == "ahead") ? "ahead"
                : "synced",
        });
    }

    private static List<SyncHistoryEntry> ParseHistory(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new List<SyncHistoryEntry>();
        try
        {
            return JsonSerializer.Deserialize<List<SyncHistoryEntry>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<SyncHistoryEntry>();
        }
        catch
        {
            return new List<SyncHistoryEntry>();
        }
    }

    private static BidirectionalGitSyncDto ToDto(BidirectionalGitSync s) => new()
    {
        Id = s.Id,
        UserId = s.UserId,
        DevRequestId = s.DevRequestId,
        ProjectName = s.ProjectName,
        RepoOwner = s.RepoOwner,
        RepoName = s.RepoName,
        DefaultBranch = s.DefaultBranch,
        AiBranch = s.AiBranch,
        SyncEnabled = s.SyncEnabled,
        AutoPushEnabled = s.AutoPushEnabled,
        AutoPullEnabled = s.AutoPullEnabled,
        WebhookEnabled = s.WebhookEnabled,
        Status = s.Status,
        LastPushAt = s.LastPushAt,
        LastPullAt = s.LastPullAt,
        LastSyncAt = s.LastSyncAt,
        TotalPushes = s.TotalPushes,
        TotalPulls = s.TotalPulls,
        TotalConflicts = s.TotalConflicts,
        ConflictsResolved = s.ConflictsResolved,
        AheadCount = s.AheadCount,
        BehindCount = s.BehindCount,
        ChangedFilesCount = s.ChangedFilesCount,
        ConflictFiles = ParseConflictFiles(s.ConflictFilesJson),
        WebhookUrl = s.WebhookUrl,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
    };

    private static string[] ParseConflictFiles(string? json)
    {
        if (string.IsNullOrEmpty(json)) return Array.Empty<string>();
        try
        {
            return JsonSerializer.Deserialize<string[]>(json) ?? Array.Empty<string>();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }
}

// === Internal model ===
internal class SyncHistoryEntry
{
    public string Operation { get; set; } = "";
    public string Timestamp { get; set; } = "";
    public int Files { get; set; }
    public string Status { get; set; } = "";
    public string CommitSha { get; set; } = "";
}

// === DTOs ===

public class BidirectionalGitSyncDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = "";
    public int DevRequestId { get; set; }
    public string ProjectName { get; set; } = "";
    public string RepoOwner { get; set; } = "";
    public string RepoName { get; set; } = "";
    public string DefaultBranch { get; set; } = "";
    public string AiBranch { get; set; } = "";
    public bool SyncEnabled { get; set; }
    public bool AutoPushEnabled { get; set; }
    public bool AutoPullEnabled { get; set; }
    public bool WebhookEnabled { get; set; }
    public string Status { get; set; } = "";
    public DateTime? LastPushAt { get; set; }
    public DateTime? LastPullAt { get; set; }
    public DateTime? LastSyncAt { get; set; }
    public int TotalPushes { get; set; }
    public int TotalPulls { get; set; }
    public int TotalConflicts { get; set; }
    public int ConflictsResolved { get; set; }
    public int AheadCount { get; set; }
    public int BehindCount { get; set; }
    public int ChangedFilesCount { get; set; }
    public string[] ConflictFiles { get; set; } = [];
    public string? WebhookUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateBidirSyncDto
{
    public string? RepoOwner { get; set; }
    public string? RepoName { get; set; }
    public string? DefaultBranch { get; set; }
    public string? AiBranch { get; set; }
    public bool? SyncEnabled { get; set; }
    public bool? AutoPushEnabled { get; set; }
    public bool? AutoPullEnabled { get; set; }
    public bool? WebhookEnabled { get; set; }
}

public class BidirPushRequestDto
{
    public int ProjectId { get; set; }
}

public class BidirPushResultDto
{
    public string CommitSha { get; set; } = "";
    public string RepoUrl { get; set; } = "";
    public int FilesCount { get; set; }
    public string Branch { get; set; } = "";
    public DateTime PushedAt { get; set; }
}

public class BidirPullRequestDto
{
    public int ProjectId { get; set; }
}

public class BidirPullResultDto
{
    public string[] ChangedFiles { get; set; } = [];
    public string[] ConflictFiles { get; set; } = [];
    public bool HasConflicts { get; set; }
    public DateTime PulledAt { get; set; }
}

public class SyncHistoryEntryDto
{
    public string Operation { get; set; } = "";
    public string Timestamp { get; set; } = "";
    public int Files { get; set; }
    public string Status { get; set; } = "";
    public string CommitSha { get; set; } = "";
}

public class BidirSyncStatsDto
{
    public int TotalSyncs { get; set; }
    public int TotalPushes { get; set; }
    public int TotalPulls { get; set; }
    public int TotalConflicts { get; set; }
    public int ConflictsResolved { get; set; }
    public int ConnectedRepos { get; set; }
    public string Status { get; set; } = "";
}
