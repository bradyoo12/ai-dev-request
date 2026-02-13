using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agent-rules")]
[Authorize]
public class AiAgentRuleController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public AiAgentRuleController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListRules([FromQuery] string? scope = null, [FromQuery] string? category = null)
    {
        var userId = GetUserId();
        var query = _db.AiAgentRules.Where(r => r.UserId == userId);
        if (!string.IsNullOrEmpty(scope))
            query = query.Where(r => r.Scope == scope);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(r => r.Category == category);
        var rules = await query.OrderByDescending(r => r.Priority).ThenByDescending(r => r.UpdatedAt).Take(100).ToListAsync();
        return Ok(rules);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRule(Guid id)
    {
        var userId = GetUserId();
        var rule = await _db.AiAgentRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (rule == null) return NotFound();
        return Ok(rule);
    }

    public record CreateRuleRequest(string? Title, string? Content, string? Scope, string? Category, string? ProjectName, int? Priority);

    [HttpPost]
    public async Task<IActionResult> CreateRule([FromBody] CreateRuleRequest req)
    {
        var userId = GetUserId();
        var count = await _db.AiAgentRules.CountAsync(r => r.UserId == userId);
        if (count >= 200) return BadRequest("Maximum 200 rules per user");

        var rule = new AiAgentRule
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = req.Title ?? "",
            Content = req.Content ?? "",
            Scope = req.Scope ?? "user",
            Category = req.Category ?? "coding-standards",
            ProjectName = req.ProjectName ?? "",
            Priority = req.Priority ?? 50,
            IsActive = true,
        };

        _db.AiAgentRules.Add(rule);
        await _db.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleRule(Guid id)
    {
        var userId = GetUserId();
        var rule = await _db.AiAgentRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (rule == null) return NotFound();

        rule.IsActive = !rule.IsActive;
        rule.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRule(Guid id)
    {
        var userId = GetUserId();
        var rule = await _db.AiAgentRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (rule == null) return NotFound();

        _db.AiAgentRules.Remove(rule);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var rules = await _db.AiAgentRules.Where(r => r.UserId == userId).ToListAsync();
        if (rules.Count == 0)
            return Ok(new
            {
                totalRules = 0, activeRules = 0, totalApplied = 0,
                byScope = Array.Empty<object>(), byCategory = Array.Empty<object>()
            });

        var byScope = rules.GroupBy(r => r.Scope).Select(g => new { scope = g.Key, count = g.Count(), active = g.Count(r => r.IsActive) }).ToList();
        var byCategory = rules.GroupBy(r => r.Category).Select(g => new { category = g.Key, count = g.Count(), totalApplied = g.Sum(r => r.TimesApplied) }).ToList();

        return Ok(new
        {
            totalRules = rules.Count,
            activeRules = rules.Count(r => r.IsActive),
            totalApplied = rules.Sum(r => r.TimesApplied),
            byScope,
            byCategory
        });
    }

    [AllowAnonymous]
    [HttpGet("categories")]
    public IActionResult GetCategories()
    {
        var categories = new[]
        {
            new { id = "architecture", name = "Architecture Patterns", description = "System architecture, design patterns, and structural decisions", color = "#3B82F6" },
            new { id = "coding-standards", name = "Coding Standards", description = "Code style, naming conventions, and formatting rules", color = "#10B981" },
            new { id = "tech-stack", name = "Tech Stack", description = "Preferred libraries, frameworks, and tools", color = "#8B5CF6" },
            new { id = "security", name = "Security Policies", description = "Security practices, authentication, and data protection", color = "#EF4444" },
            new { id = "testing", name = "Testing Standards", description = "Test coverage requirements, testing patterns, and QA rules", color = "#F59E0B" },
            new { id = "deployment", name = "Deployment Rules", description = "CI/CD, environment configuration, and release processes", color = "#6366F1" },
        };
        return Ok(categories);
    }
}
