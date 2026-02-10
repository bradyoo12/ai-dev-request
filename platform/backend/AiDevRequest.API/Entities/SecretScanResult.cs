namespace AiDevRequest.API.Entities;

public class SecretScanResult
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    /// <summary>
    /// JSON array of secret findings (type, severity, location, description)
    /// </summary>
    public string FindingsJson { get; set; } = "[]";

    public int FindingCount { get; set; }

    public string Status { get; set; } = "completed"; // pending, scanning, completed, failed

    /// <summary>
    /// JSON for generated .env template content
    /// </summary>
    public string? EnvTemplateContent { get; set; }

    /// <summary>
    /// JSON for generated .gitignore content
    /// </summary>
    public string? GitignoreContent { get; set; }

    /// <summary>
    /// Generated type-safe config module code
    /// </summary>
    public string? ConfigModuleContent { get; set; }

    /// <summary>
    /// Generated Azure Key Vault configuration
    /// </summary>
    public string? KeyVaultConfigContent { get; set; }

    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
