namespace AiDevRequest.API.Entities;

public class BuildVerification
{
    public int Id { get; set; }
    public Guid DevRequestId { get; set; }
    public int Iteration { get; set; } = 1;
    public VerificationStatus Status { get; set; } = VerificationStatus.Pending;
    public int IssuesFound { get; set; }
    public int FixesApplied { get; set; }
    public int QualityScore { get; set; }
    public string? ResultJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum VerificationStatus
{
    Pending,
    Reviewing,
    Fixing,
    Passed,
    Failed
}
