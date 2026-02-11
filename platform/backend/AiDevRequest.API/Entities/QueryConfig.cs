namespace AiDevRequest.API.Entities;

public class QueryConfig
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int StaleTimeMs { get; set; } = 300000;
    public int CacheTimeMs { get; set; } = 600000;
    public int RetryCount { get; set; } = 2;
    public int RetryDelayMs { get; set; } = 1000;
    public bool RefetchOnWindowFocus { get; set; } = true;
    public bool RefetchOnReconnect { get; set; } = true;
    public bool RefetchOnMount { get; set; } = true;
    public bool EnableDevtools { get; set; } = true;
    public bool EnableGarbageCollection { get; set; } = true;
    public bool EnableOptimisticUpdates { get; set; } = false;
    public int TotalQueries { get; set; }
    public int TotalMutations { get; set; }
    public int CacheHits { get; set; }
    public int CacheMisses { get; set; }
    public string QueryPatternsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
