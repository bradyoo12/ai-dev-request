using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class AiElementsConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Enable streaming code display with syntax highlighting
    /// </summary>
    public bool StreamingEnabled { get; set; } = true;

    /// <summary>
    /// Enable reasoning panel showing AI thought process
    /// </summary>
    public bool ReasoningPanelEnabled { get; set; } = true;

    /// <summary>
    /// Enable live component previews in sandboxed iframes
    /// </summary>
    public bool LivePreviewEnabled { get; set; } = true;

    /// <summary>
    /// Enable response actions (copy, edit, deploy, add to project)
    /// </summary>
    public bool ResponseActionsEnabled { get; set; } = true;

    /// <summary>
    /// Theme mode for code display: "dark", "light", "system"
    /// </summary>
    [MaxLength(20)]
    public string ThemeMode { get; set; } = "dark";

    /// <summary>
    /// Active AI model for streaming generation
    /// </summary>
    [MaxLength(100)]
    public string ActiveModel { get; set; } = "claude-sonnet-4-20250514";

    /// <summary>
    /// Total number of streaming sessions initiated
    /// </summary>
    public int TotalStreams { get; set; } = 0;

    /// <summary>
    /// Total tokens streamed across all sessions
    /// </summary>
    public long TotalTokensStreamed { get; set; } = 0;

    /// <summary>
    /// Total number of component previews rendered
    /// </summary>
    public int TotalComponentPreviews { get; set; } = 0;

    /// <summary>
    /// JSON array of recent preview history entries
    /// </summary>
    public string? PreviewHistoryJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
