using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/org-memory")]
[Authorize]
public class OrgMemoryController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public OrgMemoryController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("memories")]
    public async Task<IActionResult> ListMemories([FromQuery] string? scope = null, [FromQuery] string? category = null)
    {
        var userId = GetUserId();
        var query = _db.OrgMemories.Where(m => m.UserId == userId);
        if (!string.IsNullOrEmpty(scope))
            query = query.Where(m => m.Scope == scope);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(m => m.Category == category);
        var memories = await query.OrderByDescending(m => m.UpdatedAt).Take(100).ToListAsync();
        return Ok(memories);
    }

    [HttpGet("memories/{id}")]
    public async Task<IActionResult> GetMemory(Guid id)
    {
        var userId = GetUserId();
        var memory = await _db.OrgMemories.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
        if (memory == null) return NotFound();
        return Ok(memory);
    }

    public record CreateMemoryRequest(string? Title, string? Content, string? Scope, string? Category, string? SourceProject, string[]? Tags, int? DevRequestId);

    [HttpPost("memories")]
    public async Task<IActionResult> CreateMemory([FromBody] CreateMemoryRequest req)
    {
        var userId = GetUserId();
        var count = await _db.OrgMemories.CountAsync(m => m.UserId == userId);
        if (count >= 500) return BadRequest("Maximum 500 memories per user");

        var rng = new Random();
        var memory = new OrgMemory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Scope = req.Scope ?? "user",
            Category = req.Category ?? "preference",
            Title = req.Title ?? "Untitled Memory",
            Content = req.Content ?? "",
            SourceProject = req.SourceProject ?? "",
            Relevance = Math.Round(rng.NextDouble() * 0.4 + 0.6, 2),
            UsageCount = 0,
            TagsJson = System.Text.Json.JsonSerializer.Serialize(req.Tags ?? Array.Empty<string>()),
            EmbeddingStatus = "indexed",
            DevRequestId = req.DevRequestId,
        };

        _db.OrgMemories.Add(memory);
        await _db.SaveChangesAsync();
        return Ok(memory);
    }

    [HttpDelete("memories/{id}")]
    public async Task<IActionResult> DeleteMemory(Guid id)
    {
        var userId = GetUserId();
        var memory = await _db.OrgMemories.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
        if (memory == null) return NotFound();

        _db.OrgMemories.Remove(memory);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpPost("search")]
    public async Task<IActionResult> SearchMemories([FromBody] SearchRequest req)
    {
        var userId = GetUserId();
        var query = _db.OrgMemories.Where(m => m.UserId == userId);

        if (!string.IsNullOrEmpty(req.Query))
        {
            var q = req.Query.ToLower();
            query = query.Where(m => m.Title.ToLower().Contains(q) || m.Content.ToLower().Contains(q));
        }

        if (!string.IsNullOrEmpty(req.Scope))
            query = query.Where(m => m.Scope == req.Scope);

        var results = await query.OrderByDescending(m => m.Relevance).Take(20).ToListAsync();

        // Increment usage count for returned results
        foreach (var r in results)
        {
            r.UsageCount++;
            r.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();

        return Ok(results);
    }

    public record SearchRequest(string? Query, string? Scope);

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var memories = await _db.OrgMemories.Where(m => m.UserId == userId).ToListAsync();
        if (memories.Count == 0)
            return Ok(new
            {
                totalMemories = 0, userMemories = 0, orgMemories = 0,
                indexedCount = 0, avgRelevance = 0.0, totalUsages = 0,
                byCategory = Array.Empty<object>(), byScope = Array.Empty<object>()
            });

        var byCategory = memories.GroupBy(m => m.Category).Select(g => new
        {
            category = g.Key,
            count = g.Count(),
            avgRelevance = Math.Round(g.Average(m => m.Relevance) * 100)
        }).ToList();

        var byScope = memories.GroupBy(m => m.Scope).Select(g => new
        {
            scope = g.Key,
            count = g.Count()
        }).ToList();

        return Ok(new
        {
            totalMemories = memories.Count,
            userMemories = memories.Count(m => m.Scope == "user"),
            orgMemories = memories.Count(m => m.Scope == "org"),
            indexedCount = memories.Count(m => m.EmbeddingStatus == "indexed"),
            avgRelevance = memories.Count > 0 ? Math.Round(memories.Average(m => m.Relevance) * 100) : 0,
            totalUsages = memories.Sum(m => m.UsageCount),
            byCategory,
            byScope
        });
    }

    [AllowAnonymous]
    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        var categories = new[]
        {
            new { id = "preference", name = "Preference", description = "User coding preferences and tech stack choices", color = "#3B82F6" },
            new { id = "decision", name = "Decision", description = "Architecture and design decisions made during projects", color = "#10B981" },
            new { id = "pattern", name = "Pattern", description = "Recurring code patterns and solutions", color = "#F59E0B" },
            new { id = "standard", name = "Standard", description = "Team coding standards and conventions", color = "#8B5CF6" },
            new { id = "runbook", name = "Runbook", description = "Operational procedures and deployment steps", color = "#EF4444" },
        };
        return Ok(categories);
    }
}
