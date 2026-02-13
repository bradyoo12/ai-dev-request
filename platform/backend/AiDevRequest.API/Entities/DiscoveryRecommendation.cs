namespace AiDevRequest.API.Entities;

public class DiscoveryRecommendation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QuestionnaireId { get; set; }
    public required string UserId { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string MatchReason { get; set; }
    public required string ExampleUseCase { get; set; }
    public required string DifficultyLevel { get; set; } // "beginner" | "intermediate"
    public int EstimatedHours { get; set; }
    public string ProjectTypeTag { get; set; } = ""; // "web" | "mobile" | "api" | "data"
    public bool IsSelected { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
