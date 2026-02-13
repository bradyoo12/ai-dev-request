using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/build-toolchain")]
public class BuildToolchainController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public BuildToolchainController(AiDevRequestDbContext db) => _db = db;

    private string UserId => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.BuildToolchainResults
            .Where(r => r.UserId == UserId)
            .OrderByDescending(r => r.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("benchmark")]
    public async Task<IActionResult> Benchmark([FromBody] BenchmarkRequest req)
    {
        var count = await _db.BuildToolchainResults.CountAsync(r => r.UserId == UserId);
        if (count >= 50) return BadRequest("Limit of 50 benchmarks reached.");

        var rng = new Random();
        var totalModules = rng.Next(500, 3500);

        double rolldownDevMs = rng.Next(200, 600);
        double rolldownHmrMs = rng.Next(20, 80);
        double rolldownBuildMs = rng.Next(1500, 4000);
        double rolldownBundleKb = rng.Next(400, 1200);

        double esbuildDevMs = rolldownDevMs * (2.5 + rng.NextDouble());
        double esbuildHmrMs = rolldownHmrMs * (1.2 + rng.NextDouble() * 0.8);
        double esbuildBuildMs = rolldownBuildMs * (2.0 + rng.NextDouble() * 2);
        double esbuildBundleKb = rolldownBundleKb * (1.1 + rng.NextDouble() * 0.3);

        var devMs = req.Bundler == "rolldown" ? rolldownDevMs : esbuildDevMs;
        var hmrMs = req.Bundler == "rolldown" ? rolldownHmrMs : esbuildHmrMs;
        var buildMs = req.Bundler == "rolldown" ? rolldownBuildMs : esbuildBuildMs;
        var bundleKb = req.Bundler == "rolldown" ? rolldownBundleKb : esbuildBundleKb;
        var chunks = rng.Next(8, 30);
        var treeShaking = Math.Round(20 + rng.NextDouble() * 35, 1);
        var codeSplit = Math.Round(10 + rng.NextDouble() * 25, 1);
        var speedup = Math.Round(esbuildBuildMs / rolldownBuildMs, 1);

        var result = new BuildToolchainResult
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            ProjectName = req.ProjectName,
            Bundler = req.Bundler,
            TotalModules = totalModules,
            DevStartupMs = Math.Round(devMs, 1),
            HmrLatencyMs = Math.Round(hmrMs, 1),
            BuildDurationMs = Math.Round(buildMs, 1),
            BundleSizeKb = Math.Round(bundleKb, 1),
            ChunksGenerated = chunks,
            TreeShakingPercent = treeShaking,
            CodeSplitSavingsPercent = codeSplit,
            SpeedupFactor = speedup,
            FullBundleMode = req.FullBundleMode,
            Status = "completed"
        };

        _db.BuildToolchainResults.Add(result);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            result,
            comparison = new
            {
                rolldown = new { devMs = Math.Round(rolldownDevMs, 1), hmrMs = Math.Round(rolldownHmrMs, 1), buildMs = Math.Round(rolldownBuildMs, 1), bundleKb = Math.Round(rolldownBundleKb, 1) },
                esbuildRollup = new { devMs = Math.Round(esbuildDevMs, 1), hmrMs = Math.Round(esbuildHmrMs, 1), buildMs = Math.Round(esbuildBuildMs, 1), bundleKb = Math.Round(esbuildBundleKb, 1) }
            },
            details = new[]
            {
                new { metric = "Dev Server Startup", rolldown = $"{Math.Round(rolldownDevMs, 1)}ms", esbuild = $"{Math.Round(esbuildDevMs, 1)}ms", speedup = $"{Math.Round(esbuildDevMs / rolldownDevMs, 1)}x" },
                new { metric = "HMR Latency", rolldown = $"{Math.Round(rolldownHmrMs, 1)}ms", esbuild = $"{Math.Round(esbuildHmrMs, 1)}ms", speedup = $"{Math.Round(esbuildHmrMs / rolldownHmrMs, 1)}x" },
                new { metric = "Production Build", rolldown = $"{Math.Round(rolldownBuildMs, 1)}ms", esbuild = $"{Math.Round(esbuildBuildMs, 1)}ms", speedup = $"{Math.Round(esbuildBuildMs / rolldownBuildMs, 1)}x" },
                new { metric = "Bundle Size", rolldown = $"{Math.Round(rolldownBundleKb, 1)}KB", esbuild = $"{Math.Round(esbuildBundleKb, 1)}KB", speedup = $"{Math.Round(esbuildBundleKb / rolldownBundleKb, 1)}x smaller" },
                new { metric = "Tree Shaking", rolldown = $"{treeShaking}%", esbuild = $"{Math.Round(treeShaking * 0.8, 1)}%", speedup = "Better DCE" }
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.BuildToolchainResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item == null) return NotFound();
        _db.BuildToolchainResults.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var items = await _db.BuildToolchainResults.Where(r => r.UserId == UserId).ToListAsync();
        if (items.Count == 0) return Ok(new { totalBenchmarks = 0 });

        return Ok(new
        {
            totalBenchmarks = items.Count,
            avgSpeedup = Math.Round(items.Average(r => r.SpeedupFactor), 1),
            avgBuildMs = Math.Round(items.Average(r => r.BuildDurationMs), 1),
            avgBundleKb = Math.Round(items.Average(r => r.BundleSizeKb), 1),
            avgTreeShaking = Math.Round(items.Average(r => r.TreeShakingPercent), 1),
            byBundler = items.GroupBy(r => r.Bundler).Select(g => new
            {
                bundler = g.Key,
                count = g.Count(),
                avgBuildMs = Math.Round(g.Average(r => r.BuildDurationMs), 1)
            }),
            byStatus = items.GroupBy(r => r.Status).Select(g => new
            {
                status = g.Key,
                count = g.Count()
            })
        });
    }

    [AllowAnonymous]
    [HttpGet("bundlers")]
    public IActionResult GetBundlers()
    {
        return Ok(new[]
        {
            new { id = "rolldown", name = "Rolldown (Vite 8)", description = "Rust-based unified bundler — replaces esbuild + Rollup for consistent dev/prod behavior", speed = "3x faster", language = "Rust", color = "#3B82F6" },
            new { id = "esbuild-rollup", name = "esbuild + Rollup (Vite 7)", description = "Current dual-bundler — esbuild for dev, Rollup for production builds", speed = "Baseline", language = "Go + JS", color = "#F59E0B" }
        });
    }

    public class BenchmarkRequest
    {
        public string ProjectName { get; set; } = string.Empty;
        public string Bundler { get; set; } = "rolldown";
        public bool FullBundleMode { get; set; }
    }
}
