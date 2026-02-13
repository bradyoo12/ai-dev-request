namespace AiDevRequest.API.Entities;

public class AgentTerminalSession
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string AccessMode { get; set; } = "terminal"; // terminal, browser, both
    public string SandboxType { get; set; } = "docker"; // docker, firecracker, gvisor
    public int CommandsExecuted { get; set; }
    public int BrowserActions { get; set; }
    public int SubagentsDelegated { get; set; }
    public int FilesModified { get; set; }
    public double CpuLimitPercent { get; set; } = 50.0;
    public int MemoryLimitMb { get; set; } = 512;
    public int TimeoutMinutes { get; set; } = 30;
    public bool NetworkEgressAllowed { get; set; }
    public double SessionDurationMs { get; set; }
    public string Status { get; set; } = "idle"; // idle, running, completed, timeout, error
    public string OutputLog { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
