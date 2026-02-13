namespace AiDevRequest.API.Entities;

public class InferenceCostRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProjectName { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;      // simple, complex, critical
    public string ModelUsed { get; set; } = string.Empty;        // haiku, sonnet, opus
    public string ModelRouted { get; set; } = string.Empty;      // original model before routing
    public double CostUsd { get; set; }
    public double OriginalCostUsd { get; set; }
    public double SavingsUsd { get; set; }
    public double SavingsPercent { get; set; }
    public bool CacheHit { get; set; }
    public bool Batched { get; set; }
    public bool ResponseReused { get; set; }
    public double SimilarityScore { get; set; }
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public double LatencyMs { get; set; }
    public string OptimizationStrategy { get; set; } = string.Empty;  // routing, caching, batching, reuse
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
