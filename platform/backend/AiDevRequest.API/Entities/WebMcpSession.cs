namespace AiDevRequest.API.Entities;

public class WebMcpSession
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public string BrowserType { get; set; } = "chrome"; // chrome, edge, safari
    public int ElementsDiscovered { get; set; }
    public int ActionsPerformed { get; set; }
    public int EventsCaptured { get; set; }
    public int DomNodesAnalyzed { get; set; }
    public double SemanticAccuracy { get; set; }
    public double ActionReliability { get; set; }
    public int SessionDurationMs { get; set; }
    public string Protocol { get; set; } = "webmcp-v1"; // webmcp-v1, webmcp-v2
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
