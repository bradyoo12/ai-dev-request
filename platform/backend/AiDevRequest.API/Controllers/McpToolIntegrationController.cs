using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/mcp-tools")]
public class McpToolIntegrationController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public McpToolIntegrationController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "anonymous";

    // GET /api/mcp-tools/config
    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var userId = GetUserId();
        var config = await _db.McpToolIntegrations.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new McpToolIntegration
            {
                Id = Guid.NewGuid(),
                UserId = userId,
            };
            _db.McpToolIntegrations.Add(config);
            await _db.SaveChangesAsync();
        }
        return Ok(config);
    }

    // PUT /api/mcp-tools/config
    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] UpdateMcpToolConfigRequest request)
    {
        var userId = GetUserId();
        var config = await _db.McpToolIntegrations.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return NotFound();

        if (request.McpEnabled.HasValue) config.McpEnabled = request.McpEnabled.Value;
        if (request.AutoAttachTools.HasValue) config.AutoAttachTools = request.AutoAttachTools.Value;
        if (!string.IsNullOrEmpty(request.ContextDepthLevel))
        {
            var validLevels = new[] { "shallow", "standard", "deep" };
            if (validLevels.Contains(request.ContextDepthLevel.ToLowerInvariant()))
                config.ContextDepthLevel = request.ContextDepthLevel.ToLowerInvariant();
        }
        if (request.FileReadEnabled.HasValue) config.FileReadEnabled = request.FileReadEnabled.Value;
        if (request.FileWriteEnabled.HasValue) config.FileWriteEnabled = request.FileWriteEnabled.Value;
        if (request.SearchDocsEnabled.HasValue) config.SearchDocsEnabled = request.SearchDocsEnabled.Value;
        if (request.ResolveDepsEnabled.HasValue) config.ResolveDepsEnabled = request.ResolveDepsEnabled.Value;
        if (request.QueryDbEnabled.HasValue) config.QueryDbEnabled = request.QueryDbEnabled.Value;
        if (request.RunTestsEnabled.HasValue) config.RunTestsEnabled = request.RunTestsEnabled.Value;
        if (request.LintCodeEnabled.HasValue) config.LintCodeEnabled = request.LintCodeEnabled.Value;
        if (request.BrowseWebEnabled.HasValue) config.BrowseWebEnabled = request.BrowseWebEnabled.Value;
        if (request.CustomServersJson != null) config.CustomServersJson = request.CustomServersJson;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(config);
    }

    // GET /api/mcp-tools/tools
    [HttpGet("tools")]
    public IActionResult ListTools()
    {
        var tools = new[]
        {
            new { id = "file_read", name = "File Read", description = "Read file contents from the project workspace", category = "filesystem", icon = "file-text" },
            new { id = "file_write", name = "File Write", description = "Write or update files in the project workspace", category = "filesystem", icon = "file-plus" },
            new { id = "search_docs", name = "Search Docs", description = "Search documentation, APIs, and knowledge bases", category = "knowledge", icon = "search" },
            new { id = "resolve_deps", name = "Resolve Dependencies", description = "Resolve and analyze project dependencies and versions", category = "knowledge", icon = "package" },
            new { id = "query_db", name = "Query Database", description = "Execute read-only queries against the project database", category = "data", icon = "database" },
            new { id = "run_tests", name = "Run Tests", description = "Execute test suites and return results", category = "quality", icon = "check-circle" },
            new { id = "lint_code", name = "Lint Code", description = "Run linting and static analysis on generated code", category = "quality", icon = "alert-triangle" },
            new { id = "browse_web", name = "Browse Web", description = "Fetch and parse web pages for reference material", category = "external", icon = "globe" },
        };
        return Ok(tools);
    }

    // POST /api/mcp-tools/execute
    [HttpPost("execute")]
    public async Task<IActionResult> ExecuteTool([FromBody] McpToolExecuteRequest request)
    {
        var userId = GetUserId();
        var config = await _db.McpToolIntegrations.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return NotFound("MCP config not found. Call GET /api/mcp-tools/config first.");

        if (!config.McpEnabled) return BadRequest("MCP tools are disabled.");

        var validTools = new[] { "file_read", "file_write", "search_docs", "resolve_deps", "query_db", "run_tests", "lint_code", "browse_web" };
        if (!validTools.Contains(request.ToolName)) return BadRequest($"Unknown tool: {request.ToolName}");

        // Check if the tool is enabled
        var isEnabled = request.ToolName switch
        {
            "file_read" => config.FileReadEnabled,
            "file_write" => config.FileWriteEnabled,
            "search_docs" => config.SearchDocsEnabled,
            "resolve_deps" => config.ResolveDepsEnabled,
            "query_db" => config.QueryDbEnabled,
            "run_tests" => config.RunTestsEnabled,
            "lint_code" => config.LintCodeEnabled,
            "browse_web" => config.BrowseWebEnabled,
            _ => false,
        };
        if (!isEnabled) return BadRequest($"Tool '{request.ToolName}' is disabled.");

        // Simulate tool execution
        var startTime = DateTime.UtcNow;
        var rng = new Random();
        var latencyMs = rng.Next(50, 500);
        await Task.Delay(Math.Min(latencyMs, 100)); // Simulate some work (capped for responsiveness)

        var success = rng.NextDouble() > 0.05; // 95% success rate
        var output = GenerateMockOutput(request.ToolName, request.Input ?? "");
        var tokensSaved = rng.Next(100, 2000);

        // Record execution in history
        var history = JsonSerializer.Deserialize<List<ToolExecutionEntry>>(config.ExecutionHistoryJson) ?? new();
        history.Insert(0, new ToolExecutionEntry
        {
            ToolName = request.ToolName,
            Input = request.Input ?? "",
            Output = success ? output : "Tool execution failed: simulated error",
            Success = success,
            LatencyMs = latencyMs,
            Timestamp = DateTime.UtcNow,
        });
        // Keep only last 50 entries
        if (history.Count > 50) history = history.Take(50).ToList();

        config.ExecutionHistoryJson = JsonSerializer.Serialize(history);
        config.TotalExecutions++;
        if (success)
            config.SuccessfulExecutions++;
        else
            config.FailedExecutions++;

        // Update avg latency
        config.AvgLatencyMs = ((config.AvgLatencyMs * (config.TotalExecutions - 1)) + latencyMs) / config.TotalExecutions;
        config.TokensSaved += tokensSaved;
        config.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            toolName = request.ToolName,
            input = request.Input,
            output = success ? output : "Tool execution failed: simulated error",
            success,
            latencyMs,
            tokensSaved,
            timestamp = DateTime.UtcNow,
        });
    }

    // GET /api/mcp-tools/history
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var userId = GetUserId();
        var config = await _db.McpToolIntegrations.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return Ok(Array.Empty<object>());

        var history = JsonSerializer.Deserialize<List<ToolExecutionEntry>>(config.ExecutionHistoryJson) ?? new();
        return Ok(history.Take(50));
    }

    // GET /api/mcp-tools/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var config = await _db.McpToolIntegrations.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            return Ok(new
            {
                totalExecutions = 0,
                successfulExecutions = 0,
                failedExecutions = 0,
                successRate = 0.0,
                avgLatencyMs = 0.0,
                tokensSaved = 0L,
                byToolType = Array.Empty<object>(),
                mostUsedTool = (string?)null,
                customServers = 0,
            });
        }

        var history = JsonSerializer.Deserialize<List<ToolExecutionEntry>>(config.ExecutionHistoryJson) ?? new();
        var byToolType = history
            .GroupBy(h => h.ToolName)
            .Select(g => new
            {
                toolName = g.Key,
                count = g.Count(),
                successCount = g.Count(h => h.Success),
                avgLatency = Math.Round(g.Average(h => h.LatencyMs), 1),
            })
            .OrderByDescending(g => g.count)
            .ToList();

        var customServers = JsonSerializer.Deserialize<List<object>>(config.CustomServersJson) ?? new();
        var successRate = config.TotalExecutions > 0
            ? Math.Round((double)config.SuccessfulExecutions / config.TotalExecutions * 100, 1)
            : 0.0;

        return Ok(new
        {
            totalExecutions = config.TotalExecutions,
            successfulExecutions = config.SuccessfulExecutions,
            failedExecutions = config.FailedExecutions,
            successRate,
            avgLatencyMs = Math.Round(config.AvgLatencyMs, 1),
            tokensSaved = config.TokensSaved,
            byToolType,
            mostUsedTool = byToolType.FirstOrDefault()?.toolName,
            customServers = customServers.Count,
        });
    }

    // --- Helpers ---

    private static string GenerateMockOutput(string toolName, string input)
    {
        return toolName switch
        {
            "file_read" => $"// Contents of {(string.IsNullOrEmpty(input) ? "src/index.ts" : input)}\nimport {{ useState }} from 'react';\n\nexport default function App() {{\n  const [count, setCount] = useState(0);\n  return <div>Count: {{count}}</div>;\n}}",
            "file_write" => $"Successfully wrote {(string.IsNullOrEmpty(input) ? "src/component.tsx" : input)} (247 bytes)",
            "search_docs" => $"Found 3 relevant results for \"{(string.IsNullOrEmpty(input) ? "React hooks" : input)}\":\n1. useState - Manages local state in function components\n2. useEffect - Performs side effects in function components\n3. useContext - Subscribes to React context",
            "resolve_deps" => "Resolved dependencies:\n- react@18.2.0 (up to date)\n- typescript@5.3.3 (up to date)\n- vite@5.0.12 (update available: 5.1.0)\n- tailwindcss@3.4.1 (up to date)",
            "query_db" => "Query result (3 rows):\n| id | name | status |\n|----|------|--------|\n| 1  | ProjectA | active |\n| 2  | ProjectB | draft  |\n| 3  | ProjectC | active |",
            "run_tests" => "Test Results:\n  12 passed, 0 failed, 2 skipped\n  Test Suites: 3 passed, 3 total\n  Time: 2.45s",
            "lint_code" => "Lint Results:\n  0 errors, 2 warnings\n  - Warning: Unused variable 'temp' at line 42\n  - Warning: Missing return type on function at line 67",
            "browse_web" => $"Fetched content from {(string.IsNullOrEmpty(input) ? "https://docs.example.com" : input)}:\nTitle: API Documentation\nSummary: Complete reference for REST API endpoints including authentication, rate limiting, and response formats.",
            _ => "Execution completed successfully.",
        };
    }
}

public class UpdateMcpToolConfigRequest
{
    public bool? McpEnabled { get; set; }
    public bool? AutoAttachTools { get; set; }
    public string? ContextDepthLevel { get; set; }
    public bool? FileReadEnabled { get; set; }
    public bool? FileWriteEnabled { get; set; }
    public bool? SearchDocsEnabled { get; set; }
    public bool? ResolveDepsEnabled { get; set; }
    public bool? QueryDbEnabled { get; set; }
    public bool? RunTestsEnabled { get; set; }
    public bool? LintCodeEnabled { get; set; }
    public bool? BrowseWebEnabled { get; set; }
    public string? CustomServersJson { get; set; }
}

public class McpToolExecuteRequest
{
    public string ToolName { get; set; } = string.Empty;
    public string? Input { get; set; }
}

public class ToolExecutionEntry
{
    public string ToolName { get; set; } = string.Empty;
    public string Input { get; set; } = string.Empty;
    public string Output { get; set; } = string.Empty;
    public bool Success { get; set; }
    public int LatencyMs { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
