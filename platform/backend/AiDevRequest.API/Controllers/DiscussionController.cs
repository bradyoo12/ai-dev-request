using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.DTOs;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DiscussionController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<DiscussionController> _logger;

    public DiscussionController(AiDevRequestDbContext context, ILogger<DiscussionController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpGet]
    public async Task<ActionResult<List<Discussion>>> GetAll()
    {
        var userId = GetUserId();
        var discussions = await _context.Discussions
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync();

        return Ok(discussions);
    }

    [HttpPost]
    public async Task<ActionResult<Discussion>> Create([FromBody] CreateDiscussionDto dto)
    {
        var userId = GetUserId();
        var discussion = new Discussion
        {
            UserId = userId,
            Title = dto.Title ?? "New Discussion",
            DevRequestId = dto.DevRequestId
        };

        _context.Discussions.Add(discussion);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = discussion.Id }, discussion);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DiscussionWithMessagesDto>> GetById(Guid id)
    {
        var userId = GetUserId();
        var discussion = await _context.Discussions
            .Where(d => d.Id == id && d.UserId == userId)
            .FirstOrDefaultAsync();

        if (discussion == null)
            return NotFound();

        var messages = await _context.DiscussionMessages
            .Where(m => m.DiscussionId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return Ok(new DiscussionWithMessagesDto
        {
            Discussion = discussion,
            Messages = messages
        });
    }

    [HttpPost("{id}/messages")]
    public async Task<ActionResult<DiscussionMessage>> AddMessage(Guid id, [FromBody] AddDiscussionMessageDto dto)
    {
        var userId = GetUserId();
        var discussion = await _context.Discussions
            .Where(d => d.Id == id && d.UserId == userId)
            .FirstOrDefaultAsync();

        if (discussion == null)
            return NotFound();

        var message = new DiscussionMessage
        {
            DiscussionId = id,
            Role = dto.Role,
            Content = dto.Content
        };

        _context.DiscussionMessages.Add(message);
        discussion.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(message);
    }

    [HttpPost("{id}/export")]
    public async Task<ActionResult<DevRequest>> ExportToRequest(Guid id)
    {
        var userId = GetUserId();
        var discussion = await _context.Discussions
            .Where(d => d.Id == id && d.UserId == userId)
            .FirstOrDefaultAsync();

        if (discussion == null)
            return NotFound();

        var messages = await _context.DiscussionMessages
            .Where(m => m.DiscussionId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        var conversationSummary = string.Join("\n\n", messages.Select(m => $"{m.Role}: {m.Content}"));

        var devRequest = new DevRequest
        {
            UserId = userId,
            Description = $"{discussion.Title}\n\nExported from discussion:\n\n{conversationSummary}",
            Status = RequestStatus.Submitted
        };

        _context.DevRequests.Add(devRequest);
        discussion.Status = "exported";
        discussion.DevRequestId = devRequest.Id;
        await _context.SaveChangesAsync();

        return Ok(devRequest);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var discussion = await _context.Discussions
            .Where(d => d.Id == id && d.UserId == userId)
            .FirstOrDefaultAsync();

        if (discussion == null)
            return NotFound();

        discussion.Status = "archived";
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
