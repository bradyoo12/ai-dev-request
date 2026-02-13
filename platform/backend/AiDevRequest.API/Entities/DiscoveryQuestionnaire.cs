namespace AiDevRequest.API.Entities;

public class DiscoveryQuestionnaire
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string UserId { get; set; }
    public string AnswersJson { get; set; } = "{}"; // Store question responses as JSON
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
