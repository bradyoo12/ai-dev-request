using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class VisualPromptUi
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = "";

    public string ComponentName { get; set; } = "";
    public string PromptText { get; set; } = "";
    public string GeneratedCode { get; set; } = "";
    public string GeneratedHtml { get; set; } = "";
    public string Framework { get; set; } = "react";
    public string StylingLibrary { get; set; } = "tailwind";
    public string Status { get; set; } = "draft";

    public int IterationCount { get; set; } = 0;
    public string? ParentComponentId { get; set; }
    public string ConversationJson { get; set; } = "[]";

    public string Category { get; set; } = "custom";
    public string Tags { get; set; } = "";
    public int ViewCount { get; set; } = 0;
    public int ForkCount { get; set; } = 0;
    public int LikeCount { get; set; } = 0;
    public bool IsPublic { get; set; } = false;
    public string? ThumbnailUrl { get; set; }

    public string? ExportedToProjectId { get; set; }
    public string? ExportedFilePath { get; set; }
    public string ThemeTokensJson { get; set; } = "{}";

    public double GenerationTimeMs { get; set; } = 0;
    public int TokensUsed { get; set; } = 0;
    public double EstimatedCost { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
