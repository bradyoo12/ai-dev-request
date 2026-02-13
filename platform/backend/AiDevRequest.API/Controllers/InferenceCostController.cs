using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/inference-cost")]
[Authorize]
public class InferenceCostController(AiDevRequestDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.InferenceCostRecords
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze([FromBody] AnalyzeRequest req)
    {
        var rng = new Random();

        var complexity = ClassifyComplexity(req.RequestType);
        var routedModel = RouteModel(complexity);
        var originalCost = GetModelCost("opus");
        var routedCost = GetModelCost(routedModel);

        var cacheHit = rng.NextDouble() < 0.4;
        var batched = rng.NextDouble() < 0.3;
        var responseReused = !cacheHit && rng.NextDouble() < 0.2;
        var similarity = responseReused ? Math.Round(0.95 + rng.NextDouble() * 0.05, 3) : 0;

        var finalCost = routedCost;
        var strategy = "routing";
        if (cacheHit) { finalCost *= 0.1; strategy = "caching"; }
        else if (responseReused) { finalCost *= 0.05; strategy = "reuse"; }
        else if (batched) { finalCost *= 0.7; strategy = "batching"; }

        finalCost = Math.Round(finalCost, 4);
        var savings = Math.Round(originalCost - finalCost, 4);
        var savingsPercent = Math.Round(savings / originalCost * 100, 1);

        var record = new InferenceCostRecord
        {
            ProjectName = req.ProjectName,
            RequestType = req.RequestType,
            ModelUsed = routedModel,
            ModelRouted = "opus",
            CostUsd = finalCost,
            OriginalCostUsd = originalCost,
            SavingsUsd = savings,
            SavingsPercent = savingsPercent,
            CacheHit = cacheHit,
            Batched = batched,
            ResponseReused = responseReused,
            SimilarityScore = similarity,
            InputTokens = rng.Next(100, 5000),
            OutputTokens = rng.Next(50, 3000),
            LatencyMs = Math.Round(rng.NextDouble() * 2000 + 200, 2),
            OptimizationStrategy = strategy,
            Status = "completed"
        };

        db.InferenceCostRecords.Add(record);
        await db.SaveChangesAsync();

        return Ok(new
        {
            record,
            routing = new
            {
                original = "opus",
                routed = routedModel,
                reason = complexity switch
                {
                    "simple" => "Simple task routed to Haiku for 98% cost reduction",
                    "complex" => "Complex task routed to Sonnet for 70% cost reduction",
                    _ => "Critical task kept on Opus for maximum quality"
                }
            },
            optimizations = new
            {
                cacheHit,
                batched,
                responseReused,
                similarity,
                strategy
            },
            costBreakdown = new
            {
                originalCost = $"${originalCost:F4}",
                routedCost = $"${routedCost:F4}",
                finalCost = $"${finalCost:F4}",
                savings = $"${savings:F4}",
                savingsPercent = $"{savingsPercent}%"
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var entity = await db.InferenceCostRecords.FindAsync(id);
        if (entity == null) return NotFound();
        db.InferenceCostRecords.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.InferenceCostRecords.ToListAsync();
        if (all.Count == 0) return Ok(new { totalRequests = 0 });

        var byStrategy = all.GroupBy(x => x.OptimizationStrategy).Select(g => new
        {
            strategy = g.Key,
            count = g.Count(),
            avgSavingsPercent = Math.Round(g.Average(x => x.SavingsPercent), 1),
            totalSavingsUsd = Math.Round(g.Sum(x => x.SavingsUsd), 4)
        }).ToList();

        return Ok(new
        {
            totalRequests = all.Count,
            totalCostUsd = Math.Round(all.Sum(x => x.CostUsd), 4),
            totalOriginalCostUsd = Math.Round(all.Sum(x => x.OriginalCostUsd), 4),
            totalSavingsUsd = Math.Round(all.Sum(x => x.SavingsUsd), 4),
            avgSavingsPercent = Math.Round(all.Average(x => x.SavingsPercent), 1),
            cacheHitRate = Math.Round((double)all.Count(x => x.CacheHit) / all.Count * 100, 1),
            byStrategy
        });
    }

    [AllowAnonymous]
    [HttpGet("strategies")]
    public IActionResult GetStrategies()
    {
        return Ok(new[]
        {
            new { id = "routing", name = "Smart Model Routing", description = "Route simple tasks to cheaper models (Haiku/Sonnet) automatically", savingsRange = "60-98%", color = "#3b82f6" },
            new { id = "caching", name = "Prompt Caching", description = "Cache common system prompts for 90% cost reduction on repeated calls", savingsRange = "50-90%", color = "#10b981" },
            new { id = "batching", name = "Request Batching", description = "Queue similar requests and batch process every 5 seconds", savingsRange = "30-70%", color = "#f59e0b" },
            new { id = "reuse", name = "Response Reuse", description = "Semantic search for similar past responses before making API calls", savingsRange = "80-95%", color = "#8b5cf6" }
        });
    }

    private static string ClassifyComplexity(string requestType) => requestType switch
    {
        "simple" => "simple",
        "complex" => "complex",
        "critical" => "critical",
        _ => "complex"
    };

    private static string RouteModel(string complexity) => complexity switch
    {
        "simple" => "haiku",
        "complex" => "sonnet",
        _ => "opus"
    };

    private static double GetModelCost(string model) => model switch
    {
        "haiku" => 0.01,
        "sonnet" => 0.15,
        "opus" => 0.50,
        _ => 0.50
    };

    public record AnalyzeRequest(
        string ProjectName,
        string RequestType = "complex"
    );
}
