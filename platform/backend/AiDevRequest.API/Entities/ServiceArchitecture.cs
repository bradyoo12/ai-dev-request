namespace AiDevRequest.API.Entities;

public class ServiceBlueprint
{
    public int Id { get; set; }
    public Guid DevRequestId { get; set; }
    public required string UserId { get; set; }
    public required string Name { get; set; }
    public required string ServicesJson { get; set; } // JSON array of service definitions
    public required string DependenciesJson { get; set; } // JSON array of dependency edges
    public string? GatewayConfigJson { get; set; }
    public string? DockerComposeYaml { get; set; }
    public string? K8sManifestYaml { get; set; }
    public int ServiceCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
