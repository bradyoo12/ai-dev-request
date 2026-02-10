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
        var logger = new Mock<ILogger<RefinementService>>();

        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            var service = new RefinementService(config, db, logger.Object);
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
        var logger = new Mock<ILogger<RefinementService>>();
        var service = new RefinementService(config, db, logger.Object);

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
        var logger = new Mock<ILogger<RefinementService>>();
        var service = new RefinementService(config, db, logger.Object);

        var messages = await service.GetHistoryAsync(Guid.NewGuid());

        Assert.Empty(messages);
    }
}
