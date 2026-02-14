using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class StreamingCodeGenSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public int? DevRequestId { get; set; }

    [MaxLength(200)]
    public string? Prompt { get; set; }

    public string Status { get; set; } = "idle"; // idle, streaming, building, preview_ready, completed, cancelled, error

    public string? CurrentFile { get; set; }
    public int TotalFiles { get; set; }
    public int CompletedFiles { get; set; }
    public int TotalTokens { get; set; }
    public int StreamedTokens { get; set; }
    public double ProgressPercent { get; set; }

    /// <summary>JSON array of { path, status, tokenCount, language }</summary>
    public string? GeneratedFilesJson { get; set; }

    /// <summary>JSON object for build progress { step, status, output }</summary>
    public string? BuildProgressJson { get; set; }

    /// <summary>URL or HTML content for live preview</summary>
    public string? PreviewUrl { get; set; }

    public string? ErrorMessage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
