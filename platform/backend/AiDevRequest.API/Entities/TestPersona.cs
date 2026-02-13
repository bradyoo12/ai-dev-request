using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class TestPersona
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SessionId { get; set; }

    [Required]
    [MaxLength(50)]
    public string PersonaType { get; set; } = "customer"; // admin, customer, moderator

    [Required]
    [MaxLength(100)]
    public string PersonaName { get; set; } = "";

    public string? BehaviorJson { get; set; } // JSON: actions sequence, preferences, constraints

    public string? AgentId { get; set; } // A2A agent ID for tracking

    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, active, completed, failed

    public int ActionsPerformed { get; set; }

    public int ActionsSucceeded { get; set; }

    public int ActionsFailed { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}
