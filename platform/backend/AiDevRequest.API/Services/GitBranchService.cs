using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

/// <summary>
/// Service for managing git branches per dev request (v0-style workflow)
/// </summary>
public class GitBranchService
{
    private readonly AiDevRequestDbContext _db;

    public GitBranchService(AiDevRequestDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Create a new branch for a dev request
    /// </summary>
    public async Task<DevRequestBranch> CreateBranchAsync(Guid devRequestId, string? customBranchName = null)
    {
        // Check if branch already exists
        var existing = await _db.DevRequestBranches
            .FirstOrDefaultAsync(b => b.DevRequestId == devRequestId && b.Status == BranchStatus.Active);

        if (existing != null)
        {
            return existing;
        }

        // Generate branch name if not provided
        var branchName = customBranchName ?? $"dev-request-{devRequestId.ToString()[..8]}";

        var branch = new DevRequestBranch
        {
            DevRequestId = devRequestId,
            BranchName = branchName,
            Status = BranchStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.DevRequestBranches.Add(branch);
        await _db.SaveChangesAsync();

        return branch;
    }

    /// <summary>
    /// Auto-commit changes to the branch
    /// </summary>
    public async Task<CommitResult> AutoCommitAsync(Guid branchId, string commitMessage, string[] changedFiles)
    {
        var branch = await _db.DevRequestBranches.FindAsync(branchId);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        // Simulated commit SHA (in real implementation, this would call git CLI or library)
        var commitSha = Guid.NewGuid().ToString("N")[..8];

        // Add commit to history
        var history = ParseCommitHistory(branch.CommitHistoryJson);
        history.Insert(0, new CommitHistoryEntry
        {
            Sha = commitSha,
            Message = commitMessage,
            Timestamp = DateTime.UtcNow.ToString("o"),
            Author = "AI Dev Platform",
            FilesChanged = changedFiles
        });

        // Keep last 100 commits
        if (history.Count > 100)
        {
            history = history.Take(100).ToList();
        }

        branch.CommitHistoryJson = JsonSerializer.Serialize(history);
        branch.LastLocalCommitSha = commitSha;
        branch.TotalCommits++;
        branch.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new CommitResult
        {
            Success = true,
            CommitSha = commitSha,
            Message = commitMessage,
            FilesChanged = changedFiles.Length
        };
    }

    /// <summary>
    /// Sync from remote (pull changes)
    /// </summary>
    public async Task<SyncResult> SyncFromRemoteAsync(Guid branchId)
    {
        var branch = await _db.DevRequestBranches.FindAsync(branchId);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        // Simulated pull operation
        var changedFiles = new[] { "src/App.tsx", "package.json", "README.md" };
        var newCommitSha = Guid.NewGuid().ToString("N")[..8];

        branch.LastSyncedCommitSha = newCommitSha;
        branch.LastPulledAt = DateTime.UtcNow;
        branch.LastSyncedAt = DateTime.UtcNow;
        branch.TotalSyncs++;
        branch.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new SyncResult
        {
            Success = true,
            Direction = "pull",
            ChangedFiles = changedFiles,
            CommitSha = newCommitSha
        };
    }

    /// <summary>
    /// Sync to remote (push changes)
    /// </summary>
    public async Task<SyncResult> SyncToRemoteAsync(Guid branchId)
    {
        var branch = await _db.DevRequestBranches.FindAsync(branchId);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        // Get files from recent commits
        var history = ParseCommitHistory(branch.CommitHistoryJson);
        var recentFiles = history.Take(5).SelectMany(c => c.FilesChanged ?? Array.Empty<string>()).Distinct().ToArray();

        branch.LastPushedAt = DateTime.UtcNow;
        branch.LastSyncedAt = DateTime.UtcNow;
        branch.TotalSyncs++;
        branch.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new SyncResult
        {
            Success = true,
            Direction = "push",
            ChangedFiles = recentFiles,
            CommitSha = branch.LastLocalCommitSha
        };
    }

    /// <summary>
    /// Create a pull request for the branch
    /// </summary>
    public async Task<PullRequestResult> CreatePullRequestAsync(Guid branchId, string title, string? description = null)
    {
        var branch = await _db.DevRequestBranches.FindAsync(branchId);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        if (branch.HasPullRequest)
        {
            return new PullRequestResult
            {
                Success = true,
                PullRequestUrl = branch.PullRequestUrl!,
                PullRequestNumber = branch.PullRequestNumber!.Value,
                AlreadyExists = true
            };
        }

        // Simulated PR creation
        var prNumber = new Random().Next(1000, 9999);
        var prUrl = $"https://github.com/user/repo/pull/{prNumber}";

        branch.HasPullRequest = true;
        branch.PullRequestUrl = prUrl;
        branch.PullRequestNumber = prNumber;
        branch.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new PullRequestResult
        {
            Success = true,
            PullRequestUrl = prUrl,
            PullRequestNumber = prNumber,
            AlreadyExists = false
        };
    }

    /// <summary>
    /// Mark branch as merged
    /// </summary>
    public async Task MarkAsMergedAsync(Guid branchId)
    {
        var branch = await _db.DevRequestBranches.FindAsync(branchId);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        branch.Status = BranchStatus.Merged;
        branch.MergedAt = DateTime.UtcNow;
        branch.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Get branch by dev request ID
    /// </summary>
    public async Task<DevRequestBranch?> GetByDevRequestIdAsync(Guid devRequestId)
    {
        return await _db.DevRequestBranches
            .Where(b => b.DevRequestId == devRequestId && b.Status == BranchStatus.Active)
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// Get commit history for a branch
    /// </summary>
    public async Task<List<CommitHistoryEntry>> GetCommitHistoryAsync(Guid branchId)
    {
        var branch = await _db.DevRequestBranches.FindAsync(branchId);
        if (branch == null)
        {
            return new List<CommitHistoryEntry>();
        }

        return ParseCommitHistory(branch.CommitHistoryJson);
    }

    private static List<CommitHistoryEntry> ParseCommitHistory(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new List<CommitHistoryEntry>();
        try
        {
            return JsonSerializer.Deserialize<List<CommitHistoryEntry>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<CommitHistoryEntry>();
        }
        catch
        {
            return new List<CommitHistoryEntry>();
        }
    }
}

/// <summary>
/// Result of a commit operation
/// </summary>
public class CommitResult
{
    public bool Success { get; set; }
    public string CommitSha { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int FilesChanged { get; set; }
}

/// <summary>
/// Result of a sync operation (push/pull)
/// </summary>
public class SyncResult
{
    public bool Success { get; set; }
    public string Direction { get; set; } = string.Empty; // "push" or "pull"
    public string[] ChangedFiles { get; set; } = Array.Empty<string>();
    public string? CommitSha { get; set; }
}

/// <summary>
/// Result of a pull request creation
/// </summary>
public class PullRequestResult
{
    public bool Success { get; set; }
    public string PullRequestUrl { get; set; } = string.Empty;
    public int PullRequestNumber { get; set; }
    public bool AlreadyExists { get; set; }
}

/// <summary>
/// Commit history entry for JSON storage
/// </summary>
public class CommitHistoryEntry
{
    public string Sha { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string[]? FilesChanged { get; set; }
}
