using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class AgentTestExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SessionId { get; set; }

    [Required]
    public Guid PersonaId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, running, completed, failed

    public string? ActionsJson { get; set; } // JSON: array of executed actions with timestamps

    public string? IssuesJson { get; set; } // JSON: array of detected issues during execution

    public string? LogsJson { get; set; } // JSON: execution logs and traces

    public int ActionsCount { get; set; }

    public int IssuesCount { get; set; }

    public string? ErrorMessage { get; set; }

    public string? StackTrace { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}
