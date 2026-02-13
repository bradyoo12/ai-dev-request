namespace AiDevRequest.API.Entities;

public class AutonomousTestExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DevRequestId { get; set; }

    public Guid PreviewDeploymentId { get; set; }

    public string Status { get; set; } = "pending"; // pending, running, completed, failed, error

    public int MaxIterations { get; set; } = 3;

    public int CurrentIteration { get; set; } = 0;

    public bool TestsPassed { get; set; } = false;

    public string? FinalTestResult { get; set; }

    public string? TestExecutionIds { get; set; } // Comma-separated Sandbox execution IDs

    public string? CodeRegenerationAttempts { get; set; } // Comma-separated attempt IDs

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}
