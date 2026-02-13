namespace AiDevRequest.API.Entities;

public class HybridCacheEntry
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string CacheKey { get; set; } = string.Empty;
    public string CacheLayer { get; set; } = "L1"; // L1 (in-memory), L2 (distributed)
    public string Category { get; set; } = string.Empty; // ai-analysis, template, scaffold, project
    public long SizeBytes { get; set; }
    public int HitCount { get; set; }
    public int MissCount { get; set; }
    public bool StampedeProtected { get; set; }
    public int StampedeBlockedCount { get; set; }
    public double AvgLatencyMs { get; set; }
    public double CostSavedUsd { get; set; }
    public string Status { get; set; } = "active"; // active, expired, evicted
    public int TtlSeconds { get; set; } = 3600;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(1);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
