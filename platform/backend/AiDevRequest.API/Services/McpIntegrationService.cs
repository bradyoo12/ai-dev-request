using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IMcpIntegrationService
{
    List<McpToolDefinition> GetPlatformToolsAsync();
    Task<McpToolCallResult> CallPlatformToolAsync(string toolName, string arguments);
    Task<McpConnection> RegisterServerAsync(McpConnection connection);
    Task UnregisterServerAsync(Guid connectionId);
    Task<List<McpConnection>> ListServersAsync(int? projectId);
    Task<McpServerStatus> GetServerStatusAsync(Guid connectionId);
    Task<McpConnection> DiscoverToolsAsync(Guid connectionId);
    Task<McpToolCallResult> CallExternalToolAsync(Guid connectionId, string toolName, string arguments);
}

public class McpIntegrationService : IMcpIntegrationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<McpIntegrationService> _logger;

    private static readonly List<McpToolDefinition> PlatformTools =
    [
        new()
        {
            Name = "create_request",
            Description = "Create a new AI development request from a natural language description",
            InputSchema = JsonSerializer.Serialize(new
            {
                type = "object",
                properties = new
                {
                    description = new { type = "string", description = "Natural language description of the software to build" },
                    framework = new { type = "string", description = "Target framework (react, nextjs, flutter)" },
                    contactEmail = new { type = "string", description = "Contact email for notifications" }
                },
                required = new[] { "description" }
            })
        },
        new()
        {
            Name = "analyze_request",
            Description = "Run AI analysis on an existing development request to determine complexity, category, and feasibility",
            InputSchema = JsonSerializer.Serialize(new
            {
                type = "object",
                properties = new
                {
                    requestId = new { type = "integer", description = "ID of the development request to analyze" }
                },
                required = new[] { "requestId" }
            })
        },
        new()
        {
            Name = "generate_code",
            Description = "Generate code for a development request that has been analyzed and proposed",
            InputSchema = JsonSerializer.Serialize(new
            {
                type = "object",
                properties = new
                {
                    requestId = new { type = "integer", description = "ID of the development request to generate code for" }
                },
                required = new[] { "requestId" }
            })
        },
        new()
        {
            Name = "review_code",
            Description = "Run a code quality review on generated project files",
            InputSchema = JsonSerializer.Serialize(new
            {
                type = "object",
                properties = new
                {
                    requestId = new { type = "integer", description = "ID of the development request to review" }
                },
                required = new[] { "requestId" }
            })
        },
        new()
        {
            Name = "deploy_preview",
            Description = "Deploy a generated project to a preview environment",
            InputSchema = JsonSerializer.Serialize(new
            {
                type = "object",
                properties = new
                {
                    requestId = new { type = "integer", description = "ID of the development request to deploy" }
                },
                required = new[] { "requestId" }
            })
        }
    ];

    public McpIntegrationService(AiDevRequestDbContext context, ILogger<McpIntegrationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public List<McpToolDefinition> GetPlatformToolsAsync()
    {
        return PlatformTools;
    }

    public async Task<McpToolCallResult> CallPlatformToolAsync(string toolName, string arguments)
    {
        var tool = PlatformTools.FirstOrDefault(t => t.Name == toolName);
        if (tool == null)
        {
            return new McpToolCallResult
            {
                Success = false,
                Error = $"Unknown platform tool: {toolName}"
            };
        }

        _logger.LogInformation("Calling platform tool {ToolName} with args: {Arguments}", toolName, arguments);

        // Simulate tool execution — in production this would dispatch to the actual service
        var result = toolName switch
        {
            "create_request" => new McpToolCallResult
            {
                Success = true,
                Result = JsonSerializer.Serialize(new { message = "Request created", toolName, status = "pending_analysis" })
            },
            "analyze_request" => new McpToolCallResult
            {
                Success = true,
                Result = JsonSerializer.Serialize(new { message = "Analysis started", toolName, status = "analyzing" })
            },
            "generate_code" => new McpToolCallResult
            {
                Success = true,
                Result = JsonSerializer.Serialize(new { message = "Code generation started", toolName, status = "generating" })
            },
            "review_code" => new McpToolCallResult
            {
                Success = true,
                Result = JsonSerializer.Serialize(new { message = "Code review started", toolName, status = "reviewing" })
            },
            "deploy_preview" => new McpToolCallResult
            {
                Success = true,
                Result = JsonSerializer.Serialize(new { message = "Preview deployment started", toolName, status = "deploying" })
            },
            _ => new McpToolCallResult { Success = false, Error = $"Unhandled tool: {toolName}" }
        };

        await Task.CompletedTask;
        return result;
    }

    public async Task<McpConnection> RegisterServerAsync(McpConnection connection)
    {
        connection.Id = Guid.NewGuid();
        connection.Status = "disconnected";
        connection.CreatedAt = DateTime.UtcNow;

        _context.McpConnections.Add(connection);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Registered MCP server: {Name} at {Url}", connection.Name, connection.ServerUrl);

        return connection;
    }

    public async Task UnregisterServerAsync(Guid connectionId)
    {
        var connection = await _context.McpConnections.FindAsync(connectionId);
        if (connection == null)
            throw new InvalidOperationException($"MCP connection not found: {connectionId}");

        _context.McpConnections.Remove(connection);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Unregistered MCP server: {Name} ({Id})", connection.Name, connectionId);
    }

    public async Task<List<McpConnection>> ListServersAsync(int? projectId)
    {
        var query = _context.McpConnections.AsQueryable();

        if (projectId.HasValue)
            query = query.Where(c => c.ProjectId == projectId.Value);

        return await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
    }

    public async Task<McpServerStatus> GetServerStatusAsync(Guid connectionId)
    {
        var connection = await _context.McpConnections.FindAsync(connectionId);
        if (connection == null)
            throw new InvalidOperationException($"MCP connection not found: {connectionId}");

        // Simulate health check — in production this would ping the actual server
        return new McpServerStatus
        {
            ConnectionId = connection.Id,
            Name = connection.Name,
            Status = connection.Status,
            LastConnectedAt = connection.LastConnectedAt,
            ToolCount = CountJsonArray(connection.AvailableTools),
            ResourceCount = CountJsonArray(connection.AvailableResources),
            ToolCallCount = connection.ToolCallCount,
            ErrorMessage = connection.ErrorMessage,
        };
    }

    public async Task<McpConnection> DiscoverToolsAsync(Guid connectionId)
    {
        var connection = await _context.McpConnections.FindAsync(connectionId);
        if (connection == null)
            throw new InvalidOperationException($"MCP connection not found: {connectionId}");

        _logger.LogInformation("Discovering tools from MCP server: {Name} at {Url}", connection.Name, connection.ServerUrl);

        // Simulate tool discovery — in production this would call the MCP server's tools/list endpoint
        var simulatedTools = new[]
        {
            new McpToolDefinition
            {
                Name = "example_tool",
                Description = $"Example tool from {connection.Name}",
                InputSchema = JsonSerializer.Serialize(new { type = "object", properties = new { input = new { type = "string" } } })
            }
        };

        var simulatedResources = new[]
        {
            new McpResourceDefinition
            {
                Uri = $"mcp://{connection.Name}/example",
                Name = "Example Resource",
                Description = $"Example resource from {connection.Name}",
                MimeType = "application/json"
            }
        };

        connection.AvailableTools = JsonSerializer.Serialize(simulatedTools);
        connection.AvailableResources = JsonSerializer.Serialize(simulatedResources);
        connection.Status = "connected";
        connection.LastConnectedAt = DateTime.UtcNow;
        connection.ErrorMessage = null;
        connection.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return connection;
    }

    public async Task<McpToolCallResult> CallExternalToolAsync(Guid connectionId, string toolName, string arguments)
    {
        var connection = await _context.McpConnections.FindAsync(connectionId);
        if (connection == null)
        {
            return new McpToolCallResult
            {
                Success = false,
                Error = $"MCP connection not found: {connectionId}"
            };
        }

        _logger.LogInformation("Calling tool {ToolName} on MCP server {ServerName}", toolName, connection.Name);

        // Simulate external tool call — in production this would forward the request to the MCP server
        connection.ToolCallCount++;
        connection.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new McpToolCallResult
        {
            Success = true,
            Result = JsonSerializer.Serialize(new
            {
                message = $"Tool '{toolName}' executed on server '{connection.Name}'",
                serverUrl = connection.ServerUrl,
                arguments,
            })
        };
    }

    private static int CountJsonArray(string? json)
    {
        if (string.IsNullOrEmpty(json)) return 0;
        try
        {
            var arr = JsonSerializer.Deserialize<JsonElement[]>(json);
            return arr?.Length ?? 0;
        }
        catch
        {
            return 0;
        }
    }
}

// === Supporting Types ===

public class McpToolDefinition
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string InputSchema { get; set; } = "{}";
}

public class McpResourceDefinition
{
    public string Uri { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string MimeType { get; set; } = "";
}

public class McpToolCallResult
{
    public bool Success { get; set; }
    public string? Result { get; set; }
    public string? Error { get; set; }
}

public class McpServerStatus
{
    public Guid ConnectionId { get; set; }
    public string Name { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime? LastConnectedAt { get; set; }
    public int ToolCount { get; set; }
    public int ResourceCount { get; set; }
    public int ToolCallCount { get; set; }
    public string? ErrorMessage { get; set; }
}
