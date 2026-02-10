using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class DomainServiceTests
{
    [Fact]
    public async Task GetUserDomainsAsync_ReturnsEmptyForNewUser()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cloudflare:ApiToken"] = "test-token",
                ["Cloudflare:AccountId"] = "test-account"
            })
            .Build();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        var logger = new Mock<ILogger<CloudflareDomainService>>();

        var scope = new Mock<IServiceScope>();
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider.Setup(x => x.GetService(typeof(API.Data.AiDevRequestDbContext))).Returns(db);
        scope.Setup(x => x.ServiceProvider).Returns(serviceProvider.Object);
        var scopeFactory = new Mock<IServiceScopeFactory>();
        scopeFactory.Setup(x => x.CreateScope()).Returns(scope.Object);

        var service = new CloudflareDomainService(db, httpClientFactory.Object, config, logger.Object, scopeFactory.Object);

        var domains = await service.GetUserDomainsAsync("user1");

        Assert.Empty(domains);
    }

    [Fact]
    public async Task GetDomainByDeploymentAsync_ReturnsNullForNoMatch()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cloudflare:ApiToken"] = "test-token",
                ["Cloudflare:AccountId"] = "test-account"
            })
            .Build();
        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());
        var logger = new Mock<ILogger<CloudflareDomainService>>();
        var scopeFactory = new Mock<IServiceScopeFactory>();

        var service = new CloudflareDomainService(db, httpClientFactory.Object, config, logger.Object, scopeFactory.Object);

        var domain = await service.GetDomainByDeploymentAsync(Guid.NewGuid(), "user1");

        Assert.Null(domain);
    }
}
