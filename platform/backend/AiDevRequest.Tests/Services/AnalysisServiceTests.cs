using AiDevRequest.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class AnalysisServiceTests
{
    private static IModelRouterService CreateModelRouter()
    {
        var mockProvider = new Mock<IModelProviderService>();
        return new ModelRouterService(
            new Mock<ILogger<ModelRouterService>>().Object,
            new[] { mockProvider.Object });
    }

    private static IEnumerable<IModelProviderService> CreateProviders()
    {
        var mockProvider = new Mock<IModelProviderService>();
        return new[] { mockProvider.Object };
    }

    [Fact]
    public void Constructor_ThrowsWhenNoApiKey()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var logger = new Mock<ILogger<AnalysisService>>();

        // Remove env var to ensure it's not set
        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            Assert.Throws<InvalidOperationException>(() => new AnalysisService(config, CreateModelRouter(), CreateProviders(), logger.Object));
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
        var logger = new Mock<ILogger<AnalysisService>>();

        var service = new AnalysisService(config, CreateModelRouter(), CreateProviders(), logger.Object);

        Assert.NotNull(service);
    }
}
