using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agent-sdk")]
public class AgentSdkController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public AgentSdkController(AiDevRequestDbContext db) => _db = db;

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.AgentSdkSessions
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [Authorize]
    [HttpPost("execute")]
    public async Task<IActionResult> Execute([FromBody] ExecuteAgentRequest req)
    {
        var session = new AgentSdkSession
        {
            UserId = User.FindFirst("sub")?.Value ?? "",
            ProjectName = req.ProjectName,
            TaskDescription = req.TaskDescription,
            AgentModel = req.AgentModel
        };

        var rng = new Random();

        // Simulate agent loop execution
        session.ToolCallsTotal = rng.Next(8, 65);
        session.ToolCallsSucceeded = session.ToolCallsTotal - rng.Next(0, 3);
        session.SubagentsSpawned = rng.Next(0, 5);
        session.SkillsInvoked = rng.Next(1, 8);
        session.McpServersConnected = rng.Next(0, 4);
        session.ContextTokensUsed = rng.Next(15000, 180000);
        session.ContextCompressions = rng.Next(0, 3);
        session.RetryAttempts = rng.Next(0, 4);
        session.SuccessRate = Math.Round(88.0 + rng.NextDouble() * 12.0, 1);
        session.DurationMs = rng.Next(3000, 45000);

        // Simulate tool call breakdown
        var toolTypes = new[] { "Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebSearch", "WebFetch", "Task" };
        var toolBreakdown = toolTypes.Select(t => new
        {
            tool = t,
            calls = rng.Next(0, 15),
            avgDurationMs = rng.Next(50, 2000),
            successRate = Math.Round(90.0 + rng.NextDouble() * 10.0, 1)
        }).Where(t => t.calls > 0).ToList();

        // Simulate subagent details
        var subagentDetails = Enumerable.Range(1, session.SubagentsSpawned).Select(i => new
        {
            id = i,
            name = $"agent-{(new[] { "frontend", "backend", "tester", "reviewer", "planner" })[rng.Next(5)]}",
            model = (new[] { "claude-opus-4-6", "claude-sonnet-4-5", "claude-haiku-4-5" })[rng.Next(3)],
            toolCalls = rng.Next(3, 20),
            tokensUsed = rng.Next(5000, 50000),
            durationMs = rng.Next(2000, 20000),
            status = "completed"
        }).ToList();

        // Simulate skill invocations
        var skillNames = new[] { "code-generation", "code-review", "test-generation", "refactoring", "documentation", "debugging", "deployment" };
        var skillDetails = Enumerable.Range(0, session.SkillsInvoked).Select(i => new
        {
            name = skillNames[rng.Next(skillNames.Length)],
            durationMs = rng.Next(500, 8000),
            success = rng.NextDouble() > 0.05
        }).ToList();

        // Simulate MCP server connections
        var mcpServers = new[] { "github", "filesystem", "database", "browser", "slack", "jira" };
        var mcpDetails = Enumerable.Range(0, session.McpServersConnected).Select(i => new
        {
            server = mcpServers[rng.Next(mcpServers.Length)],
            toolsAvailable = rng.Next(3, 15),
            callsMade = rng.Next(1, 10),
            latencyMs = rng.Next(20, 200)
        }).ToList();

        _db.AgentSdkSessions.Add(session);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            session,
            toolBreakdown,
            subagentDetails,
            skillDetails,
            mcpDetails,
            agentLoop = new
            {
                totalTurns = rng.Next(5, 30),
                avgTurnDurationMs = rng.Next(500, 3000),
                contextWindowUsage = Math.Round(session.ContextTokensUsed / 200000.0 * 100, 1),
                compressionsSaved = session.ContextCompressions * rng.Next(10000, 40000)
            }
        });
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.AgentSdkSessions.FindAsync(id);
        if (item == null) return NotFound();
        _db.AgentSdkSessions.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await _db.AgentSdkSessions.ToListAsync();
        if (!all.Any()) return Ok(new { totalSessions = 0 });

        return Ok(new
        {
            totalSessions = all.Count,
            avgSuccessRate = Math.Round(all.Average(x => x.SuccessRate), 1),
            totalToolCalls = all.Sum(x => x.ToolCallsTotal),
            totalSubagents = all.Sum(x => x.SubagentsSpawned),
            totalSkills = all.Sum(x => x.SkillsInvoked),
            totalMcpServers = all.Sum(x => x.McpServersConnected),
            avgDurationMs = (int)all.Average(x => x.DurationMs),
            byModel = all.GroupBy(x => x.AgentModel)
                .Select(g => new
                {
                    model = g.Key,
                    count = g.Count(),
                    avgSuccessRate = Math.Round(g.Average(x => x.SuccessRate), 1)
                })
        });
    }

    [AllowAnonymous]
    [HttpGet("models")]
    public IActionResult Models()
    {
        return Ok(new[]
        {
            new { id = "claude-opus-4-6", name = "Claude Opus 4.6", description = "Most capable model for complex coding and architecture tasks", recommended = true, color = "#7C3AED" },
            new { id = "claude-sonnet-4-5", name = "Claude Sonnet 4.5", description = "Balanced performance and speed for standard development tasks", recommended = false, color = "#2563EB" },
            new { id = "claude-haiku-4-5", name = "Claude Haiku 4.5", description = "Fast and cost-effective for simple tasks and quick lookups", recommended = false, color = "#059669" }
        });
    }
}

public record ExecuteAgentRequest(string ProjectName, string TaskDescription, string AgentModel = "claude-opus-4-6");
