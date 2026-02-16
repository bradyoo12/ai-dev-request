namespace AiDevRequest.API.Entities;

public class McpServer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ServerType { get; set; } = "project_context";  // project_context, database_schema, deployment_config
    public string Endpoint { get; set; } = string.Empty;
    public string Status { get; set; } = "inactive";              // active, inactive, error
    public string ToolsJson { get; set; } = "[]";                 // JSON array of tool definitions
    public string ResourcesJson { get; set; } = "[]";             // JSON array of resource definitions
    public string CapabilitiesJson { get; set; } = "{}";
    public int ConnectionCount { get; set; }
    public DateTime? LastActiveAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
