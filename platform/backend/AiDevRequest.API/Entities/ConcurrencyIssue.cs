using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class ConcurrencyIssue
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SessionId { get; set; }

    [Required]
    [MaxLength(50)]
    public string IssueType { get; set; } = ""; // race_condition, data_conflict, deadlock, lost_update, phantom_read

    [Required]
    [MaxLength(50)]
    public string Severity { get; set; } = "medium"; // critical, high, medium, low

    public string? AffectedPersonasJson { get; set; } // JSON: array of persona IDs involved

    [Required]
    public string Description { get; set; } = "";

    public string? ResourcePath { get; set; } // API endpoint or resource affected

    public string? ConflictingOperations { get; set; } // Description of conflicting operations

    public string? StackTrace { get; set; }

    public string? SuggestedFixJson { get; set; } // JSON: AI-generated fix suggestion

    public int ConfidenceScore { get; set; } // 0-100 confidence in detection

    [MaxLength(50)]
    public string Status { get; set; } = "detected"; // detected, acknowledged, resolved, false_positive

    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ResolvedAt { get; set; }
}
