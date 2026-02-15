using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class BrowserTestSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ExecutionId { get; set; }

    public int IterationNumber { get; set; }

    [MaxLength(500)]
    public string? PageUrl { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, navigating, screenshotting, analyzing, fixing, completed, failed

    public string? ScreenshotBase64 { get; set; }

    public string? VisionAnalysisJson { get; set; } // Claude Vision API analysis result

    public string? IssuesJson { get; set; } // JSON array of detected issues

    public string? FixesJson { get; set; } // JSON array of applied fixes

    public int IssuesFound { get; set; } = 0;

    public int IssuesResolved { get; set; } = 0;

    public decimal ConfidenceScore { get; set; } = 0;

    public long DurationMs { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}
