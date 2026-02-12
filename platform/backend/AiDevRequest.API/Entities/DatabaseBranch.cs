namespace AiDevRequest.API.Entities;

public class DatabaseBranch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DevRequestId { get; set; }
    public string BranchName { get; set; } = "";
    public string SourceBranch { get; set; } = "main"; // "main" or parent branch name
    public string Status { get; set; } = "active"; // active, merged, discarded
    public string SchemaVersion { get; set; } = "1.0.0";
    public string? TablesJson { get; set; } // JSON array of table names
    public string? MigrationsJson { get; set; } // JSON array of pending migrations
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? MergedAt { get; set; }
    public DateTime? DiscardedAt { get; set; }
}
