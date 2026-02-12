using System.Text.Json;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/requests/{devRequestId:guid}/orchestration")]
public class SubagentOrchestrationController : ControllerBase
{
    private readonly ISubagentOrchestrationService _orchestrationService;
    private readonly IResultAggregationService _aggregationService;
    private readonly ILogger<SubagentOrchestrationController> _logger;

    public SubagentOrchestrationController(
        ISubagentOrchestrationService orchestrationService,
        IResultAggregationService aggregationService,
        ILogger<SubagentOrchestrationController> logger)
    {
        _orchestrationService = orchestrationService;
        _aggregationService = aggregationService;
        _logger = logger;
    }

    /// <summary>
    /// Start parallel subagent orchestration for a dev request
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<object>> StartOrchestration(Guid devRequestId)
    {
        try
        {
            _logger.LogInformation("Starting orchestration for dev request {DevRequestId}", devRequestId);
            var orchestration = await _orchestrationService.StartOrchestrationAsync(devRequestId);

            return Ok(new
            {
                orchestration.Id,
                orchestration.DevRequestId,
                orchestration.Status,
                orchestration.TotalTasks,
                orchestration.CreatedAt,
                message = "Orchestration started successfully"
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to start orchestration for dev request {DevRequestId}", devRequestId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting orchestration for dev request {DevRequestId}", devRequestId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get orchestration status for a dev request
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<object>> GetStatus(Guid devRequestId, [FromQuery] int? orchestrationId = null)
    {
        try
        {
            Entities.ParallelOrchestration? orchestration;

            if (orchestrationId.HasValue)
            {
                orchestration = await _orchestrationService.GetOrchestrationStatusAsync(orchestrationId.Value);
            }
            else
            {
                // Get the latest orchestration for this dev request
                orchestration = await _orchestrationService.GetOrchestrationStatusAsync(0); // This needs DbContext query
                // TODO: Implement GetLatestOrchestrationAsync method
            }

            if (orchestration == null)
            {
                return NotFound(new { error = "Orchestration not found" });
            }

            return Ok(new
            {
                orchestration.Id,
                orchestration.DevRequestId,
                orchestration.Status,
                orchestration.TotalTasks,
                orchestration.CompletedTasks,
                orchestration.FailedTasks,
                orchestration.StartedAt,
                orchestration.CompletedAt,
                orchestration.TotalDurationMs,
                orchestration.CreatedAt,
                dependencyGraph = JsonSerializer.Deserialize<object>(orchestration.DependencyGraphJson),
                hasConflicts = !string.IsNullOrEmpty(orchestration.MergeConflictsJson)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting orchestration status");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get all tasks for an orchestration
    /// </summary>
    [HttpGet("{orchestrationId:int}/tasks")]
    public async Task<ActionResult<object>> GetTasks(Guid devRequestId, int orchestrationId)
    {
        try
        {
            var tasks = await _orchestrationService.GetTasksAsync(orchestrationId);

            return Ok(tasks.Select(t => new
            {
                t.Id,
                t.TaskType,
                t.Name,
                t.Description,
                t.Status,
                t.StartedAt,
                t.CompletedAt,
                t.DurationMs,
                t.TokensUsed,
                t.ErrorMessage,
                t.CreatedAt,
                hasOutput = !string.IsNullOrEmpty(t.OutputJson)
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tasks for orchestration {OrchestrationId}", orchestrationId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Cancel an ongoing orchestration
    /// </summary>
    [HttpPost("{orchestrationId:int}/cancel")]
    public async Task<ActionResult> CancelOrchestration(Guid devRequestId, int orchestrationId)
    {
        try
        {
            await _orchestrationService.CancelOrchestrationAsync(orchestrationId);
            return Ok(new { message = "Orchestration cancelled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling orchestration {OrchestrationId}", orchestrationId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

[Authorize]
[ApiController]
[Route("api/orchestration/{orchestrationId:int}")]
public class OrchestrationController : ControllerBase
{
    private readonly ISubagentOrchestrationService _orchestrationService;
    private readonly IResultAggregationService _aggregationService;
    private readonly ILogger<OrchestrationController> _logger;

    public OrchestrationController(
        ISubagentOrchestrationService orchestrationService,
        IResultAggregationService aggregationService,
        ILogger<OrchestrationController> logger)
    {
        _orchestrationService = orchestrationService;
        _aggregationService = aggregationService;
        _logger = logger;
    }

    /// <summary>
    /// Get detected merge conflicts for an orchestration
    /// </summary>
    [HttpGet("conflicts")]
    public async Task<ActionResult<object>> GetConflicts(int orchestrationId)
    {
        try
        {
            var conflicts = await _aggregationService.DetectConflictsAsync(orchestrationId);

            return Ok(new
            {
                orchestrationId,
                conflictCount = conflicts.Count,
                conflicts = conflicts.Select(c => new
                {
                    c.Id,
                    c.FilePath,
                    c.ConflictType,
                    c.Description,
                    c.Severity,
                    c.Status,
                    c.TaskIds,
                    c.Resolution
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting conflicts for orchestration {OrchestrationId}", orchestrationId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Resolve a merge conflict (manual or auto)
    /// </summary>
    [HttpPost("conflicts/{conflictId:int}/resolve")]
    public async Task<ActionResult<object>> ResolveConflict(
        int orchestrationId,
        int conflictId,
        [FromBody] ResolveConflictRequest request)
    {
        try
        {
            var resolved = await _aggregationService.ResolveConflictAsync(conflictId, request.AutoResolve);

            return Ok(new
            {
                conflictId,
                status = resolved.Status,
                resolution = resolved.Resolution,
                message = "Conflict resolution attempted"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resolving conflict {ConflictId}", conflictId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get aggregated results (all generated files) for an orchestration
    /// </summary>
    [HttpGet("results")]
    public async Task<ActionResult<object>> GetResults(int orchestrationId)
    {
        try
        {
            var result = await _aggregationService.AggregateResultsAsync(orchestrationId);

            return Ok(new
            {
                result.OrchestrationId,
                fileCount = result.AllFiles.Count,
                conflictCount = result.Conflicts.Count,
                files = result.AllFiles.Select(kvp => new
                {
                    path = kvp.Key,
                    language = kvp.Value.Language,
                    contributors = kvp.Value.Contributors,
                    contentLength = kvp.Value.Content.Length
                }),
                conflicts = result.Conflicts.Select(c => new
                {
                    c.Id,
                    c.FilePath,
                    c.ConflictType,
                    c.Severity,
                    c.Status
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting results for orchestration {OrchestrationId}", orchestrationId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Stream real-time orchestration updates via Server-Sent Events (SSE)
    /// </summary>
    [HttpGet("stream")]
    public async Task StreamOrchestration(int orchestrationId, CancellationToken cancellationToken)
    {
        try
        {
            Response.Headers.Append("Content-Type", "text/event-stream");
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");
            Response.Headers.Append("X-Accel-Buffering", "no");

            await foreach (var evt in _orchestrationService.StreamOrchestrationAsync(orchestrationId, cancellationToken))
            {
                var json = JsonSerializer.Serialize(evt);
                await Response.WriteAsync($"data: {json}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("SSE stream cancelled for orchestration {OrchestrationId}", orchestrationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming orchestration {OrchestrationId}", orchestrationId);
            var errorEvent = JsonSerializer.Serialize(new { type = "error", message = "Stream error" });
            await Response.WriteAsync($"data: {errorEvent}\n\n");
            await Response.Body.FlushAsync();
        }
    }
}

// Request DTOs
public record ResolveConflictRequest
{
    public bool AutoResolve { get; init; }
}
