using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class BuildVerificationServiceTests
{
    [Fact]
    public void Constructor_ThrowsWhenNoApiKey()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var logger = new Mock<ILogger<BuildVerificationService>>();

        var originalKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        try
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", null);
            Assert.Throws<InvalidOperationException>(() => new BuildVerificationService(config, db, logger.Object));
        }
        finally
        {
            Environment.SetEnvironmentVariable("ANTHROPIC_API_KEY", originalKey);
        }
    }

    [Fact]
    public void Constructor_SucceedsWithApiKey()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Anthropic:ApiKey"] = "test-api-key"
            })
            .Build();
        var logger = new Mock<ILogger<BuildVerificationService>>();

        var service = new BuildVerificationService(config, db, logger.Object);

        Assert.NotNull(service);
    }
}
