using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/visual-workflow")]
public class VisualWorkflowController : ControllerBase
{
    private readonly IVisualWorkflowService _service;
    private readonly ILogger<VisualWorkflowController> _logger;

    public VisualWorkflowController(IVisualWorkflowService service, ILogger<VisualWorkflowController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "anonymous";

    [HttpGet]
    public async Task<IActionResult> GetWorkflows()
    {
        var workflows = await _service.GetWorkflowsAsync(GetUserId());
        return Ok(workflows.Select(MapDto).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWorkflow(Guid id)
    {
        var workflow = await _service.GetWorkflowByIdAsync(id, GetUserId());
        if (workflow == null) return NotFound(new { error = "Workflow not found" });
        return Ok(MapDto(workflow));
    }

    [HttpPost]
    public async Task<IActionResult> CreateWorkflow([FromBody] CreateVisualWorkflowRequest request)
    {
        try
        {
            var workflow = await _service.CreateWorkflowAsync(GetUserId(), new CreateVisualWorkflowDto
            {
                Name = request.Name,
                Description = request.Description,
                NodesJson = request.NodesJson,
                EdgesJson = request.EdgesJson,
                TriggerType = request.TriggerType,
                TriggerConfigJson = request.TriggerConfigJson,
                NaturalLanguagePrompt = request.NaturalLanguagePrompt,
            });
            return Ok(MapDto(workflow));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create workflow");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateWorkflow(Guid id, [FromBody] UpdateVisualWorkflowRequest request)
    {
        try
        {
            var workflow = await _service.UpdateWorkflowAsync(id, GetUserId(), new UpdateVisualWorkflowDto
            {
                Name = request.Name,
                Description = request.Description,
                NodesJson = request.NodesJson,
                EdgesJson = request.EdgesJson,
                TriggerType = request.TriggerType,
                TriggerConfigJson = request.TriggerConfigJson,
                Status = request.Status,
            });
            return Ok(MapDto(workflow));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteWorkflow(Guid id)
    {
        try
        {
            await _service.DeleteWorkflowAsync(id, GetUserId());
            return Ok(new { success = true });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateFromNaturalLanguage([FromBody] GenerateWorkflowRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
            return BadRequest(new { error = "Prompt is required" });

        try
        {
            var workflow = await _service.GenerateFromNaturalLanguageAsync(GetUserId(), request.Prompt);
            return Ok(MapDto(workflow));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate workflow from natural language");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/execute")]
    public async Task<IActionResult> ExecuteWorkflow(Guid id)
    {
        try
        {
            var run = await _service.ExecuteWorkflowAsync(id, GetUserId());
            return Ok(MapRunDto(run));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}/status")]
    public async Task<IActionResult> GetExecutionStatus(Guid id)
    {
        var run = await _service.GetRunStatusAsync(id, GetUserId());
        if (run == null) return Ok(new { status = "no_runs" });
        return Ok(MapRunDto(run));
    }

    private static VisualWorkflowDto MapDto(WorkflowAutomation w) => new()
    {
        Id = w.Id.ToString(),
        Name = w.Name,
        Description = w.Description,
        NodesJson = w.NodesJson,
        EdgesJson = w.EdgesJson,
        TriggerType = w.TriggerType,
        TriggerConfigJson = w.TriggerConfigJson,
        Status = w.Status.ToString(),
        NaturalLanguagePrompt = w.NaturalLanguagePrompt,
        CreatedAt = w.CreatedAt,
        UpdatedAt = w.UpdatedAt,
    };

    private static VisualWorkflowRunDto MapRunDto(WorkflowAutomationRun r) => new()
    {
        Id = r.Id.ToString(),
        WorkflowId = r.WorkflowAutomationId.ToString(),
        Status = r.Status.ToString(),
        CurrentNodeId = r.CurrentNodeId,
        NodeResultsJson = r.NodeResultsJson,
        StartedAt = r.StartedAt,
        CompletedAt = r.CompletedAt,
        Error = r.Error,
    };
}

// === Request DTOs ===

public record CreateVisualWorkflowRequest
{
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string? NodesJson { get; init; }
    public string? EdgesJson { get; init; }
    public string? TriggerType { get; init; }
    public string? TriggerConfigJson { get; init; }
    public string? NaturalLanguagePrompt { get; init; }
}

public record UpdateVisualWorkflowRequest
{
    public string? Name { get; init; }
    public string? Description { get; init; }
    public string? NodesJson { get; init; }
    public string? EdgesJson { get; init; }
    public string? TriggerType { get; init; }
    public string? TriggerConfigJson { get; init; }
    public string? Status { get; init; }
}

public record GenerateWorkflowRequest
{
    public string Prompt { get; init; } = "";
}

// === Response DTOs ===

public record VisualWorkflowDto
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string? Description { get; init; }
    public string NodesJson { get; init; } = "[]";
    public string EdgesJson { get; init; } = "[]";
    public string TriggerType { get; init; } = "manual";
    public string? TriggerConfigJson { get; init; }
    public string Status { get; init; } = "Draft";
    public string? NaturalLanguagePrompt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record VisualWorkflowRunDto
{
    public string Id { get; init; } = "";
    public string WorkflowId { get; init; } = "";
    public string Status { get; init; } = "";
    public string? CurrentNodeId { get; init; }
    public string NodeResultsJson { get; init; } = "{}";
    public DateTime StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? Error { get; init; }
}
