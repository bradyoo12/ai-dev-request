using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agentic-plan")]
[Authorize]
public class AgenticPlanController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public AgenticPlanController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("plans")]
    public async Task<IActionResult> ListPlans()
    {
        var userId = GetUserId();
        var plans = await _db.AgenticPlans.Where(p => p.UserId == userId)
            .OrderByDescending(p => p.UpdatedAt).Take(50).ToListAsync();
        return Ok(plans);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GeneratePlan([FromBody] GeneratePlanRequest request)
    {
        var userId = GetUserId();
        var input = request.Prompt?.ToLowerInvariant() ?? "";

        var steps = new List<object>();

        // Simulated AI plan generation based on prompt keywords
        steps.Add(new { id = 1, name = "Analyze Requirements", description = "Parse user prompt and identify key features, technologies, and constraints", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });

        if (input.Contains("api") || input.Contains("backend") || input.Contains("server"))
        {
            steps.Add(new { id = steps.Count + 1, name = "Design API Schema", description = "Define REST endpoints, request/response models, and database schema", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
            steps.Add(new { id = steps.Count + 1, name = "Generate Backend Code", description = "Create controllers, services, entity models, and database migrations", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
        }

        if (input.Contains("ui") || input.Contains("frontend") || input.Contains("page") || input.Contains("dashboard"))
        {
            steps.Add(new { id = steps.Count + 1, name = "Design UI Components", description = "Create component hierarchy, layout structure, and responsive design specs", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
            steps.Add(new { id = steps.Count + 1, name = "Generate Frontend Code", description = "Build React components, state management, API integration, and styling", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
        }

        if (input.Contains("auth") || input.Contains("login") || input.Contains("user"))
        {
            steps.Add(new { id = steps.Count + 1, name = "Implement Authentication", description = "Add user authentication flow with JWT tokens, OAuth, and session management", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
        }

        if (input.Contains("test") || input.Contains("quality"))
        {
            steps.Add(new { id = steps.Count + 1, name = "Generate Tests", description = "Create unit tests, integration tests, and E2E test scenarios", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
        }

        if (input.Contains("deploy") || input.Contains("production") || input.Contains("hosting"))
        {
            steps.Add(new { id = steps.Count + 1, name = "Configure Deployment", description = "Set up CI/CD pipeline, environment configs, and deployment scripts", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
        }

        steps.Add(new { id = steps.Count + 1, name = "Validate & Review", description = "Run linting, type checking, build verification, and generate summary report", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });

        if (steps.Count <= 2)
        {
            steps.Insert(1, new { id = 2, name = "Generate Project Structure", description = "Create file structure, package configuration, and boilerplate code", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
            steps.Insert(2, new { id = 3, name = "Implement Core Logic", description = "Build main application logic based on requirements analysis", status = "pending", timeMs = 0, tokensUsed = 0, retries = 0 });
        }

        var plan = new AgenticPlan
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PlanName = request.PlanName ?? "Untitled Plan",
            UserPrompt = request.Prompt ?? "",
            StepsJson = JsonSerializer.Serialize(steps),
            Status = "draft",
            TotalSteps = steps.Count,
            RequiresApproval = true,
            TotalTokensUsed = input.Length * 20,
            TotalTimeMs = 500 + steps.Count * 150,
        };
        _db.AgenticPlans.Add(plan);
        await _db.SaveChangesAsync();
        return Ok(plan);
    }

    [HttpPost("plans/{id}/approve")]
    public async Task<IActionResult> ApprovePlan(Guid id)
    {
        var userId = GetUserId();
        var plan = await _db.AgenticPlans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (plan == null) return NotFound();

        plan.IsApproved = true;
        plan.Status = "approved";
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(plan);
    }

    [HttpPost("plans/{id}/execute")]
    public async Task<IActionResult> ExecutePlan(Guid id)
    {
        var userId = GetUserId();
        var plan = await _db.AgenticPlans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        if (plan == null) return NotFound();
        if (!plan.IsApproved && plan.RequiresApproval) return BadRequest("Plan must be approved before execution");

        // Simulate execution
        var steps = JsonSerializer.Deserialize<List<JsonElement>>(plan.StepsJson) ?? new();
        var updatedSteps = new List<object>();
        var completedCount = 0;

        foreach (var step in steps)
        {
            completedCount++;
            updatedSteps.Add(new
            {
                id = step.GetProperty("id").GetInt32(),
                name = step.GetProperty("name").GetString(),
                description = step.GetProperty("description").GetString(),
                status = "completed",
                timeMs = 200 + completedCount * 100,
                tokensUsed = 500 + completedCount * 200,
                retries = 0,
            });
        }

        plan.StepsJson = JsonSerializer.Serialize(updatedSteps);
        plan.Status = "completed";
        plan.CompletedSteps = completedCount;
        plan.TotalTimeMs = updatedSteps.Sum(s => ((dynamic)s).timeMs);
        plan.TotalTokensUsed = updatedSteps.Sum(s => ((dynamic)s).tokensUsed);
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(plan);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var plans = await _db.AgenticPlans.Where(p => p.UserId == userId).ToListAsync();
        return Ok(new
        {
            totalPlans = plans.Count,
            completedPlans = plans.Count(p => p.Status == "completed"),
            totalStepsExecuted = plans.Sum(p => p.CompletedSteps),
            totalTokensUsed = plans.Sum(p => p.TotalTokensUsed),
            averageStepsPerPlan = plans.Count > 0 ? Math.Round(plans.Average(p => p.TotalSteps), 1) : 0,
            successRate = plans.Count(p => p.Status == "completed") > 0 && plans.Count > 0
                ? Math.Round((double)plans.Count(p => p.Status == "completed") / plans.Count * 100, 1)
                : 0,
            recentPlans = plans.OrderByDescending(p => p.UpdatedAt).Take(5).Select(p => new { p.PlanName, p.Status, p.TotalSteps, p.CompletedSteps, p.CreatedAt }),
        });
    }
}

public class GeneratePlanRequest
{
    public string? Prompt { get; set; }
    public string? PlanName { get; set; }
}
