namespace AiDevRequest.API.Entities;

public class ParallelAgentRun
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TaskDescription { get; set; } = string.Empty;
    public int AgentCount { get; set; }
    public int SubtasksTotal { get; set; }
    public int SubtasksCompleted { get; set; }
    public int MergeConflicts { get; set; }
    public int AutoResolved { get; set; }
    public int FilesModified { get; set; }
    public int LinesChanged { get; set; }
    public int DurationMs { get; set; }
    public double SpeedupFactor { get; set; }
    public string IsolationMode { get; set; } = "worktree"; // worktree, branch, fork
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
