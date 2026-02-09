namespace AiDevRequest.API.Entities;

public class UserPreference
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public required string Category { get; set; }
    public required string Key { get; set; }
    public required string Value { get; set; }
    public double Confidence { get; set; } = 0.5;
    public string Source { get; set; } = "auto";
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class UserPreferenceSummary
{
    public int Id { get; set; }
    public required string UserId { get; set; }
    public required string SummaryText { get; set; }
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}
