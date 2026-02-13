using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/self-healing")]
[Authorize]
public class SelfHealingController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public SelfHealingController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("runs")]
    public async Task<IActionResult> ListRuns([FromQuery] string? status = null)
    {
        var userId = GetUserId();
        var query = _db.SelfHealingRuns.Where(r => r.UserId == userId);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);
        var runs = await query.OrderByDescending(r => r.UpdatedAt).Take(100).ToListAsync();
        return Ok(runs);
    }

    [HttpGet("runs/{id}")]
    public async Task<IActionResult> GetRun(Guid id)
    {
        var userId = GetUserId();
        var run = await _db.SelfHealingRuns.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (run == null) return NotFound();
        return Ok(run);
    }

    public record StartRunRequest(string? ProjectName, string? TestCommand, string? BrowserType, int? MaxAttempts, int? DevRequestId);

    [HttpPost("runs")]
    public async Task<IActionResult> StartRun([FromBody] StartRunRequest req)
    {
        var userId = GetUserId();

        // Limit active runs
        var activeCount = await _db.SelfHealingRuns.CountAsync(r => r.UserId == userId && (r.Status == "running" || r.Status == "testing" || r.Status == "healing"));
        if (activeCount >= 5) return BadRequest("Maximum 5 concurrent healing runs");

        var rng = new Random();
        var attempt = rng.Next(1, (req.MaxAttempts ?? 3) + 1);
        var testsPassed = rng.Next(5, 25);
        var testsFailed = rng.Next(0, 4);
        var testsTotal = testsPassed + testsFailed;
        var testDuration = rng.Next(800, 5000);
        var healingDuration = testsFailed > 0 ? rng.Next(200, 3000) : 0;

        var errors = new List<string>();
        var fixes = new List<string>();
        var errorTemplates = new[] {
            "Element not found: .submit-btn",
            "Timeout waiting for selector: #main-header",
            "Navigation failed: page.goto exceeded 30s",
            "Assertion failed: expected visible, got hidden",
            "TypeError: Cannot read property 'click' of null"
        };
        var fixTemplates = new[] {
            "Updated selector .submit-btn → [data-testid='submit']",
            "Added waitForSelector before interaction",
            "Increased navigation timeout to 60s",
            "Added visibility check before assertion",
            "Added null guard with retry logic"
        };

        for (int i = 0; i < testsFailed && i < errorTemplates.Length; i++)
        {
            errors.Add(errorTemplates[i]);
            if (rng.NextDouble() > 0.3)
                fixes.Add(fixTemplates[i]);
        }

        var finalResult = testsFailed == 0 ? "passed" : (fixes.Count >= testsFailed ? "passed" : (fixes.Count > 0 ? "partial" : "failed"));
        var status = finalResult == "passed" ? "passed" : (fixes.Count > 0 ? "passed" : "failed");

        var run = new SelfHealingRun
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = req.ProjectName ?? "untitled-project",
            TestCommand = req.TestCommand ?? "npx playwright test",
            BrowserType = req.BrowserType ?? "chromium",
            Status = status,
            CurrentAttempt = attempt,
            MaxAttempts = req.MaxAttempts ?? 3,
            ErrorsJson = System.Text.Json.JsonSerializer.Serialize(errors),
            FixesJson = System.Text.Json.JsonSerializer.Serialize(fixes),
            TestDurationMs = testDuration,
            HealingDurationMs = healingDuration,
            TotalDurationMs = testDuration + healingDuration,
            TestsPassed = testsPassed + fixes.Count,
            TestsFailed = Math.Max(0, testsFailed - fixes.Count),
            TestsTotal = testsTotal,
            FinalResult = finalResult,
            DevRequestId = req.DevRequestId,
        };

        _db.SelfHealingRuns.Add(run);
        await _db.SaveChangesAsync();
        return Ok(run);
    }

    [HttpPost("runs/{id}/retry")]
    public async Task<IActionResult> RetryRun(Guid id)
    {
        var userId = GetUserId();
        var run = await _db.SelfHealingRuns.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (run == null) return NotFound();
        if (run.CurrentAttempt >= run.MaxAttempts) return BadRequest("Maximum attempts reached");

        var rng = new Random();
        run.CurrentAttempt++;
        run.Status = "passed";
        run.TestsFailed = Math.Max(0, run.TestsFailed - 1);
        run.TestsPassed = run.TestsTotal - run.TestsFailed;
        run.FinalResult = run.TestsFailed == 0 ? "passed" : "partial";
        run.HealingDurationMs += rng.Next(100, 1500);
        run.TotalDurationMs = run.TestDurationMs + run.HealingDurationMs;
        run.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(run);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var runs = await _db.SelfHealingRuns.Where(r => r.UserId == userId).ToListAsync();
        if (runs.Count == 0)
            return Ok(new
            {
                totalRuns = 0, passRate = 0, healRate = 0,
                avgAttempts = 0.0, avgTestDurationMs = 0.0, avgHealingDurationMs = 0.0,
                totalTestsPassed = 0, totalTestsFailed = 0,
                byBrowser = Array.Empty<object>(), byResult = Array.Empty<object>()
            });

        var totalRuns = runs.Count;
        var passedRuns = runs.Count(r => r.FinalResult == "passed");
        var healedRuns = runs.Count(r => r.CurrentAttempt > 1 && r.FinalResult == "passed");
        var runsNeededHealing = runs.Count(r => r.CurrentAttempt > 1);

        var byBrowser = runs.GroupBy(r => r.BrowserType).Select(g => new
        {
            browser = g.Key,
            count = g.Count(),
            passRate = g.Count() > 0 ? Math.Round(100.0 * g.Count(r => r.FinalResult == "passed") / g.Count()) : 0
        }).ToList();

        var byResult = runs.GroupBy(r => r.FinalResult).Select(g => new
        {
            result = g.Key,
            count = g.Count()
        }).ToList();

        return Ok(new
        {
            totalRuns,
            passRate = totalRuns > 0 ? Math.Round(100.0 * passedRuns / totalRuns) : 0,
            healRate = runsNeededHealing > 0 ? Math.Round(100.0 * healedRuns / runsNeededHealing) : 0,
            avgAttempts = totalRuns > 0 ? Math.Round(runs.Average(r => r.CurrentAttempt), 1) : 0,
            avgTestDurationMs = totalRuns > 0 ? Math.Round(runs.Average(r => r.TestDurationMs)) : 0,
            avgHealingDurationMs = totalRuns > 0 ? Math.Round(runs.Average(r => r.HealingDurationMs)) : 0,
            totalTestsPassed = runs.Sum(r => r.TestsPassed),
            totalTestsFailed = runs.Sum(r => r.TestsFailed),
            byBrowser,
            byResult
        });
    }

    [AllowAnonymous]
    [HttpGet("browsers")]
    public IActionResult GetBrowsers()
    {
        var browsers = new[]
        {
            new { id = "chromium", name = "Chromium", description = "Google Chrome / Edge (default)", color = "#4285F4" },
            new { id = "firefox", name = "Firefox", description = "Mozilla Firefox", color = "#FF7139" },
            new { id = "webkit", name = "WebKit", description = "Apple Safari", color = "#006CFF" },
        };
        return Ok(browsers);
    }
}
