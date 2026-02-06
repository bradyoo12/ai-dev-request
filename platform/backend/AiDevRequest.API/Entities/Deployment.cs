namespace AiDevRequest.API.Entities;

public class Deployment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    public required string UserId { get; set; }

    public required string SiteName { get; set; }

    public string? ResourceGroupName { get; set; }

    public DeploymentStatus Status { get; set; } = DeploymentStatus.Pending;

    public string? PreviewUrl { get; set; }

    public string? ContainerAppName { get; set; }

    public string? ContainerImageTag { get; set; }

    public string Region { get; set; } = "koreacentral";

    public string? ProjectType { get; set; }

    public string? DeploymentLogJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? DeployedAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum DeploymentStatus
{
    Pending,
    Provisioning,
    Building,
    Deploying,
    Running,
    Failed,
    Deleted
}
