using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<MessageController> _logger;

    public MessageController(
        IMessageService messageService,
        AiDevRequestDbContext db,
        ILogger<MessageController> logger)
    {
        _messageService = messageService;
        _db = db;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Send a new message to another user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.ReceiverId))
            return BadRequest(new { error = "Receiver ID is required" });

        if (string.IsNullOrWhiteSpace(body.Content))
            return BadRequest(new { error = "Message content is required" });

        if (body.Content.Length > 5000)
            return BadRequest(new { error = "Message content exceeds 5000 characters" });

        try
        {
            var senderId = GetUserId();
            var message = await _messageService.SendMessageAsync(senderId, body.ReceiverId, body.Content);

            return Ok(new
            {
                message.Id,
                message.SenderId,
                message.ReceiverId,
                message.Content,
                message.IsRead,
                message.CreatedAt,
                message.ReadAt
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send message");
            return StatusCode(500, new { error = "Failed to send message" });
        }
    }

    /// <summary>
    /// Get all conversations for the authenticated user
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        try
        {
            var userId = GetUserId();
            var conversations = await _messageService.GetConversationListAsync(userId);

            return Ok(conversations.Select(c => new
            {
                c.OtherUserId,
                c.OtherUserDisplayName,
                c.OtherUserEmail,
                c.LastMessageContent,
                c.LastMessageAt,
                c.UnreadCount
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get conversations");
            return Ok(Array.Empty<object>());
        }
    }

    /// <summary>
    /// Get conversation messages with a specific user
    /// </summary>
    [HttpGet("conversation/{otherUserId}")]
    public async Task<IActionResult> GetConversation(string otherUserId)
    {
        try
        {
            var userId = GetUserId();
            var messages = await _messageService.GetConversationAsync(userId, otherUserId);

            return Ok(messages.Select(m => new
            {
                m.Id,
                m.SenderId,
                m.ReceiverId,
                m.Content,
                m.IsRead,
                m.CreatedAt,
                m.ReadAt
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get conversation with {OtherUserId}", otherUserId);
            return Ok(Array.Empty<object>());
        }
    }

    /// <summary>
    /// Mark a message as read
    /// </summary>
    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var message = await _messageService.MarkAsReadAsync(id, userId);

            if (message == null)
                return NotFound(new { error = "Message not found or you are not the receiver" });

            return Ok(new
            {
                message.Id,
                message.IsRead,
                message.ReadAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark message {MessageId} as read", id);
            return StatusCode(500, new { error = "Failed to mark message as read" });
        }
    }

    /// <summary>
    /// Get unread message count for the authenticated user
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        try
        {
            var userId = GetUserId();
            var count = await _messageService.GetUnreadCountAsync(userId);

            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get unread count");
            return Ok(new { count = 0 });
        }
    }

    /// <summary>
    /// Get list of users available for messaging (admin sees all, regular users see admins)
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAvailableUsers()
    {
        try
        {
            var userId = GetUserId();
            if (!Guid.TryParse(userId, out var userGuid))
                return Ok(Array.Empty<object>());

            var currentUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userGuid);
            if (currentUser == null)
                return Ok(Array.Empty<object>());

            List<object> users;
            if (currentUser.IsAdmin)
            {
                // Admins can message anyone
                users = await _db.Users
                    .AsNoTracking()
                    .Where(u => u.Id != userGuid)
                    .OrderBy(u => u.DisplayName ?? u.Email)
                    .Select(u => (object)new
                    {
                        id = u.Id.ToString(),
                        displayName = u.DisplayName,
                        email = u.Email,
                        isAdmin = u.IsAdmin
                    })
                    .Take(100)
                    .ToListAsync();
            }
            else
            {
                // Regular users can message admins
                users = await _db.Users
                    .AsNoTracking()
                    .Where(u => u.IsAdmin && u.Id != userGuid)
                    .OrderBy(u => u.DisplayName ?? u.Email)
                    .Select(u => (object)new
                    {
                        id = u.Id.ToString(),
                        displayName = u.DisplayName,
                        email = u.Email,
                        isAdmin = u.IsAdmin
                    })
                    .ToListAsync();
            }

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get available users");
            return Ok(Array.Empty<object>());
        }
    }
}

public class SendMessageRequest
{
    public string ReceiverId { get; set; } = "";
    public string Content { get; set; } = "";
}
