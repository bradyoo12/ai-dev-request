using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/hybrid-cache")]
[Authorize]
public class HybridCacheController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public HybridCacheController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("entries")]
    public async Task<IActionResult> ListEntries([FromQuery] string? category = null)
    {
        var userId = GetUserId();
        var query = _db.HybridCacheEntries.Where(e => e.UserId == userId);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(e => e.Category == category);
        var entries = await query.OrderByDescending(e => e.UpdatedAt).Take(100).ToListAsync();
        return Ok(entries);
    }

    [HttpGet("entries/{id}")]
    public async Task<IActionResult> GetEntry(Guid id)
    {
        var userId = GetUserId();
        var entry = await _db.HybridCacheEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (entry == null) return NotFound();
        return Ok(entry);
    }

    [HttpPost("entries")]
    public async Task<IActionResult> CreateEntry([FromBody] CreateCacheEntryRequest request)
    {
        var userId = GetUserId();
        var count = await _db.HybridCacheEntries.CountAsync(e => e.UserId == userId && e.Status == "active");
        if (count >= 200) return BadRequest("Maximum 200 active cache entries per user");

        var entry = new HybridCacheEntry
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CacheKey = request.CacheKey ?? $"cache:{request.Category}:{Guid.NewGuid():N}",
            CacheLayer = request.CacheLayer ?? "L1",
            Category = request.Category ?? "general",
            SizeBytes = request.SizeBytes,
            StampedeProtected = request.StampedeProtected,
            TtlSeconds = request.TtlSeconds > 0 ? request.TtlSeconds : 3600,
            ExpiresAt = DateTime.UtcNow.AddSeconds(request.TtlSeconds > 0 ? request.TtlSeconds : 3600),
        };

        _db.HybridCacheEntries.Add(entry);
        await _db.SaveChangesAsync();
        return Ok(entry);
    }

    [HttpPost("entries/{id}/invalidate")]
    public async Task<IActionResult> InvalidateEntry(Guid id)
    {
        var userId = GetUserId();
        var entry = await _db.HybridCacheEntries.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
        if (entry == null) return NotFound();

        entry.Status = "evicted";
        entry.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(entry);
    }

    [HttpPost("invalidate-all")]
    public async Task<IActionResult> InvalidateAll([FromQuery] string? category = null)
    {
        var userId = GetUserId();
        var query = _db.HybridCacheEntries.Where(e => e.UserId == userId && e.Status == "active");
        if (!string.IsNullOrEmpty(category))
            query = query.Where(e => e.Category == category);

        var entries = await query.ToListAsync();
        foreach (var e in entries)
        {
            e.Status = "evicted";
            e.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(new { evicted = entries.Count });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var entries = await _db.HybridCacheEntries.Where(e => e.UserId == userId).ToListAsync();

        var active = entries.Where(e => e.Status == "active").ToList();
        var totalHits = entries.Sum(e => e.HitCount);
        var totalMisses = entries.Sum(e => e.MissCount);
        var hitRate = totalHits + totalMisses > 0
            ? Math.Round(totalHits * 100.0 / (totalHits + totalMisses), 1)
            : 0;

        var stats = new
        {
            totalEntries = entries.Count,
            activeEntries = active.Count,
            expiredEntries = entries.Count(e => e.Status == "expired"),
            evictedEntries = entries.Count(e => e.Status == "evicted"),
            totalHits,
            totalMisses,
            hitRate,
            totalSizeBytes = active.Sum(e => e.SizeBytes),
            totalCostSaved = Math.Round(entries.Sum(e => e.CostSavedUsd), 4),
            avgLatencyMs = entries.Count > 0 ? Math.Round(entries.Average(e => e.AvgLatencyMs), 1) : 0,
            stampedeBlocked = entries.Sum(e => e.StampedeBlockedCount),
            byCategory = entries.GroupBy(e => e.Category).Select(g => new
            {
                category = g.Key,
                count = g.Count(),
                hits = g.Sum(e => e.HitCount),
                misses = g.Sum(e => e.MissCount),
                costSaved = Math.Round(g.Sum(e => e.CostSavedUsd), 4),
            }),
            byLayer = entries.GroupBy(e => e.CacheLayer).Select(g => new
            {
                layer = g.Key,
                count = g.Count(),
                sizeBytes = g.Sum(e => e.SizeBytes),
                avgLatencyMs = Math.Round(g.Average(e => e.AvgLatencyMs), 1),
            }),
        };

        return Ok(stats);
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    public IActionResult GetCategories()
    {
        var categories = new[]
        {
            new { id = "ai-analysis", name = "AI Analysis", description = "Cached AI analysis results for dev requests", icon = "brain", color = "#8b5cf6" },
            new { id = "template", name = "Templates", description = "Cached project templates and scaffolds", icon = "layout", color = "#3b82f6" },
            new { id = "scaffold", name = "Scaffolds", description = "Generated code scaffolds and boilerplate", icon = "code", color = "#10b981" },
            new { id = "project", name = "Project Data", description = "Cached project configurations and metadata", icon = "folder", color = "#f59e0b" },
            new { id = "model-response", name = "Model Responses", description = "Cached Claude API responses for similar prompts", icon = "message-square", color = "#ef4444" },
            new { id = "general", name = "General", description = "General-purpose cache entries", icon = "database", color = "#6b7280" },
        };
        return Ok(categories);
    }
}

public record CreateCacheEntryRequest(
    string? CacheKey,
    string? CacheLayer,
    string? Category,
    long SizeBytes,
    bool StampedeProtected,
    int TtlSeconds
);
