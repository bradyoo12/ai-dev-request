using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class AgentInboxItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public Guid? DevRequestId { get; set; }

    [MaxLength(50)]
    public string Type { get; set; } = "suggestion";

    [Required]
    [MaxLength(10000)]
    public required string Content { get; set; }

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "pending";

    [MaxLength(50)]
    public string Source { get; set; } = "widget";

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    [MaxLength(200)]
    public string? SubmitterEmail { get; set; }

    [MaxLength(100)]
    public string? SubmitterName { get; set; }

    public string? AiResponseJson { get; set; }

    public Guid? TriggeredDevRequestId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
