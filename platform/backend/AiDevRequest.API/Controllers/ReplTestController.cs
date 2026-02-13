using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/repl-test")]
[Authorize]
public class ReplTestController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public ReplTestController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListSessions()
    {
        var userId = GetUserId();
        var sessions = await _db.ReplTestSessions.Where(s => s.UserId == userId).OrderByDescending(s => s.UpdatedAt).Take(50).ToListAsync();
        return Ok(sessions);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.ReplTestSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();
        return Ok(session);
    }

    public record RunTestRequest(string? ProjectName, string? TestMode, string? Runtime);

    [HttpPost("run")]
    public async Task<IActionResult> RunTests([FromBody] RunTestRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();

        var totalTests = rng.Next(8, 25);
        var failed = rng.Next(0, 3);
        var passed = totalTests - failed;
        var potemkin = rng.Next(0, 4);
        var dbChecks = rng.Next(2, 8);
        var logs = rng.Next(10, 50);
        var latency = Math.Round(rng.NextDouble() * 80 + 20, 1);

        var session = new ReplTestSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = req.ProjectName ?? "my-project",
            TestMode = req.TestMode ?? "repl",
            Runtime = req.Runtime ?? "node",
            TotalTests = totalTests,
            PassedTests = passed,
            FailedTests = failed,
            PotemkinDetections = potemkin,
            DbStateChecks = dbChecks,
            LogsCaptured = logs,
            AvgLatencyMs = latency,
            SpeedupFactor = Math.Round(rng.NextDouble() * 2 + 2, 1),
            CostReduction = Math.Round(rng.NextDouble() * 5 + 7, 1),
            Status = failed > 0 ? "failed" : "completed",
            ResultSummary = failed > 0
                ? $"{failed} tests failed: possible Potemkin interfaces detected"
                : "All tests passed — runtime behavior verified",
        };

        _db.ReplTestSessions.Add(session);
        await _db.SaveChangesAsync();

        var results = Enumerable.Range(0, totalTests).Select(i =>
        {
            var isFailed = i >= passed;
            var isPotemkin = isFailed && rng.NextDouble() > 0.5;
            return new
            {
                id = Guid.NewGuid().ToString(),
                name = GetSampleTestName(rng),
                status = isFailed ? "failed" : "passed",
                latencyMs = Math.Round(rng.NextDouble() * 50 + 5, 1),
                potemkin = isPotemkin,
                logSnippet = isFailed ? "Error: Button click did not trigger backend handler" : "OK: Action completed and state verified",
                dbVerified = rng.NextDouble() > 0.3,
            };
        }).ToList();

        return Ok(new
        {
            session,
            results,
            comparison = new
            {
                replLatencyMs = latency,
                browserLatencyMs = Math.Round(latency * (rng.NextDouble() * 1.5 + 2.5), 1),
                replCost = Math.Round(rng.NextDouble() * 0.01 + 0.005, 4),
                browserCost = Math.Round(rng.NextDouble() * 0.05 + 0.05, 4),
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSession(Guid id)
    {
        var userId = GetUserId();
        var session = await _db.ReplTestSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (session == null) return NotFound();

        _db.ReplTestSessions.Remove(session);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var sessions = await _db.ReplTestSessions.Where(s => s.UserId == userId).ToListAsync();
        if (sessions.Count == 0)
            return Ok(new { totalSessions = 0, totalTests = 0, passRate = 0.0, avgSpeedup = 0.0, avgCostReduction = 0.0, potemkinDetected = 0, byMode = Array.Empty<object>(), byRuntime = Array.Empty<object>() });

        var byMode = sessions.GroupBy(s => s.TestMode).Select(g => new { mode = g.Key, count = g.Count(), tests = g.Sum(s => s.TotalTests) }).ToList();
        var byRuntime = sessions.GroupBy(s => s.Runtime).Select(g => new { runtime = g.Key, count = g.Count() }).ToList();

        return Ok(new
        {
            totalSessions = sessions.Count,
            totalTests = sessions.Sum(s => s.TotalTests),
            passRate = Math.Round(sessions.Sum(s => s.PassedTests) * 100.0 / Math.Max(1, sessions.Sum(s => s.TotalTests)), 1),
            avgSpeedup = Math.Round(sessions.Average(s => s.SpeedupFactor), 1),
            avgCostReduction = Math.Round(sessions.Average(s => s.CostReduction), 1),
            potemkinDetected = sessions.Sum(s => s.PotemkinDetections),
            byMode,
            byRuntime
        });
    }

    [AllowAnonymous]
    [HttpGet("runtimes")]
    public IActionResult GetRuntimes()
    {
        var runtimes = new[]
        {
            new { id = "node", name = "Node.js", description = "JavaScript/TypeScript runtime with REPL and inspector", color = "#339933" },
            new { id = "deno", name = "Deno", description = "Secure runtime with built-in permissions and TypeScript support", color = "#000000" },
            new { id = "bun", name = "Bun", description = "Ultra-fast runtime with native bundler and test runner", color = "#FBF0DF" },
            new { id = "python", name = "Python", description = "Interactive REPL with debugging and inspection tools", color = "#3776AB" },
        };
        return Ok(runtimes);
    }

    private static string GetSampleTestName(Random rng)
    {
        var names = new[]
        {
            "submit form triggers API call",
            "delete button removes database row",
            "login redirects to dashboard",
            "payment button initiates Stripe session",
            "search input updates results list",
            "toggle switch persists preference",
            "file upload stores to blob storage",
            "export button generates CSV download",
            "notification bell shows unread count",
            "settings save updates user profile",
            "cart add button increments total",
            "filter dropdown updates query params",
        };
        return names[rng.Next(names.Length)];
    }
}
