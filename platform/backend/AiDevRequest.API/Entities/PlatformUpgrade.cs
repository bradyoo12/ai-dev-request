using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class PlatformUpgrade
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [MaxLength(50)]
    public string CurrentDotNetVersion { get; set; } = "net10.0";

    [MaxLength(50)]
    public string CurrentEfCoreVersion { get; set; } = "10.0";

    [MaxLength(50)]
    public string CurrentCSharpVersion { get; set; } = "14.0";

    public bool VectorSearchEnabled { get; set; } = true;
    public bool NativeJsonColumnsEnabled { get; set; } = true;
    public bool LeftJoinLinqEnabled { get; set; } = true;
    public bool PerformanceProfilingEnabled { get; set; } = false;

    public double AvgQueryTimeMs { get; set; } = 0;
    public double P95QueryTimeMs { get; set; } = 0;
    public double P99QueryTimeMs { get; set; } = 0;
    public long TotalQueriesExecuted { get; set; } = 0;
    public double CacheHitRate { get; set; } = 0;
    public double MemoryUsageMb { get; set; } = 0;
    public double CpuUsagePercent { get; set; } = 0;
    public double ThroughputRequestsPerSec { get; set; } = 0;

    public int VectorIndexCount { get; set; } = 0;
    public int VectorDimensions { get; set; } = 1536;
    public double VectorSearchAvgMs { get; set; } = 0;

    [MaxLength(20)]
    public string UpgradeStatus { get; set; } = "current";

    public string? FeatureFlagsJson { get; set; }
    public string? PerformanceHistoryJson { get; set; }
    public string? MigrationLogJson { get; set; }

    public DateTime? LastProfiledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
