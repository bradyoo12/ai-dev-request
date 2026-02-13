namespace AiDevRequest.API.Entities;

public class BuildToolchainResult
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Bundler { get; set; } = "rolldown"; // rolldown, esbuild-rollup
    public int TotalModules { get; set; }
    public double DevStartupMs { get; set; }
    public double HmrLatencyMs { get; set; }
    public double BuildDurationMs { get; set; }
    public double BundleSizeKb { get; set; }
    public int ChunksGenerated { get; set; }
    public double TreeShakingPercent { get; set; }
    public double CodeSplitSavingsPercent { get; set; }
    public double SpeedupFactor { get; set; } = 1.0;
    public bool FullBundleMode { get; set; }
    public string Status { get; set; } = "completed"; // pending, building, completed, failed
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
