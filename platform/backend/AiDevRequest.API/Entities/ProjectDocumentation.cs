namespace AiDevRequest.API.Entities;

public class ProjectDocumentation
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid? DevRequestId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string ArchitectureOverview { get; set; } = string.Empty;
    public string ComponentDocs { get; set; } = string.Empty;
    public string ApiReference { get; set; } = string.Empty;
    public string SetupGuide { get; set; } = string.Empty;
    public string QaHistoryJson { get; set; } = "[]";
    public int SourceFilesCount { get; set; }
    public int TotalLinesAnalyzed { get; set; }
    public int GenerationTimeMs { get; set; }
    public int TokensUsed { get; set; }
    public decimal EstimatedCost { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
