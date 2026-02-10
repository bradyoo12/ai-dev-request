using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IGitHubSyncService
{
    Task<GitHubSync> ConnectRepoAsync(int projectId, string repoOwner, string repoName);
    Task DisconnectRepoAsync(int projectId);
    Task<GitHubSync> PushToRepoAsync(int projectId);
    Task<GitHubSync> PullFromRepoAsync(int projectId);
    Task<GitHubSync?> GetSyncStatusAsync(int projectId);
    Task<GitHubSync> ResolveConflictsAsync(int projectId, string resolution);
    Task HandleWebhookAsync(string payload, string signature);
    Task<List<SyncHistoryEntry>> GetSyncHistoryAsync(int projectId);
}

public class SyncHistoryEntry
{
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? CommitSha { get; set; }
    public DateTime Timestamp { get; set; }
    public string? Details { get; set; }
}

public class GitHubSyncService : IGitHubSyncService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<GitHubSyncService> _logger;

    public GitHubSyncService(AiDevRequestDbContext context, ILogger<GitHubSyncService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<GitHubSync> ConnectRepoAsync(int projectId, string repoOwner, string repoName)
    {
        var existing = await _context.GitHubSyncs
            .FirstOrDefaultAsync(s => s.ProjectId == projectId);

        if (existing != null)
            throw new InvalidOperationException("Project is already connected to a GitHub repository.");

        var webhookSecret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

        var sync = new GitHubSync
        {
            ProjectId = projectId,
            GitHubRepoOwner = repoOwner,
            GitHubRepoName = repoName,
            GitHubRepoUrl = $"https://github.com/{repoOwner}/{repoName}",
            Status = "connected",
            WebhookSecret = webhookSecret,
        };

        _context.GitHubSyncs.Add(sync);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Connected project {ProjectId} to GitHub repo {Owner}/{Repo}",
            projectId, repoOwner, repoName);

        return sync;
    }

    public async Task DisconnectRepoAsync(int projectId)
    {
        var sync = await _context.GitHubSyncs
            .FirstOrDefaultAsync(s => s.ProjectId == projectId)
            ?? throw new InvalidOperationException("No GitHub connection found for this project.");

        _context.GitHubSyncs.Remove(sync);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Disconnected project {ProjectId} from GitHub repo {Owner}/{Repo}",
            projectId, sync.GitHubRepoOwner, sync.GitHubRepoName);
    }

    public async Task<GitHubSync> PushToRepoAsync(int projectId)
    {
        var sync = await _context.GitHubSyncs
            .FirstOrDefaultAsync(s => s.ProjectId == projectId)
            ?? throw new InvalidOperationException("No GitHub connection found for this project.");

        if (sync.Status == "syncing")
            throw new InvalidOperationException("A sync operation is already in progress.");

        sync.Status = "syncing";
        await _context.SaveChangesAsync();

        try
        {
            // Simulate push operation — in production, this would use GitHub API
            var commitSha = Guid.NewGuid().ToString("N")[..8];

            sync.Status = "synced";
            sync.LastSyncCommitSha = commitSha;
            sync.LastPushAt = DateTime.UtcNow;
            sync.LastSyncedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Pushed project {ProjectId} to GitHub, commit {Sha}",
                projectId, commitSha);

            return sync;
        }
        catch (Exception ex)
        {
            sync.Status = "error";
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Push failed for project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<GitHubSync> PullFromRepoAsync(int projectId)
    {
        var sync = await _context.GitHubSyncs
            .FirstOrDefaultAsync(s => s.ProjectId == projectId)
            ?? throw new InvalidOperationException("No GitHub connection found for this project.");

        if (sync.Status == "syncing")
            throw new InvalidOperationException("A sync operation is already in progress.");

        sync.Status = "syncing";
        await _context.SaveChangesAsync();

        try
        {
            // Simulate pull operation — in production, this would use GitHub API
            var commitSha = Guid.NewGuid().ToString("N")[..8];

            sync.Status = "synced";
            sync.LastSyncCommitSha = commitSha;
            sync.LastPullAt = DateTime.UtcNow;
            sync.LastSyncedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Pulled from GitHub for project {ProjectId}, commit {Sha}",
                projectId, commitSha);

            return sync;
        }
        catch (Exception ex)
        {
            sync.Status = "error";
            await _context.SaveChangesAsync();

            _logger.LogError(ex, "Pull failed for project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<GitHubSync?> GetSyncStatusAsync(int projectId)
    {
        return await _context.GitHubSyncs
            .FirstOrDefaultAsync(s => s.ProjectId == projectId);
    }

    public async Task<GitHubSync> ResolveConflictsAsync(int projectId, string resolution)
    {
        var sync = await _context.GitHubSyncs
            .FirstOrDefaultAsync(s => s.ProjectId == projectId)
            ?? throw new InvalidOperationException("No GitHub connection found for this project.");

        if (sync.Status != "conflict")
            throw new InvalidOperationException("No conflicts to resolve.");

        sync.Status = "synced";
        sync.ConflictDetails = null;
        sync.LastSyncedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Conflicts resolved for project {ProjectId} with resolution: {Resolution}",
            projectId, resolution);

        return sync;
    }

    public async Task HandleWebhookAsync(string payload, string signature)
    {
        // Parse the webhook payload to determine the affected project
        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;

        if (!root.TryGetProperty("repository", out var repo))
        {
            _logger.LogWarning("Webhook payload missing repository field");
            return;
        }

        var fullName = repo.GetProperty("full_name").GetString() ?? "";
        var parts = fullName.Split('/');
        if (parts.Length != 2) return;

        var sync = await _context.GitHubSyncs
            .FirstOrDefaultAsync(s => s.GitHubRepoOwner == parts[0] && s.GitHubRepoName == parts[1]);

        if (sync == null)
        {
            _logger.LogWarning("Webhook received for unconnected repo {FullName}", fullName);
            return;
        }

        // Verify webhook signature
        if (!string.IsNullOrEmpty(sync.WebhookSecret))
        {
            var expected = ComputeHmacSha256(payload, sync.WebhookSecret);
            if ($"sha256={expected}" != signature)
            {
                _logger.LogWarning("Invalid webhook signature for repo {FullName}", fullName);
                return;
            }
        }

        // Update sync status to indicate new changes available
        if (root.TryGetProperty("head_commit", out var headCommit))
        {
            sync.LastSyncCommitSha = headCommit.GetProperty("id").GetString();
        }

        sync.Status = "connected"; // Changes available but not synced
        await _context.SaveChangesAsync();

        _logger.LogInformation("Webhook processed for repo {FullName}", fullName);
    }

    public async Task<List<SyncHistoryEntry>> GetSyncHistoryAsync(int projectId)
    {
        var sync = await _context.GitHubSyncs
            .FirstOrDefaultAsync(s => s.ProjectId == projectId);

        if (sync == null) return new List<SyncHistoryEntry>();

        // Build history from sync timestamps
        var history = new List<SyncHistoryEntry>();

        history.Add(new SyncHistoryEntry
        {
            Action = "connect",
            Status = "success",
            Timestamp = sync.CreatedAt,
            Details = $"Connected to {sync.GitHubRepoOwner}/{sync.GitHubRepoName}",
        });

        if (sync.LastPushAt.HasValue)
        {
            history.Add(new SyncHistoryEntry
            {
                Action = "push",
                Status = "success",
                CommitSha = sync.LastSyncCommitSha,
                Timestamp = sync.LastPushAt.Value,
                Details = "Pushed generated code to repository",
            });
        }

        if (sync.LastPullAt.HasValue)
        {
            history.Add(new SyncHistoryEntry
            {
                Action = "pull",
                Status = "success",
                CommitSha = sync.LastSyncCommitSha,
                Timestamp = sync.LastPullAt.Value,
                Details = "Pulled changes from repository",
            });
        }

        return history.OrderByDescending(h => h.Timestamp).ToList();
    }

    private static string ComputeHmacSha256(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
