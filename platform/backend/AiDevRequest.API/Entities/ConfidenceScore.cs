namespace AiDevRequest.API.Entities;

public class ConfidenceScore
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string RequestTitle { get; set; } = string.Empty;
    public string RequestDescription { get; set; } = string.Empty;
    public string ConfidenceLevel { get; set; } = "yellow"; // green, yellow, red
    public double Score { get; set; } // 0.0 - 1.0
    public string ComplexityRating { get; set; } = "medium"; // low, medium, high, extreme
    public string AmbiguityLevel { get; set; } = "low"; // low, medium, high
    public string FeasibilityRating { get; set; } = "feasible"; // feasible, challenging, infeasible
    public string Factors { get; set; } = string.Empty; // JSON array of scoring factors
    public string Suggestions { get; set; } = string.Empty; // JSON array of refinement suggestions
    public string EstimatedEffort { get; set; } = string.Empty; // e.g., "2-4 hours"
    public bool WasAccurate { get; set; } // tracks actual outcome
    public string ActualOutcome { get; set; } = string.Empty; // success, partial, failed
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
