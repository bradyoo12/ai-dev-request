using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IMessageService
{
    Task<UserMessage> SendMessageAsync(string senderId, string receiverId, string content);
    Task<List<UserMessage>> GetMessagesAsync(string userId);
    Task<List<UserMessage>> GetConversationAsync(string userId1, string userId2);
    Task<Message?> MarkAsReadAsync(Guid messageId, string userId);
    Task<int> GetUnreadCountAsync(string userId);
    Task<List<ConversationSummary>> GetConversationListAsync(string userId);
}

public class ConversationSummary
{
    public required string OtherUserId { get; set; }
    public string? OtherUserDisplayName { get; set; }
    public string? OtherUserEmail { get; set; }
    public required string LastMessageContent { get; set; }
    public DateTime LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
}

public class MessageService : IMessageService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<MessageService> _logger;

    public MessageService(AiDevRequestDbContext db, ILogger<MessageService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<UserMessage> SendMessageAsync(string senderId, string receiverId, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Message content cannot be empty.", nameof(content));

        if (senderId == receiverId)
            throw new ArgumentException("Cannot send a message to yourself.", nameof(receiverId));

        var message = new Message
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = content.Trim()
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Message {MessageId} sent from {SenderId} to {ReceiverId}",
            message.Id, senderId, receiverId);

        return message;
    }

    public async Task<List<UserMessage>> GetMessagesAsync(string userId)
    {
        return await _db.Messages
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<UserMessage>> GetConversationAsync(string userId1, string userId2)
    {
        return await _db.Messages
            .Where(m =>
                (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                (m.SenderId == userId2 && m.ReceiverId == userId1))
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<Message?> MarkAsReadAsync(Guid messageId, string userId)
    {
        var message = await _db.Messages.FindAsync(messageId);
        if (message == null) return null;

        // Only the receiver can mark a message as read
        if (message.ReceiverId != userId) return null;

        if (message.IsRead) return message;

        message.IsRead = true;
        message.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return message;
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _db.Messages
            .CountAsync(m => m.ReceiverId == userId && !m.IsRead);
    }

    public async Task<List<ConversationSummary>> GetConversationListAsync(string userId)
    {
        // Get all messages involving this user
        var messages = await _db.Messages
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        // Group by conversation partner
        var conversations = messages
            .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
            .Select(g =>
            {
                var lastMessage = g.First(); // Already ordered by CreatedAt DESC
                return new ConversationSummary
                {
                    OtherUserId = g.Key,
                    LastMessageContent = lastMessage.Content.Length > 100
                        ? lastMessage.Content[..100] + "..."
                        : lastMessage.Content,
                    LastMessageAt = lastMessage.CreatedAt,
                    UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                };
            })
            .OrderByDescending(c => c.LastMessageAt)
            .ToList();

        // Enrich with user display names
        var otherUserIds = conversations.Select(c => c.OtherUserId).ToList();
        var userGuids = otherUserIds
            .Where(id => Guid.TryParse(id, out _))
            .Select(Guid.Parse)
            .ToList();

        var users = await _db.Users
            .Where(u => userGuids.Contains(u.Id))
            .Select(u => new { u.Id, u.DisplayName, u.Email })
            .ToListAsync();

        foreach (var conv in conversations)
        {
            if (Guid.TryParse(conv.OtherUserId, out var guid))
            {
                var user = users.FirstOrDefault(u => u.Id == guid);
                if (user != null)
                {
                    conv.OtherUserDisplayName = user.DisplayName;
                    conv.OtherUserEmail = user.Email;
                }
            }
        }

        return conversations;
    }
}
