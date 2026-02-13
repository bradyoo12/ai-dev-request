using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/terminal-execution")]
public class TerminalExecutionController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public TerminalExecutionController(AiDevRequestDbContext db) => _db = db;

    private static readonly string[] AllowList = { "npm run build", "npm test", "npm run lint", "npm run format", "dotnet build", "dotnet test", "npx vitest run", "npx playwright test", "npx vite build", "git status", "git diff", "git log" };
    private static readonly string[] DenyList = { "rm -rf", "git push --force", "DROP TABLE", "DROP DATABASE", "del /s /q", "format c:", "shutdown", "reboot", "curl | bash", "wget | sh" };

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.TerminalExecutions
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [Authorize]
    [HttpPost("execute")]
    public async Task<IActionResult> Execute([FromBody] ExecuteTerminalRequest req)
    {
        var rng = new Random();
        var execution = new TerminalExecution
        {
            UserId = User.FindFirst("sub")?.Value ?? "",
            ProjectName = req.ProjectName,
            Command = req.Command,
            SecurityLevel = req.SecurityLevel
        };

        // Classify command category
        if (req.Command.Contains("build")) execution.Category = "build";
        else if (req.Command.Contains("test")) execution.Category = "test";
        else if (req.Command.Contains("lint") || req.Command.Contains("eslint") || req.Command.Contains("biome")) execution.Category = "lint";
        else if (req.Command.Contains("format") || req.Command.Contains("prettier")) execution.Category = "format";
        else if (req.Command.Contains("deploy") || req.Command.Contains("push")) execution.Category = "deploy";
        else execution.Category = "custom";

        // Check deny list
        var isDenied = DenyList.Any(d => req.Command.Contains(d, StringComparison.OrdinalIgnoreCase));
        if (isDenied)
        {
            execution.Blocked = true;
            execution.BlockReason = "Command matches deny list pattern";
            execution.AutoApproved = false;
            execution.Status = "blocked";
            _db.TerminalExecutions.Add(execution);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                execution,
                output = (string?)null,
                policyMatch = new { matched = true, list = "deny", pattern = DenyList.First(d => req.Command.Contains(d, StringComparison.OrdinalIgnoreCase)) }
            });
        }

        // Check allow list for auto-approval
        var isAllowed = AllowList.Any(a => req.Command.StartsWith(a, StringComparison.OrdinalIgnoreCase));
        execution.AutoApproved = isAllowed;
        execution.Blocked = false;

        // Simulate command execution
        execution.ExitCode = rng.NextDouble() > 0.9 ? 1 : 0;
        execution.OutputLines = rng.Next(5, 120);
        execution.DurationMs = rng.Next(200, 15000);
        execution.Status = execution.ExitCode == 0 ? "completed" : "failed";

        // Generate simulated output
        var outputLines = new List<string>();
        if (execution.Category == "build")
        {
            outputLines.AddRange(new[] { "> vite build", "transforming...", $"  {rng.Next(50, 200)} modules transformed.", $"\u2713 built in {(execution.DurationMs / 1000.0):F2}s" });
        }
        else if (execution.Category == "test")
        {
            var passed = rng.Next(20, 50);
            var skipped = rng.Next(0, 3);
            outputLines.AddRange(new[] { $"Running {passed + skipped} tests...", $"  {skipped} skipped", $"  {passed} passed ({(execution.DurationMs / 1000.0):F1}s)" });
        }
        else if (execution.Category == "lint")
        {
            var issues = rng.Next(0, 8);
            outputLines.AddRange(new[] { "Checking files...", $"  {rng.Next(30, 150)} files checked", $"  {issues} issues found", issues == 0 ? "\u2713 All clear" : $"\u2717 {issues} issues need fixing" });
        }
        else
        {
            outputLines.AddRange(new[] { $"$ {req.Command}", $"Command completed with exit code {execution.ExitCode}" });
        }

        _db.TerminalExecutions.Add(execution);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            execution,
            output = string.Join("\n", outputLines),
            policyMatch = new { matched = isAllowed, list = "allow", pattern = isAllowed ? AllowList.First(a => req.Command.StartsWith(a, StringComparison.OrdinalIgnoreCase)) : (string?)null }
        });
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.TerminalExecutions.FindAsync(id);
        if (item == null) return NotFound();
        _db.TerminalExecutions.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await _db.TerminalExecutions.ToListAsync();
        if (!all.Any()) return Ok(new { totalExecutions = 0 });

        return Ok(new
        {
            totalExecutions = all.Count,
            autoApproved = all.Count(x => x.AutoApproved),
            blocked = all.Count(x => x.Blocked),
            successRate = Math.Round(all.Where(x => !x.Blocked).Count(x => x.ExitCode == 0) * 100.0 / Math.Max(1, all.Count(x => !x.Blocked)), 1),
            avgDurationMs = (int)all.Where(x => !x.Blocked).DefaultIfEmpty().Average(x => x?.DurationMs ?? 0),
            byCategory = all.GroupBy(x => x.Category)
                .Select(g => new { category = g.Key, count = g.Count(), autoApproved = g.Count(x => x.AutoApproved) })
        });
    }

    [AllowAnonymous]
    [HttpGet("policies")]
    public IActionResult Policies()
    {
        return Ok(new
        {
            allowList = AllowList.Select(a => new { pattern = a, category = a.Contains("build") ? "build" : a.Contains("test") ? "test" : a.Contains("lint") || a.Contains("format") ? "lint" : "safe" }),
            denyList = DenyList.Select(d => new { pattern = d, severity = d.Contains("rm") || d.Contains("del") || d.Contains("DROP") ? "critical" : "high" }),
            securityLevels = new[]
            {
                new { id = "safe", name = "Safe", description = "Only auto-execute allow-listed commands", color = "#22C55E" },
                new { id = "cautious", name = "Cautious", description = "Auto-execute build/test/lint, prompt for others", color = "#EAB308" },
                new { id = "restricted", name = "Restricted", description = "Prompt for all commands, deny-list enforced", color = "#EF4444" }
            }
        });
    }
}

public record ExecuteTerminalRequest(string ProjectName, string Command, string SecurityLevel = "safe");
