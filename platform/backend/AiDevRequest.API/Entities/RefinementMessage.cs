namespace AiDevRequest.API.Entities;

public class RefinementMessage
{
    public int Id { get; set; }

    public Guid DevRequestId { get; set; }

    public string Role { get; set; } = "user"; // "user" or "assistant"

    public string Content { get; set; } = "";

    public int? TokensUsed { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
