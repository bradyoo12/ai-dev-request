using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/composer")]
[Authorize]
public class ComposerController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public ComposerController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListPlans()
    {
        var userId = GetUserId();
        var plans = await _db.ComposerPlans.Where(p => p.UserId == userId).OrderByDescending(p => p.UpdatedAt).Take(50).ToListAsync();
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlan(Guid id)
    {
        var userId = GetUserId();
        var plan = await _db.ComposerPlans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    public record CreatePlanRequest(string? ProjectName, string? Prompt, string? PlanMode, string? ModelTier);

    [HttpPost("plan")]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();

        var steps = rng.Next(3, 8);
        var files = rng.Next(2, 6);
        var added = rng.Next(20, 150);
        var removed = rng.Next(5, 50);

        var plan = new ComposerPlan
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProjectName = req.ProjectName ?? "my-project",
            Prompt = req.Prompt ?? "Update the codebase",
            PlanMode = req.PlanMode ?? "plan-first",
            TotalSteps = steps,
            FilesChanged = files,
            LinesAdded = added,
            LinesRemoved = removed,
            ModelTier = req.ModelTier ?? "sonnet",
            EstimatedTokens = Math.Round(rng.NextDouble() * 5000 + 2000, 0),
            DiffPreviewShown = req.PlanMode == "plan-first",
            Status = req.PlanMode == "direct" ? "executing" : "planning",
            PlanSummary = GeneratePlanSummary(rng),
        };

        _db.ComposerPlans.Add(plan);
        await _db.SaveChangesAsync();

        var planSteps = Enumerable.Range(1, steps).Select(i => new
        {
            step = i,
            description = GetSampleStep(rng),
            file = GetSampleFile(rng),
            changeType = new[] { "modify", "create", "delete" }[rng.Next(3)],
            linesAdded = rng.Next(5, 40),
            linesRemoved = rng.Next(0, 15),
        }).ToList();

        return Ok(new { plan, steps = planSteps });
    }

    public record ApprovePlanRequest(bool Approved);

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApprovePlan(Guid id, [FromBody] ApprovePlanRequest req)
    {
        var userId = GetUserId();
        var plan = await _db.ComposerPlans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (plan == null) return NotFound();

        plan.PlanApproved = req.Approved;
        plan.Status = req.Approved ? "executing" : "rejected";
        plan.CompletedSteps = req.Approved ? plan.TotalSteps : 0;
        plan.ActualTokens = req.Approved ? plan.EstimatedTokens * (0.8 + new Random().NextDouble() * 0.4) : 0;
        if (req.Approved) plan.Status = "completed";
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(plan);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlan(Guid id)
    {
        var userId = GetUserId();
        var plan = await _db.ComposerPlans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (plan == null) return NotFound();
        _db.ComposerPlans.Remove(plan);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var plans = await _db.ComposerPlans.Where(p => p.UserId == userId).ToListAsync();
        if (plans.Count == 0)
            return Ok(new { totalPlans = 0, totalFiles = 0, totalLinesAdded = 0, totalLinesRemoved = 0, approvalRate = 0.0, byMode = Array.Empty<object>(), byModel = Array.Empty<object>() });

        return Ok(new
        {
            totalPlans = plans.Count,
            totalFiles = plans.Sum(p => p.FilesChanged),
            totalLinesAdded = plans.Sum(p => p.LinesAdded),
            totalLinesRemoved = plans.Sum(p => p.LinesRemoved),
            approvalRate = Math.Round(plans.Count(p => p.PlanApproved) * 100.0 / Math.Max(1, plans.Count), 1),
            byMode = plans.GroupBy(p => p.PlanMode).Select(g => new { mode = g.Key, count = g.Count() }).ToList(),
            byModel = plans.GroupBy(p => p.ModelTier).Select(g => new { model = g.Key, count = g.Count(), tokens = g.Sum(p => p.ActualTokens) }).ToList(),
        });
    }

    [AllowAnonymous]
    [HttpGet("modes")]
    public IActionResult GetModes()
    {
        var modes = new[]
        {
            new { id = "plan-first", name = "Plan First", description = "AI outlines execution plan before making changes — review and approve before execution", color = "#3B82F6" },
            new { id = "direct", name = "Direct Edit", description = "AI makes changes immediately without planning step — fastest for simple edits", color = "#10B981" },
            new { id = "interactive", name = "Interactive", description = "Step-by-step execution with approval at each step — most control", color = "#F59E0B" },
        };
        return Ok(modes);
    }

    private static string GeneratePlanSummary(Random rng)
    {
        var summaries = new[]
        {
            "Refactor authentication module to use JWT tokens with refresh flow",
            "Add responsive design breakpoints and mobile navigation",
            "Implement API rate limiting with Redis-based token bucket",
            "Update database schema and add migration for user preferences",
            "Extract shared utilities into reusable component library",
        };
        return summaries[rng.Next(summaries.Length)];
    }

    private static string GetSampleStep(Random rng)
    {
        var steps = new[]
        {
            "Update component props interface",
            "Add new API endpoint handler",
            "Modify database migration file",
            "Create utility helper function",
            "Update route configuration",
            "Add error handling middleware",
            "Refactor state management logic",
            "Update test assertions",
        };
        return steps[rng.Next(steps.Length)];
    }

    private static string GetSampleFile(Random rng)
    {
        var files = new[]
        {
            "src/components/Auth.tsx",
            "src/api/users.ts",
            "src/pages/Dashboard.tsx",
            "src/utils/validation.ts",
            "src/hooks/useAuth.ts",
            "src/store/app.ts",
            "tests/auth.test.ts",
        };
        return files[rng.Next(files.Length)];
    }
}
