using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/requests/{requestId:int}/specs")]
public class SpecificationController : ControllerBase
{
    private readonly ISpecificationService _specService;
    private readonly ILogger<SpecificationController> _logger;

    public SpecificationController(ISpecificationService specService, ILogger<SpecificationController> logger)
    {
        _specService = specService;
        _logger = logger;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateSpec(int requestId, [FromBody] GenerateSpecDto dto)
    {
        try
        {
            var spec = dto.Phase?.ToLowerInvariant() switch
            {
                "requirements" => await _specService.GenerateRequirementsSpecAsync(requestId),
                "design" => await _specService.GenerateDesignSpecAsync(requestId),
                "implementation" => await _specService.GenerateImplementationSpecAsync(requestId),
                _ => throw new InvalidOperationException($"Invalid phase: {dto.Phase}. Must be 'requirements', 'design', or 'implementation'.")
            };

            return Ok(MapDto(spec));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetSpec(int requestId)
    {
        var spec = await _specService.GetSpecAsync(requestId);
        if (spec == null) return NotFound();
        return Ok(MapDto(spec));
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetSpecHistory(int requestId)
    {
        var specs = await _specService.GetSpecHistoryAsync(requestId);
        return Ok(specs.Select(MapDto).ToList());
    }

    [HttpPost("{specId:guid}/approve")]
    public async Task<IActionResult> ApproveSpec(int requestId, Guid specId)
    {
        try
        {
            var spec = await _specService.ApproveSpecAsync(specId);
            return Ok(MapDto(spec));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{specId:guid}/reject")]
    public async Task<IActionResult> RejectSpec(int requestId, Guid specId, [FromBody] RejectSpecDto dto)
    {
        try
        {
            var spec = await _specService.RejectSpecAsync(specId, dto.Feedback);
            return Ok(MapDto(spec));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{specId:guid}")]
    public async Task<IActionResult> UpdateSpec(int requestId, Guid specId, [FromBody] DevelopmentSpecUpdateDto dto)
    {
        try
        {
            var spec = await _specService.UpdateSpecAsync(specId, dto);
            return Ok(MapDto(spec));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static DevelopmentSpecDto MapDto(Entities.DevelopmentSpec s) => new()
    {
        Id = s.Id,
        DevRequestId = s.DevRequestId,
        Phase = s.Phase,
        Status = s.Status,
        UserStories = s.UserStories,
        AcceptanceCriteria = s.AcceptanceCriteria,
        EdgeCases = s.EdgeCases,
        ArchitectureDecisions = s.ArchitectureDecisions,
        ApiContracts = s.ApiContracts,
        DataModels = s.DataModels,
        ComponentBreakdown = s.ComponentBreakdown,
        TaskList = s.TaskList,
        DependencyOrder = s.DependencyOrder,
        EstimatedFiles = s.EstimatedFiles,
        TraceabilityLinks = s.TraceabilityLinks,
        RejectionFeedback = s.RejectionFeedback,
        Version = s.Version,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
        ApprovedAt = s.ApprovedAt,
    };
}

// === DTOs ===

public record GenerateSpecDto
{
    public string Phase { get; init; } = "requirements";
}

public record RejectSpecDto
{
    public string Feedback { get; init; } = "";
}

public record DevelopmentSpecDto
{
    public Guid Id { get; init; }
    public int DevRequestId { get; init; }
    public string Phase { get; init; } = "";
    public string Status { get; init; } = "";
    public string? UserStories { get; init; }
    public string? AcceptanceCriteria { get; init; }
    public string? EdgeCases { get; init; }
    public string? ArchitectureDecisions { get; init; }
    public string? ApiContracts { get; init; }
    public string? DataModels { get; init; }
    public string? ComponentBreakdown { get; init; }
    public string? TaskList { get; init; }
    public string? DependencyOrder { get; init; }
    public string? EstimatedFiles { get; init; }
    public string? TraceabilityLinks { get; init; }
    public string? RejectionFeedback { get; init; }
    public int Version { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public DateTime? ApprovedAt { get; init; }
}
