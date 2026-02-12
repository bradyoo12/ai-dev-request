using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/agent-automation")]
public class AgentAutomationController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<AgentAutomationController> _logger;

    public AgentAutomationController(AiDevRequestDbContext db, ILogger<AgentAutomationController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        var config = await _db.AgentAutomationConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            return Ok(new AgentAutomationConfigDto
            {
                Enabled = false,
                TriggerLabels = new[] { "auto-implement", "agent" },
                MaxConcurrent = 2,
                AutoMerge = false,
            });
        }
        return Ok(MapConfigDto(config));
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] UpdateAgentAutomationConfigRequest request)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        var config = await _db.AgentAutomationConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new AgentAutomationConfig { UserId = userId };
            _db.AgentAutomationConfigs.Add(config);
        }

        if (request.Enabled.HasValue) config.Enabled = request.Enabled.Value;
        if (request.TriggerLabels != null) config.TriggerLabelsJson = JsonSerializer.Serialize(request.TriggerLabels);
        if (request.MaxConcurrent.HasValue) config.MaxConcurrent = request.MaxConcurrent.Value;
        if (request.AutoMerge.HasValue) config.AutoMerge = request.AutoMerge.Value;
        config.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapConfigDto(config));
    }

    [HttpGet("tasks")]
    public async Task<IActionResult> GetTasks([FromQuery] int page = 1)
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        var tasks = await _db.AgentTasks
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.StartedAt)
            .Skip((page - 1) * 20)
            .Take(20)
            .ToListAsync();
        return Ok(tasks.Select(MapTaskDto));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
        var tasks = await _db.AgentTasks.Where(t => t.UserId == userId).ToListAsync();
        var completed = tasks.Where(t => t.Status == "pr_created").ToList();
        var avgDuration = completed.Any()
            ? completed.Where(t => t.CompletedAt.HasValue)
                .Average(t => (t.CompletedAt!.Value - t.StartedAt).TotalSeconds)
            : 0;

        return Ok(new
        {
            totalRuns = tasks.Count,
            completed = completed.Count,
            failed = tasks.Count(t => t.Status == "failed"),
            inProgress = tasks.Count(t => t.Status is "queued" or "analyzing" or "implementing" or "testing"),
            avgDurationSeconds = Math.Round(avgDuration, 1)
        });
    }

    [HttpPost("tasks/{id:guid}/cancel")]
    public async Task<IActionResult> CancelTask(Guid id)
    {
        var task = await _db.AgentTasks.FindAsync(id);
        if (task == null) return NotFound(new { error = "Task not found" });
        if (task.Status is "pr_created" or "failed") return BadRequest(new { error = "Cannot cancel a completed or failed task" });

        task.Status = "failed";
        task.Error = "Cancelled by user";
        task.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(MapTaskDto(task));
    }

    [HttpPost("tasks/{id:guid}/retry")]
    public async Task<IActionResult> RetryTask(Guid id)
    {
        var task = await _db.AgentTasks.FindAsync(id);
        if (task == null) return NotFound(new { error = "Task not found" });
        if (task.Status != "failed") return BadRequest(new { error = "Only failed tasks can be retried" });

        task.Status = "queued";
        task.Error = null;
        task.CompletedAt = null;
        task.StartedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(MapTaskDto(task));
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook([FromBody] JsonElement payload)
    {
        try
        {
            var action = payload.GetProperty("action").GetString();
            if (action != "assigned") return Ok(new { status = "ignored" });

            var issue = payload.GetProperty("issue");
            var issueNumber = issue.GetProperty("number").GetInt32();
            var issueTitle = issue.GetProperty("title").GetString() ?? "";

            var labels = issue.GetProperty("labels").EnumerateArray()
                .Select(l => l.GetProperty("name").GetString() ?? "")
                .ToList();

            // Find configs that match any of the labels
            var configs = await _db.AgentAutomationConfigs
                .Where(c => c.Enabled)
                .ToListAsync();

            foreach (var config in configs)
            {
                var triggerLabels = JsonSerializer.Deserialize<string[]>(config.TriggerLabelsJson) ?? Array.Empty<string>();
                if (!labels.Any(l => triggerLabels.Contains(l))) continue;

                var existingTask = await _db.AgentTasks
                    .FirstOrDefaultAsync(t => t.IssueNumber == issueNumber && t.UserId == config.UserId && t.Status != "failed");
                if (existingTask != null) continue;

                var activeCount = await _db.AgentTasks
                    .CountAsync(t => t.UserId == config.UserId &&
                        (t.Status == "queued" || t.Status == "analyzing" || t.Status == "implementing" || t.Status == "testing"));
                if (activeCount >= config.MaxConcurrent) continue;

                var agentTask = new AgentTask
                {
                    IssueNumber = issueNumber,
                    IssueTitle = issueTitle,
                    Status = "queued",
                    UserId = config.UserId,
                };
                _db.AgentTasks.Add(agentTask);
            }

            await _db.SaveChangesAsync();
            return Ok(new { status = "processed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing webhook");
            return StatusCode(500, new { error = "Webhook processing failed" });
        }
    }

    private static AgentAutomationConfigDto MapConfigDto(AgentAutomationConfig c) => new()
    {
        Enabled = c.Enabled,
        TriggerLabels = JsonSerializer.Deserialize<string[]>(c.TriggerLabelsJson) ?? Array.Empty<string>(),
        MaxConcurrent = c.MaxConcurrent,
        AutoMerge = c.AutoMerge,
        WebhookSecret = c.WebhookSecret,
    };

    private static AgentTaskDto MapTaskDto(AgentTask t) => new()
    {
        Id = t.Id.ToString(),
        IssueNumber = t.IssueNumber,
        IssueTitle = t.IssueTitle,
        Status = t.Status,
        PrNumber = t.PrNumber,
        PrUrl = t.PrUrl,
        StartedAt = t.StartedAt,
        CompletedAt = t.CompletedAt,
        Error = t.Error,
    };
}

public record UpdateAgentAutomationConfigRequest
{
    public bool? Enabled { get; init; }
    public string[]? TriggerLabels { get; init; }
    public int? MaxConcurrent { get; init; }
    public bool? AutoMerge { get; init; }
}

public record AgentAutomationConfigDto
{
    public bool Enabled { get; init; }
    public string[] TriggerLabels { get; init; } = Array.Empty<string>();
    public int MaxConcurrent { get; init; }
    public bool AutoMerge { get; init; }
    public string? WebhookSecret { get; init; }
}

public record AgentTaskDto
{
    public string Id { get; init; } = "";
    public int IssueNumber { get; init; }
    public string IssueTitle { get; init; } = "";
    public string Status { get; init; } = "";
    public int? PrNumber { get; init; }
    public string? PrUrl { get; init; }
    public DateTime StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? Error { get; init; }
}
