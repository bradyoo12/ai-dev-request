namespace AiDevRequest.API.Entities;

public class CodeQualityReview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ProjectId { get; set; }
    public string Status { get; set; } = "pending"; // pending, reviewing, completed, failed

    // Dimension scores (1-5)
    public int ArchitectureScore { get; set; }
    public int SecurityScore { get; set; }
    public int PerformanceScore { get; set; }
    public int AccessibilityScore { get; set; }
    public int MaintainabilityScore { get; set; }
    public double OverallScore { get; set; }

    // Findings
    public string? Findings { get; set; } // JSON array of { dimension, severity, title, description, file, line, suggestedFix }
    public int CriticalCount { get; set; }
    public int WarningCount { get; set; }
    public int InfoCount { get; set; }

    // Fix tracking
    public string? AppliedFixes { get; set; } // JSON array of applied fix IDs
    public int FixesApplied { get; set; }

    // Metadata
    public int ReviewVersion { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
