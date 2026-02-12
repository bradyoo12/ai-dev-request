namespace AiDevRequest.API.Entities;

public class BidirectionalGitSync
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public int DevRequestId { get; set; }
    public string ProjectName { get; set; } = string.Empty;

    // Repository connection
    public string RepoOwner { get; set; } = string.Empty;
    public string RepoName { get; set; } = string.Empty;
    public string DefaultBranch { get; set; } = "main";
    public string AiBranch { get; set; } = "ai-dev";

    // Sync toggles
    public bool SyncEnabled { get; set; } = true;
    public bool AutoPushEnabled { get; set; } = false;
    public bool AutoPullEnabled { get; set; } = false;
    public bool WebhookEnabled { get; set; } = false;

    // Status: synced, ahead, behind, diverged, disconnected
    public string Status { get; set; } = "disconnected";

    // Timestamps
    public DateTime? LastPushAt { get; set; }
    public DateTime? LastPullAt { get; set; }
    public DateTime? LastSyncAt { get; set; }

    // Counters
    public int TotalPushes { get; set; }
    public int TotalPulls { get; set; }
    public int TotalConflicts { get; set; }
    public int ConflictsResolved { get; set; }

    // Diff state
    public int AheadCount { get; set; }
    public int BehindCount { get; set; }
    public int ChangedFilesCount { get; set; }

    // JSON fields
    public string SyncHistoryJson { get; set; } = "[]"; // array of {operation, timestamp, files, status, commitSha}
    public string ConflictFilesJson { get; set; } = "[]"; // array of conflicting file paths

    // Webhook
    public string? WebhookSecret { get; set; }
    public string? WebhookUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
