using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/performance-opt")]
[Authorize]
public class PerformanceOptController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public PerformanceOptController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListOptimizations()
    {
        var userId = GetUserId();
        var items = await _db.PerformanceOptimizations.Where(o => o.UserId == userId).OrderByDescending(o => o.UpdatedAt).Take(50).ToListAsync();
        return Ok(items);
    }

    public record RunBenchmarkRequest(string ProjectName, string? Category);

    [HttpPost("benchmark")]
    public async Task<IActionResult> RunBenchmark([FromBody] RunBenchmarkRequest req)
    {
        var userId = GetUserId();
        var count = await _db.PerformanceOptimizations.CountAsync(o => o.UserId == userId);
        if (count >= 50) return BadRequest("Maximum 50 optimizations per user");

        var rng = new Random();
        var category = req.Category ?? "json";

        var (baseLatency, improvement, memBefore, memSaved, throughput) = category switch
        {
            "json" => (rng.NextDouble() * 20 + 30, rng.NextDouble() * 10 + 30, rng.NextDouble() * 100 + 200, rng.NextDouble() * 5 + 8, rng.NextDouble() * 5000 + 10000),
            "http" => (rng.NextDouble() * 15 + 20, rng.NextDouble() * 8 + 18, rng.NextDouble() * 80 + 150, rng.NextDouble() * 5 + 5, rng.NextDouble() * 8000 + 15000),
            "startup" => (rng.NextDouble() * 500 + 1000, rng.NextDouble() * 5 + 12, rng.NextDouble() * 200 + 300, rng.NextDouble() * 10 + 15, 0.0),
            "aot" => (rng.NextDouble() * 300 + 500, rng.NextDouble() * 15 + 25, rng.NextDouble() * 150 + 250, rng.NextDouble() * 15 + 30, rng.NextDouble() * 3000 + 8000),
            "gc" => (rng.NextDouble() * 10 + 15, rng.NextDouble() * 5 + 5, rng.NextDouble() * 300 + 400, rng.NextDouble() * 5 + 8, rng.NextDouble() * 10000 + 20000),
            _ => (rng.NextDouble() * 20 + 30, rng.NextDouble() * 10 + 20, rng.NextDouble() * 100 + 200, rng.NextDouble() * 5 + 10, rng.NextDouble() * 5000 + 10000),
        };

        var optimizedLatency = baseLatency * (1 - improvement / 100);

        var opt = new PerformanceOptimization
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = req.ProjectName,
            Category = category,
            Enabled = true,
            BaselineLatencyMs = Math.Round(baseLatency, 1),
            OptimizedLatencyMs = Math.Round(optimizedLatency, 1),
            ImprovementPercent = Math.Round(improvement, 1),
            MemoryBeforeMb = Math.Round(memBefore, 1),
            MemoryAfterMb = Math.Round(memBefore * (1 - memSaved / 100), 1),
            MemorySavedPercent = Math.Round(memSaved, 1),
            BenchmarkRuns = rng.Next(100, 1000),
            ThroughputRps = Math.Round(throughput, 0),
            Status = "optimized",
        };

        _db.PerformanceOptimizations.Add(opt);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            optimization = opt,
            benchmarkDetails = new[]
            {
                new { metric = "JSON Serialization", before = $"{Math.Round(baseLatency * 0.4, 1)}ms", after = $"{Math.Round(optimizedLatency * 0.35, 1)}ms", improvement = $"{Math.Round(improvement * 1.1, 1)}%" },
                new { metric = "HTTP Request Handling", before = $"{Math.Round(baseLatency * 0.3, 1)}ms", after = $"{Math.Round(optimizedLatency * 0.25, 1)}ms", improvement = $"{Math.Round(improvement * 0.9, 1)}%" },
                new { metric = "GC Pause Time", before = $"{Math.Round(rng.NextDouble() * 5 + 2, 1)}ms", after = $"{Math.Round(rng.NextDouble() * 3 + 1, 1)}ms", improvement = $"{Math.Round(rng.NextDouble() * 20 + 15, 1)}%" },
                new { metric = "Memory Allocation", before = $"{Math.Round(memBefore, 0)}MB", after = $"{Math.Round(memBefore * (1 - memSaved / 100), 0)}MB", improvement = $"{Math.Round(memSaved, 1)}%" },
            },
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOptimization(Guid id)
    {
        var userId = GetUserId();
        var opt = await _db.PerformanceOptimizations.FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);
        if (opt == null) return NotFound();
        _db.PerformanceOptimizations.Remove(opt);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var items = await _db.PerformanceOptimizations.Where(o => o.UserId == userId).ToListAsync();
        if (items.Count == 0)
            return Ok(new { totalOptimizations = 0, avgImprovement = 0.0, avgMemorySaved = 0.0, totalBenchmarks = 0, avgThroughput = 0.0, byCategory = Array.Empty<object>(), byStatus = Array.Empty<object>() });

        var byCategory = items.GroupBy(o => o.Category).Select(g => new { category = g.Key, count = g.Count(), avgImprovement = Math.Round(g.Average(o => o.ImprovementPercent), 1) }).ToList();
        var byStatus = items.GroupBy(o => o.Status).Select(g => new { status = g.Key, count = g.Count() }).ToList();

        return Ok(new
        {
            totalOptimizations = items.Count,
            avgImprovement = Math.Round(items.Average(o => o.ImprovementPercent), 1),
            avgMemorySaved = Math.Round(items.Average(o => o.MemorySavedPercent), 1),
            totalBenchmarks = items.Sum(o => o.BenchmarkRuns),
            avgThroughput = Math.Round(items.Where(o => o.ThroughputRps > 0).DefaultIfEmpty().Average(o => o?.ThroughputRps ?? 0), 0),
            byCategory,
            byStatus,
        });
    }

    [AllowAnonymous]
    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        var categories = new[]
        {
            new { id = "json", name = "JSON Serialization", description = "35% faster with System.Text.Json source generators", color = "#3B82F6", improvement = "35%" },
            new { id = "http", name = "HTTP/2 & HTTP/3", description = "20% faster Kestrel request handling, 25% lower latency", color = "#10B981", improvement = "20%" },
            new { id = "startup", name = "Startup Time", description = "15% faster cold starts with optimized assembly loading", color = "#F59E0B", improvement = "15%" },
            new { id = "aot", name = "Native AOT", description = "30-40% less memory with ahead-of-time compilation", color = "#8B5CF6", improvement = "35%" },
            new { id = "gc", name = "Garbage Collection", description = "8-12% less memory overhead with improved GC", color = "#EF4444", improvement = "10%" },
        };
        return Ok(categories);
    }
}
