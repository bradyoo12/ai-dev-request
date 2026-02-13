using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class MultiAgentTestSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DevRequestId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, running, completed, failed

    public int PersonaCount { get; set; }

    public int ConcurrencyLevel { get; set; } = 3;

    [Required]
    [MaxLength(100)]
    public string ScenarioType { get; set; } = "concurrent_crud"; // concurrent_crud, permission_boundaries, race_conditions, data_consistency

    public string? ConfigJson { get; set; } // JSON: personas config, timeout, retry settings

    public string? ResultsJson { get; set; } // JSON: aggregated test results

    public int TotalActions { get; set; }

    public int SuccessfulActions { get; set; }

    public int FailedActions { get; set; }

    public int IssuesDetected { get; set; }

    public decimal OverallScore { get; set; } // 0-100 score

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
