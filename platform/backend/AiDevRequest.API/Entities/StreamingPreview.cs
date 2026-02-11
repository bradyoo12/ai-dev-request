using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class StreamingPreview
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public Guid? DevRequestId { get; set; }

    [MaxLength(200)]
    public string SessionName { get; set; } = "";

    [MaxLength(20)]
    public string Status { get; set; } = "idle";

    [MaxLength(50)]
    public string StreamType { get; set; } = "code";

    public string? GeneratedCode { get; set; }

    public string? PreviewHtml { get; set; }

    public string? ReasoningStepsJson { get; set; }

    public int TotalTokens { get; set; } = 0;

    public int StreamDurationMs { get; set; } = 0;

    public int ChunksDelivered { get; set; } = 0;

    public string? ActionsJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
