namespace AiDevRequest.API.Entities;

public class ReactUseHookDemo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ComponentName { get; set; } = string.Empty;
    public string DataSource { get; set; } = string.Empty;    // api, graphql, websocket, cache
    public string Pattern { get; set; } = string.Empty;        // use-hook, use-effect, swr, react-query
    public bool SuspenseEnabled { get; set; }
    public bool ErrorBoundaryEnabled { get; set; }
    public bool RequestDedup { get; set; }
    public double RenderTimeMs { get; set; }
    public double DataFetchMs { get; set; }
    public int ReRenderCount { get; set; }
    public int BoilerplateLines { get; set; }
    public double PerformanceScore { get; set; }
    public string Status { get; set; } = "completed";          // completed, suspended, error
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
