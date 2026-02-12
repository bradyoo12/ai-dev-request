namespace AiDevRequest.API.Entities;

public class GitHubSyncConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public bool GitHubConnected { get; set; } = false;
    public string GitHubUsername { get; set; } = string.Empty;
    public string DefaultBranch { get; set; } = "main";
    public bool AutoSync { get; set; } = false;
    public bool SyncOnPush { get; set; } = true;
    public bool SyncOnPull { get; set; } = true;
    public string ConflictResolution { get; set; } = "manual"; // ai-merge, manual, prefer-remote, prefer-local
    public bool WebhookEnabled { get; set; } = false;
    public int TotalPushes { get; set; }
    public int TotalPulls { get; set; }
    public int TotalConflicts { get; set; }
    public int TotalMerges { get; set; }
    public string SyncHistoryJson { get; set; } = "[]";
    public string ConnectedReposJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
