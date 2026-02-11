namespace AiDevRequest.API.Entities;

public class FigmaImport
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string FigmaFileKey { get; set; } = string.Empty;
    public string FigmaNodeId { get; set; } = string.Empty;
    public string SourceType { get; set; } = "url"; // url, screenshot, upload
    public string SourceUrl { get; set; } = string.Empty;
    public string DesignName { get; set; } = string.Empty;
    public string DesignTokensJson { get; set; } = "{}";
    public string ComponentTreeJson { get; set; } = "[]";
    public string GeneratedCodeJson { get; set; } = "{}";
    public string Status { get; set; } = "pending"; // pending, extracting, generating, completed, failed
    public string Framework { get; set; } = "react"; // react, nextjs, vue
    public string StylingLib { get; set; } = "tailwind"; // tailwind, css-modules, styled-components
    public int ComponentCount { get; set; }
    public int TokenCount { get; set; }
    public double ProcessingTimeMs { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
