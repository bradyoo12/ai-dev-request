using AiDevRequest.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class CryptoPaymentServiceTests
{
    [Fact]
    public void Constructor_SucceedsWithConfiguration()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Coinbase:ApiKey"] = "test-key",
                ["Coinbase:WebhookSecret"] = "test-secret"
            })
            .Build();

        var scopeFactory = new Mock<IServiceScopeFactory>();
        var logger = new Mock<ILogger<CoinbaseCryptoPaymentService>>();
        var env = new Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns("Development");
        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());

        var service = new CoinbaseCryptoPaymentService(
            scopeFactory.Object, config, logger.Object, env.Object, httpClientFactory.Object);

        Assert.NotNull(service);
    }
}
