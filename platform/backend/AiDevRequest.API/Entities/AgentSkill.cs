namespace AiDevRequest.API.Entities;

public class AgentSkill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? InstructionContent { get; set; }
    public string? ScriptsJson { get; set; }
    public string? ResourcesJson { get; set; }
    public string? TagsJson { get; set; }
    public bool IsBuiltIn { get; set; }
    public bool IsPublic { get; set; }
    public int DownloadCount { get; set; }
    public string? Version { get; set; }
    public string? Author { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
