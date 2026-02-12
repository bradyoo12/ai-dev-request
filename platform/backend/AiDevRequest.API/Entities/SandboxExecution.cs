namespace AiDevRequest.API.Entities;

public class SandboxExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DevRequestId { get; set; }
    public string Status { get; set; } = "pending"; // pending, running, completed, failed, timeout
    public string ExecutionType { get; set; } = "build"; // build, test, preview
    public string IsolationLevel { get; set; } = "container"; // container, microvm, gvisor
    public string Command { get; set; } = "";
    public string OutputLog { get; set; } = "";
    public string ErrorLog { get; set; } = "";
    public int? ExitCode { get; set; }
    public string? ResourceUsage { get; set; } // JSON: { cpu, memory, duration }
    public string? SecurityViolationsJson { get; set; } // JSON array of violations
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
