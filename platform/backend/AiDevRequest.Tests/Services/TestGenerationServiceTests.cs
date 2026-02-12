using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class TestGenerationServiceTests
{
    [Fact]
    public void Constructor_ThrowsWhenNoApiKey()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var db = TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TestGenerationService>>();

        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            var act = () => new TestGenerationService(db, config, logger.Object);
            act.Should().Throw<InvalidOperationException>();
        }
        finally
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", originalKey);
        }
    }

    [Fact]
    public void Constructor_SucceedsWithApiKey()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var db = TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TestGenerationService>>();

        var service = new TestGenerationService(db, config, logger.Object);

        service.Should().NotBeNull();
    }

    [Fact]
    public async Task GenerateTestsAsync_ReturnsEmptyForInvalidPath()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var db = TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TestGenerationService>>();
        var service = new TestGenerationService(db, config, logger.Object);

        var result = await service.GenerateTestsAsync("/nonexistent/path", "react");

        result.TestFilesGenerated.Should().Be(0);
        result.Summary.Should().Contain("No source files found");
    }
}
