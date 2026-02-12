using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/workflows")]
public class WorkflowController : ControllerBase
{
    private readonly IWorkflowOrchestrationService _workflowService;
    private readonly ILogger<WorkflowController> _logger;

    public WorkflowController(IWorkflowOrchestrationService workflowService, ILogger<WorkflowController> logger)
    {
        _workflowService = workflowService;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartWorkflow([FromBody] StartWorkflowDto dto)
    {
        try
        {
            var execution = await _workflowService.StartWorkflowAsync(dto.RequestId, dto.WorkflowType);
            return Ok(MapDto(execution));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{executionId:int}")]
    public async Task<IActionResult> GetWorkflowStatus(int executionId)
    {
        var execution = await _workflowService.GetWorkflowStatusAsync(executionId);
        if (execution == null) return NotFound();
        return Ok(MapDto(execution));
    }

    [HttpPost("{executionId:int}/retry/{stepName}")]
    public async Task<IActionResult> RetryStep(int executionId, string stepName)
    {
        try
        {
            var execution = await _workflowService.RetryStepAsync(executionId, stepName);
            return Ok(MapDto(execution));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{executionId:int}/cancel")]
    public async Task<IActionResult> CancelWorkflow(int executionId)
    {
        try
        {
            var execution = await _workflowService.CancelWorkflowAsync(executionId);
            return Ok(MapDto(execution));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> ListWorkflows([FromQuery] Guid? requestId = null)
    {
        var workflows = await _workflowService.ListWorkflowsAsync(requestId);
        return Ok(workflows.Select(MapDto).ToList());
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetWorkflowMetrics()
    {
        var metrics = await _workflowService.GetWorkflowMetricsAsync();
        return Ok(metrics);
    }

    private static WorkflowExecutionDto MapDto(Entities.WorkflowExecution e) => new()
    {
        Id = e.Id,
        DevRequestId = e.DevRequestId,
        WorkflowType = e.WorkflowType,
        Status = e.Status.ToString(),
        StepsJson = e.StepsJson,
        RetryCount = e.RetryCount,
        CreatedAt = e.CreatedAt,
        CompletedAt = e.CompletedAt,
    };
}

// === DTOs ===

public record StartWorkflowDto
{
    public Guid RequestId { get; init; }
    public string WorkflowType { get; init; } = "full";
}

public record WorkflowExecutionDto
{
    public int Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string WorkflowType { get; init; } = "";
    public string Status { get; init; } = "";
    public string StepsJson { get; init; } = "";
    public int RetryCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}
