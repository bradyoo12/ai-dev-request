using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/background-agents")]
[Authorize]
public class BackgroundAgentController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;

    public BackgroundAgentController(AiDevRequestDbContext db, IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _scopeFactory = scopeFactory;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListAgents([FromQuery] string? status)
    {
        var userId = GetUserId();
        var query = _db.BackgroundAgents.Where(a => a.UserId == userId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);

        var agents = await query.OrderByDescending(a => a.CreatedAt).Take(50).ToListAsync();

        return Ok(agents.Select(a => new AgentSummaryDto
        {
            Id = a.Id,
            AgentName = a.AgentName,
            TaskDescription = a.TaskDescription,
            Status = a.Status,
            BranchName = a.BranchName,
            AgentType = a.AgentType,
            Priority = a.Priority,
            ProgressPercent = a.ProgressPercent,
            CompletedSteps = a.CompletedSteps,
            TotalSteps = a.TotalSteps,
            ElapsedSeconds = a.ElapsedSeconds,
            EstimatedRemainingSeconds = a.EstimatedRemainingSeconds,
            PullRequestUrl = a.PullRequestUrl,
            PullRequestStatus = a.PullRequestStatus,
            StartedAt = a.StartedAt,
            CreatedAt = a.CreatedAt
        }));
    }

    [HttpGet("{agentId:guid}")]
    public async Task<IActionResult> GetAgent(Guid agentId)
    {
        var userId = GetUserId();
        var agent = await _db.BackgroundAgents.FirstOrDefaultAsync(a => a.Id == agentId && a.UserId == userId);
        if (agent == null) return NotFound();

        return Ok(new AgentDetailDto
        {
            Id = agent.Id,
            AgentName = agent.AgentName,
            TaskDescription = agent.TaskDescription,
            Status = agent.Status,
            BranchName = agent.BranchName,
            AgentType = agent.AgentType,
            Priority = agent.Priority,
            TotalSteps = agent.TotalSteps,
            CompletedSteps = agent.CompletedSteps,
            ProgressPercent = agent.ProgressPercent,
            FilesCreated = agent.FilesCreated,
            FilesModified = agent.FilesModified,
            TestsPassed = agent.TestsPassed,
            TestsFailed = agent.TestsFailed,
            ErrorCount = agent.ErrorCount,
            SelfHealAttempts = agent.SelfHealAttempts,
            CpuUsagePercent = agent.CpuUsagePercent,
            MemoryUsageMb = agent.MemoryUsageMb,
            TokensUsed = agent.TokensUsed,
            EstimatedCost = agent.EstimatedCost,
            ElapsedSeconds = agent.ElapsedSeconds,
            EstimatedRemainingSeconds = agent.EstimatedRemainingSeconds,
            PullRequestUrl = agent.PullRequestUrl,
            PullRequestStatus = agent.PullRequestStatus,
            LogEntries = string.IsNullOrEmpty(agent.LogEntriesJson) ? [] : JsonSerializer.Deserialize<List<LogEntry>>(agent.LogEntriesJson) ?? [],
            Steps = string.IsNullOrEmpty(agent.StepsJson) ? [] : JsonSerializer.Deserialize<List<AgentStep>>(agent.StepsJson) ?? [],
            InstalledPackages = string.IsNullOrEmpty(agent.InstalledPackagesJson) ? [] : JsonSerializer.Deserialize<List<string>>(agent.InstalledPackagesJson) ?? [],
            StartedAt = agent.StartedAt,
            CompletedAt = agent.CompletedAt,
            CreatedAt = agent.CreatedAt
        });
    }

    [HttpPost("spawn")]
    public async Task<IActionResult> SpawnAgent([FromBody] SpawnAgentDto dto)
    {
        var userId = GetUserId();

        var activeCount = await _db.BackgroundAgents.CountAsync(a => a.UserId == userId && (a.Status == "running" || a.Status == "starting"));
        if (activeCount >= 5) return BadRequest(new { error = "Maximum 5 concurrent agents allowed" });

        var branchName = $"agent/{dto.AgentName?.Replace(" ", "-").ToLower() ?? "task"}-{Guid.NewGuid().ToString()[..8]}";

        var steps = new List<AgentStep>
        {
            new() { Name = "Initialize environment", Status = "pending", Order = 1 },
            new() { Name = "Analyze requirements", Status = "pending", Order = 2 },
            new() { Name = "Create branch & scaffold", Status = "pending", Order = 3 },
            new() { Name = "Implement changes", Status = "pending", Order = 4 },
            new() { Name = "Run tests", Status = "pending", Order = 5 },
            new() { Name = "Self-review & fix", Status = "pending", Order = 6 },
            new() { Name = "Open pull request", Status = "pending", Order = 7 }
        };

        var agent = new BackgroundAgent
        {
            UserId = userId,
            DevRequestId = dto.DevRequestId,
            AgentName = dto.AgentName ?? "Agent",
            TaskDescription = dto.TaskDescription,
            Status = "starting",
            BranchName = branchName,
            AgentType = dto.AgentType ?? "general",
            Priority = dto.Priority ?? "normal",
            TotalSteps = steps.Count,
            StepsJson = JsonSerializer.Serialize(steps),
            StartedAt = DateTime.UtcNow
        };

        _db.BackgroundAgents.Add(agent);
        await _db.SaveChangesAsync();

        var scopeFactory = _scopeFactory;
        _ = Task.Run(async () =>
        {
            await Task.Delay(2000);
            await SimulateAgentExecution(agent.Id, scopeFactory);
        });

        return Ok(new { agentId = agent.Id, branchName, status = "starting" });
    }

    [HttpPost("{agentId:guid}/stop")]
    public async Task<IActionResult> StopAgent(Guid agentId)
    {
        var userId = GetUserId();
        var agent = await _db.BackgroundAgents.FirstOrDefaultAsync(a => a.Id == agentId && a.UserId == userId);
        if (agent == null) return NotFound();
        if (agent.Status != "running" && agent.Status != "starting") return BadRequest(new { error = "Agent is not running" });

        agent.Status = "stopped";
        agent.CompletedAt = DateTime.UtcNow;
        agent.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { status = "stopped" });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var agents = await _db.BackgroundAgents.Where(a => a.UserId == userId).ToListAsync();

        return Ok(new
        {
            totalAgents = agents.Count,
            activeAgents = agents.Count(a => a.Status == "running" || a.Status == "starting"),
            completedAgents = agents.Count(a => a.Status == "completed"),
            failedAgents = agents.Count(a => a.Status == "failed"),
            totalTokensUsed = agents.Sum(a => a.TokensUsed),
            totalEstimatedCost = agents.Sum(a => a.EstimatedCost),
            totalPullRequests = agents.Count(a => a.PullRequestUrl != null),
            avgCompletionSeconds = agents.Where(a => a.CompletedAt != null && a.StartedAt != null).Select(a => (a.CompletedAt!.Value - a.StartedAt!.Value).TotalSeconds).DefaultIfEmpty(0).Average()
        });
    }

    [HttpGet("types")]
    public IActionResult GetAgentTypes()
    {
        return Ok(new[]
        {
            new { type = "general", name = "General Purpose", description = "Full-stack development and feature implementation", icon = "wrench", frameworkManaged = true },
            new { type = "frontend", name = "Frontend Specialist", description = "UI components, styling, and user experience", icon = "palette", frameworkManaged = true },
            new { type = "backend", name = "Backend Specialist", description = "API endpoints, database schemas, and business logic", icon = "server", frameworkManaged = true },
            new { type = "testing", name = "Testing Agent", description = "Test generation, coverage improvement, and QA", icon = "shield", frameworkManaged = true },
            new { type = "refactor", name = "Refactoring Agent", description = "Code cleanup, performance optimization, and modernization", icon = "refresh", frameworkManaged = true }
        });
    }

    private static async Task SimulateAgentExecution(Guid agentId, IServiceScopeFactory scopeFactory)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();
        var agent = await db.BackgroundAgents.FindAsync(agentId);
        if (agent == null) return;

        agent.Status = "running";
        agent.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var steps = JsonSerializer.Deserialize<List<AgentStep>>(agent.StepsJson ?? "[]") ?? [];
        var logs = new List<LogEntry>();
        var random = new Random();

        for (int i = 0; i < steps.Count; i++)
        {
            if (agent.Status == "stopped") break;

            steps[i].Status = "running";
            steps[i].StartedAt = DateTime.UtcNow;
            agent.StepsJson = JsonSerializer.Serialize(steps);
            agent.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            await Task.Delay(random.Next(1000, 3000));

            steps[i].Status = "completed";
            steps[i].CompletedAt = DateTime.UtcNow;
            agent.CompletedSteps = i + 1;
            agent.ProgressPercent = Math.Round((double)(i + 1) / steps.Count * 100, 1);
            agent.ElapsedSeconds += random.Next(5, 15);
            agent.EstimatedRemainingSeconds = Math.Max(0, (steps.Count - i - 1) * 10);
            agent.TokensUsed += random.Next(500, 2000);
            agent.EstimatedCost += random.NextDouble() * 0.01;
            agent.CpuUsagePercent = random.Next(15, 85);
            agent.MemoryUsageMb = random.Next(128, 512);

            if (i == 3)
            {
                agent.FilesCreated = random.Next(2, 8);
                agent.FilesModified = random.Next(3, 12);
            }
            if (i == 4)
            {
                agent.TestsPassed = random.Next(5, 20);
                agent.TestsFailed = random.Next(0, 3);
                if (agent.TestsFailed > 0)
                {
                    agent.SelfHealAttempts = 1;
                    agent.TestsFailed = 0;
                    agent.TestsPassed += 2;
                }
            }

            logs.Add(new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                Level = "info",
                Message = $"Step {i + 1}/{steps.Count}: {steps[i].Name} completed"
            });
            agent.LogEntriesJson = JsonSerializer.Serialize(logs);
            agent.StepsJson = JsonSerializer.Serialize(steps);
            agent.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        if (agent.Status == "running")
        {
            agent.Status = "completed";
            agent.PullRequestUrl = $"https://github.com/user/project/pull/{random.Next(100, 999)}";
            agent.PullRequestStatus = "open";
            agent.CompletedAt = DateTime.UtcNow;
            logs.Add(new LogEntry { Timestamp = DateTime.UtcNow, Level = "info", Message = "Pull request created successfully" });
            agent.LogEntriesJson = JsonSerializer.Serialize(logs);
            agent.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
    }
}

public class AgentSummaryDto
{
    public Guid Id { get; set; }
    public string AgentName { get; set; } = "";
    public string? TaskDescription { get; set; }
    public string Status { get; set; } = "";
    public string? BranchName { get; set; }
    public string AgentType { get; set; } = "";
    public string Priority { get; set; } = "";
    public double ProgressPercent { get; set; }
    public int CompletedSteps { get; set; }
    public int TotalSteps { get; set; }
    public int ElapsedSeconds { get; set; }
    public int EstimatedRemainingSeconds { get; set; }
    public string? PullRequestUrl { get; set; }
    public string? PullRequestStatus { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AgentDetailDto : AgentSummaryDto
{
    public int FilesCreated { get; set; }
    public int FilesModified { get; set; }
    public int TestsPassed { get; set; }
    public int TestsFailed { get; set; }
    public int ErrorCount { get; set; }
    public int SelfHealAttempts { get; set; }
    public double CpuUsagePercent { get; set; }
    public double MemoryUsageMb { get; set; }
    public double TokensUsed { get; set; }
    public double EstimatedCost { get; set; }
    public List<LogEntry> LogEntries { get; set; } = [];
    public List<AgentStep> Steps { get; set; } = [];
    public List<string> InstalledPackages { get; set; } = [];
    public DateTime? CompletedAt { get; set; }
}

public class SpawnAgentDto
{
    public Guid DevRequestId { get; set; }
    public string? AgentName { get; set; }
    public string? TaskDescription { get; set; }
    public string? AgentType { get; set; }
    public string? Priority { get; set; }
}

public class LogEntry
{
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = "info";
    public string Message { get; set; } = "";
}

public class AgentStep
{
    public string Name { get; set; } = "";
    public string Status { get; set; } = "pending";
    public int Order { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
