using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agent-messages")]
public class AgentMessageController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public AgentMessageController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await _db.AgentMessages
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendMessageRequest req)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..12];
        var latency = 5 + new Random().NextDouble() * 50;
        var deliveryStatus = new Random().NextDouble() > 0.05 ? "delivered" : "failed";
        var requiresAck = req.MessageType is "task-delegation" or "resource-lock" or "conflict-resolution";

        var payload = req.MessageType switch
        {
            "task-delegation" => JsonSerializer.Serialize(new
            {
                taskId = $"task-{new Random().Next(1000, 9999)}",
                spec = req.Content,
                deadline = DateTime.UtcNow.AddHours(2).ToString("O"),
                priority = req.Priority
            }),
            "resource-lock" => JsonSerializer.Serialize(new
            {
                resource = req.Content,
                requester = req.FromAgent,
                timeoutMs = 30000,
                granted = new Random().NextDouble() > 0.2,
                lockId = $"lock-{new Random().Next(100, 999)}"
            }),
            "progress-update" => JsonSerializer.Serialize(new
            {
                taskId = $"task-{new Random().Next(1000, 9999)}",
                progress = Math.Round(new Random().NextDouble(), 2),
                status = new[] { "analyzing", "generating", "testing", "reviewing" }[new Random().Next(4)],
                etaSeconds = new Random().Next(30, 300)
            }),
            "conflict-resolution" => JsonSerializer.Serialize(new
            {
                conflictType = new[] { "merge-conflict", "resource-contention", "priority-clash", "deadlock" }[new Random().Next(4)],
                resources = new[] { req.Content },
                resolution = new[] { "auto-resolved", "needs-arbitration", "rollback-applied" }[new Random().Next(3)],
                affectedAgents = new[] { req.FromAgent, req.ToAgent }
            }),
            "heartbeat" => JsonSerializer.Serialize(new
            {
                agent = req.FromAgent,
                uptime = new Random().Next(60, 86400),
                tasksCompleted = new Random().Next(0, 50),
                cpuPercent = Math.Round(new Random().NextDouble() * 100, 1),
                memoryMb = new Random().Next(128, 2048)
            }),
            _ => JsonSerializer.Serialize(new { content = req.Content })
        };

        var msg = new AgentMessage
        {
            UserId = "demo-user",
            ProjectName = req.ProjectName,
            MessageType = req.MessageType,
            FromAgent = req.FromAgent,
            ToAgent = req.ToAgent,
            Payload = payload,
            Priority = req.Priority,
            DeliveryStatus = deliveryStatus,
            LatencyMs = Math.Round(latency, 1),
            RequiresAck = requiresAck,
            Acknowledged = deliveryStatus == "delivered" && requiresAck && new Random().NextDouble() > 0.1,
            CorrelationId = correlationId,
            RetryCount = deliveryStatus == "failed" ? 1 : 0
        };

        _db.AgentMessages.Add(msg);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            msg.Id,
            msg.MessageType,
            msg.FromAgent,
            msg.ToAgent,
            msg.Priority,
            msg.DeliveryStatus,
            msg.LatencyMs,
            msg.RequiresAck,
            msg.Acknowledged,
            msg.CorrelationId,
            payload = JsonSerializer.Deserialize<object>(payload),
            recommendation = deliveryStatus == "failed"
                ? "Message delivery failed. Retrying..."
                : requiresAck && !msg.Acknowledged
                    ? "Message delivered but awaiting acknowledgment."
                    : "Message successfully delivered and acknowledged."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.AgentMessages.FindAsync(id);
        if (item == null) return NotFound();
        _db.AgentMessages.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await _db.AgentMessages.ToListAsync();
        var byType = all.GroupBy(x => x.MessageType)
            .Select(g => new { type = g.Key, count = g.Count(), avgLatency = Math.Round(g.Average(x => x.LatencyMs), 1) })
            .ToList();
        return Ok(new { total = all.Count, byType });
    }

    [HttpGet("protocols")]
    public IActionResult Protocols()
    {
        var protocols = new[]
        {
            new { id = "task-delegation", name = "Task Delegation", description = "Structured task assignment between agents with specs, deadlines, and priorities", fields = new[] { "taskId", "spec", "deadline", "priority" }, requiresAck = true },
            new { id = "resource-lock", name = "Resource Locking", description = "Distributed resource locking to prevent conflicts during concurrent operations", fields = new[] { "resource", "requester", "timeoutMs", "granted", "lockId" }, requiresAck = true },
            new { id = "progress-update", name = "Progress Reporting", description = "Real-time task progress updates with ETA and status", fields = new[] { "taskId", "progress", "status", "etaSeconds" }, requiresAck = false },
            new { id = "conflict-resolution", name = "Conflict Resolution", description = "Detect and resolve resource conflicts, merge conflicts, and priority clashes", fields = new[] { "conflictType", "resources", "resolution", "affectedAgents" }, requiresAck = true },
            new { id = "heartbeat", name = "Heartbeat", description = "Agent health monitoring with uptime, tasks completed, and resource usage", fields = new[] { "agent", "uptime", "tasksCompleted", "cpuPercent", "memoryMb" }, requiresAck = false }
        };
        return Ok(protocols);
    }

    public class SendMessageRequest
    {
        public string ProjectName { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public string FromAgent { get; set; } = string.Empty;
        public string ToAgent { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Priority { get; set; } = "normal";
    }
}
