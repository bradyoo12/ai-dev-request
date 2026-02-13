using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/react-use-hook")]
[Authorize]
public class ReactUseHookController(AiDevRequestDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.ReactUseHookDemos
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("benchmark")]
    public async Task<IActionResult> Benchmark([FromBody] BenchmarkRequest req)
    {
        var rng = new Random();

        var useHookResult = new ReactUseHookDemo
        {
            ComponentName = req.ComponentName,
            DataSource = req.DataSource,
            Pattern = "use-hook",
            SuspenseEnabled = true,
            ErrorBoundaryEnabled = true,
            RequestDedup = true,
            RenderTimeMs = Math.Round(rng.NextDouble() * 30 + 5, 2),
            DataFetchMs = Math.Round(rng.NextDouble() * 100 + 20, 2),
            ReRenderCount = rng.Next(1, 3),
            BoilerplateLines = rng.Next(3, 8),
            PerformanceScore = Math.Round(85 + rng.NextDouble() * 15, 1),
            Status = "completed"
        };

        var useEffectResult = new
        {
            pattern = "use-effect",
            suspenseEnabled = false,
            errorBoundaryEnabled = false,
            requestDedup = false,
            renderTimeMs = Math.Round(useHookResult.RenderTimeMs * (1.2 + rng.NextDouble() * 0.5), 2),
            dataFetchMs = Math.Round(useHookResult.DataFetchMs * (1.1 + rng.NextDouble() * 0.3), 2),
            reRenderCount = useHookResult.ReRenderCount + rng.Next(1, 4),
            boilerplateLines = useHookResult.BoilerplateLines + rng.Next(8, 15),
            performanceScore = Math.Round(useHookResult.PerformanceScore * (0.7 + rng.NextDouble() * 0.15), 1)
        };

        db.ReactUseHookDemos.Add(useHookResult);
        await db.SaveChangesAsync();

        return Ok(new
        {
            component = req.ComponentName,
            useHook = useHookResult,
            useEffect = useEffectResult,
            improvement = new
            {
                renderTimeReduction = $"{Math.Round((1 - useHookResult.RenderTimeMs / (double)useEffectResult.renderTimeMs) * 100, 1)}%",
                fetchTimeReduction = $"{Math.Round((1 - useHookResult.DataFetchMs / useEffectResult.dataFetchMs) * 100, 1)}%",
                reRenderReduction = $"{useEffectResult.reRenderCount - useHookResult.ReRenderCount} fewer",
                boilerplateReduction = $"{useEffectResult.boilerplateLines - useHookResult.BoilerplateLines} lines saved",
                scoreImprovement = $"+{Math.Round(useHookResult.PerformanceScore - useEffectResult.performanceScore, 1)} points"
            },
            codeComparison = new
            {
                before = $"const [{req.ComponentName.ToLower()}Data, set{req.ComponentName}Data] = useState(null)\nuseEffect(() => {{\n  fetch('/api/{req.DataSource}').then(r => r.json()).then(set{req.ComponentName}Data)\n}}, [])",
                after = $"const {req.ComponentName.ToLower()}Data = use(fetch('/api/{req.DataSource}'))"
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var entity = await db.ReactUseHookDemos.FindAsync(id);
        if (entity == null) return NotFound();
        db.ReactUseHookDemos.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.ReactUseHookDemos.ToListAsync();
        if (all.Count == 0) return Ok(new { totalBenchmarks = 0 });

        var byDataSource = all.GroupBy(x => x.DataSource).Select(g => new
        {
            dataSource = g.Key,
            count = g.Count(),
            avgPerformanceScore = Math.Round(g.Average(x => x.PerformanceScore), 1)
        }).ToList();

        return Ok(new
        {
            totalBenchmarks = all.Count,
            avgRenderTimeMs = Math.Round(all.Average(x => x.RenderTimeMs), 2),
            avgDataFetchMs = Math.Round(all.Average(x => x.DataFetchMs), 2),
            avgPerformanceScore = Math.Round(all.Average(x => x.PerformanceScore), 1),
            avgBoilerplateLines = Math.Round(all.Average(x => (double)x.BoilerplateLines), 1),
            byDataSource
        });
    }

    [AllowAnonymous]
    [HttpGet("patterns")]
    public IActionResult GetPatterns()
    {
        return Ok(new[]
        {
            new { id = "use-hook", name = "React 19 use() Hook", description = "Native async data loading with Suspense integration", recommended = true, color = "#3b82f6" },
            new { id = "use-effect", name = "useEffect + useState", description = "Traditional pattern with manual loading/error states", recommended = false, color = "#6b7280" },
            new { id = "swr", name = "SWR (stale-while-revalidate)", description = "Vercel's data fetching library with caching", recommended = false, color = "#f59e0b" },
            new { id = "react-query", name = "TanStack Query", description = "Powerful data synchronization with background refetching", recommended = false, color = "#ef4444" }
        });
    }

    public record BenchmarkRequest(
        string ComponentName,
        string DataSource = "api"
    );
}
