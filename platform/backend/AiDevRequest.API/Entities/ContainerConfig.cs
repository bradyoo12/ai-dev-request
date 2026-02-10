namespace AiDevRequest.API.Entities;

public class ContainerConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int ProjectId { get; set; }
    public string DetectedStack { get; set; } = string.Empty; // nodejs, dotnet, python, static
    public string Dockerfile { get; set; } = string.Empty;
    public string? ComposeFile { get; set; }
    public string? K8sManifest { get; set; }
    public string? RegistryUrl { get; set; }
    public string ImageName { get; set; } = string.Empty;
    public string ImageTag { get; set; } = "latest";
    public string BuildStatus { get; set; } = "pending"; // pending, building, built, pushing, pushed, deploying, deployed, error
    public string? BuildLogs { get; set; } // JSON array of log entries
    public string? ErrorMessage { get; set; }
    public int BuildDurationMs { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? BuiltAt { get; set; }
    public DateTime? DeployedAt { get; set; }
}
