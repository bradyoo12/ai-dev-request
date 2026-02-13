namespace AiDevRequest.API.Entities;

public class DotnetUpgradeResult
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = "net9.0";
    public string TargetVersion { get; set; } = "net10.0";
    public int PackagesUpgraded { get; set; }
    public int BreakingChanges { get; set; }
    public int DeprecationWarnings { get; set; }
    public int CSharp14Adoptions { get; set; }
    public double StartupTimeReduction { get; set; } // percentage
    public double MemoryReduction { get; set; } // percentage
    public double ThroughputIncrease { get; set; } // percentage
    public bool VectorSearchEnabled { get; set; }
    public bool NativeAotEnabled { get; set; }
    public bool McpSupportEnabled { get; set; }
    public int AnalysisDurationMs { get; set; }
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
