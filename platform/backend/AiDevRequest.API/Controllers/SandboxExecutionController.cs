using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{id:guid}/sandbox")]
public class SandboxExecutionController : ControllerBase
{
    private readonly ISandboxExecutionService _sandboxService;
    private readonly ILogger<SandboxExecutionController> _logger;

    public SandboxExecutionController(ISandboxExecutionService sandboxService, ILogger<SandboxExecutionController> logger)
    {
        _sandboxService = sandboxService;
        _logger = logger;
    }

    [HttpPost("execute")]
    public async Task<IActionResult> Execute(Guid id, [FromBody] SandboxExecuteRequest request)
    {
        try
        {
            var result = await _sandboxService.ExecuteInSandbox(
                id,
                request.ExecutionType ?? "build",
                request.Command ?? "",
                request.IsolationLevel ?? "container");
            return Ok(MapDto(result));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("executions")]
    public async Task<IActionResult> GetHistory(Guid id)
    {
        var history = await _sandboxService.GetExecutionHistory(id);
        return Ok(history.Select(MapDto));
    }

    [HttpGet("executions/{executionId:guid}")]
    public async Task<IActionResult> GetExecution(Guid id, Guid executionId)
    {
        var execution = await _sandboxService.GetExecutionById(executionId);
        if (execution == null || execution.DevRequestId != id) return NotFound();
        return Ok(MapDto(execution));
    }

    [HttpGet("executions/latest")]
    public async Task<IActionResult> GetLatest(Guid id)
    {
        var execution = await _sandboxService.GetLatestExecution(id);
        if (execution == null) return NotFound();
        return Ok(MapDto(execution));
    }

    private static SandboxExecutionDto MapDto(Entities.SandboxExecution e) => new()
    {
        Id = e.Id,
        DevRequestId = e.DevRequestId,
        Status = e.Status,
        ExecutionType = e.ExecutionType,
        IsolationLevel = e.IsolationLevel,
        Command = e.Command,
        OutputLog = e.OutputLog,
        ErrorLog = e.ErrorLog,
        ExitCode = e.ExitCode,
        ResourceUsage = e.ResourceUsage,
        SecurityViolationsJson = e.SecurityViolationsJson,
        StartedAt = e.StartedAt,
        CompletedAt = e.CompletedAt,
        CreatedAt = e.CreatedAt,
    };
}

public record SandboxExecuteRequest
{
    public string? ExecutionType { get; init; }
    public string? IsolationLevel { get; init; }
    public string? Command { get; init; }
}

public record SandboxExecutionDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string Status { get; init; } = "";
    public string ExecutionType { get; init; } = "";
    public string IsolationLevel { get; init; } = "";
    public string Command { get; init; } = "";
    public string OutputLog { get; init; } = "";
    public string ErrorLog { get; init; } = "";
    public int? ExitCode { get; init; }
    public string? ResourceUsage { get; init; }
    public string? SecurityViolationsJson { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime CreatedAt { get; init; }
}
