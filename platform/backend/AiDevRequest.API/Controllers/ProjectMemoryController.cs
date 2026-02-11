using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/project-memory")]
public class ProjectMemoryController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public ProjectMemoryController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/project-memory/memories
    [HttpGet("memories")]
    public async Task<IActionResult> ListMemories([FromQuery] string? project, [FromQuery] string? category)
    {
        var userId = GetUserId();
        var query = _db.ProjectMemories.Where(m => m.UserId == userId);
        if (!string.IsNullOrEmpty(project))
            query = query.Where(m => m.ProjectName == project);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(m => m.Category == category);
        var memories = await query
            .OrderByDescending(m => m.Confidence)
            .ThenByDescending(m => m.UpdatedAt)
            .Take(100)
            .ToListAsync();
        return Ok(memories);
    }

    // POST /api/project-memory/memories
    [HttpPost("memories")]
    public async Task<IActionResult> AddMemory([FromBody] AddMemoryRequest req)
    {
        var userId = GetUserId();
        var memory = new ProjectMemory
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = req.ProjectName ?? "",
            MemoryType = req.MemoryType ?? "convention",
            Category = req.Category ?? "general",
            Content = req.Content,
            Summary = req.Summary ?? "",
            SourceType = req.SourceType ?? "explicit",
            SourceRef = req.SourceRef ?? "",
            Confidence = 0.7,
            Reinforcements = 0,
            Contradictions = 0,
            IsActive = true,
            TagsJson = req.TagsJson ?? "[]",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.ProjectMemories.Add(memory);
        await _db.SaveChangesAsync();
        return Ok(memory);
    }

    // PUT /api/project-memory/memories/{id}
    [HttpPut("memories/{id}")]
    public async Task<IActionResult> UpdateMemory(Guid id, [FromBody] UpdateMemoryRequest req)
    {
        var userId = GetUserId();
        var memory = await _db.ProjectMemories.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
        if (memory == null) return NotFound();

        if (req.Content != null) memory.Content = req.Content;
        if (req.Summary != null) memory.Summary = req.Summary;
        if (req.Category != null) memory.Category = req.Category;
        if (req.IsActive.HasValue) memory.IsActive = req.IsActive.Value;
        if (req.TagsJson != null) memory.TagsJson = req.TagsJson;
        memory.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(memory);
    }

    // DELETE /api/project-memory/memories/{id}
    [HttpDelete("memories/{id}")]
    public async Task<IActionResult> DeleteMemory(Guid id)
    {
        var userId = GetUserId();
        var memory = await _db.ProjectMemories.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
        if (memory == null) return NotFound();

        _db.ProjectMemories.Remove(memory);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // POST /api/project-memory/memories/{id}/reinforce
    [HttpPost("memories/{id}/reinforce")]
    public async Task<IActionResult> ReinforceMemory(Guid id)
    {
        var userId = GetUserId();
        var memory = await _db.ProjectMemories.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
        if (memory == null) return NotFound();

        memory.Reinforcements++;
        memory.Confidence = Math.Min(1.0, memory.Confidence + 0.05);
        memory.LastAppliedAt = DateTime.UtcNow;
        memory.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(memory);
    }

    // POST /api/project-memory/memories/{id}/contradict
    [HttpPost("memories/{id}/contradict")]
    public async Task<IActionResult> ContradictMemory(Guid id)
    {
        var userId = GetUserId();
        var memory = await _db.ProjectMemories.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
        if (memory == null) return NotFound();

        memory.Contradictions++;
        memory.Confidence = Math.Max(0.0, memory.Confidence - 0.1);
        if (memory.Confidence < 0.2) memory.IsActive = false;
        memory.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(memory);
    }

    // GET /api/project-memory/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var memories = await _db.ProjectMemories.Where(m => m.UserId == userId).ToListAsync();
        var totalMemories = memories.Count;
        var activeMemories = memories.Count(m => m.IsActive);
        var avgConfidence = memories.Any() ? Math.Round(memories.Average(m => m.Confidence) * 100, 1) : 0;
        var totalReinforcements = memories.Sum(m => m.Reinforcements);
        var totalContradictions = memories.Sum(m => m.Contradictions);

        var byCategory = memories.GroupBy(m => m.Category).Select(g => new
        {
            category = g.Key,
            count = g.Count(),
            avgConfidence = Math.Round(g.Average(m => m.Confidence) * 100, 1)
        }).OrderByDescending(x => x.count).ToList();

        var byType = memories.GroupBy(m => m.MemoryType).Select(g => new
        {
            type = g.Key,
            count = g.Count()
        }).OrderByDescending(x => x.count).ToList();

        var recentMemories = memories.OrderByDescending(m => m.UpdatedAt).Take(5).Select(m => new
        {
            m.Summary,
            m.Category,
            m.Confidence,
            m.Reinforcements,
            m.UpdatedAt
        }).ToList();

        return Ok(new
        {
            totalMemories,
            activeMemories,
            avgConfidence,
            totalReinforcements,
            totalContradictions,
            byCategory,
            byType,
            recentMemories
        });
    }

    // GET /api/project-memory/projects
    [HttpGet("projects")]
    public async Task<IActionResult> ListProjects()
    {
        var userId = GetUserId();
        var projects = await _db.ProjectMemories
            .Where(m => m.UserId == userId && m.ProjectName != "")
            .GroupBy(m => m.ProjectName)
            .Select(g => new { name = g.Key, memoryCount = g.Count() })
            .OrderByDescending(p => p.memoryCount)
            .Take(20)
            .ToListAsync();
        return Ok(projects);
    }
}

public record AddMemoryRequest(string Content, string? ProjectName, string? MemoryType, string? Category, string? Summary, string? SourceType, string? SourceRef, string? TagsJson);
public record UpdateMemoryRequest(string? Content, string? Summary, string? Category, bool? IsActive, string? TagsJson);
