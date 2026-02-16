using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class AutonomousTestExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [MaxLength(100)]
    public required string UserId { get; set; }

    public Guid DevRequestId { get; set; }

    public Guid PreviewDeploymentId { get; set; }

    [MaxLength(200)]
    public string? ProjectName { get; set; }

    [MaxLength(500)]
    public string? TargetUrl { get; set; }

    [MaxLength(50)]
    public string BrowserType { get; set; } = "chromium"; // chromium, firefox, webkit

    public string Status { get; set; } = "pending"; // pending, running, completed, failed, error, cancelled

    public int MaxIterations { get; set; } = 3;

    public int CurrentIteration { get; set; } = 0;

    public bool TestsPassed { get; set; } = false;

    public string? FinalTestResult { get; set; }

    public string? TestExecutionIds { get; set; } // Comma-separated Sandbox execution IDs

    public string? CodeRegenerationAttempts { get; set; } // Comma-separated attempt IDs

    public string? ScreenshotsJson { get; set; } // JSON array of screenshot analysis results

    public string? IssuesFoundJson { get; set; } // JSON array of UI/UX issues detected by vision

    public string? FixesAppliedJson { get; set; } // JSON array of auto-fixes applied

    public int VisionAnalysisCount { get; set; } = 0;

    public int IssuesDetected { get; set; } = 0;

    public int IssuesFixed { get; set; } = 0;

    public long TotalDurationMs { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}
