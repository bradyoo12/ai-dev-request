using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class MessageServiceTests
{
    private MessageService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<MessageService>>();
        return new MessageService(db, logger.Object);
    }

    [Fact]
    public async Task SendMessageAsync_CreatesMessage()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var message = await service.SendMessageAsync("user1", "user2", "Hello!");

        Assert.NotNull(message);
        Assert.Equal("user1", message.SenderId);
        Assert.Equal("user2", message.ReceiverId);
        Assert.Equal("Hello!", message.Content);
        Assert.False(message.IsRead);
        Assert.Null(message.ReadAt);
    }

    [Fact]
    public async Task SendMessageAsync_TrimsContent()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var message = await service.SendMessageAsync("user1", "user2", "  Hello!  ");

        Assert.Equal("Hello!", message.Content);
    }

    [Fact]
    public async Task SendMessageAsync_ThrowsOnEmptyContent()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.SendMessageAsync("user1", "user2", ""));
    }

    [Fact]
    public async Task SendMessageAsync_ThrowsOnSelfMessage()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.SendMessageAsync("user1", "user1", "Hello!"));
    }

    [Fact]
    public async Task GetMessagesAsync_ReturnsUserMessages()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SendMessageAsync("user1", "user2", "Message 1");
        await service.SendMessageAsync("user2", "user1", "Message 2");
        await service.SendMessageAsync("user3", "user4", "Other message");

        var messages = await service.GetMessagesAsync("user1");

        Assert.Equal(2, messages.Count);
    }

    [Fact]
    public async Task GetMessagesAsync_ReturnsOrderedByCreatedAtDesc()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SendMessageAsync("user1", "user2", "First");
        await service.SendMessageAsync("user2", "user1", "Second");

        var messages = await service.GetMessagesAsync("user1");

        Assert.Equal("Second", messages[0].Content);
        Assert.Equal("First", messages[1].Content);
    }

    [Fact]
    public async Task GetConversationAsync_ReturnsConversationMessages()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SendMessageAsync("user1", "user2", "Hello user2");
        await service.SendMessageAsync("user2", "user1", "Hi user1");
        await service.SendMessageAsync("user1", "user3", "Hello user3");

        var conversation = await service.GetConversationAsync("user1", "user2");

        Assert.Equal(2, conversation.Count);
        Assert.Equal("Hello user2", conversation[0].Content);
        Assert.Equal("Hi user1", conversation[1].Content);
    }

    [Fact]
    public async Task GetConversationAsync_ReturnsOrderedByCreatedAtAsc()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SendMessageAsync("user1", "user2", "First");
        await service.SendMessageAsync("user2", "user1", "Second");

        var conversation = await service.GetConversationAsync("user1", "user2");

        Assert.Equal("First", conversation[0].Content);
        Assert.Equal("Second", conversation[1].Content);
    }

    [Fact]
    public async Task MarkAsReadAsync_MarksMessageAsRead()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var sent = await service.SendMessageAsync("user1", "user2", "Hello!");
        var marked = await service.MarkAsReadAsync(sent.Id, "user2");

        Assert.NotNull(marked);
        Assert.True(marked!.IsRead);
        Assert.NotNull(marked.ReadAt);
    }

    [Fact]
    public async Task MarkAsReadAsync_ReturnsNullForNonReceiver()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var sent = await service.SendMessageAsync("user1", "user2", "Hello!");
        var marked = await service.MarkAsReadAsync(sent.Id, "user1"); // sender, not receiver

        Assert.Null(marked);
    }

    [Fact]
    public async Task MarkAsReadAsync_ReturnsNullForNonexistentMessage()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var marked = await service.MarkAsReadAsync(Guid.NewGuid(), "user1");

        Assert.Null(marked);
    }

    [Fact]
    public async Task MarkAsReadAsync_IdempotentForAlreadyReadMessage()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var sent = await service.SendMessageAsync("user1", "user2", "Hello!");
        await service.MarkAsReadAsync(sent.Id, "user2");
        var markedAgain = await service.MarkAsReadAsync(sent.Id, "user2");

        Assert.NotNull(markedAgain);
        Assert.True(markedAgain!.IsRead);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ReturnsCorrectCount()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SendMessageAsync("user1", "user2", "Message 1");
        await service.SendMessageAsync("user1", "user2", "Message 2");
        await service.SendMessageAsync("user2", "user1", "Reply");

        var unreadForUser2 = await service.GetUnreadCountAsync("user2");
        var unreadForUser1 = await service.GetUnreadCountAsync("user1");

        Assert.Equal(2, unreadForUser2);
        Assert.Equal(1, unreadForUser1);
    }

    [Fact]
    public async Task GetUnreadCountAsync_DecreasesAfterMarkAsRead()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var msg1 = await service.SendMessageAsync("user1", "user2", "Message 1");
        await service.SendMessageAsync("user1", "user2", "Message 2");

        var beforeRead = await service.GetUnreadCountAsync("user2");
        Assert.Equal(2, beforeRead);

        await service.MarkAsReadAsync(msg1.Id, "user2");

        var afterRead = await service.GetUnreadCountAsync("user2");
        Assert.Equal(1, afterRead);
    }

    [Fact]
    public async Task GetConversationListAsync_ReturnsConversationSummaries()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SendMessageAsync("user1", "user2", "Hello user2");
        await service.SendMessageAsync("user2", "user1", "Hi user1");
        await service.SendMessageAsync("user1", "user3", "Hello user3");

        var conversations = await service.GetConversationListAsync("user1");

        Assert.Equal(2, conversations.Count);
    }

    [Fact]
    public async Task GetConversationListAsync_ShowsUnreadCount()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.SendMessageAsync("user2", "user1", "Hello 1");
        await service.SendMessageAsync("user2", "user1", "Hello 2");

        var conversations = await service.GetConversationListAsync("user1");

        Assert.Single(conversations);
        Assert.Equal(2, conversations[0].UnreadCount);
    }

    [Fact]
    public async Task GetConversationListAsync_TruncatesLongMessages()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var longContent = new string('A', 200);
        await service.SendMessageAsync("user1", "user2", longContent);

        var conversations = await service.GetConversationListAsync("user1");

        Assert.Single(conversations);
        Assert.True(conversations[0].LastMessageContent.Length <= 103); // 100 chars + "..."
        Assert.EndsWith("...", conversations[0].LastMessageContent);
    }

    [Fact]
    public async Task GetConversationListAsync_EnrichesWithUserInfo()
    {
        var db = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            Email = "other@test.com",
            DisplayName = "Other User",
            PasswordHash = "hash"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.SendMessageAsync("user1", userId.ToString(), "Hello!");

        var conversations = await service.GetConversationListAsync("user1");

        Assert.Single(conversations);
        Assert.Equal("Other User", conversations[0].OtherUserDisplayName);
        Assert.Equal("other@test.com", conversations[0].OtherUserEmail);
    }
}
