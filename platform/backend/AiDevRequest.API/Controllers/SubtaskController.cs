using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/requests/{requestId:guid}/subtasks")]
public class SubtaskController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly ISubtaskService _subtaskService;
    private readonly ILogger<SubtaskController> _logger;

    public SubtaskController(
        AiDevRequestDbContext db,
        ISubtaskService subtaskService,
        ILogger<SubtaskController> logger)
    {
        _db = db;
        _subtaskService = subtaskService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    private async Task<(DevRequest? entity, ActionResult? error)> GetOwnedRequestAsync(Guid requestId)
    {
        var entity = await _db.DevRequests.FindAsync(requestId);
        if (entity == null)
            return (null, NotFound(new { error = "Request not found." }));
        if (entity.UserId != GetUserId())
            return (null, StatusCode(403, new { error = "Access denied." }));
        return (entity, null);
    }

    /// <summary>
    /// Get all subtasks for a dev request, ordered by OrderIndex.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<SubtaskDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SubtaskDto>>> GetSubtasks(Guid requestId)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var subtasks = await _subtaskService.GetSubtasksAsync(requestId);
        return Ok(subtasks);
    }

    /// <summary>
    /// Get a single subtask by ID.
    /// </summary>
    [HttpGet("{subtaskId:guid}")]
    [ProducesResponseType(typeof(SubtaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SubtaskDto>> GetSubtask(Guid requestId, Guid subtaskId)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var subtask = await _db.Subtasks.FindAsync(subtaskId);
        if (subtask == null || subtask.DevRequestId != requestId)
            return NotFound(new { error = "Subtask not found." });

        return Ok(subtask.ToDto());
    }

    /// <summary>
    /// Create a new subtask for a dev request.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SubtaskDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SubtaskDto>> CreateSubtask(Guid requestId, [FromBody] CreateSubtaskDto dto)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var result = await _subtaskService.CreateSubtaskAsync(requestId, GetUserId(), dto);

        return CreatedAtAction(
            nameof(GetSubtask),
            new { requestId, subtaskId = result.Id },
            result
        );
    }

    /// <summary>
    /// Create multiple subtasks at once (batch create for AI-generated plan).
    /// </summary>
    [HttpPost("batch")]
    [ProducesResponseType(typeof(List<SubtaskDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<List<SubtaskDto>>> CreateSubtasksBatch(
        Guid requestId,
        [FromBody] List<CreateSubtaskDto> dtos)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var results = await _subtaskService.CreateSubtasksAsync(requestId, GetUserId(), dtos);

        return StatusCode(201, results);
    }

    /// <summary>
    /// Update a subtask (PATCH - only provided fields are updated).
    /// </summary>
    [HttpPatch("{subtaskId:guid}")]
    [ProducesResponseType(typeof(SubtaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SubtaskDto>> UpdateSubtask(
        Guid requestId,
        Guid subtaskId,
        [FromBody] UpdateSubtaskDto dto)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var result = await _subtaskService.UpdateSubtaskAsync(requestId, subtaskId, dto);
        if (result == null)
            return NotFound(new { error = "Subtask not found." });

        return Ok(result);
    }

    /// <summary>
    /// Delete a subtask.
    /// </summary>
    [HttpDelete("{subtaskId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSubtask(Guid requestId, Guid subtaskId)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var deleted = await _subtaskService.DeleteSubtaskAsync(requestId, subtaskId);
        if (!deleted)
            return NotFound(new { error = "Subtask not found." });

        return NoContent();
    }

    /// <summary>
    /// Approve all pending subtasks for a request.
    /// </summary>
    [HttpPost("approve-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ApproveAllSubtasks(Guid requestId)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var approvedCount = await _subtaskService.ApproveAllSubtasksAsync(requestId);

        _logger.LogInformation("Approved {Count} subtasks for request {RequestId}", approvedCount, requestId);

        return Ok(new { message = "All pending subtasks approved.", approvedCount });
    }

    /// <summary>
    /// Approve the subtask plan for a request (transition request to Approved status).
    /// </summary>
    [HttpPost("approve-plan")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ApprovePlan(Guid requestId)
    {
        var (request, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var subtaskCount = await _db.Subtasks.CountAsync(s => s.DevRequestId == requestId);
        if (subtaskCount == 0)
            return BadRequest(new { error = "No subtasks to approve." });

        // Approve all pending subtasks
        await _subtaskService.ApproveAllSubtasksAsync(requestId);

        // Move request to Approved if it was in ProposalReady or Analyzed
        if (request!.Status == RequestStatus.ProposalReady || request.Status == RequestStatus.Analyzed)
        {
            request.Status = RequestStatus.Approved;
            request.ApprovedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        _logger.LogInformation("Subtask plan approved for request {RequestId}", requestId);

        return Ok(new { message = "Plan approved", subtaskCount });
    }

    /// <summary>
    /// Reject the subtask plan (delete all subtasks so AI can regenerate).
    /// </summary>
    [HttpPost("reject-plan")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RejectPlan(Guid requestId)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        var subtasks = await _db.Subtasks
            .Where(s => s.DevRequestId == requestId)
            .ToListAsync();

        _db.Subtasks.RemoveRange(subtasks);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Subtask plan rejected for request {RequestId}, {Count} subtasks removed",
            requestId, subtasks.Count);

        return Ok(new { message = "Plan rejected", removedCount = subtasks.Count });
    }

    /// <summary>
    /// AI-generate subtasks from the request description.
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(List<SubtaskDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SubtaskDto>>> GenerateSubtasks(Guid requestId)
    {
        var (_, error) = await GetOwnedRequestAsync(requestId);
        if (error != null) return error;

        try
        {
            var results = await _subtaskService.GenerateSubtasksAsync(requestId, GetUserId());
            _logger.LogInformation("Generated {Count} subtasks for request {RequestId}", results.Count, requestId);
            return Ok(results);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate subtasks for request {RequestId}", requestId);
            return StatusCode(500, new { error = "Failed to generate subtasks." });
        }
    }
}

// DTOs

public record CreateSubtaskDto
{
    public required string Title { get; init; }
    public string? Description { get; init; }
    public decimal? EstimatedHours { get; init; }
    public int OrderIndex { get; init; }
    public int Priority { get; init; }
    public Guid? ParentSubtaskId { get; init; }
    public List<string>? DependencyIds { get; init; }
}

public record UpdateSubtaskDto
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public decimal? EstimatedHours { get; init; }
    public int? OrderIndex { get; init; }
    public int? Priority { get; init; }
    public SubtaskStatus? Status { get; init; }
    public Guid? ParentSubtaskId { get; init; }
    public List<string>? DependencyIds { get; init; }
}

public record SubtaskDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public Guid? ParentSubtaskId { get; init; }
    public int OrderIndex { get; init; }
    public int Priority { get; init; }
    public string Title { get; init; } = "";
    public string? Description { get; init; }
    public decimal? EstimatedHours { get; init; }
    public string Status { get; init; } = "";
    public List<string> DependencyIds { get; init; } = [];
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public static class SubtaskMappings
{
    public static SubtaskDto ToDto(this Subtask entity)
    {
        return new SubtaskDto
        {
            Id = entity.Id,
            DevRequestId = entity.DevRequestId,
            ParentSubtaskId = entity.ParentSubtaskId,
            OrderIndex = entity.OrderIndex,
            Priority = entity.Priority,
            Title = entity.Title,
            Description = entity.Description,
            EstimatedHours = entity.EstimatedHours,
            Status = entity.Status.ToString(),
            DependencyIds = string.IsNullOrEmpty(entity.DependsOnSubtaskIdsJson)
                ? []
                : entity.DependsOnSubtaskIdsJson.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
