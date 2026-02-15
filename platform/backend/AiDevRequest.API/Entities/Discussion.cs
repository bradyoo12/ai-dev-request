using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Discussion
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? DevRequestId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = "";

    [MaxLength(20)]
    public string Status { get; set; } = "active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
