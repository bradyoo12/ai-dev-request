namespace AiDevRequest.API.Entities;

public class UserInterest
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public required string Category { get; set; }
    public double Confidence { get; set; } = 0.5;
    public string Source { get; set; } = "profile";
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
}

public class AppRecommendation
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Reason { get; set; }
    public required string PromptTemplate { get; set; }
    public int MatchPercent { get; set; }
    public required string InterestCategory { get; set; }
    public bool IsDismissed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
