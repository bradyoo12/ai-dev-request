using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/requests/{requestId}/subtasks")]
public class SubTasksController : ControllerBase
{
    private readonly ISubTaskService _subTaskService;
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SubTasksController> _logger;

    public SubTasksController(ISubTaskService subTaskService, AiDevRequestDbContext context, ILogger<SubTasksController> logger)
    {
        _subTaskService = subTaskService;
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<SubTaskDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SubTaskDto>>> GetSubTasks(Guid requestId)
    {
        var subTasks = await _subTaskService.GetByRequestIdAsync(requestId);
        return Ok(subTasks.Select(MapToDto).ToList());
    }

    [HttpPost]
    [ProducesResponseType(typeof(List<SubTaskDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<SubTaskDto>>> CreateSubTasks(Guid requestId, [FromBody] CreateSubTasksDto dto)
    {
        try
        {
            var subTasks = dto.SubTasks.Select(s => new SubTask
            {
                Title = s.Title,
                Description = s.Description,
                Order = s.Order,
                EstimatedCredits = s.EstimatedCredits,
                DependsOnSubTaskId = s.DependsOnSubTaskId,
            }).ToList();

            var created = await _subTaskService.CreateBatchAsync(requestId, subTasks);
            return Created($"/api/requests/{requestId}/subtasks", created.Select(MapToDto).ToList());
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create subtasks for request {RequestId}", requestId);
            return BadRequest(new { error = "Failed to create subtasks" });
        }
    }

    /// <summary>
    /// Generate subtasks from the analysis/proposal of a dev request.
    /// Parses milestones from the proposal or functional requirements from the analysis.
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(List<SubTaskDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<SubTaskDto>>> GenerateSubTasks(Guid requestId)
    {
        var entity = await _context.DevRequests.FindAsync(requestId);
        if (entity == null) return NotFound(new { error = "Dev request not found." });

        if (string.IsNullOrEmpty(entity.AnalysisResultJson))
            return BadRequest(new { error = "분석이 먼저 완료되어야 합니다." });

        // Remove existing subtasks if regenerating
        var existing = await _context.SubTasks
            .Where(s => s.DevRequestId == requestId)
            .ToListAsync();
        if (existing.Count > 0)
            _context.SubTasks.RemoveRange(existing);

        var subtasks = new List<SubTask>();
        int order = 0;

        // If there's a proposal with milestones, use those as subtasks
        if (!string.IsNullOrEmpty(entity.ProposalJson))
        {
            try
            {
                var proposal = JsonSerializer.Deserialize<JsonElement>(entity.ProposalJson);
                if (proposal.TryGetProperty("milestones", out var milestones) && milestones.ValueKind == JsonValueKind.Array)
                {
                    Guid? previousId = null;
                    foreach (var milestone in milestones.EnumerateArray())
                    {
                        var title = milestone.TryGetProperty("name", out var n) ? n.GetString() ?? $"Phase {order + 1}" : $"Phase {order + 1}";
                        var description = milestone.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "";
                        var deliverables = "";
                        if (milestone.TryGetProperty("deliverables", out var del) && del.ValueKind == JsonValueKind.Array)
                        {
                            deliverables = string.Join("\n", del.EnumerateArray().Select(x => $"- {x.GetString()}"));
                        }
                        var durationDays = milestone.TryGetProperty("durationDays", out var dur) ? dur.GetInt32() : 0;
                        var estimatedCredits = durationDays * 10;

                        var subtask = new SubTask
                        {
                            DevRequestId = requestId,
                            Title = title,
                            Description = string.IsNullOrEmpty(deliverables) ? description : $"{description}\n\n{deliverables}",
                            Order = order,
                            EstimatedCredits = estimatedCredits > 0 ? estimatedCredits : null,
                            DependsOnSubTaskId = previousId
                        };
                        subtasks.Add(subtask);
                        previousId = subtask.Id;
                        order++;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse proposal milestones for request {RequestId}", requestId);
            }
        }

        // Fallback: generate subtasks from analysis requirements
        if (subtasks.Count == 0)
        {
            var analysis = JsonSerializer.Deserialize<JsonElement>(entity.AnalysisResultJson);
            if (analysis.TryGetProperty("requirements", out var reqs))
            {
                if (reqs.TryGetProperty("functional", out var functional) && functional.ValueKind == JsonValueKind.Array)
                {
                    foreach (var req in functional.EnumerateArray())
                    {
                        var reqText = req.GetString() ?? "";
                        if (string.IsNullOrWhiteSpace(reqText)) continue;
                        subtasks.Add(new SubTask
                        {
                            DevRequestId = requestId,
                            Title = reqText.Length > 500 ? reqText[..497] + "..." : reqText,
                            Description = reqText,
                            Order = order++,
                            EstimatedCredits = 10
                        });
                    }
                }
            }
        }

        // Final fallback: single subtask from description
        if (subtasks.Count == 0)
        {
            subtasks.Add(new SubTask
            {
                DevRequestId = requestId,
                Title = entity.Description.Length > 500 ? entity.Description[..497] + "..." : entity.Description,
                Description = entity.Description,
                Order = 0,
                EstimatedCredits = 20
            });
        }

        _context.SubTasks.AddRange(subtasks);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Generated {Count} subtasks for request {RequestId}", subtasks.Count, requestId);

        return Ok(subtasks.Select(MapToDto).ToList());
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(SubTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SubTaskDto>> UpdateSubTask(Guid requestId, Guid id, [FromBody] UpdateSubTaskDto dto)
    {
        try
        {
            var update = new SubTask
            {
                Title = dto.Title,
                Description = dto.Description,
                Status = Enum.Parse<SubTaskStatus>(dto.Status, ignoreCase: true),
                Order = dto.Order,
                DependsOnSubTaskId = dto.DependsOnSubTaskId,
            };

            var updated = await _subTaskService.UpdateAsync(id, update);
            if (updated == null) return NotFound(new { error = "SubTask not found" });
            return Ok(MapToDto(updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update subtask {Id}", id);
            return BadRequest(new { error = "Failed to update subtask" });
        }
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSubTask(Guid requestId, Guid id)
    {
        var deleted = await _subTaskService.DeleteAsync(id);
        if (!deleted) return NotFound(new { error = "SubTask not found" });
        return NoContent();
    }

    [HttpPost("{id}/approve")]
    [ProducesResponseType(typeof(SubTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SubTaskDto>> ApproveSubTask(Guid requestId, Guid id)
    {
        var approved = await _subTaskService.ApproveAsync(id);
        if (approved == null) return NotFound(new { error = "SubTask not found" });
        return Ok(MapToDto(approved));
    }

    [HttpPost("{id}/reject")]
    [ProducesResponseType(typeof(SubTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SubTaskDto>> RejectSubTask(Guid requestId, Guid id)
    {
        var rejected = await _subTaskService.RejectAsync(id);
        if (rejected == null) return NotFound(new { error = "SubTask not found" });
        return Ok(MapToDto(rejected));
    }

    [HttpPost("approve-all")]
    [ProducesResponseType(typeof(List<SubTaskDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<SubTaskDto>>> ApproveAllSubTasks(Guid requestId)
    {
        var approved = await _subTaskService.ApproveAllAsync(requestId);
        return Ok(approved.Select(MapToDto).ToList());
    }

    private static SubTaskDto MapToDto(SubTask s) => new()
    {
        Id = s.Id,
        DevRequestId = s.DevRequestId,
        Title = s.Title,
        Description = s.Description,
        Status = s.Status.ToString(),
        Order = s.Order,
        EstimatedCredits = s.EstimatedCredits,
        DependsOnSubTaskId = s.DependsOnSubTaskId,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
    };
}

public record SubTaskDto
{
    public Guid Id { get; init; }
    public Guid DevRequestId { get; init; }
    public string Title { get; init; } = "";
    public string? Description { get; init; }
    public string Status { get; init; } = "Pending";
    public int Order { get; init; }
    public int? EstimatedCredits { get; init; }
    public Guid? DependsOnSubTaskId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateSubTasksDto
{
    public List<CreateSubTaskItemDto> SubTasks { get; init; } = [];
}

public record CreateSubTaskItemDto
{
    public string Title { get; init; } = "";
    public string? Description { get; init; }
    public int Order { get; init; }
    public int? EstimatedCredits { get; init; }
    public Guid? DependsOnSubTaskId { get; init; }
}

public record UpdateSubTaskDto
{
    public string Title { get; init; } = "";
    public string? Description { get; init; }
    public string Status { get; init; } = "Pending";
    public int Order { get; init; }
    public Guid? DependsOnSubTaskId { get; init; }
}
