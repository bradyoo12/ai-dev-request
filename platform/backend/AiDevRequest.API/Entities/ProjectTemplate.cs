using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ProjectTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    [MaxLength(255)]
    public string Description { get; set; } = "";

    [MaxLength(50)]
    public string Category { get; set; } = "general";

    [MaxLength(50)]
    public string Framework { get; set; } = "react";

    /// <summary>
    /// Comma-separated tags (e.g. "auth,billing,dashboard")
    /// </summary>
    [MaxLength(500)]
    public string Tags { get; set; } = "";

    /// <summary>
    /// The prompt template that seeds AI generation
    /// </summary>
    public string PromptTemplate { get; set; } = "";

    /// <summary>
    /// Who created: "system" for built-in, or userId for community
    /// </summary>
    [MaxLength(100)]
    public string CreatedBy { get; set; } = "system";

    public int UsageCount { get; set; }

    public bool IsPublished { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
