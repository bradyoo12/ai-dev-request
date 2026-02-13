using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/agent-inbox")]
public class AgentInboxController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly IAgentInboxService _inboxService;
    private readonly ILogger<AgentInboxController> _logger;

    public AgentInboxController(
        AiDevRequestDbContext db,
        IAgentInboxService inboxService,
        ILogger<AgentInboxController> logger)
    {
        _db = db;
        _inboxService = inboxService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// List inbox items with optional filters
    /// </summary>
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetInboxItems(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] Guid? devRequestId = null)
    {
        var userId = GetUserId();
        var query = _db.AgentInboxItems
            .Where(i => i.UserId == userId)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && status != "all")
            query = query.Where(i => i.Status == status);

        if (!string.IsNullOrEmpty(type) && type != "all")
            query = query.Where(i => i.Type == type);

        if (devRequestId.HasValue)
            query = query.Where(i => i.DevRequestId == devRequestId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new
            {
                i.Id,
                i.UserId,
                i.DevRequestId,
                i.Type,
                i.Content,
                i.Title,
                i.Status,
                i.Source,
                i.SubmitterEmail,
                i.SubmitterName,
                i.AiResponseJson,
                i.TriggeredDevRequestId,
                i.CreatedAt,
                i.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { items, total, page, pageSize });
    }

    /// <summary>
    /// Get a single inbox item by ID
    /// </summary>
    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetInboxItem(Guid id)
    {
        var userId = GetUserId();
        var item = await _db.AgentInboxItems
            .Where(i => i.Id == id && i.UserId == userId)
            .Select(i => new
            {
                i.Id,
                i.UserId,
                i.DevRequestId,
                i.Type,
                i.Content,
                i.Title,
                i.Status,
                i.Source,
                i.UserAgent,
                i.SubmitterEmail,
                i.SubmitterName,
                i.AiResponseJson,
                i.TriggeredDevRequestId,
                i.CreatedAt,
                i.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (item == null) return NotFound();
        return Ok(item);
    }

    /// <summary>
    /// Create a new inbox item from the embeddable widget (anonymous)
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> CreateInboxItem([FromBody] CreateAgentInboxItemRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Content))
            return BadRequest(new { error = "Content is required" });

        if (string.IsNullOrWhiteSpace(body.UserId))
            return BadRequest(new { error = "UserId (project owner) is required" });

        var validTypes = new[] { "suggestion", "bug", "feature", "other" };
        var itemType = body.Type ?? "suggestion";
        if (!validTypes.Contains(itemType))
            return BadRequest(new { error = "Invalid type. Must be: suggestion, bug, feature, or other" });

        var item = new AgentInboxItem
        {
            UserId = body.UserId,
            DevRequestId = body.DevRequestId,
            Type = itemType,
            Content = body.Content,
            Title = body.Title,
            Source = body.Source ?? "widget",
            UserAgent = Request.Headers.UserAgent.ToString(),
            SubmitterEmail = body.SubmitterEmail,
            SubmitterName = body.SubmitterName
        };

        _db.AgentInboxItems.Add(item);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Agent inbox item created: {Id} for user {UserId}", item.Id, item.UserId);

        return Ok(new
        {
            item.Id,
            item.Type,
            item.Status,
            item.CreatedAt
        });
    }

    /// <summary>
    /// Update inbox item status
    /// </summary>
    [Authorize]
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateAgentInboxStatusRequest body)
    {
        var userId = GetUserId();
        var item = await _db.AgentInboxItems.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (item == null) return NotFound();

        var validStatuses = new[] { "pending", "in_progress", "completed", "dismissed" };
        if (!validStatuses.Contains(body.Status))
            return BadRequest(new { error = "Invalid status. Must be: pending, in_progress, completed, or dismissed" });

        var previousStatus = item.Status;
        item.Status = body.Status;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { item.Id, item.Status, previousStatus });
    }

    /// <summary>
    /// Convert inbox item to a dev request for implementation
    /// </summary>
    [Authorize]
    [HttpPost("{id}/implement")]
    public async Task<IActionResult> Implement(Guid id)
    {
        var userId = GetUserId();
        var item = await _db.AgentInboxItems.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (item == null) return NotFound();

        if (item.TriggeredDevRequestId.HasValue)
            return BadRequest(new { error = "This item has already been converted to a dev request" });

        var devRequestId = await _inboxService.CreateDevRequestFromFeedbackAsync(item, userId);
        return Ok(new { item.Id, devRequestId, item.Status });
    }

    /// <summary>
    /// Delete an inbox item
    /// </summary>
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInboxItem(Guid id)
    {
        var userId = GetUserId();
        var item = await _db.AgentInboxItems.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
        if (item == null) return NotFound();

        _db.AgentInboxItems.Remove(item);
        await _db.SaveChangesAsync();

        return Ok(new { deleted = true, id });
    }
}

public class CreateAgentInboxItemRequest
{
    public string UserId { get; set; } = "";
    public Guid? DevRequestId { get; set; }
    public string? Type { get; set; }
    public string Content { get; set; } = "";
    public string? Title { get; set; }
    public string? Source { get; set; }
    public string? SubmitterEmail { get; set; }
    public string? SubmitterName { get; set; }
}

public class UpdateAgentInboxStatusRequest
{
    public string Status { get; set; } = "";
}
