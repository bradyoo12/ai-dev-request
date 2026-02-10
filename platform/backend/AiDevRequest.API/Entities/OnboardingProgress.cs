namespace AiDevRequest.API.Entities;

public class OnboardingProgress
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public int CurrentStep { get; set; }
    public string CompletedStepsJson { get; set; } = "[]";
    public string Status { get; set; } = "active"; // active, completed, skipped
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
