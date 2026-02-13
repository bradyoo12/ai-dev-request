namespace AiDevRequest.API.Entities;

/// <summary>
/// Represents a git branch associated with a dev request for branch-per-chat workflow
/// </summary>
public class DevRequestBranch
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Associated dev request ID
    /// </summary>
    public Guid DevRequestId { get; set; }

    /// <summary>
    /// Git branch name (e.g., "dev-request-123-feature-name")
    /// </summary>
    public string BranchName { get; set; } = string.Empty;

    /// <summary>
    /// Base branch this was created from (usually "main")
    /// </summary>
    public string BaseBranch { get; set; } = "main";

    /// <summary>
    /// Status: Active, Merged, Abandoned, Stale
    /// </summary>
    public BranchStatus Status { get; set; } = BranchStatus.Active;

    /// <summary>
    /// Last synced commit SHA from remote
    /// </summary>
    public string? LastSyncedCommitSha { get; set; }

    /// <summary>
    /// Last local commit SHA that was auto-committed
    /// </summary>
    public string? LastLocalCommitSha { get; set; }

    /// <summary>
    /// Total number of commits made to this branch
    /// </summary>
    public int TotalCommits { get; set; }

    /// <summary>
    /// Total number of sync operations (push/pull)
    /// </summary>
    public int TotalSyncs { get; set; }

    /// <summary>
    /// Has an active pull request
    /// </summary>
    public bool HasPullRequest { get; set; }

    /// <summary>
    /// Pull request URL if exists
    /// </summary>
    public string? PullRequestUrl { get; set; }

    /// <summary>
    /// Pull request number
    /// </summary>
    public int? PullRequestNumber { get; set; }

    /// <summary>
    /// Preview deployment URL for this branch
    /// </summary>
    public string? PreviewUrl { get; set; }

    /// <summary>
    /// JSON array of commit history entries
    /// [{ sha, message, timestamp, author, filesChanged }]
    /// </summary>
    public string CommitHistoryJson { get; set; } = "[]";

    /// <summary>
    /// Last time changes were pushed to remote
    /// </summary>
    public DateTime? LastPushedAt { get; set; }

    /// <summary>
    /// Last time changes were pulled from remote
    /// </summary>
    public DateTime? LastPulledAt { get; set; }

    /// <summary>
    /// Last time any sync happened
    /// </summary>
    public DateTime? LastSyncedAt { get; set; }

    /// <summary>
    /// When this branch was merged (if Status = Merged)
    /// </summary>
    public DateTime? MergedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Branch lifecycle status
/// </summary>
public enum BranchStatus
{
    /// <summary>Currently active and being worked on</summary>
    Active,

    /// <summary>Merged into base branch</summary>
    Merged,

    /// <summary>Manually abandoned/closed</summary>
    Abandoned,

    /// <summary>No activity for extended period</summary>
    Stale
}
