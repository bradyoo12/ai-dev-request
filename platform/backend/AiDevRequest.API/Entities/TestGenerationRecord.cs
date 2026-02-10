namespace AiDevRequest.API.Entities;

public class TestGenerationRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ProjectId { get; set; }
    public string Status { get; set; } = "pending"; // pending, generating, completed, failed

    // Results
    public int TestFilesGenerated { get; set; }
    public int TotalTestCount { get; set; }
    public int CoverageEstimate { get; set; }
    public string TestFramework { get; set; } = "";
    public string Summary { get; set; } = "";
    public string? TestFilesJson { get; set; } // JSON array of { path, testCount, type }

    // Metadata
    public int GenerationVersion { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
