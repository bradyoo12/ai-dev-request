namespace AiDevRequest.API.Entities;

public class ScreenshotToCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string DesignName { get; set; } = string.Empty;
    public string ImageFileName { get; set; } = string.Empty;
    public string ImageContentType { get; set; } = string.Empty;
    public long ImageSizeBytes { get; set; }
    public string AnalysisJson { get; set; } = "{}";
    public string GeneratedCodeJson { get; set; } = "{}";
    public string ComponentTreeJson { get; set; } = "[]";
    public string Status { get; set; } = "pending"; // pending, analyzing, generating, completed, failed
    public string Framework { get; set; } = "react"; // react, nextjs, vue
    public string StylingLib { get; set; } = "tailwind"; // tailwind, css-modules, styled-components
    public int ComponentCount { get; set; }
    public double ProcessingTimeMs { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
