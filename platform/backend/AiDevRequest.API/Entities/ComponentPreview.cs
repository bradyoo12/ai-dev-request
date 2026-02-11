using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ComponentPreview
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = "";

    [MaxLength(255)]
    public string ComponentName { get; set; } = "Untitled Component";

    /// <summary>
    /// Generated component code (JSX/TSX)
    /// </summary>
    public string Code { get; set; } = "";

    /// <summary>
    /// JSON array of chat messages for conversational iteration
    /// </summary>
    public string ChatHistoryJson { get; set; } = "[]";

    /// <summary>
    /// Current iteration/version number
    /// </summary>
    public int IterationCount { get; set; }

    /// <summary>
    /// Status: draft, generating, ready, exported
    /// </summary>
    [MaxLength(50)]
    public string Status { get; set; } = "draft";

    /// <summary>
    /// Design tokens JSON (brand colors, fonts, spacing)
    /// </summary>
    public string? DesignTokensJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
