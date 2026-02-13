namespace AiDevRequest.API.Entities;

public class PreviewDeployment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    public required string UserId { get; set; }

    public PreviewDeploymentStatus Status { get; set; } = PreviewDeploymentStatus.Pending;

    public string? PreviewUrl { get; set; }

    public string Provider { get; set; } = "azure-container-instances";

    public string? ContainerGroupName { get; set; }

    public string? ContainerName { get; set; }

    public string? Region { get; set; }

    public string? ResourceGroupName { get; set; }

    public int Port { get; set; } = 3000;

    public string? ImageUri { get; set; }

    public string? Fqdn { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? DeployedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum PreviewDeploymentStatus
{
    Pending,
    Deploying,
    Deployed,
    Expired,
    Failed
}
