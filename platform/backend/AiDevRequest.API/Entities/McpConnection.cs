namespace AiDevRequest.API.Entities;

public class McpConnection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int? ProjectId { get; set; } // null for platform-level connections
    public string Name { get; set; } = string.Empty;
    public string ServerUrl { get; set; } = string.Empty;
    public string Transport { get; set; } = "sse"; // sse, stdio, grpc
    public string Status { get; set; } = "disconnected"; // disconnected, connecting, connected, error
    public string? AuthType { get; set; } // none, bearer, api-key
    public string? AuthToken { get; set; } // encrypted
    public string? AvailableTools { get; set; } // JSON array of tool definitions
    public string? AvailableResources { get; set; } // JSON array of resource definitions
    public int ToolCallCount { get; set; }
    public DateTime? LastConnectedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
