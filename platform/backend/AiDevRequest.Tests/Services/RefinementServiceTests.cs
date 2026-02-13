using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class RefinementServiceTests
{
    [Fact]
    public void Constructor_SucceedsWithNoApiKey()
    {
        // Constructor does not throw even without an API key - it falls back to empty string
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var db = TestDbContextFactory.Create();
        var versionService = new Mock<IProjectVersionService>();
        var logger = new Mock<ILogger<RefinementService>>();

        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            var service = new RefinementService(config, db, versionService.Object, logger.Object);
            Assert.NotNull(service);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", originalKey);
        }
    }

    [Fact]
    public async Task GetHistoryAsync_ReturnsMessages()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        db.RefinementMessages.Add(new RefinementMessage
        {
            DevRequestId = requestId,
            Role = "user",
            Content = "Hello"
        });
        db.RefinementMessages.Add(new RefinementMessage
        {
            DevRequestId = requestId,
            Role = "assistant",
            Content = "Hi there"
        });
        await db.SaveChangesAsync();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var versionService = new Mock<IProjectVersionService>();
        var logger = new Mock<ILogger<RefinementService>>();
        var service = new RefinementService(config, db, versionService.Object, logger.Object);

        var messages = await service.GetHistoryAsync(requestId);

        Assert.Equal(2, messages.Count);
    }

    [Fact]
    public async Task GetHistoryAsync_ReturnsEmptyForNoMessages()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var versionService = new Mock<IProjectVersionService>();
        var logger = new Mock<ILogger<RefinementService>>();
        var service = new RefinementService(config, db, versionService.Object, logger.Object);

        var messages = await service.GetHistoryAsync(Guid.NewGuid());

        Assert.Empty(messages);
    }

    [Fact]
    public async Task ParseFileChanges_ExtractsFilesFromMarkdown()
    {
        var content = @"Here are the changes:

**File: `src/App.tsx`**
```tsx
function App() {
  return <div>Hello</div>;
}
```

**File: `src/index.ts`**
```ts
console.log('test');
```";

        var changes = RefinementService.ParseFileChanges(content);

        Assert.Equal(2, changes.Count);
        Assert.Equal("src/App.tsx", changes[0].FilePath);
        Assert.Contains("function App()", changes[0].Content);
        Assert.Equal("src/index.ts", changes[1].FilePath);
        Assert.Contains("console.log", changes[1].Content);
    }

    [Fact]
    public async Task UndoLastIterationAsync_ReturnsFalse_WhenNoVersionExists()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();

        var versionService = new Mock<IProjectVersionService>();
        versionService.Setup(x => x.GetLatestVersionAsync(It.IsAny<Guid>()))
            .ReturnsAsync((ProjectVersion?)null);

        var logger = new Mock<ILogger<RefinementService>>();
        var service = new RefinementService(config, db, versionService.Object, logger.Object);

        var requestId = Guid.NewGuid();
        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user",
            Description = "Test project",
            ProjectPath = "/test/path"
        });
        await db.SaveChangesAsync();

        var result = await service.UndoLastIterationAsync(requestId);

        Assert.False(result);
    }

    [Fact]
    public async Task UndoLastIterationAsync_CallsRollback_WhenVersionExists()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();

        var requestId = Guid.NewGuid();
        var versionId = Guid.NewGuid();
        var version = new ProjectVersion
        {
            Id = versionId,
            DevRequestId = requestId,
            VersionNumber = 1,
            Label = "Test version",
            SnapshotPath = "/test/snapshot.zip",
            CreatedAt = DateTime.UtcNow
        };

        var versionService = new Mock<IProjectVersionService>();
        versionService.Setup(x => x.GetLatestVersionAsync(requestId))
            .ReturnsAsync(version);
        versionService.Setup(x => x.RollbackAsync(requestId, versionId))
            .ReturnsAsync(version);

        var logger = new Mock<ILogger<RefinementService>>();
        var service = new RefinementService(config, db, versionService.Object, logger.Object);

        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "test-user",
            Description = "Test project",
            ProjectPath = "/test/path"
        });
        await db.SaveChangesAsync();

        var result = await service.UndoLastIterationAsync(requestId);

        Assert.True(result);
        versionService.Verify(x => x.RollbackAsync(requestId, versionId), Times.Once);
    }
}
