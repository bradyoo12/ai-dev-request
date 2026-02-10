namespace AiDevRequest.API.Entities;

public class MarketplaceTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int AuthorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // web-app, api, mobile, automation, data-pipeline
    public string TechStack { get; set; } = string.Empty; // JSON array of technologies
    public string? Tags { get; set; } // JSON array of tags
    public string TemplateData { get; set; } = "{}"; // JSON template configuration
    public string? PreviewImageUrl { get; set; }
    public double Rating { get; set; }
    public int RatingCount { get; set; }
    public int DownloadCount { get; set; }
    public string Status { get; set; } = "draft"; // draft, published, archived
    public bool IsOfficial { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
