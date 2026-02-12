namespace AiDevRequest.API.Entities;

public class McpToolIntegration
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public bool McpEnabled { get; set; } = true;
    public bool AutoAttachTools { get; set; } = false;
    public string ContextDepthLevel { get; set; } = "standard"; // shallow, standard, deep
    public bool FileReadEnabled { get; set; } = true;
    public bool FileWriteEnabled { get; set; } = true;
    public bool SearchDocsEnabled { get; set; } = true;
    public bool ResolveDepsEnabled { get; set; } = true;
    public bool QueryDbEnabled { get; set; } = false;
    public bool RunTestsEnabled { get; set; } = false;
    public bool LintCodeEnabled { get; set; } = true;
    public bool BrowseWebEnabled { get; set; } = false;
    public int TotalExecutions { get; set; }
    public int SuccessfulExecutions { get; set; }
    public int FailedExecutions { get; set; }
    public double AvgLatencyMs { get; set; }
    public long TokensSaved { get; set; }
    public string ExecutionHistoryJson { get; set; } = "[]";
    public string CustomServersJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
