namespace AiDevRequest.API.Entities;

public class SemanticIndex
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty; // template, project, request
    public string SourceId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty; // the text that was embedded
    public string ContentHash { get; set; } = string.Empty; // SHA-256 for dedup
    public string EmbeddingJson { get; set; } = "[]"; // JSON serialized float array
    public int Dimensions { get; set; } = 1536;
    public DateTime IndexedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
