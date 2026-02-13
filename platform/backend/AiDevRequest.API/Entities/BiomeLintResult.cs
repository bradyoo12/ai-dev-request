namespace AiDevRequest.API.Entities;

public class BiomeLintResult
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Toolchain { get; set; } = "biome"; // biome, eslint-prettier
    public int TotalFiles { get; set; }
    public int FilesLinted { get; set; }
    public int Errors { get; set; }
    public int Warnings { get; set; }
    public int AutoFixed { get; set; }
    public double LintDurationMs { get; set; }
    public double FormatDurationMs { get; set; }
    public double TotalDurationMs { get; set; }
    public double SpeedupFactor { get; set; } = 1.0;
    public bool TypeAwareEnabled { get; set; }
    public int TypeAwareIssues { get; set; }
    public string ConfigPreset { get; set; } = "recommended"; // recommended, strict, minimal
    public string Status { get; set; } = "completed"; // pending, running, completed, failed
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
