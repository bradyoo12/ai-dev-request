namespace AiDevRequest.API.Entities;

public class OAuthComplianceReport
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    /// <summary>
    /// JSON array of detected OAuth scopes with provider info
    /// </summary>
    public string ScopesAnalyzedJson { get; set; } = "[]";

    /// <summary>
    /// JSON array of minimal scope recommendations per provider
    /// </summary>
    public string RecommendationsJson { get; set; } = "[]";

    /// <summary>
    /// JSON object containing generated compliance documents (privacy policy, data usage, scope justifications)
    /// </summary>
    public string? ComplianceDocsJson { get; set; }

    public int TotalScopesDetected { get; set; }

    public int OverPermissionedCount { get; set; }

    public string Status { get; set; } = "pending"; // pending, analyzed, docs_generated

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
