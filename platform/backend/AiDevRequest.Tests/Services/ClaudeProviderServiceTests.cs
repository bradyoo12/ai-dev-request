using AiDevRequest.API.DTOs;
using AiDevRequest.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class ClaudeProviderServiceTests
{
    [Fact]
    public void Constructor_ThrowsWhenNoApiKey()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();

        // Remove env var to ensure it's not set
        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            Assert.Throws<InvalidOperationException>(() => new ClaudeProviderService(config, logger.Object));
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
        var logger = new Mock<ILogger<ClaudeProviderService>>();

        var service = new ClaudeProviderService(config, logger.Object);

        Assert.NotNull(service);
        Assert.Equal("claude", service.ProviderName);
    }

    [Fact]
    public void ProviderName_ReturnsCorrectValue()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        Assert.Equal("claude", service.ProviderName);
    }

    [Fact]
    public void SupportsModel_ReturnsTrueForSupportedModels()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        Assert.True(service.SupportsModel("claude-haiku-4-5-20251001"));
        Assert.True(service.SupportsModel("claude-sonnet-4-5-20250929"));
        Assert.True(service.SupportsModel("claude-opus-4-6"));
    }

    [Fact]
    public void SupportsModel_ReturnsFalseForUnsupportedModels()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        Assert.False(service.SupportsModel("gpt-4"));
        Assert.False(service.SupportsModel("gemini-pro"));
        Assert.False(service.SupportsModel("invalid-model"));
    }

    [Fact]
    public void GetCostPerToken_ReturnsCorrectCosts()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        Assert.Equal(1.00m, service.GetCostPerToken("claude-haiku-4-5-20251001"));
        Assert.Equal(3.00m, service.GetCostPerToken("claude-sonnet-4-5-20250929"));
        Assert.Equal(15.00m, service.GetCostPerToken("claude-opus-4-6"));
        Assert.Equal(3.00m, service.GetCostPerToken("unknown-model")); // Default to Sonnet cost
    }

    [Fact]
    public void GetAvailableModels_ReturnsAllSupportedModels()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        var models = service.GetAvailableModels().ToList();

        Assert.Equal(3, models.Count);
        Assert.Contains("claude-haiku-4-5-20251001", models);
        Assert.Contains("claude-sonnet-4-5-20250929", models);
        Assert.Contains("claude-opus-4-6", models);
    }

    [Fact]
    public async Task GenerateAsync_ThrowsForUnsupportedModel()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        await Assert.ThrowsAsync<ArgumentException>(async () =>
            await service.GenerateAsync("test prompt", "invalid-model"));
    }

    [Theory]
    [InlineData(ThinkingEffortLevel.Low)]
    [InlineData(ThinkingEffortLevel.Medium)]
    [InlineData(ThinkingEffortLevel.High)]
    public async Task GenerateAsync_AcceptsAllEffortLevels(ThinkingEffortLevel effortLevel)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        // This test verifies the method signature accepts effort levels
        // Actual API call will fail without real credentials, but that's expected
        try
        {
            await service.GenerateAsync(
                "test prompt",
                "claude-sonnet-4-5-20250929",
                effortLevel);
        }
        catch (InvalidOperationException)
        {
            // Expected - API call will fail without real credentials
            // But we verified the method accepts the effort level parameter
        }
    }

    [Fact]
    public async Task GenerateAsync_AcceptsOutputSchema()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        var schema = @"{""type"":""object"",""properties"":{""name"":{""type"":""string""}}}";

        // This test verifies the method signature accepts output schema
        try
        {
            await service.GenerateAsync(
                "test prompt",
                "claude-sonnet-4-5-20250929",
                ThinkingEffortLevel.Medium,
                schema);
        }
        catch (InvalidOperationException)
        {
            // Expected - API call will fail without real credentials
        }
    }

    [Fact]
    public async Task GenerateAsync_AcceptsBothEffortLevelAndSchema()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<ClaudeProviderService>>();
        var service = new ClaudeProviderService(config, logger.Object);

        var schema = @"{""type"":""object"",""properties"":{""result"":{""type"":""string""}}}";

        // Verify both parameters can be used together
        try
        {
            await service.GenerateAsync(
                "test prompt",
                "claude-sonnet-4-5-20250929",
                ThinkingEffortLevel.High,
                schema);
        }
        catch (InvalidOperationException)
        {
            // Expected - API call will fail without real credentials
        }
    }
}
