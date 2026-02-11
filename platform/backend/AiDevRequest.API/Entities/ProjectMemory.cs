namespace AiDevRequest.API.Entities;

public class ProjectMemory
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string MemoryType { get; set; } = "convention"; // convention, pattern, preference, feedback
    public string Category { get; set; } = "general"; // naming, architecture, style, review, testing, deployment
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string SourceType { get; set; } = "explicit"; // explicit, accepted_suggestion, rejected_suggestion, review_feedback, code_pattern
    public string SourceRef { get; set; } = string.Empty;
    public double Confidence { get; set; } = 0.5;
    public int Reinforcements { get; set; }
    public int Contradictions { get; set; }
    public bool IsActive { get; set; } = true;
    public string TagsJson { get; set; } = "[]";
    public string EmbeddingJson { get; set; } = "[]";
    public DateTime LastAppliedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
