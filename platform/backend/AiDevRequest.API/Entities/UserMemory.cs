namespace AiDevRequest.API.Entities;

public class UserMemory
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public MemoryScope Scope { get; set; } = MemoryScope.User;
    public string? SessionId { get; set; }
    public required string Content { get; set; }
    public required string Category { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum MemoryScope
{
    User,
    Session
}
