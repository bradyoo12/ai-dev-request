using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/code-lint")]
[Authorize]
public class CodeLintController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public CodeLintController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListResults([FromQuery] string? severity = null, [FromQuery] string? category = null, [FromQuery] string? language = null)
    {
        var userId = GetUserId();
        var query = _db.CodeLintResults.Where(r => r.UserId == userId);
        if (!string.IsNullOrEmpty(severity))
            query = query.Where(r => r.Severity == severity);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(r => r.Category == category);
        if (!string.IsNullOrEmpty(language))
            query = query.Where(r => r.Language == language);
        var results = await query.OrderByDescending(r => r.CreatedAt).Take(100).ToListAsync();
        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetResult(Guid id)
    {
        var userId = GetUserId();
        var result = await _db.CodeLintResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (result == null) return NotFound();
        return Ok(result);
    }

    public record RunAnalysisRequest(string? ProjectName, string? Language);

    [HttpPost("analyze")]
    public async Task<IActionResult> RunAnalysis([FromBody] RunAnalysisRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();
        var languages = new[] { "typescript", "csharp", "python" };
        var categories = new[] { "bug", "vulnerability", "code-smell", "security", "performance", "maintainability" };
        var severities = new[] { "info", "warning", "error", "critical" };
        var lang = req.Language ?? languages[rng.Next(languages.Length)];

        var issueCount = rng.Next(3, 8);
        var issues = new List<CodeLintResult>();
        for (int i = 0; i < issueCount; i++)
        {
            issues.Add(new CodeLintResult
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ProjectName = req.ProjectName ?? "untitled",
                Language = lang,
                Severity = severities[rng.Next(severities.Length)],
                Category = categories[rng.Next(categories.Length)],
                RuleId = $"AI-{rng.Next(100, 999)}",
                Message = GetSampleMessage(rng),
                FilePath = GetSamplePath(lang, rng),
                LineNumber = rng.Next(1, 200),
                Snippet = GetSampleSnippet(lang, rng),
                SuggestedFix = "AI-generated fix available",
                AutofixStatus = "pending",
            });
        }

        _db.CodeLintResults.AddRange(issues);
        await _db.SaveChangesAsync();
        return Ok(issues);
    }

    [HttpPost("{id}/autofix")]
    public async Task<IActionResult> ApplyAutofix(Guid id)
    {
        var userId = GetUserId();
        var result = await _db.CodeLintResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (result == null) return NotFound();

        result.AutofixStatus = "applied";
        result.IsResolved = true;
        result.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(result);
    }

    [HttpPost("{id}/dismiss")]
    public async Task<IActionResult> DismissIssue(Guid id)
    {
        var userId = GetUserId();
        var result = await _db.CodeLintResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (result == null) return NotFound();

        result.AutofixStatus = "dismissed";
        result.IsResolved = true;
        result.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteResult(Guid id)
    {
        var userId = GetUserId();
        var result = await _db.CodeLintResults.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (result == null) return NotFound();

        _db.CodeLintResults.Remove(result);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var results = await _db.CodeLintResults.Where(r => r.UserId == userId).ToListAsync();
        if (results.Count == 0)
            return Ok(new
            {
                totalIssues = 0, resolved = 0, autofixed = 0, critical = 0,
                bySeverity = Array.Empty<object>(), byCategory = Array.Empty<object>(), byLanguage = Array.Empty<object>()
            });

        var bySeverity = results.GroupBy(r => r.Severity).Select(g => new { severity = g.Key, count = g.Count(), resolved = g.Count(r => r.IsResolved) }).ToList();
        var byCategory = results.GroupBy(r => r.Category).Select(g => new { category = g.Key, count = g.Count() }).ToList();
        var byLanguage = results.GroupBy(r => r.Language).Select(g => new { language = g.Key, count = g.Count() }).ToList();

        return Ok(new
        {
            totalIssues = results.Count,
            resolved = results.Count(r => r.IsResolved),
            autofixed = results.Count(r => r.AutofixStatus == "applied"),
            critical = results.Count(r => r.Severity == "critical"),
            bySeverity,
            byCategory,
            byLanguage
        });
    }

    [AllowAnonymous]
    [HttpGet("rules")]
    public IActionResult GetRules()
    {
        var rules = new[]
        {
            new { id = "bug", name = "Bugs", description = "Potential runtime errors and logic issues", color = "#EF4444", icon = "bug" },
            new { id = "vulnerability", name = "Vulnerabilities", description = "Security weaknesses exploitable by attackers", color = "#F97316", icon = "shield" },
            new { id = "code-smell", name = "Code Smells", description = "Maintainability issues and anti-patterns", color = "#EAB308", icon = "nose" },
            new { id = "security", name = "Security Hotspots", description = "Code requiring security review", color = "#DC2626", icon = "lock" },
            new { id = "performance", name = "Performance", description = "Inefficient code patterns affecting speed", color = "#3B82F6", icon = "zap" },
            new { id = "maintainability", name = "Maintainability", description = "Code complexity and readability issues", color = "#8B5CF6", icon = "wrench" },
        };
        return Ok(rules);
    }

    private static string GetSampleMessage(Random rng)
    {
        var messages = new[]
        {
            "Unused variable may indicate dead code",
            "Potential null reference exception",
            "SQL injection vulnerability detected",
            "Function exceeds complexity threshold (cyclomatic: 15)",
            "Missing error handling for async operation",
            "Hardcoded credentials detected",
            "Inefficient loop pattern - consider using LINQ",
            "Missing input validation on user-supplied data",
        };
        return messages[rng.Next(messages.Length)];
    }

    private static string GetSamplePath(string lang, Random rng)
    {
        return lang switch
        {
            "csharp" => $"src/Services/Service{rng.Next(1, 5)}.cs",
            "python" => $"app/utils/helper{rng.Next(1, 5)}.py",
            _ => $"src/components/Component{rng.Next(1, 5)}.tsx",
        };
    }

    private static string GetSampleSnippet(string lang, Random rng)
    {
        return lang switch
        {
            "csharp" => "var result = await service.GetAsync(id);",
            "python" => "result = db.query(f\"SELECT * FROM users WHERE id={user_id}\")",
            _ => "const data = await fetch(url).then(r => r.json());",
        };
    }
}
