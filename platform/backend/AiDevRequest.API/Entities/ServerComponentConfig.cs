namespace AiDevRequest.API.Entities;

public class ServerComponentConfig
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Framework { get; set; } = "nextjs"; // nextjs, remix, vite-rsc
    public string RenderStrategy { get; set; } = "hybrid"; // ssr, ssc, hybrid, client-only
    public bool StreamingEnabled { get; set; } = true;
    public bool MetadataHoisting { get; set; } = true;
    public bool DirectDbAccess { get; set; }
    public string DataFetchingPattern { get; set; } = "server-fetch"; // server-fetch, use-server, api-route
    public int ServerComponentCount { get; set; }
    public int ClientComponentCount { get; set; }
    public double BundleSizeReductionPercent { get; set; }
    public double InitialLoadMs { get; set; }
    public string Status { get; set; } = "configured"; // configured, migrating, optimized, error
    public string MigrationNotes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
