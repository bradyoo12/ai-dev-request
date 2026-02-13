using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/multi-model-routing")]
[Authorize]
public class MultiModelRoutingController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public MultiModelRoutingController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListRules()
    {
        var userId = GetUserId();
        var rules = await _db.ModelRoutingRules.Where(r => r.UserId == userId).OrderByDescending(r => r.UpdatedAt).Take(50).ToListAsync();
        return Ok(rules);
    }

    public record CreateRuleRequest(string? TaskType, string? PrimaryModel, string? FallbackModel, string? RoutingStrategy, double? CostThreshold, double? LatencyThresholdMs);

    [HttpPost]
    public async Task<IActionResult> CreateRule([FromBody] CreateRuleRequest req)
    {
        var userId = GetUserId();
        var count = await _db.ModelRoutingRules.CountAsync(r => r.UserId == userId);
        if (count >= 20) return BadRequest("Maximum 20 routing rules per user");

        var rule = new ModelRoutingRule
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TaskType = req.TaskType ?? "code-generation",
            PrimaryModel = req.PrimaryModel ?? "claude-opus",
            FallbackModel = req.FallbackModel ?? "gpt-codex",
            RoutingStrategy = req.RoutingStrategy ?? "quality-first",
            CostThreshold = req.CostThreshold ?? 0.10,
            LatencyThresholdMs = req.LatencyThresholdMs ?? 5000,
        };

        _db.ModelRoutingRules.Add(rule);
        await _db.SaveChangesAsync();
        return Ok(rule);
    }

    public record SimulateRequest(string TaskType, string Prompt);

    [HttpPost("simulate")]
    public async Task<IActionResult> SimulateRouting([FromBody] SimulateRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();

        var rule = await _db.ModelRoutingRules.FirstOrDefaultAsync(r => r.UserId == userId && r.TaskType == req.TaskType);
        var primaryModel = rule?.PrimaryModel ?? "claude-opus";
        var fallbackModel = rule?.FallbackModel ?? "gpt-codex";
        var strategy = rule?.RoutingStrategy ?? "quality-first";

        var primaryLatency = Math.Round(rng.NextDouble() * 2000 + 1000, 0);
        var fallbackLatency = Math.Round(rng.NextDouble() * 800 + 400, 0);
        var primaryCost = Math.Round(rng.NextDouble() * 0.08 + 0.04, 4);
        var fallbackCost = Math.Round(rng.NextDouble() * 0.03 + 0.01, 4);
        var primaryAccuracy = Math.Round(rng.NextDouble() * 10 + 88, 1);
        var fallbackAccuracy = Math.Round(rng.NextDouble() * 15 + 72, 1);

        var selectedModel = strategy switch
        {
            "speed-first" => fallbackModel,
            "cost-optimized" => primaryCost > (rule?.CostThreshold ?? 0.10) ? fallbackModel : primaryModel,
            "balanced" => rng.NextDouble() > 0.5 ? primaryModel : fallbackModel,
            _ => primaryModel,
        };

        if (rule != null)
        {
            rule.TotalRequests++;
            if (selectedModel == primaryModel) rule.PrimaryHits++;
            else rule.FallbackHits++;
            rule.AvgPrimaryLatencyMs = Math.Round((rule.AvgPrimaryLatencyMs * (rule.TotalRequests - 1) + primaryLatency) / rule.TotalRequests, 0);
            rule.AvgFallbackLatencyMs = Math.Round((rule.AvgFallbackLatencyMs * (rule.TotalRequests - 1) + fallbackLatency) / rule.TotalRequests, 0);
            rule.AvgPrimaryCost = Math.Round((rule.AvgPrimaryCost * (rule.TotalRequests - 1) + primaryCost) / rule.TotalRequests, 4);
            rule.AvgFallbackCost = Math.Round((rule.AvgFallbackCost * (rule.TotalRequests - 1) + fallbackCost) / rule.TotalRequests, 4);
            rule.AccuracyScore = Math.Round((rule.AccuracyScore * (rule.TotalRequests - 1) + (selectedModel == primaryModel ? primaryAccuracy : fallbackAccuracy)) / rule.TotalRequests, 1);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            selectedModel,
            strategy,
            taskType = req.TaskType,
            comparison = new[]
            {
                new { model = primaryModel, latencyMs = primaryLatency, cost = primaryCost, accuracy = primaryAccuracy, selected = selectedModel == primaryModel },
                new { model = fallbackModel, latencyMs = fallbackLatency, cost = fallbackCost, accuracy = fallbackAccuracy, selected = selectedModel == fallbackModel },
            },
            reasoning = strategy switch
            {
                "speed-first" => $"Selected {fallbackModel} for lower latency ({fallbackLatency}ms vs {primaryLatency}ms)",
                "cost-optimized" => $"Selected {selectedModel} based on cost threshold (${primaryCost} vs limit ${rule?.CostThreshold ?? 0.10})",
                "balanced" => $"Selected {selectedModel} using balanced random distribution",
                _ => $"Selected {primaryModel} for highest accuracy ({primaryAccuracy}%)",
            },
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRule(Guid id)
    {
        var userId = GetUserId();
        var rule = await _db.ModelRoutingRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (rule == null) return NotFound();
        _db.ModelRoutingRules.Remove(rule);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var rules = await _db.ModelRoutingRules.Where(r => r.UserId == userId).ToListAsync();
        if (rules.Count == 0)
            return Ok(new { totalRules = 0, totalRequests = 0, avgAccuracy = 0.0, avgLatency = 0.0, avgCost = 0.0, byStrategy = Array.Empty<object>(), byTaskType = Array.Empty<object>() });

        var byStrategy = rules.GroupBy(r => r.RoutingStrategy).Select(g => new { strategy = g.Key, count = g.Count(), requests = g.Sum(r => r.TotalRequests) }).ToList();
        var byTaskType = rules.GroupBy(r => r.TaskType).Select(g => new { taskType = g.Key, count = g.Count(), requests = g.Sum(r => r.TotalRequests) }).ToList();

        return Ok(new
        {
            totalRules = rules.Count,
            totalRequests = rules.Sum(r => r.TotalRequests),
            avgAccuracy = Math.Round(rules.Where(r => r.AccuracyScore > 0).DefaultIfEmpty().Average(r => r?.AccuracyScore ?? 0), 1),
            avgLatency = Math.Round(rules.Where(r => r.AvgPrimaryLatencyMs > 0).DefaultIfEmpty().Average(r => r?.AvgPrimaryLatencyMs ?? 0), 0),
            avgCost = Math.Round(rules.Where(r => r.AvgPrimaryCost > 0).DefaultIfEmpty().Average(r => r?.AvgPrimaryCost ?? 0), 4),
            byStrategy,
            byTaskType,
        });
    }

    [AllowAnonymous]
    [HttpGet("models")]
    public IActionResult GetModels()
    {
        var models = new[]
        {
            new { id = "claude-opus", name = "Claude Opus 4.6", description = "Deep reasoning, 80.8% SWE-Bench, 1M context", color = "#8B5CF6", speed = "1x", accuracy = "80.8%", costPer1k = "$0.075" },
            new { id = "claude-sonnet", name = "Claude Sonnet 4.5", description = "Balanced quality and speed for most tasks", color = "#3B82F6", speed = "2x", accuracy = "70.3%", costPer1k = "$0.015" },
            new { id = "gpt-codex", name = "GPT-5.3-Codex", description = "Fast code generation, 77.3% Terminal-Bench", color = "#10B981", speed = "3x", accuracy = "77.3%", costPer1k = "$0.030" },
            new { id = "gpt-4o", name = "GPT-4o", description = "Multimodal reasoning with vision capabilities", color = "#F59E0B", speed = "2.5x", accuracy = "71.1%", costPer1k = "$0.025" },
        };
        return Ok(models);
    }
}
