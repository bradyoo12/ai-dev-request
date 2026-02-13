namespace AiDevRequest.API.Entities;

public class HybridValidation
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string OperationType { get; set; } = string.Empty; // db-migration, git-operation, file-operation, api-validation, security-check
    public string AiOutput { get; set; } = string.Empty;
    public string ValidationResult { get; set; } = string.Empty; // passed, failed, retried
    public int RetryCount { get; set; }
    public int MaxRetries { get; set; } = 3;
    public bool UsedFallback { get; set; }
    public string FallbackAction { get; set; } = string.Empty;
    public string FailureReason { get; set; } = string.Empty;
    public string RulesApplied { get; set; } = string.Empty; // JSON array of rule names
    public int RulesPassedCount { get; set; }
    public int RulesFailedCount { get; set; }
    public double ConfidenceScore { get; set; }
    public double ValidationTimeMs { get; set; }
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
