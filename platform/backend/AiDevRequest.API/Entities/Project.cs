using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Name { get; set; }

    [MaxLength(500)]
    public string? ProductionUrl { get; set; }

    [MaxLength(500)]
    public string? PreviewUrl { get; set; }

    public Guid? DevRequestId { get; set; }

    public ProjectStatus Status { get; set; } = ProjectStatus.Active;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastDeployedAt { get; set; }

    // Navigation properties
    public DevRequest? DevRequest { get; set; }
    public ICollection<ProjectLog> Logs { get; set; } = new List<ProjectLog>();
}

public enum ProjectStatus
{
    Active,
    Paused,
    Archived
}
