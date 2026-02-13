using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/playwright-healing")]
[Authorize]
public class PlaywrightHealingController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public PlaywrightHealingController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("results")]
    public async Task<IActionResult> ListResults([FromQuery] string? status = null)
    {
        var userId = GetUserId();
        var query = _db.PlaywrightHealingResults.Where(r => r.UserId == userId);
        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);
        var results = await query.OrderByDescending(r => r.UpdatedAt).Take(100).ToListAsync();
        return Ok(results);
    }

    [HttpGet("results/{id}")]
    public async Task<IActionResult> GetResult(Guid id)
    {
        var userId = GetUserId();
        var result = await _db.PlaywrightHealingResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("heal")]
    public async Task<IActionResult> HealTest([FromBody] HealTestRequest request)
    {
        var userId = GetUserId();
        var rand = new Random();

        // Simulate AI-driven healing
        var strategies = new[] { "closest-match", "ai-suggest", "fallback-chain" };
        var strategy = strategies[rand.Next(strategies.Length)];
        var confidence = Math.Round(0.7 + rand.NextDouble() * 0.3, 2);
        var healingTimeMs = rand.Next(100, 2000);

        var healedSelector = GenerateHealedSelector(request.OriginalSelector, strategy);

        var result = new PlaywrightHealingResult
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TestFile = request.TestFile ?? "unknown.spec.ts",
            TestName = request.TestName ?? "unknown test",
            OriginalSelector = request.OriginalSelector ?? "",
            HealedSelector = healedSelector,
            HealingStrategy = strategy,
            Confidence = confidence,
            Status = confidence >= 0.8 ? "healed" : "manual-review",
            HealingAttempts = rand.Next(1, 4),
            HealingTimeMs = healingTimeMs,
            DevRequestId = request.DevRequestId,
        };

        _db.PlaywrightHealingResults.Add(result);
        await _db.SaveChangesAsync();
        return Ok(result);
    }

    [HttpPost("results/{id}/approve")]
    public async Task<IActionResult> ApproveHealing(Guid id)
    {
        var userId = GetUserId();
        var result = await _db.PlaywrightHealingResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (result == null) return NotFound();

        result.Status = "healed";
        result.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(result);
    }

    [HttpPost("results/{id}/reject")]
    public async Task<IActionResult> RejectHealing(Guid id)
    {
        var userId = GetUserId();
        var result = await _db.PlaywrightHealingResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (result == null) return NotFound();

        result.Status = "failed";
        result.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var results = await _db.PlaywrightHealingResults.Where(r => r.UserId == userId).ToListAsync();

        var stats = new
        {
            totalHealings = results.Count,
            successfulHealings = results.Count(r => r.Status == "healed"),
            failedHealings = results.Count(r => r.Status == "failed"),
            pendingReview = results.Count(r => r.Status == "manual-review"),
            healRate = results.Count > 0
                ? Math.Round(results.Count(r => r.Status == "healed") * 100.0 / results.Count, 1)
                : 0,
            avgConfidence = results.Count > 0
                ? Math.Round(results.Average(r => r.Confidence) * 100, 1)
                : 0,
            avgHealingTimeMs = results.Count > 0
                ? Math.Round(results.Average(r => r.HealingTimeMs), 1)
                : 0,
            byStrategy = results.GroupBy(r => r.HealingStrategy).Select(g => new
            {
                strategy = g.Key,
                count = g.Count(),
                avgConfidence = Math.Round(g.Average(r => r.Confidence) * 100, 1),
            }),
            recentHealings = results.OrderByDescending(r => r.UpdatedAt).Take(5).Select(r => new
            {
                r.Id, r.TestName, r.Status, r.Confidence, r.HealingStrategy, r.UpdatedAt
            }),
        };

        return Ok(stats);
    }

    [HttpGet("strategies")]
    [AllowAnonymous]
    public IActionResult GetStrategies()
    {
        var strategies = new[]
        {
            new { id = "closest-match", name = "Closest Match", description = "Finds the closest matching element using DOM similarity and attribute analysis", color = "#3b82f6" },
            new { id = "ai-suggest", name = "AI Suggestion", description = "Uses Claude to analyze the page and suggest the most likely replacement selector", color = "#8b5cf6" },
            new { id = "fallback-chain", name = "Fallback Chain", description = "Tries multiple selector strategies in order: role > test-id > text > CSS", color = "#10b981" },
        };
        return Ok(strategies);
    }

    private static string GenerateHealedSelector(string original, string strategy)
    {
        if (string.IsNullOrEmpty(original)) return "getByRole('button')";

        return strategy switch
        {
            "closest-match" => original.Contains("text=")
                ? original.Replace("text=", "getByText('") + "')"
                : $"getByTestId('{original.Replace("#", "").Replace(".", "")}')",
            "ai-suggest" => original.Contains("button")
                ? "getByRole('button', { name: 'Submit' })"
                : $"getByRole('textbox', {{ name: '{original}' }})",
            "fallback-chain" => $"getByRole('button').or(getByTestId('{original}'))",
            _ => original,
        };
    }
}

public record HealTestRequest(
    string? TestFile,
    string? TestName,
    string? OriginalSelector,
    int? DevRequestId
);
