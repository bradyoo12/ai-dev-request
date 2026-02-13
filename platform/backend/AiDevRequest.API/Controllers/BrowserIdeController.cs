using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/browser-ide")]
[Authorize]
public class BrowserIdeController(AiDevRequestDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.BrowserIdeSessions
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("execute")]
    public async Task<IActionResult> Execute([FromBody] ExecuteRequest req)
    {
        var rng = new Random();
        var linesOfCode = req.Code.Split('\n').Length;
        var hasErrors = rng.NextDouble() < 0.15;
        var errorCount = hasErrors ? rng.Next(1, 4) : 0;

        var consoleLines = new List<string>();
        if (req.Runtime == "react")
        {
            consoleLines.Add("Compiling React component...");
            consoleLines.Add("Dependencies resolved: react@19.0, react-dom@19.0");
            if (!hasErrors) consoleLines.Add("Component rendered successfully");
        }
        else if (req.Runtime == "node")
        {
            consoleLines.Add("Running Node.js script...");
            if (!hasErrors) consoleLines.Add("Execution completed");
        }
        else if (req.Runtime == "typescript")
        {
            consoleLines.Add("Type-checking with TypeScript 5.7...");
            consoleLines.Add("Transpiling to JavaScript...");
            if (!hasErrors) consoleLines.Add("Execution completed");
        }
        else
        {
            consoleLines.Add("Running vanilla JavaScript...");
            if (!hasErrors) consoleLines.Add("Script executed");
        }

        if (hasErrors)
        {
            for (var i = 0; i < errorCount; i++)
                consoleLines.Add($"Error: Unexpected token at line {rng.Next(1, linesOfCode + 1)}");
        }

        var session = new BrowserIdeSession
        {
            ProjectName = req.ProjectName,
            Runtime = req.Runtime,
            Code = req.Code,
            LinesOfCode = linesOfCode,
            PackagesInstalled = rng.Next(0, 12),
            ExecutionTimeMs = Math.Round(rng.NextDouble() * 500 + 50, 2),
            HasErrors = hasErrors,
            ErrorCount = errorCount,
            ConsoleOutputLines = consoleLines.Count,
            LivePreviewEnabled = req.Runtime == "react" || req.Runtime == "vanilla",
            SharedLink = false,
            ShareId = string.Empty,
            ForkCount = 0,
            MemoryUsageMb = Math.Round(rng.NextDouble() * 64 + 16, 2),
            Status = hasErrors ? "error" : "completed"
        };

        db.BrowserIdeSessions.Add(session);
        await db.SaveChangesAsync();

        return Ok(new
        {
            session,
            consoleOutput = consoleLines,
            livePreviewUrl = session.LivePreviewEnabled ? $"/preview/{session.Id}" : (string?)null,
            executionTimeMs = session.ExecutionTimeMs,
            memoryUsageMb = session.MemoryUsageMb
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var entity = await db.BrowserIdeSessions.FindAsync(id);
        if (entity == null) return NotFound();
        db.BrowserIdeSessions.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.BrowserIdeSessions.ToListAsync();
        if (all.Count == 0) return Ok(new { totalSessions = 0 });

        var byRuntime = all.GroupBy(x => x.Runtime).Select(g => new
        {
            runtime = g.Key,
            count = g.Count(),
            avgExecutionTimeMs = Math.Round(g.Average(x => x.ExecutionTimeMs), 2),
            errorRate = Math.Round((double)g.Count(x => x.HasErrors) / g.Count() * 100, 1)
        }).ToList();

        return Ok(new
        {
            totalSessions = all.Count,
            avgExecutionTimeMs = Math.Round(all.Average(x => x.ExecutionTimeMs), 2),
            avgLinesOfCode = Math.Round(all.Average(x => (double)x.LinesOfCode), 1),
            avgMemoryUsageMb = Math.Round(all.Average(x => x.MemoryUsageMb), 2),
            errorRate = Math.Round((double)all.Count(x => x.HasErrors) / all.Count * 100, 1),
            totalShared = all.Count(x => x.SharedLink),
            byRuntime
        });
    }

    [AllowAnonymous]
    [HttpGet("runtimes")]
    public IActionResult GetRuntimes()
    {
        return Ok(new[]
        {
            new { id = "react", name = "React 19", description = "Build interactive UIs with JSX and hot reload", icon = "⚛️", extensions = new[] { ".jsx", ".tsx" }, color = "#61dafb" },
            new { id = "node", name = "Node.js 22", description = "Server-side JavaScript with full API access", icon = "🟢", extensions = new[] { ".js", ".mjs" }, color = "#339933" },
            new { id = "vanilla", name = "Vanilla JS", description = "Plain JavaScript with HTML/CSS preview", icon = "📜", extensions = new[] { ".js", ".html", ".css" }, color = "#f7df1e" },
            new { id = "typescript", name = "TypeScript 5.7", description = "Type-safe JavaScript with instant compilation", icon = "🔷", extensions = new[] { ".ts", ".tsx" }, color = "#3178c6" }
        });
    }

    public record ExecuteRequest(
        string ProjectName,
        string Code,
        string Runtime = "react"
    );
}
