using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agent-terminal")]
[Authorize]
public class AgentTerminalController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public AgentTerminalController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListSessions()
    {
        var userId = GetUserId();
        var sessions = await _db.AgentTerminalSessions.Where(s => s.UserId == userId).OrderByDescending(s => s.UpdatedAt).Take(50).ToListAsync();
        return Ok(sessions);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.AgentTerminalSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();
        return Ok(session);
    }

    public record RunCommandRequest(string? ProjectName, string? Command, string? AccessMode, string? SandboxType);

    [HttpPost("execute")]
    public async Task<IActionResult> ExecuteCommand([FromBody] RunCommandRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();

        var commands = rng.Next(3, 12);
        var browserActs = req.AccessMode == "browser" || req.AccessMode == "both" ? rng.Next(2, 8) : 0;
        var subagents = rng.Next(0, 4);
        var files = rng.Next(1, 6);
        var duration = Math.Round(rng.NextDouble() * 5000 + 1000, 0);

        var session = new AgentTerminalSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = req.ProjectName ?? "my-project",
            AccessMode = req.AccessMode ?? "terminal",
            SandboxType = req.SandboxType ?? "docker",
            CommandsExecuted = commands,
            BrowserActions = browserActs,
            SubagentsDelegated = subagents,
            FilesModified = files,
            SessionDurationMs = duration,
            Status = rng.NextDouble() > 0.9 ? "error" : "completed",
            OutputLog = GenerateLog(rng, req.Command ?? "npm install"),
        };

        _db.AgentTerminalSessions.Add(session);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            session,
            commandResults = Enumerable.Range(0, commands).Select(i => new
            {
                command = GetSampleCommand(rng),
                exitCode = rng.NextDouble() > 0.85 ? 1 : 0,
                output = "✓ Operation completed successfully",
                durationMs = Math.Round(rng.NextDouble() * 2000 + 100, 0),
            }).ToList(),
            browserResults = browserActs > 0 ? Enumerable.Range(0, browserActs).Select(i => new
            {
                action = GetSampleBrowserAction(rng),
                url = "http://localhost:3000" + new[] { "/", "/dashboard", "/settings", "/login" }[rng.Next(4)],
                screenshot = false,
                consoleErrors = rng.Next(0, 2),
            }).ToList() : null,
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.AgentTerminalSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();
        _db.AgentTerminalSessions.Remove(session);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var sessions = await _db.AgentTerminalSessions.Where(s => s.UserId == userId).ToListAsync();
        if (sessions.Count == 0)
            return Ok(new { totalSessions = 0, totalCommands = 0, totalBrowserActions = 0, totalSubagents = 0, avgDuration = 0.0, byMode = Array.Empty<object>(), bySandbox = Array.Empty<object>() });

        return Ok(new
        {
            totalSessions = sessions.Count,
            totalCommands = sessions.Sum(s => s.CommandsExecuted),
            totalBrowserActions = sessions.Sum(s => s.BrowserActions),
            totalSubagents = sessions.Sum(s => s.SubagentsDelegated),
            avgDuration = Math.Round(sessions.Average(s => s.SessionDurationMs), 0),
            byMode = sessions.GroupBy(s => s.AccessMode).Select(g => new { mode = g.Key, count = g.Count(), commands = g.Sum(s => s.CommandsExecuted) }).ToList(),
            bySandbox = sessions.GroupBy(s => s.SandboxType).Select(g => new { sandbox = g.Key, count = g.Count() }).ToList(),
        });
    }

    [AllowAnonymous]
    [HttpGet("sandboxes")]
    public IActionResult GetSandboxTypes()
    {
        var sandboxes = new[]
        {
            new { id = "docker", name = "Docker", description = "Container isolation with resource limits and network control", color = "#2496ED" },
            new { id = "firecracker", name = "Firecracker", description = "MicroVM with dedicated kernel — strongest isolation (used by AWS Lambda)", color = "#FF9900" },
            new { id = "gvisor", name = "gVisor", description = "User-space kernel with syscall interception — lighter than MicroVMs", color = "#4285F4" },
            new { id = "deno", name = "Deno Sandbox", description = "Built-in permission system — sub-1s startup for JS/TS projects", color = "#000000" },
        };
        return Ok(sandboxes);
    }

    private static string GenerateLog(Random rng, string command)
    {
        var lines = new[]
        {
            $"$ {command}",
            "Installing dependencies...",
            "✓ 42 packages installed in 3.2s",
            "Running build...",
            "✓ Build completed successfully",
            "Running tests...",
            $"✓ {rng.Next(8, 20)} tests passed",
        };
        return string.Join("\n", lines.Take(rng.Next(3, lines.Length)));
    }

    private static string GetSampleCommand(Random rng)
    {
        var commands = new[] { "npm install", "npm run build", "npm test", "git status", "dotnet build", "python -m pytest", "docker compose up -d", "npx playwright test", "git commit -m 'fix'", "npm run lint" };
        return commands[rng.Next(commands.Length)];
    }

    private static string GetSampleBrowserAction(Random rng)
    {
        var actions = new[] { "Navigate to page", "Click submit button", "Fill form input", "Check console errors", "Verify page title", "Screenshot capture", "Check network requests" };
        return actions[rng.Next(actions.Length)];
    }
}
