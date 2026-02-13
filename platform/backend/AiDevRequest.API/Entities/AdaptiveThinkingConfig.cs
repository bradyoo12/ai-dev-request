namespace AiDevRequest.API.Entities;

public class AdaptiveThinkingConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public bool Enabled { get; set; } = false;
    public string ModelName { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
