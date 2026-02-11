namespace AiDevRequest.API.Entities;

public class CodeReviewPipeline
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid? DevRequestId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public bool PipelineEnabled { get; set; } = true;
    public bool AutoRunAfterGeneration { get; set; }
    public bool AutoFixEnabled { get; set; }
    public bool AstAnalysisEnabled { get; set; } = true;
    public bool SastScanEnabled { get; set; } = true;
    public bool AiReviewEnabled { get; set; } = true;
    public bool TestGenerationEnabled { get; set; } = true;
    public int QualityScore { get; set; }
    public int MinQualityThreshold { get; set; } = 70;
    public string LastRunStatus { get; set; } = "idle";
    public DateTime? LastRunAt { get; set; }
    public int TotalRuns { get; set; }
    public int PassedRuns { get; set; }
    public int FailedRuns { get; set; }
    public string FindingsJson { get; set; } = "[]";
    public string GeneratedTestsJson { get; set; } = "[]";
    public string PipelineStepsJson { get; set; } = "[]";
    public int TotalFindingsFound { get; set; }
    public int TotalFindingsFixed { get; set; }
    public int TotalTestsGenerated { get; set; }
    public decimal AvgQualityScore { get; set; }
    public int TokensUsed { get; set; }
    public decimal EstimatedCost { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
