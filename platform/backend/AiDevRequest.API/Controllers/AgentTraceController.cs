using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{id:guid}/traces")]
public class AgentTraceController : ControllerBase
{
    private readonly IAgentTraceService _agentTraceService;
    private readonly ILogger<AgentTraceController> _logger;

    public AgentTraceController(IAgentTraceService agentTraceService, ILogger<AgentTraceController> logger)
    {
        _agentTraceService = agentTraceService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> RecordAttribution(Guid id)
    {
        try
        {
            var trace = await _agentTraceService.RecordAttribution(id);
            return Ok(MapDto(trace));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("latest")]
    public async Task<IActionResult> GetLatestTrace(Guid id)
    {
        var trace = await _agentTraceService.GetLatestTrace(id);
        if (trace == null) return NotFound();
        return Ok(MapDto(trace));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(Guid id)
    {
        var history = await _agentTraceService.GetHistory(id);
        return Ok(history.Select(MapDto));
    }

    [HttpPost("{traceId:guid}/export")]
    public async Task<IActionResult> ExportTrace(Guid id, Guid traceId)
    {
        var trace = await _agentTraceService.ExportTrace(traceId);
        if (trace == null) return NotFound();
        return Ok(MapDto(trace));
    }

    private static AgentTraceDto MapDto(Entities.AgentTrace t) => new()
    {
        Id = t.Id,
        DevRequestId = t.DevRequestId,
        Status = t.Status,
        TotalFiles = t.TotalFiles,
        AiGeneratedFiles = t.AiGeneratedFiles,
        HumanEditedFiles = t.HumanEditedFiles,
        MixedFiles = t.MixedFiles,
        AiContributionPercentage = t.AiContributionPercentage,
        TraceDataJson = t.TraceDataJson,
        ExportFormat = t.ExportFormat,
        ExportedAt = t.ExportedAt,
        Version = t.Version,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
    };
}

public record AgentTraceDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string Status { get; init; } = "";
    public int TotalFiles { get; init; }
    public int AiGeneratedFiles { get; init; }
    public int HumanEditedFiles { get; init; }
    public int MixedFiles { get; init; }
    public decimal AiContributionPercentage { get; init; }
    public string? TraceDataJson { get; init; }
    public string? ExportFormat { get; init; }
    public string? ExportedAt { get; init; }
    public int Version { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
