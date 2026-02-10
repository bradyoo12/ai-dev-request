using AiDevRequest.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class ProductionServiceTests
{
    private static IModelRouterService CreateModelRouter() =>
        new ModelRouterService(new Mock<ILogger<ModelRouterService>>().Object);

    [Fact]
    public void Constructor_ThrowsWhenNoApiKey()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var logger = new Mock<ILogger<ProductionService>>();

        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            Assert.Throws<InvalidOperationException>(() => new ProductionService(config, CreateModelRouter(), logger.Object));
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
        var logger = new Mock<ILogger<ProductionService>>();

        var service = new ProductionService(config, CreateModelRouter(), logger.Object);

        Assert.NotNull(service);
    }

    [Fact]
    public async Task GetBuildStatusAsync_ReturnsStatusForNonExistentProject()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ProductionService>>();
        var service = new ProductionService(config, CreateModelRouter(), logger.Object);

        var status = await service.GetBuildStatusAsync("non-existent-project");

        Assert.NotNull(status);
    }
}
