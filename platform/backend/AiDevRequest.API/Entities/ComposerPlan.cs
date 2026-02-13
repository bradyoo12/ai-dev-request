namespace AiDevRequest.API.Entities;

public class ComposerPlan
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string PlanMode { get; set; } = "plan-first"; // plan-first, direct, interactive
    public int TotalSteps { get; set; }
    public int CompletedSteps { get; set; }
    public int FilesChanged { get; set; }
    public int LinesAdded { get; set; }
    public int LinesRemoved { get; set; }
    public string ModelTier { get; set; } = "sonnet"; // haiku, sonnet, opus
    public double EstimatedTokens { get; set; }
    public double ActualTokens { get; set; }
    public bool DiffPreviewShown { get; set; }
    public bool PlanApproved { get; set; }
    public string Status { get; set; } = "planning"; // planning, approved, executing, completed, rejected
    public string PlanSummary { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
