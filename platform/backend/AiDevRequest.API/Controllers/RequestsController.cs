using AiDevRequest.API.Data;
using AiDevRequest.API.DTOs;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<RequestsController> _logger;

    public RequestsController(AiDevRequestDbContext context, ILogger<RequestsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Create a new development request
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DevRequestResponseDto>> CreateRequest([FromBody] CreateDevRequestDto dto)
    {
        var entity = dto.ToEntity();

        _context.DevRequests.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("New dev request created: {RequestId}", entity.Id);

        return CreatedAtAction(
            nameof(GetRequest),
            new { id = entity.Id },
            entity.ToResponseDto()
        );
    }

    /// <summary>
    /// Get a specific development request by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DevRequestResponseDto>> GetRequest(Guid id)
    {
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        return Ok(entity.ToResponseDto());
    }

    /// <summary>
    /// Get all development requests (paginated)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DevRequestListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DevRequestListItemDto>>> GetRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] RequestStatus? status = null)
    {
        var query = _context.DevRequests.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => r.ToListItemDto())
            .ToListAsync();

        return Ok(requests);
    }

    /// <summary>
    /// Update a development request status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(DevRequestResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DevRequestResponseDto>> UpdateStatus(
        Guid id,
        [FromBody] UpdateStatusDto dto)
    {
        var entity = await _context.DevRequests.FindAsync(id);

        if (entity == null)
        {
            return NotFound();
        }

        entity.Status = dto.Status;

        // Update relevant timestamps based on status
        switch (dto.Status)
        {
            case RequestStatus.Analyzed:
                entity.AnalyzedAt = DateTime.UtcNow;
                break;
            case RequestStatus.ProposalReady:
                entity.ProposedAt = DateTime.UtcNow;
                break;
            case RequestStatus.Approved:
                entity.ApprovedAt = DateTime.UtcNow;
                break;
            case RequestStatus.Completed:
                entity.CompletedAt = DateTime.UtcNow;
                break;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Dev request {RequestId} status updated to {Status}", id, dto.Status);

        return Ok(entity.ToResponseDto());
    }
}

public record UpdateStatusDto
{
    public RequestStatus Status { get; init; }
}
