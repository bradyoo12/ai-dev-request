namespace AiDevRequest.API.Entities;

public class ModelRoutingRule
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string TaskType { get; set; } = "code-generation"; // code-generation, reasoning, refactoring, testing, review
    public string PrimaryModel { get; set; } = "claude-opus"; // claude-opus, claude-sonnet, gpt-codex, gpt-4o
    public string FallbackModel { get; set; } = "gpt-codex";
    public string RoutingStrategy { get; set; } = "quality-first"; // quality-first, speed-first, cost-optimized, balanced
    public double CostThreshold { get; set; } = 0.10;
    public double LatencyThresholdMs { get; set; } = 5000;
    public int TotalRequests { get; set; }
    public int PrimaryHits { get; set; }
    public int FallbackHits { get; set; }
    public double AvgPrimaryLatencyMs { get; set; }
    public double AvgFallbackLatencyMs { get; set; }
    public double AvgPrimaryCost { get; set; }
    public double AvgFallbackCost { get; set; }
    public double AccuracyScore { get; set; }
    public bool Enabled { get; set; } = true;
    public string Status { get; set; } = "active"; // active, paused, testing
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
