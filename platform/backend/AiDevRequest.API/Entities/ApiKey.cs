using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ApiKey
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(500)]
    public required string KeyHash { get; set; }

    [Required]
    [MaxLength(20)]
    public required string KeyPrefix { get; set; } // "aidev_...xxxx"

    public ApiKeyStatus Status { get; set; } = ApiKeyStatus.Active;

    public int RequestCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastUsedAt { get; set; }

    public DateTime? RevokedAt { get; set; }
}

public enum ApiKeyStatus
{
    Active,
    Revoked
}
