namespace AiDevRequest.API.Entities;

public class SelfHealingTestResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DevRequestId { get; set; }
    public string Status { get; set; } = "pending"; // pending, analyzing, completed, failed

    // Test counts
    public int TotalTests { get; set; }
    public int FailedTests { get; set; }
    public int HealedTests { get; set; }
    public int SkippedTests { get; set; }
    public decimal ConfidenceScore { get; set; }

    // JSON detail fields
    public string? HealedTestsJson { get; set; } // JSON array of { testName, filePath, originalCode, fixedCode, confidence, reason }
    public string? FailedTestDetailsJson { get; set; } // JSON array of { testName, filePath, errorMessage, stackTrace }

    // Metadata
    public int AnalysisVersion { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
