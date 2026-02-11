using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class GenerativeUiSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    public Guid DevRequestId { get; set; }

    [MaxLength(200)]
    public string SessionName { get; set; } = "";

    [MaxLength(20)]
    public string Status { get; set; } = "active";

    public int TotalMessages { get; set; } = 0;

    public int AiMessages { get; set; } = 0;

    public int UserMessages { get; set; } = 0;

    public int GeneratedComponents { get; set; } = 0;

    public int ToolCallCount { get; set; } = 0;

    public bool StreamingEnabled { get; set; } = true;

    public bool GenerativeUiEnabled { get; set; } = true;

    [MaxLength(50)]
    public string ActiveModel { get; set; } = "claude-sonnet-4-5";

    public double TotalTokensUsed { get; set; } = 0;

    public double EstimatedCost { get; set; } = 0;

    public string? MessagesJson { get; set; }

    public string? ToolDefinitionsJson { get; set; }

    public string? GeneratedComponentsJson { get; set; }

    public string? ReasoningStepsJson { get; set; }

    public DateTime? LastMessageAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
