using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string SenderId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string ReceiverId { get; set; }

    [Required]
    [MaxLength(5000)]
    public required string Content { get; set; }

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReadAt { get; set; }
}
