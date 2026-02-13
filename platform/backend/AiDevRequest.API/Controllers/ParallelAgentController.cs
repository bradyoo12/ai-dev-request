using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/parallel-agents")]
public class ParallelAgentController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public ParallelAgentController(AiDevRequestDbContext db) => _db = db;

    private string UserId => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.ParallelAgentRuns
            .Where(p => p.UserId == UserId)
            .OrderByDescending(p => p.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("execute")]
    public async Task<IActionResult> Execute([FromBody] ExecuteRequest req)
    {
        var count = await _db.ParallelAgentRuns.CountAsync(p => p.UserId == UserId);
        if (count >= 50) return BadRequest("Limit of 50 runs reached.");

        var rng = new Random();
        var agents = Math.Max(2, Math.Min(req.AgentCount, 8));
        var subtasks = rng.Next(agents, agents * 3);
        var conflicts = rng.Next(0, Math.Max(1, subtasks / 3));
        var autoResolved = Math.Min(conflicts, rng.Next(conflicts / 2, conflicts + 1));
        var files = rng.Next(5, 40);
        var lines = rng.Next(100, 2000);
        var sequentialMs = rng.Next(30000, 120000);
        var parallelMs = (int)(sequentialMs / (agents * 0.7 + 0.3));
        var speedup = Math.Round((double)sequentialMs / parallelMs, 1);

        var run = new ParallelAgentRun
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            ProjectName = req.ProjectName,
            TaskDescription = req.TaskDescription,
            AgentCount = agents,
            SubtasksTotal = subtasks,
            SubtasksCompleted = subtasks,
            MergeConflicts = conflicts,
            AutoResolved = autoResolved,
            FilesModified = files,
            LinesChanged = lines,
            DurationMs = parallelMs,
            SpeedupFactor = speedup,
            IsolationMode = req.IsolationMode,
            Status = "completed"
        };

        _db.ParallelAgentRuns.Add(run);
        await _db.SaveChangesAsync();

        var agentNames = new[] { "Architect", "Frontend", "Backend", "Tests", "DevOps", "Docs", "Refactor", "Security" };
        var agentStatuses = new[] { "idle", "working", "completed", "merging" };
        var agentDetails = Enumerable.Range(0, agents).Select(i =>
        {
            var taskCount = rng.Next(1, 4);
            return new
            {
                name = agentNames[i % agentNames.Length],
                worktree = $"worktree-{i + 1}",
                status = "completed",
                tasksCompleted = taskCount,
                filesModified = rng.Next(1, 10),
                linesChanged = rng.Next(20, 400),
                durationMs = rng.Next(8000, 45000),
                branch = $"agent-{i + 1}/{agentNames[i % agentNames.Length].ToLower()}"
            };
        }).ToArray();

        var subtaskDetails = Enumerable.Range(0, Math.Min(subtasks, 8)).Select(i =>
        {
            var types = new[] { "implement", "refactor", "test", "fix", "optimize", "document" };
            var areas = new[] { "auth module", "API endpoints", "UI components", "database queries", "error handling", "routing", "state management", "caching" };
            return new
            {
                id = i + 1,
                description = $"{types[rng.Next(types.Length)]} {areas[rng.Next(areas.Length)]}",
                assignedTo = agentNames[i % agents],
                status = "completed",
                filesChanged = rng.Next(1, 6),
                durationMs = rng.Next(5000, 30000)
            };
        }).ToArray();

        var mergeTimeline = new[]
        {
            new { phase = "Task Decomposition", durationMs = rng.Next(500, 2000), status = "completed" },
            new { phase = "Worktree Creation", durationMs = rng.Next(200, 800), status = "completed" },
            new { phase = "Parallel Execution", durationMs = parallelMs - rng.Next(2000, 5000), status = "completed" },
            new { phase = "Conflict Detection", durationMs = rng.Next(300, 1000), status = "completed" },
            new { phase = "Auto-Merge", durationMs = rng.Next(500, 2000), status = conflicts > autoResolved ? "partial" : "completed" }
        };

        return Ok(new
        {
            run,
            agentDetails,
            subtaskDetails,
            mergeTimeline,
            comparison = new
            {
                sequential = new { durationMs = sequentialMs, agents = 1 },
                parallel = new { durationMs = parallelMs, agents },
                speedup
            }
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await _db.ParallelAgentRuns.FirstOrDefaultAsync(p => p.Id == id && p.UserId == UserId);
        if (item == null) return NotFound();
        _db.ParallelAgentRuns.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var items = await _db.ParallelAgentRuns.Where(p => p.UserId == UserId).ToListAsync();
        if (items.Count == 0) return Ok(new { totalRuns = 0 });

        return Ok(new
        {
            totalRuns = items.Count,
            avgAgents = Math.Round(items.Average(p => p.AgentCount), 1),
            avgSpeedup = Math.Round(items.Average(p => p.SpeedupFactor), 1),
            totalSubtasks = items.Sum(p => p.SubtasksTotal),
            totalConflicts = items.Sum(p => p.MergeConflicts),
            totalAutoResolved = items.Sum(p => p.AutoResolved),
            totalFilesModified = items.Sum(p => p.FilesModified),
            totalLinesChanged = items.Sum(p => p.LinesChanged),
            byIsolation = items.GroupBy(p => p.IsolationMode).Select(g => new
            {
                mode = g.Key,
                count = g.Count(),
                avgSpeedup = Math.Round(g.Average(x => x.SpeedupFactor), 1)
            })
        });
    }

    [AllowAnonymous]
    [HttpGet("modes")]
    public IActionResult GetModes()
    {
        return Ok(new[]
        {
            new { id = "worktree", name = "Git Worktree", description = "Each agent works in its own git worktree — fastest isolation with shared .git directory", recommended = true, color = "#3B82F6" },
            new { id = "branch", name = "Branch Per Agent", description = "Each agent works on a separate branch — simpler but requires sequential checkout", recommended = false, color = "#10B981" },
            new { id = "fork", name = "Fork Isolation", description = "Each agent works in a full repository fork — maximum isolation for untrusted agents", recommended = false, color = "#F59E0B" }
        });
    }

    public class ExecuteRequest
    {
        public string ProjectName { get; set; } = string.Empty;
        public string TaskDescription { get; set; } = string.Empty;
        public int AgentCount { get; set; } = 4;
        public string IsolationMode { get; set; } = "worktree";
    }
}
