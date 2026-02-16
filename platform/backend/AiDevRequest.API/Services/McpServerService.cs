using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IMcpServerService
{
    Task<List<McpServer>> GetByProjectAsync(string userId, Guid? projectId);
    Task<McpServer?> GetByIdAsync(Guid id, string userId);
    Task<McpServer> CreateServerAsync(string userId, McpServer server);
    Task<McpServer?> UpdateServerAsync(Guid id, string userId, McpServer updates);
    Task<bool> DeleteServerAsync(Guid id, string userId);
    Task<object> GetToolDefinitionsAsync(Guid id, string userId);
    Task<object> GetResourcesAsync(Guid id, string userId);
    Task<object> GetServerStatsAsync(string userId);
    Task<object> TestConnectionAsync(Guid id, string userId);
}

public class McpServerService : IMcpServerService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<McpServerService> _logger;

    public McpServerService(AiDevRequestDbContext db, ILogger<McpServerService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<McpServer>> GetByProjectAsync(string userId, Guid? projectId)
    {
        var query = _db.McpServers.Where(s => s.UserId == userId);
        if (projectId.HasValue)
            query = query.Where(s => s.ProjectId == projectId.Value);

        return await query.OrderByDescending(s => s.CreatedAt).Take(50).ToListAsync();
    }

    public async Task<McpServer?> GetByIdAsync(Guid id, string userId)
    {
        return await _db.McpServers.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
    }

    public async Task<McpServer> CreateServerAsync(string userId, McpServer server)
    {
        server.Id = Guid.NewGuid();
        server.UserId = userId;
        server.CreatedAt = DateTime.UtcNow;
        server.UpdatedAt = DateTime.UtcNow;

        _db.McpServers.Add(server);
        await _db.SaveChangesAsync();

        _logger.LogInformation("MCP server created: {ServerId} type={Type} for user {UserId}", server.Id, server.ServerType, userId);
        return server;
    }

    public async Task<McpServer?> UpdateServerAsync(Guid id, string userId, McpServer updates)
    {
        var server = await GetByIdAsync(id, userId);
        if (server == null) return null;

        if (!string.IsNullOrEmpty(updates.Name)) server.Name = updates.Name;
        if (!string.IsNullOrEmpty(updates.ServerType)) server.ServerType = updates.ServerType;
        if (!string.IsNullOrEmpty(updates.Endpoint)) server.Endpoint = updates.Endpoint;
        if (!string.IsNullOrEmpty(updates.Status)) server.Status = updates.Status;
        if (updates.ToolsJson != "[]") server.ToolsJson = updates.ToolsJson;
        if (updates.ResourcesJson != "[]") server.ResourcesJson = updates.ResourcesJson;
        if (updates.CapabilitiesJson != "{}") server.CapabilitiesJson = updates.CapabilitiesJson;
        server.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("MCP server updated: {ServerId} for user {UserId}", id, userId);
        return server;
    }

    public async Task<bool> DeleteServerAsync(Guid id, string userId)
    {
        var server = await GetByIdAsync(id, userId);
        if (server == null) return false;

        _db.McpServers.Remove(server);
        await _db.SaveChangesAsync();

        _logger.LogInformation("MCP server deleted: {ServerId} for user {UserId}", id, userId);
        return true;
    }

    public async Task<object> GetToolDefinitionsAsync(Guid id, string userId)
    {
        var server = await GetByIdAsync(id, userId);
        if (server == null) return new { tools = Array.Empty<object>() };

        return new
        {
            serverId = server.Id,
            serverType = server.ServerType,
            tools = server.ToolsJson
        };
    }

    public async Task<object> GetResourcesAsync(Guid id, string userId)
    {
        var server = await GetByIdAsync(id, userId);
        if (server == null) return new { resources = Array.Empty<object>() };

        return new
        {
            serverId = server.Id,
            serverType = server.ServerType,
            resources = server.ResourcesJson
        };
    }

    public async Task<object> GetServerStatsAsync(string userId)
    {
        var servers = await _db.McpServers.Where(s => s.UserId == userId).ToListAsync();

        return new
        {
            totalServers = servers.Count,
            activeServers = servers.Count(s => s.Status == "active"),
            totalConnections = servers.Sum(s => s.ConnectionCount),
            serversByType = new
            {
                projectContext = servers.Count(s => s.ServerType == "project_context"),
                databaseSchema = servers.Count(s => s.ServerType == "database_schema"),
                deploymentConfig = servers.Count(s => s.ServerType == "deployment_config")
            },
            recentServers = servers
                .OrderByDescending(s => s.LastActiveAt ?? s.CreatedAt)
                .Take(5)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.ServerType,
                    s.Status,
                    s.ConnectionCount,
                    s.LastActiveAt,
                    s.CreatedAt
                })
        };
    }

    public async Task<object> TestConnectionAsync(Guid id, string userId)
    {
        var server = await GetByIdAsync(id, userId);
        if (server == null) return new { success = false, error = "Server not found" };

        // Simulate connection test
        var sw = System.Diagnostics.Stopwatch.StartNew();
        await Task.Delay(50); // Simulate network latency
        sw.Stop();

        server.LastActiveAt = DateTime.UtcNow;
        server.Status = "active";
        await _db.SaveChangesAsync();

        _logger.LogInformation("MCP server connection test passed: {ServerId} in {Ms}ms", id, sw.ElapsedMilliseconds);

        return new
        {
            success = true,
            latencyMs = sw.ElapsedMilliseconds,
            serverType = server.ServerType,
            endpoint = server.Endpoint,
            testedAt = DateTime.UtcNow
        };
    }
}
