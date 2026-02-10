using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class MemoryServiceTests
{
    private MemoryService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<MemoryService>>();
        return new MemoryService(db, logger.Object);
    }

    [Fact]
    public async Task AddMemoryAsync_CreatesMemory()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var memory = await service.AddMemoryAsync("user1", "Test memory", "general", MemoryScope.User);

        Assert.Equal("Test memory", memory.Content);
        Assert.Equal("general", memory.Category);
        Assert.Equal("user1", memory.UserId);
    }

    [Fact]
    public async Task GetAllMemoriesAsync_ReturnsUserMemories()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.AddMemoryAsync("user1", "Memory1", "general", MemoryScope.User);
        await service.AddMemoryAsync("user1", "Memory2", "coding", MemoryScope.User);
        await service.AddMemoryAsync("user2", "Memory3", "general", MemoryScope.User);

        var memories = await service.GetAllMemoriesAsync("user1", 1, 50);

        Assert.Equal(2, memories.Count);
    }

    [Fact]
    public async Task GetMemoryCountAsync_ReturnsCorrectCount()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.AddMemoryAsync("user1", "Memory1", "general", MemoryScope.User);
        await service.AddMemoryAsync("user1", "Memory2", "coding", MemoryScope.User);

        var count = await service.GetMemoryCountAsync("user1");

        Assert.Equal(2, count);
    }

    [Fact]
    public async Task DeleteMemoryAsync_DeletesMemory()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var memory = await service.AddMemoryAsync("user1", "Memory1", "general", MemoryScope.User);
        await service.DeleteMemoryAsync("user1", memory.Id);

        var count = await service.GetMemoryCountAsync("user1");
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task DeleteAllMemoriesAsync_DeletesAllUserMemories()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.AddMemoryAsync("user1", "Memory1", "general", MemoryScope.User);
        await service.AddMemoryAsync("user1", "Memory2", "coding", MemoryScope.User);
        await service.DeleteAllMemoriesAsync("user1");

        var count = await service.GetMemoryCountAsync("user1");
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task SearchMemoriesAsync_ReturnsMatchingMemories()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.AddMemoryAsync("user1", "I prefer dark mode", "ui", MemoryScope.User);
        await service.AddMemoryAsync("user1", "I like TypeScript", "coding", MemoryScope.User);

        var results = await service.SearchMemoriesAsync("user1", "dark");

        Assert.Single(results);
        Assert.Contains("dark mode", results[0].Content);
    }

    [Fact]
    public async Task BuildMemoryContextAsync_ReturnsContextString()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.AddMemoryAsync("user1", "Uses React", "tech", MemoryScope.User);
        await service.AddMemoryAsync("user1", "Prefers TypeScript", "tech", MemoryScope.User);

        var context = await service.BuildMemoryContextAsync("user1");

        Assert.Contains("React", context);
        Assert.Contains("TypeScript", context);
    }
}
