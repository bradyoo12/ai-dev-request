namespace AiDevRequest.API.Entities;

public class TrendReport
{
    public int Id { get; set; }
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
    public required string Category { get; set; } // ai_model, ui_framework, backend, security, infrastructure
    public required string SummaryJson { get; set; } // JSON array of trend items
    public int TrendCount { get; set; }
}

public class ProjectReview
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public int DevRequestId { get; set; }
    public required string ProjectName { get; set; }
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
    public int HealthScore { get; set; } // 0-100
    public required string FindingsJson { get; set; } // JSON array of findings
    public int CriticalCount { get; set; }
    public int HighCount { get; set; }
    public int MediumCount { get; set; }
    public int LowCount { get; set; }
}

public class UpdateRecommendation
{
    public int Id { get; set; }
    public int ProjectReviewId { get; set; }
    public required string UserId { get; set; }
    public required string Category { get; set; } // security, performance, feature, quality
    public required string Severity { get; set; } // critical, high, medium, low
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string? CurrentVersion { get; set; }
    public string? RecommendedVersion { get; set; }
    public string EffortEstimate { get; set; } = "low"; // low, medium, high
    public string Status { get; set; } = "pending"; // pending, accepted, rejected, applied
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
