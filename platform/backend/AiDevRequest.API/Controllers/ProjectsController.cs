using System.Security.Claims;
using System.Text;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectAggregationService _aggregationService;
    private readonly IProjectCostEstimationService _costEstimationService;
    private readonly ILogStreamService _logStreamService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(
        IProjectAggregationService aggregationService,
        IProjectCostEstimationService costEstimationService,
        ILogStreamService logStreamService,
        ILogger<ProjectsController> logger)
    {
        _aggregationService = aggregationService;
        _costEstimationService = costEstimationService;
        _logStreamService = logStreamService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Get all projects for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProjectSummary>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProjectSummary>>> GetProjects()
    {
        var userId = GetUserId();
        var projects = await _aggregationService.GetUserProjects(userId);
        return Ok(projects);
    }

    /// <summary>
    /// Get detailed information for a specific project
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProjectDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectDetail>> GetProject(Guid id)
    {
        var userId = GetUserId();

        try
        {
            var project = await _aggregationService.GetProjectDetail(id, userId);
            return Ok(project);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Get cost estimate for a project
    /// </summary>
    [HttpGet("{id:guid}/cost-estimate")]
    [ProducesResponseType(typeof(ProjectCostEstimate), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectCostEstimate>> GetCostEstimate(Guid id)
    {
        try
        {
            var estimate = await _costEstimationService.CalculateDailyCost(id);
            return Ok(estimate);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Get cost breakdown for a project
    /// </summary>
    [HttpGet("{id:guid}/cost-breakdown")]
    [ProducesResponseType(typeof(ProjectCostBreakdown), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectCostBreakdown>> GetCostBreakdown(Guid id)
    {
        try
        {
            var breakdown = await _costEstimationService.GetCostBreakdown(id);
            return Ok(breakdown);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Get logs for a project (paginated, with filters)
    /// </summary>
    [HttpGet("{id:guid}/logs")]
    [ProducesResponseType(typeof(List<ProjectLogEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProjectLogEntry>>> GetLogs(
        Guid id,
        [FromQuery] string? level = null,
        [FromQuery] string? source = null,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int limit = 100)
    {
        Entities.LogLevel? logLevel = null;
        if (!string.IsNullOrEmpty(level))
        {
            if (Enum.TryParse<Entities.LogLevel>(level, true, out var parsedLevel))
            {
                logLevel = parsedLevel;
            }
        }

        var queryParams = new LogQueryParams
        {
            Level = logLevel,
            Source = source,
            Search = search,
            From = from,
            To = to,
            Limit = Math.Min(limit, 1000) // Cap at 1000
        };

        var logs = await _logStreamService.GetProjectLogsAsync(id, queryParams);
        return Ok(logs);
    }

    /// <summary>
    /// Stream logs in real-time using Server-Sent Events (SSE)
    /// </summary>
    [HttpGet("{id:guid}/logs/stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task StreamLogs(Guid id, CancellationToken cancellationToken)
    {
        Response.Headers.Add("Content-Type", "text/event-stream");
        Response.Headers.Add("Cache-Control", "no-cache");
        Response.Headers.Add("Connection", "keep-alive");

        _logger.LogInformation("Starting SSE log stream for project {ProjectId}", id);

        try
        {
            // Send initial connection message
            await SendSseMessage("connected", $"Connected to project {id} log stream");

            // Get recent logs first
            var recentLogs = await _logStreamService.GetProjectLogsAsync(id, new LogQueryParams { Limit = 50 });

            foreach (var log in recentLogs.OrderBy(l => l.Timestamp))
            {
                var logJson = System.Text.Json.JsonSerializer.Serialize(log);
                await SendSseMessage("log", logJson);
            }

            // Keep connection alive and stream new logs
            // In a real implementation, this would use a message queue or pub/sub system
            // For now, we'll just keep the connection alive
            while (!cancellationToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);
                await SendSseMessage("heartbeat", DateTime.UtcNow.ToString("o"));
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("SSE log stream cancelled for project {ProjectId}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SSE log stream for project {ProjectId}", id);
        }
    }

    private async Task SendSseMessage(string eventType, string data)
    {
        var message = $"event: {eventType}\ndata: {data}\n\n";
        var bytes = Encoding.UTF8.GetBytes(message);
        await Response.Body.WriteAsync(bytes);
        await Response.Body.FlushAsync();
    }
}
