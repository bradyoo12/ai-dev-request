namespace AiDevRequest.API.Entities;

public class TerminalExecution
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Command { get; set; } = string.Empty;
    public string Category { get; set; } = "build"; // build, test, lint, format, deploy, custom
    public bool AutoApproved { get; set; }
    public bool Blocked { get; set; }
    public string? BlockReason { get; set; }
    public int ExitCode { get; set; }
    public int OutputLines { get; set; }
    public int DurationMs { get; set; }
    public string SecurityLevel { get; set; } = "safe"; // safe, cautious, restricted
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
