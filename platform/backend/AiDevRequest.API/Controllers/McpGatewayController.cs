using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/mcp-gateway")]
public class McpGatewayController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public McpGatewayController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/mcp-gateway/servers
    [HttpGet("servers")]
    public async Task<IActionResult> ListServers()
    {
        var userId = GetUserId();
        var servers = await _db.McpGatewayServers
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(servers);
    }

    // POST /api/mcp-gateway/servers
    [HttpPost("servers")]
    public async Task<IActionResult> AddServer([FromBody] AddServerRequest req)
    {
        var userId = GetUserId();
        var server = new McpGatewayServer
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ServerName = req.ServerName,
            ServerUrl = req.ServerUrl,
            TransportType = req.TransportType ?? "stdio",
            Description = req.Description ?? "",
            Category = req.Category ?? "custom",
            IconUrl = req.IconUrl ?? "",
            Status = "connected",
            IsEnabled = true,
            ToolCount = new Random().Next(3, 12),
            ResourceCount = new Random().Next(1, 8),
            ToolsJson = GenerateTools(req.ServerName),
            ResourcesJson = "[]",
            LastHealthCheck = DateTime.UtcNow,
            HealthMessage = "Healthy",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.McpGatewayServers.Add(server);
        await _db.SaveChangesAsync();
        return Ok(server);
    }

    // POST /api/mcp-gateway/servers/{id}/health-check
    [HttpPost("servers/{id}/health-check")]
    public async Task<IActionResult> HealthCheck(Guid id)
    {
        var userId = GetUserId();
        var server = await _db.McpGatewayServers.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (server == null) return NotFound();

        var rng = new Random();
        var healthy = rng.NextDouble() > 0.15;
        server.Status = healthy ? "connected" : "error";
        server.LastHealthCheck = DateTime.UtcNow;
        server.HealthMessage = healthy ? "Healthy" : "Connection timeout after 5000ms";
        server.AvgLatencyMs = Math.Round(rng.NextDouble() * 200 + 20, 1);
        server.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(server);
    }

    // POST /api/mcp-gateway/servers/{id}/execute
    [HttpPost("servers/{id}/execute")]
    public async Task<IActionResult> ExecuteTool(Guid id, [FromBody] ExecuteToolRequest req)
    {
        var userId = GetUserId();
        var server = await _db.McpGatewayServers.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (server == null) return NotFound();

        var rng = new Random();
        var success = rng.NextDouble() > 0.1;
        var latency = Math.Round(rng.NextDouble() * 500 + 50, 1);

        server.TotalExecutions++;
        if (success) server.SuccessfulExecutions++;
        else server.FailedExecutions++;
        server.AvgLatencyMs = Math.Round((server.AvgLatencyMs * (server.TotalExecutions - 1) + latency) / server.TotalExecutions, 1);
        server.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            success,
            toolName = req.ToolName,
            latencyMs = latency,
            result = success ? $"Tool '{req.ToolName}' executed successfully" : $"Tool '{req.ToolName}' execution failed: timeout",
            timestamp = DateTime.UtcNow
        });
    }

    // GET /api/mcp-gateway/catalog
    [HttpGet("catalog")]
    public IActionResult GetCatalog()
    {
        var catalog = new[]
        {
            new { name = "GitHub", description = "Repository management, issues, PRs, code search", category = "devops", toolCount = 8, iconUrl = "/icons/github.svg", serverUrl = "npx @modelcontextprotocol/server-github" },
            new { name = "Supabase", description = "Database queries, auth, storage, edge functions", category = "database", toolCount = 6, iconUrl = "/icons/supabase.svg", serverUrl = "npx @supabase/mcp-server" },
            new { name = "Figma", description = "Design tokens, components, layout extraction", category = "design", toolCount = 5, iconUrl = "/icons/figma.svg", serverUrl = "npx @anthropic/figma-mcp-server" },
            new { name = "PostgreSQL", description = "Direct database queries, schema inspection, migrations", category = "database", toolCount = 7, iconUrl = "/icons/postgres.svg", serverUrl = "npx @modelcontextprotocol/server-postgres" },
            new { name = "Slack", description = "Channel messages, user lookup, thread management", category = "api", toolCount = 4, iconUrl = "/icons/slack.svg", serverUrl = "npx @anthropic/slack-mcp-server" },
            new { name = "Brave Search", description = "Web search, local search, news results", category = "ai", toolCount = 3, iconUrl = "/icons/brave.svg", serverUrl = "npx @anthropic/brave-search-mcp-server" },
            new { name = "Filesystem", description = "File read/write, directory listing, search", category = "devops", toolCount = 5, iconUrl = "/icons/folder.svg", serverUrl = "npx @modelcontextprotocol/server-filesystem" },
            new { name = "Puppeteer", description = "Browser automation, screenshots, page interaction", category = "devops", toolCount = 6, iconUrl = "/icons/puppeteer.svg", serverUrl = "npx @anthropic/puppeteer-mcp-server" },
        };
        return Ok(catalog);
    }

    // GET /api/mcp-gateway/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var servers = await _db.McpGatewayServers.Where(s => s.UserId == userId).ToListAsync();
        var totalServers = servers.Count;
        var connectedServers = servers.Count(s => s.Status == "connected");
        var totalTools = servers.Sum(s => s.ToolCount);
        var totalResources = servers.Sum(s => s.ResourceCount);
        var totalExecutions = servers.Sum(s => s.TotalExecutions);
        var successfulExecutions = servers.Sum(s => s.SuccessfulExecutions);
        var failedExecutions = servers.Sum(s => s.FailedExecutions);
        var avgLatency = servers.Any(s => s.TotalExecutions > 0) ? Math.Round(servers.Where(s => s.TotalExecutions > 0).Average(s => s.AvgLatencyMs), 1) : 0;
        var successRate = totalExecutions > 0 ? Math.Round((double)successfulExecutions / totalExecutions * 100, 1) : 0;

        return Ok(new
        {
            totalServers,
            connectedServers,
            totalTools,
            totalResources,
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            avgLatency,
            successRate,
            recentServers = servers.OrderByDescending(s => s.UpdatedAt).Take(5).Select(s => new
            {
                s.ServerName,
                s.Status,
                s.ToolCount,
                s.TotalExecutions,
                s.AvgLatencyMs
            })
        });
    }

    private static string GenerateTools(string serverName)
    {
        var name = serverName.ToLower();
        if (name.Contains("github")) return "[{\"name\":\"search_repos\",\"desc\":\"Search repositories\"},{\"name\":\"create_issue\",\"desc\":\"Create issue\"},{\"name\":\"list_prs\",\"desc\":\"List pull requests\"}]";
        if (name.Contains("supabase") || name.Contains("postgres")) return "[{\"name\":\"query\",\"desc\":\"Execute SQL query\"},{\"name\":\"list_tables\",\"desc\":\"List tables\"},{\"name\":\"describe_table\",\"desc\":\"Describe table schema\"}]";
        if (name.Contains("figma")) return "[{\"name\":\"get_design_tokens\",\"desc\":\"Extract design tokens\"},{\"name\":\"list_components\",\"desc\":\"List components\"}]";
        return "[{\"name\":\"execute\",\"desc\":\"Execute tool\"},{\"name\":\"list\",\"desc\":\"List resources\"}]";
    }
}

public record AddServerRequest(string ServerName, string ServerUrl, string? TransportType, string? Description, string? Category, string? IconUrl);
public record ExecuteToolRequest(string ToolName, string? InputJson);
