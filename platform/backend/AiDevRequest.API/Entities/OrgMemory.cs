namespace AiDevRequest.API.Entities;

public class OrgMemory
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Scope { get; set; } = "user"; // user, org
    public string Category { get; set; } = string.Empty; // preference, decision, pattern, standard, runbook
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string SourceProject { get; set; } = string.Empty;
    public double Relevance { get; set; }
    public int UsageCount { get; set; }
    public string TagsJson { get; set; } = "[]"; // JSON array of tags
    public string EmbeddingStatus { get; set; } = "pending"; // pending, indexed, failed
    public int? DevRequestId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
