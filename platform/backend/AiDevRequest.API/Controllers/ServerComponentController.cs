using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/server-components")]
[Authorize]
public class ServerComponentController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public ServerComponentController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListConfigs([FromQuery] string? framework = null)
    {
        var userId = GetUserId();
        var query = _db.ServerComponentConfigs.Where(c => c.UserId == userId);
        if (!string.IsNullOrEmpty(framework))
            query = query.Where(c => c.Framework == framework);
        var configs = await query.OrderByDescending(c => c.UpdatedAt).Take(50).ToListAsync();
        return Ok(configs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetConfig(Guid id)
    {
        var userId = GetUserId();
        var config = await _db.ServerComponentConfigs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (config == null) return NotFound();
        return Ok(config);
    }

    public record CreateConfigRequest(string? ProjectName, string? Framework, string? RenderStrategy, bool? StreamingEnabled, bool? MetadataHoisting, bool? DirectDbAccess, string? DataFetchingPattern);

    [HttpPost]
    public async Task<IActionResult> CreateConfig([FromBody] CreateConfigRequest req)
    {
        var userId = GetUserId();
        var count = await _db.ServerComponentConfigs.CountAsync(c => c.UserId == userId);
        if (count >= 50) return BadRequest("Maximum 50 configurations per user");

        var config = new ServerComponentConfig
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = req.ProjectName ?? "",
            Framework = req.Framework ?? "nextjs",
            RenderStrategy = req.RenderStrategy ?? "hybrid",
            StreamingEnabled = req.StreamingEnabled ?? true,
            MetadataHoisting = req.MetadataHoisting ?? true,
            DirectDbAccess = req.DirectDbAccess ?? false,
            DataFetchingPattern = req.DataFetchingPattern ?? "server-fetch",
        };

        _db.ServerComponentConfigs.Add(config);
        await _db.SaveChangesAsync();
        return Ok(config);
    }

    [HttpPost("{id}/analyze")]
    public async Task<IActionResult> AnalyzeProject(Guid id)
    {
        var userId = GetUserId();
        var config = await _db.ServerComponentConfigs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (config == null) return NotFound();

        // Simulated analysis
        var rng = new Random();
        config.ServerComponentCount = rng.Next(10, 40);
        config.ClientComponentCount = rng.Next(5, 20);
        config.BundleSizeReductionPercent = Math.Round(rng.NextDouble() * 40 + 20, 1);
        config.InitialLoadMs = Math.Round(rng.NextDouble() * 800 + 200, 0);
        config.Status = "optimized";
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(config);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteConfig(Guid id)
    {
        var userId = GetUserId();
        var config = await _db.ServerComponentConfigs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (config == null) return NotFound();

        _db.ServerComponentConfigs.Remove(config);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var configs = await _db.ServerComponentConfigs.Where(c => c.UserId == userId).ToListAsync();
        if (configs.Count == 0)
            return Ok(new
            {
                totalProjects = 0, avgBundleReduction = 0.0, avgInitialLoad = 0.0,
                byFramework = Array.Empty<object>(), byStrategy = Array.Empty<object>()
            });

        var byFramework = configs.GroupBy(c => c.Framework).Select(g => new { framework = g.Key, count = g.Count(), avgReduction = Math.Round(g.Average(c => c.BundleSizeReductionPercent), 1) }).ToList();
        var byStrategy = configs.GroupBy(c => c.RenderStrategy).Select(g => new { strategy = g.Key, count = g.Count() }).ToList();

        return Ok(new
        {
            totalProjects = configs.Count,
            avgBundleReduction = Math.Round(configs.Average(c => c.BundleSizeReductionPercent), 1),
            avgInitialLoad = Math.Round(configs.Average(c => c.InitialLoadMs), 0),
            byFramework,
            byStrategy
        });
    }

    [AllowAnonymous]
    [HttpGet("frameworks")]
    public IActionResult GetFrameworks()
    {
        var frameworks = new[]
        {
            new { id = "nextjs", name = "Next.js App Router", description = "Full RSC support with file-based routing and built-in SSR/SSG", color = "#000000" },
            new { id = "remix", name = "Remix", description = "Nested routes with loader/action patterns and streaming", color = "#3992FF" },
            new { id = "vite-rsc", name = "Vite + RSC", description = "Experimental RSC support with Vite bundler for custom setups", color = "#646CFF" },
        };
        return Ok(frameworks);
    }

    [AllowAnonymous]
    [HttpGet("patterns")]
    public IActionResult GetPatterns()
    {
        var patterns = new[]
        {
            new { id = "data-fetching", title = "Server Data Fetching", description = "Fetch data directly in server components without API endpoints", code = "async function ProductList() {\n  const products = await db.product.findMany();\n  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;\n}" },
            new { id = "streaming", title = "Streaming with Suspense", description = "Progressive rendering with React Suspense boundaries", code = "<Suspense fallback={<Loading />}>\n  <SlowComponent />\n</Suspense>" },
            new { id = "metadata", title = "Metadata Management", description = "Auto-hoisted metadata from server components to <head>", code = "export const metadata = {\n  title: 'My App',\n  description: 'Built with RSC'\n};" },
            new { id = "client-boundary", title = "Client Boundary", description = "Mark interactive components with 'use client' directive", code = "'use client';\nimport { useState } from 'react';\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(c+1)}>{count}</button>;\n}" },
        };
        return Ok(patterns);
    }
}
