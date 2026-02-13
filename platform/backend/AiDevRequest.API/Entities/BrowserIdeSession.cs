namespace AiDevRequest.API.Entities;

public class BrowserIdeSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProjectName { get; set; } = string.Empty;
    public string Runtime { get; set; } = string.Empty;         // react, node, vanilla, typescript
    public string Code { get; set; } = string.Empty;
    public int LinesOfCode { get; set; }
    public int PackagesInstalled { get; set; }
    public double ExecutionTimeMs { get; set; }
    public bool HasErrors { get; set; }
    public int ErrorCount { get; set; }
    public int ConsoleOutputLines { get; set; }
    public bool LivePreviewEnabled { get; set; }
    public bool SharedLink { get; set; }
    public string ShareId { get; set; } = string.Empty;
    public int ForkCount { get; set; }
    public double MemoryUsageMb { get; set; }
    public string Status { get; set; } = "completed";           // completed, running, error, shared
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
