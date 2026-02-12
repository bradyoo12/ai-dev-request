namespace AiDevRequest.API.Entities;

public class AgentTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int IssueNumber { get; set; }
    public string IssueTitle { get; set; } = string.Empty;
    public string Status { get; set; } = "queued"; // queued, analyzing, implementing, testing, pr_created, failed
    public int? PrNumber { get; set; }
    public string? PrUrl { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? Error { get; set; }
    public string? UserId { get; set; }
}

public class AgentAutomationConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? UserId { get; set; }
    public bool Enabled { get; set; }
    public string TriggerLabelsJson { get; set; } = "[\"auto-implement\",\"agent\"]"; // JSON array
    public int MaxConcurrent { get; set; } = 2;
    public bool AutoMerge { get; set; }
    public string? WebhookSecret { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
