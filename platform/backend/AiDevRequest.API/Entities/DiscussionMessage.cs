using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class DiscussionMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DiscussionId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "user";

    public string Content { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
