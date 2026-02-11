namespace AiDevRequest.API.Entities;

public class VisualRegressionResult
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string PageUrl { get; set; } = string.Empty;
    public string ViewportSize { get; set; } = "1280x720";
    public string BaselineImageUrl { get; set; } = string.Empty;
    public string ComparisonImageUrl { get; set; } = string.Empty;
    public string DiffImageUrl { get; set; } = string.Empty;
    public double MismatchPercentage { get; set; }
    public double Threshold { get; set; } = 0.1;
    public string Status { get; set; } = "pending";
    public bool Passed { get; set; }
    public int PixelsDifferent { get; set; }
    public int TotalPixels { get; set; }
    public string IgnoreRegionsJson { get; set; } = "[]";
    public string MetadataJson { get; set; } = "{}";
    public int CaptureTimeMs { get; set; }
    public int CompareTimeMs { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
