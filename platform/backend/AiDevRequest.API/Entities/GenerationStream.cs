namespace AiDevRequest.API.Entities;

public class GenerationStream
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int DevRequestId { get; set; }
    public string Status { get; set; } = "idle"; // idle, streaming, paused, completed, cancelled, error
    public string? CurrentFile { get; set; }
    public int TotalFiles { get; set; }
    public int CompletedFiles { get; set; }
    public int TotalTokens { get; set; }
    public int StreamedTokens { get; set; }
    public double ProgressPercent { get; set; }
    public string? GeneratedFiles { get; set; } // JSON array of { path, status, tokenCount }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
