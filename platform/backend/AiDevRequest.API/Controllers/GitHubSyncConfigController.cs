using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/github-sync")]
public class GitHubSyncConfigController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public GitHubSyncConfigController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "anonymous";

    // GET /api/github-sync/config
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var userId = GetUserId();
        var config = await _db.GitHubSyncConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new GitHubSyncConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId,
            };
            _db.GitHubSyncConfigs.Add(config);
            await _db.SaveChangesAsync();
        }
        return Ok(config);
    }

    // PUT /api/github-sync/config
    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] UpdateGitHubSyncConfigRequest request)
    {
        var userId = GetUserId();
        var config = await _db.GitHubSyncConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return NotFound();

        if (request.GitHubConnected.HasValue) config.GitHubConnected = request.GitHubConnected.Value;
        if (!string.IsNullOrEmpty(request.GitHubUsername)) config.GitHubUsername = request.GitHubUsername;
        if (!string.IsNullOrEmpty(request.DefaultBranch)) config.DefaultBranch = request.DefaultBranch;
        if (request.AutoSync.HasValue) config.AutoSync = request.AutoSync.Value;
        if (request.SyncOnPush.HasValue) config.SyncOnPush = request.SyncOnPush.Value;
        if (request.SyncOnPull.HasValue) config.SyncOnPull = request.SyncOnPull.Value;
        if (!string.IsNullOrEmpty(request.ConflictResolution))
        {
            var validStrategies = new[] { "ai-merge", "manual", "prefer-remote", "prefer-local" };
            if (validStrategies.Contains(request.ConflictResolution.ToLowerInvariant()))
                config.ConflictResolution = request.ConflictResolution.ToLowerInvariant();
        }
        if (request.WebhookEnabled.HasValue) config.WebhookEnabled = request.WebhookEnabled.Value;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(config);
    }

    // GET /api/github-sync/repos
    [HttpGet("repos")]
    public IActionResult ListRepos()
    {
        var repos = new[]
        {
            new { id = "repo-1", name = "ai-dev-request", url = "https://github.com/bradyoo12/ai-dev-request", lastSynced = DateTime.UtcNow.AddHours(-2).ToString("o"), status = "synced", branch = "main", commits = 142 },
            new { id = "repo-2", name = "bradyoo-core", url = "https://github.com/bradyoo12/bradyoo-core", lastSynced = DateTime.UtcNow.AddHours(-5).ToString("o"), status = "synced", branch = "main", commits = 87 },
            new { id = "repo-3", name = "tax-ai", url = "https://github.com/bradyoo12/tax-ai", lastSynced = DateTime.UtcNow.AddDays(-1).ToString("o"), status = "pending", branch = "develop", commits = 54 },
            new { id = "repo-4", name = "e-commerce-generator", url = "https://github.com/bradyoo12/e-commerce-generator", lastSynced = DateTime.UtcNow.AddDays(-3).ToString("o"), status = "conflict", branch = "main", commits = 31 },
            new { id = "repo-5", name = "portfolio-builder", url = "https://github.com/bradyoo12/portfolio-builder", lastSynced = DateTime.UtcNow.AddMinutes(-30).ToString("o"), status = "synced", branch = "main", commits = 18 },
        };
        return Ok(repos);
    }

    // POST /api/github-sync/push
    [HttpPost("push")]
    public async Task<IActionResult> PushToGitHub([FromBody] GitHubSyncActionRequest request)
    {
        var userId = GetUserId();
        var config = await _db.GitHubSyncConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return NotFound("GitHub sync config not found. Call GET /api/github-sync/config first.");

        // Simulate push
        var rng = new Random();
        var filesChanged = rng.Next(1, 15);
        var commitSha = Guid.NewGuid().ToString("N")[..8];

        // Record in history
        var history = JsonSerializer.Deserialize<List<SyncHistoryEntry>>(config.SyncHistoryJson) ?? new();
        history.Insert(0, new SyncHistoryEntry
        {
            Action = "push",
            RepoName = request.RepoName ?? "ai-dev-request",
            CommitSha = commitSha,
            FilesChanged = filesChanged,
            Status = "success",
            Timestamp = DateTime.UtcNow,
        });
        if (history.Count > 50) history = history.Take(50).ToList();

        config.SyncHistoryJson = JsonSerializer.Serialize(history);
        config.TotalPushes++;
        config.TotalMerges++;
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            action = "push",
            repoName = request.RepoName ?? "ai-dev-request",
            commitSha,
            filesChanged,
            branch = config.DefaultBranch,
            message = $"Successfully pushed {filesChanged} files to GitHub",
            timestamp = DateTime.UtcNow,
        });
    }

    // POST /api/github-sync/pull
    [HttpPost("pull")]
    public async Task<IActionResult> PullFromGitHub([FromBody] GitHubSyncActionRequest request)
    {
        var userId = GetUserId();
        var config = await _db.GitHubSyncConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return NotFound("GitHub sync config not found. Call GET /api/github-sync/config first.");

        // Simulate pull
        var rng = new Random();
        var filesChanged = rng.Next(1, 10);
        var commitSha = Guid.NewGuid().ToString("N")[..8];
        var hasConflict = rng.NextDouble() < 0.1; // 10% chance of conflict

        var history = JsonSerializer.Deserialize<List<SyncHistoryEntry>>(config.SyncHistoryJson) ?? new();
        history.Insert(0, new SyncHistoryEntry
        {
            Action = "pull",
            RepoName = request.RepoName ?? "ai-dev-request",
            CommitSha = commitSha,
            FilesChanged = filesChanged,
            Status = hasConflict ? "conflict" : "success",
            Timestamp = DateTime.UtcNow,
        });
        if (history.Count > 50) history = history.Take(50).ToList();

        config.SyncHistoryJson = JsonSerializer.Serialize(history);
        config.TotalPulls++;
        if (hasConflict)
            config.TotalConflicts++;
        else
            config.TotalMerges++;
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = !hasConflict,
            action = "pull",
            repoName = request.RepoName ?? "ai-dev-request",
            commitSha,
            filesChanged,
            branch = config.DefaultBranch,
            hasConflict,
            message = hasConflict
                ? "Pull completed with merge conflicts that need resolution"
                : $"Successfully pulled {filesChanged} files from GitHub",
            timestamp = DateTime.UtcNow,
        });
    }

    // GET /api/github-sync/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var config = await _db.GitHubSyncConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            return Ok(new
            {
                totalPushes = 0,
                totalPulls = 0,
                totalConflicts = 0,
                totalMerges = 0,
                recentActivity = Array.Empty<object>(),
            });
        }

        var history = JsonSerializer.Deserialize<List<SyncHistoryEntry>>(config.SyncHistoryJson) ?? new();

        return Ok(new
        {
            totalPushes = config.TotalPushes,
            totalPulls = config.TotalPulls,
            totalConflicts = config.TotalConflicts,
            totalMerges = config.TotalMerges,
            recentActivity = history.Take(10),
        });
    }
}

public class UpdateGitHubSyncConfigRequest
{
    public bool? GitHubConnected { get; set; }
    public string? GitHubUsername { get; set; }
    public string? DefaultBranch { get; set; }
    public bool? AutoSync { get; set; }
    public bool? SyncOnPush { get; set; }
    public bool? SyncOnPull { get; set; }
    public string? ConflictResolution { get; set; }
    public bool? WebhookEnabled { get; set; }
}

public class GitHubSyncActionRequest
{
    public string? RepoName { get; set; }
}

public class SyncHistoryEntry
{
    public string Action { get; set; } = string.Empty;
    public string RepoName { get; set; } = string.Empty;
    public string CommitSha { get; set; } = string.Empty;
    public int FilesChanged { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
