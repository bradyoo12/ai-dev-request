namespace AiDevRequest.API.Entities;

public class InfrastructureConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    /// <summary>
    /// JSON array of selected Azure services (e.g., ["container_apps", "postgresql", "blob_storage", "app_insights", "static_web_apps"])
    /// </summary>
    public string SelectedServicesJson { get; set; } = "[]";

    /// <summary>
    /// Pricing tier: Free, Basic, Standard
    /// </summary>
    public string Tier { get; set; } = "Free";

    /// <summary>
    /// Estimated monthly cost in USD
    /// </summary>
    public decimal EstimatedMonthlyCostUsd { get; set; }

    /// <summary>
    /// Generated Bicep main template content
    /// </summary>
    public string? GeneratedBicepMain { get; set; }

    /// <summary>
    /// Generated Bicep parameters file content
    /// </summary>
    public string? GeneratedBicepParameters { get; set; }

    /// <summary>
    /// AI analysis summary of recommended infrastructure
    /// </summary>
    public string? AnalysisSummary { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
