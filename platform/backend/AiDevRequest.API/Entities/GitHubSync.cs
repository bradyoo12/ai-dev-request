namespace AiDevRequest.API.Entities;

public class GitHubSync
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ProjectId { get; set; }
    public string GitHubRepoOwner { get; set; } = string.Empty;
    public string GitHubRepoName { get; set; } = string.Empty;
    public string GitHubRepoUrl { get; set; } = string.Empty;
    public string Branch { get; set; } = "main";
    public string Status { get; set; } = "disconnected"; // disconnected, connected, syncing, synced, conflict, error
    public string? LastSyncCommitSha { get; set; }
    public string? ConflictDetails { get; set; } // JSON
    public string? WebhookId { get; set; }
    public string? WebhookSecret { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSyncedAt { get; set; }
    public DateTime? LastPushAt { get; set; }
    public DateTime? LastPullAt { get; set; }
}
