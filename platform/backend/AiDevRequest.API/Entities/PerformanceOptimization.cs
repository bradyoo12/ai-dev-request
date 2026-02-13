namespace AiDevRequest.API.Entities;

public class PerformanceOptimization
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Category { get; set; } = "json"; // json, http, startup, aot, gc
    public bool Enabled { get; set; } = true;
    public double BaselineLatencyMs { get; set; }
    public double OptimizedLatencyMs { get; set; }
    public double ImprovementPercent { get; set; }
    public double MemoryBeforeMb { get; set; }
    public double MemoryAfterMb { get; set; }
    public double MemorySavedPercent { get; set; }
    public int BenchmarkRuns { get; set; }
    public double ThroughputRps { get; set; }
    public string Status { get; set; } = "pending"; // pending, benchmarking, optimized, failed
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
