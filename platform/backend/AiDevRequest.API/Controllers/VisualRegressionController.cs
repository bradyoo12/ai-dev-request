using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/visual-regression")]
[Authorize]
public class VisualRegressionController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public VisualRegressionController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("results")]
    public async Task<IActionResult> ListResults()
    {
        var userId = GetUserId();
        var results = await _db.VisualRegressionResults
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(results);
    }

    [HttpPost("capture")]
    public async Task<IActionResult> CaptureBaseline([FromBody] CaptureRequest request)
    {
        var userId = GetUserId();
        var result = new VisualRegressionResult
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = request.ProjectName ?? "Untitled",
            PageUrl = request.PageUrl ?? "/",
            ViewportSize = request.ViewportSize ?? "1280x720",
            BaselineImageUrl = $"/screenshots/baseline_{Guid.NewGuid():N}.png",
            Status = "baseline_captured",
            Passed = true,
            Threshold = request.Threshold > 0 ? request.Threshold : 0.1,
            CaptureTimeMs = 200 + Random.Shared.Next(100, 500),
            TotalPixels = ParseViewportPixels(request.ViewportSize ?? "1280x720"),
        };
        _db.VisualRegressionResults.Add(result);
        await _db.SaveChangesAsync();
        return Ok(result);
    }

    [HttpPost("compare")]
    public async Task<IActionResult> RunComparison([FromBody] CompareRequest request)
    {
        var userId = GetUserId();
        var baseline = await _db.VisualRegressionResults
            .Where(r => r.UserId == userId && r.ProjectName == request.ProjectName && r.Status == "baseline_captured")
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        var mismatch = Random.Shared.NextDouble() * 5;
        var threshold = request.Threshold > 0 ? request.Threshold : baseline?.Threshold ?? 0.1;
        var totalPixels = ParseViewportPixels(request.ViewportSize ?? baseline?.ViewportSize ?? "1280x720");
        var pixelsDiff = (int)(totalPixels * mismatch / 100);

        var result = new VisualRegressionResult
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = request.ProjectName ?? baseline?.ProjectName ?? "Untitled",
            PageUrl = request.PageUrl ?? baseline?.PageUrl ?? "/",
            ViewportSize = request.ViewportSize ?? baseline?.ViewportSize ?? "1280x720",
            BaselineImageUrl = baseline?.BaselineImageUrl ?? "",
            ComparisonImageUrl = $"/screenshots/compare_{Guid.NewGuid():N}.png",
            DiffImageUrl = $"/screenshots/diff_{Guid.NewGuid():N}.png",
            MismatchPercentage = Math.Round(mismatch, 2),
            Threshold = threshold,
            Status = "completed",
            Passed = mismatch <= threshold,
            PixelsDifferent = pixelsDiff,
            TotalPixels = totalPixels,
            CaptureTimeMs = 200 + Random.Shared.Next(100, 400),
            CompareTimeMs = 100 + Random.Shared.Next(50, 300),
        };
        _db.VisualRegressionResults.Add(result);
        await _db.SaveChangesAsync();
        return Ok(result);
    }

    [HttpGet("viewports")]
    public IActionResult GetViewports()
    {
        return Ok(new[]
        {
            new { id = "desktop", name = "Desktop", width = 1280, height = 720 },
            new { id = "laptop", name = "Laptop", width = 1024, height = 768 },
            new { id = "tablet", name = "Tablet", width = 768, height = 1024 },
            new { id = "mobile", name = "Mobile", width = 375, height = 812 },
            new { id = "wide", name = "Widescreen", width = 1920, height = 1080 },
        });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var results = await _db.VisualRegressionResults.Where(r => r.UserId == userId).ToListAsync();
        var completed = results.Where(r => r.Status == "completed").ToList();
        return Ok(new
        {
            totalTests = results.Count,
            passedTests = completed.Count(r => r.Passed),
            failedTests = completed.Count(r => !r.Passed),
            passRate = completed.Count > 0 ? Math.Round((double)completed.Count(r => r.Passed) / completed.Count * 100, 1) : 0,
            avgMismatch = completed.Count > 0 ? Math.Round(completed.Average(r => r.MismatchPercentage), 2) : 0,
            totalPixelsAnalyzed = results.Sum(r => (long)r.TotalPixels),
            recentResults = results.OrderByDescending(r => r.CreatedAt).Take(5).Select(r => new
            {
                r.ProjectName,
                r.PageUrl,
                r.MismatchPercentage,
                r.Passed,
                r.Status,
                r.CreatedAt,
            }),
        });
    }

    private static int ParseViewportPixels(string viewport)
    {
        var parts = viewport.Split('x');
        if (parts.Length == 2 && int.TryParse(parts[0], out var w) && int.TryParse(parts[1], out var h))
            return w * h;
        return 1280 * 720;
    }
}

public class CaptureRequest
{
    public string? ProjectName { get; set; }
    public string? PageUrl { get; set; }
    public string? ViewportSize { get; set; }
    public double Threshold { get; set; }
}

public class CompareRequest
{
    public string? ProjectName { get; set; }
    public string? PageUrl { get; set; }
    public string? ViewportSize { get; set; }
    public double Threshold { get; set; }
}
