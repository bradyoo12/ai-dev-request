using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/deployment-health")]
[Authorize]
public class DeploymentHealthController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public DeploymentHealthController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get or create health monitoring config for a deployment
    /// </summary>
    [HttpGet("config/{projectId:guid}")]
    public async Task<ActionResult<DeploymentHealthDto>> GetConfig(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var health = await _db.DeploymentHealths
            .FirstOrDefaultAsync(h => h.UserId == userId && h.DevRequestId == projectId);

        if (health == null)
        {
            health = new DeploymentHealth
            {
                UserId = userId,
                DevRequestId = projectId,
            };
            _db.DeploymentHealths.Add(health);
            await _db.SaveChangesAsync();
        }

        return Ok(MapToDto(health));
    }

    /// <summary>
    /// Update health monitoring settings
    /// </summary>
    [HttpPut("config/{projectId:guid}")]
    public async Task<ActionResult<DeploymentHealthDto>> UpdateConfig(Guid projectId, [FromBody] UpdateHealthConfigDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var health = await _db.DeploymentHealths
            .FirstOrDefaultAsync(h => h.UserId == userId && h.DevRequestId == projectId);

        if (health == null) return NotFound();

        health.DeploymentUrl = dto.DeploymentUrl ?? health.DeploymentUrl;
        health.MonitoringEnabled = dto.MonitoringEnabled;
        health.CheckIntervalSeconds = Math.Max(30, Math.Min(dto.CheckIntervalSeconds, 3600));
        health.ErrorRateThreshold = Math.Max(0.01, Math.Min(dto.ErrorRateThreshold, 1.0));
        health.LatencyThresholdMs = Math.Max(100, Math.Min(dto.LatencyThresholdMs, 30000));
        health.AutoRollbackEnabled = dto.AutoRollbackEnabled;
        health.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(health));
    }

    /// <summary>
    /// Get health stats summary for a deployment
    /// </summary>
    [HttpGet("stats/{projectId:guid}")]
    public async Task<ActionResult<HealthStatsDto>> GetStats(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var health = await _db.DeploymentHealths
            .FirstOrDefaultAsync(h => h.UserId == userId && h.DevRequestId == projectId);

        if (health == null) return NotFound();

        return Ok(new HealthStatsDto
        {
            Status = health.Status,
            UptimePercentage = health.UptimePercentage,
            TotalChecks = health.TotalChecks,
            SuccessfulChecks = health.SuccessfulChecks,
            FailedChecks = health.FailedChecks,
            CurrentErrorRate = health.CurrentErrorRate,
            AvgResponseTimeMs = health.AvgResponseTimeMs,
            P95ResponseTimeMs = health.P95ResponseTimeMs,
            P99ResponseTimeMs = health.P99ResponseTimeMs,
            RollbackCount = health.RollbackCount,
            LastCheckAt = health.LastCheckAt,
        });
    }

    /// <summary>
    /// Record a health check result (called by background service or external)
    /// </summary>
    [HttpPost("check")]
    public async Task<ActionResult<DeploymentHealthDto>> RecordCheck([FromBody] RecordCheckDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var health = await _db.DeploymentHealths
            .FirstOrDefaultAsync(h => h.UserId == userId && h.DevRequestId == dto.ProjectId);

        if (health == null) return NotFound();

        health.TotalChecks++;
        if (dto.Success)
            health.SuccessfulChecks++;
        else
            health.FailedChecks++;

        health.CurrentErrorRate = health.TotalChecks > 0
            ? (double)health.FailedChecks / health.TotalChecks
            : 0;

        health.AvgResponseTimeMs = dto.ResponseTimeMs;
        health.P95ResponseTimeMs = Math.Max(health.P95ResponseTimeMs, dto.ResponseTimeMs * 0.95);
        health.P99ResponseTimeMs = Math.Max(health.P99ResponseTimeMs, dto.ResponseTimeMs * 0.99);
        health.UptimePercentage = health.TotalChecks > 0
            ? (double)health.SuccessfulChecks / health.TotalChecks * 100
            : 100;

        // Determine status
        if (!dto.Success)
            health.Status = "down";
        else if (dto.ResponseTimeMs > health.LatencyThresholdMs)
            health.Status = "degraded";
        else
            health.Status = "up";

        health.LastCheckAt = DateTime.UtcNow;
        health.UpdatedAt = DateTime.UtcNow;

        // Append to health events (keep last 100)
        var events = new List<HealthEvent>();
        if (!string.IsNullOrEmpty(health.HealthEventsJson))
        {
            try { events = System.Text.Json.JsonSerializer.Deserialize<List<HealthEvent>>(health.HealthEventsJson) ?? []; }
            catch { }
        }
        events.Add(new HealthEvent
        {
            Timestamp = DateTime.UtcNow,
            Status = health.Status,
            ResponseTimeMs = dto.ResponseTimeMs,
            Error = dto.Error,
        });
        if (events.Count > 100)
            events = events.Skip(events.Count - 100).ToList();
        health.HealthEventsJson = System.Text.Json.JsonSerializer.Serialize(events);

        // Check if auto-rollback should trigger
        var shouldRollback = health.AutoRollbackEnabled
            && health.CurrentErrorRate > health.ErrorRateThreshold
            && health.TotalChecks >= 5;

        if (shouldRollback)
        {
            health.RollbackCount++;
            var incidents = new List<IncidentRecord>();
            if (!string.IsNullOrEmpty(health.IncidentsJson))
            {
                try { incidents = System.Text.Json.JsonSerializer.Deserialize<List<IncidentRecord>>(health.IncidentsJson) ?? []; }
                catch { }
            }
            incidents.Add(new IncidentRecord
            {
                StartedAt = DateTime.UtcNow,
                Type = "auto-rollback",
                Description = $"Error rate {health.CurrentErrorRate:P1} exceeded threshold {health.ErrorRateThreshold:P1}",
            });
            health.IncidentsJson = System.Text.Json.JsonSerializer.Serialize(incidents);
        }

        await _db.SaveChangesAsync();

        return Ok(MapToDto(health));
    }

    /// <summary>
    /// Get recent health events timeline
    /// </summary>
    [HttpGet("events/{projectId:guid}")]
    public async Task<ActionResult<IEnumerable<HealthEvent>>> GetEvents(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var health = await _db.DeploymentHealths
            .FirstOrDefaultAsync(h => h.UserId == userId && h.DevRequestId == projectId);

        if (health == null) return Ok(Array.Empty<HealthEvent>());

        var events = new List<HealthEvent>();
        if (!string.IsNullOrEmpty(health.HealthEventsJson))
        {
            try { events = System.Text.Json.JsonSerializer.Deserialize<List<HealthEvent>>(health.HealthEventsJson) ?? []; }
            catch { }
        }

        return Ok(events);
    }

    /// <summary>
    /// Get incidents history
    /// </summary>
    [HttpGet("incidents/{projectId:guid}")]
    public async Task<ActionResult<IEnumerable<IncidentRecord>>> GetIncidents(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var health = await _db.DeploymentHealths
            .FirstOrDefaultAsync(h => h.UserId == userId && h.DevRequestId == projectId);

        if (health == null) return Ok(Array.Empty<IncidentRecord>());

        var incidents = new List<IncidentRecord>();
        if (!string.IsNullOrEmpty(health.IncidentsJson))
        {
            try { incidents = System.Text.Json.JsonSerializer.Deserialize<List<IncidentRecord>>(health.IncidentsJson) ?? []; }
            catch { }
        }

        return Ok(incidents);
    }

    private static DeploymentHealthDto MapToDto(DeploymentHealth h) => new()
    {
        Id = h.Id,
        ProjectId = h.DevRequestId,
        DeploymentUrl = h.DeploymentUrl,
        Status = h.Status,
        MonitoringEnabled = h.MonitoringEnabled,
        CheckIntervalSeconds = h.CheckIntervalSeconds,
        ErrorRateThreshold = h.ErrorRateThreshold,
        LatencyThresholdMs = h.LatencyThresholdMs,
        AutoRollbackEnabled = h.AutoRollbackEnabled,
        TotalChecks = h.TotalChecks,
        SuccessfulChecks = h.SuccessfulChecks,
        FailedChecks = h.FailedChecks,
        CurrentErrorRate = h.CurrentErrorRate,
        AvgResponseTimeMs = h.AvgResponseTimeMs,
        P95ResponseTimeMs = h.P95ResponseTimeMs,
        P99ResponseTimeMs = h.P99ResponseTimeMs,
        UptimePercentage = h.UptimePercentage,
        RollbackCount = h.RollbackCount,
        LastCheckAt = h.LastCheckAt,
    };
}

public class DeploymentHealthDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string DeploymentUrl { get; set; } = "";
    public string Status { get; set; } = "unknown";
    public bool MonitoringEnabled { get; set; }
    public int CheckIntervalSeconds { get; set; }
    public double ErrorRateThreshold { get; set; }
    public int LatencyThresholdMs { get; set; }
    public bool AutoRollbackEnabled { get; set; }
    public int TotalChecks { get; set; }
    public int SuccessfulChecks { get; set; }
    public int FailedChecks { get; set; }
    public double CurrentErrorRate { get; set; }
    public double AvgResponseTimeMs { get; set; }
    public double P95ResponseTimeMs { get; set; }
    public double P99ResponseTimeMs { get; set; }
    public double UptimePercentage { get; set; }
    public int RollbackCount { get; set; }
    public DateTime? LastCheckAt { get; set; }
}

public class UpdateHealthConfigDto
{
    public string? DeploymentUrl { get; set; }
    public bool MonitoringEnabled { get; set; }
    public int CheckIntervalSeconds { get; set; } = 60;
    public double ErrorRateThreshold { get; set; } = 0.1;
    public int LatencyThresholdMs { get; set; } = 5000;
    public bool AutoRollbackEnabled { get; set; }
}

public class RecordCheckDto
{
    public Guid ProjectId { get; set; }
    public bool Success { get; set; }
    public double ResponseTimeMs { get; set; }
    public string? Error { get; set; }
}

public class HealthStatsDto
{
    public string Status { get; set; } = "unknown";
    public double UptimePercentage { get; set; }
    public int TotalChecks { get; set; }
    public int SuccessfulChecks { get; set; }
    public int FailedChecks { get; set; }
    public double CurrentErrorRate { get; set; }
    public double AvgResponseTimeMs { get; set; }
    public double P95ResponseTimeMs { get; set; }
    public double P99ResponseTimeMs { get; set; }
    public int RollbackCount { get; set; }
    public DateTime? LastCheckAt { get; set; }
}

public class HealthEvent
{
    public DateTime Timestamp { get; set; }
    public string Status { get; set; } = "";
    public double ResponseTimeMs { get; set; }
    public string? Error { get; set; }
}

public class IncidentRecord
{
    public DateTime StartedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string Type { get; set; } = "";
    public string Description { get; set; } = "";
}
