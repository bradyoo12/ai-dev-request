using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class DeploymentServiceTests
{
    private (AzureDeploymentService service, API.Data.AiDevRequestDbContext db) CreateService()
    {
        var db = TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Azure:SubscriptionId"] = "test-sub",
                ["Azure:TenantId"] = "test-tenant"
            })
            .Build();

        var scope = new Mock<IServiceScope>();
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider.Setup(x => x.GetService(typeof(API.Data.AiDevRequestDbContext))).Returns(db);
        scope.Setup(x => x.ServiceProvider).Returns(serviceProvider.Object);
        var scopeFactory = new Mock<IServiceScopeFactory>();
        scopeFactory.Setup(x => x.CreateScope()).Returns(scope.Object);

        var logger = new Mock<ILogger<AzureDeploymentService>>();
        var service = new AzureDeploymentService(scopeFactory.Object, config, logger.Object);
        return (service, db);
    }

    [Fact]
    public async Task CreateDeploymentAsync_CreatesDeployment()
    {
        var (service, db) = CreateService();

        var deployment = await service.CreateDeploymentAsync(
            Guid.NewGuid(), "user1", "my-site", "webapp", "/path/to/project");

        Assert.NotNull(deployment);
        Assert.Equal("my-site", deployment.SiteName);
        Assert.Equal("user1", deployment.UserId);
        Assert.Equal(DeploymentStatus.Pending, deployment.Status);
    }

    [Fact]
    public async Task GetDeploymentAsync_ReturnsDeployment()
    {
        var (service, db) = CreateService();

        var created = await service.CreateDeploymentAsync(
            Guid.NewGuid(), "user1", "my-site", "webapp", "/path");
        var result = await service.GetDeploymentAsync(created.Id);

        Assert.NotNull(result);
        Assert.Equal(created.Id, result!.Id);
    }

    [Fact]
    public async Task GetDeploymentAsync_ReturnsNullForNonExistent()
    {
        var (service, _) = CreateService();

        var result = await service.GetDeploymentAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetUserDeploymentsAsync_ReturnsUserDeployments()
    {
        var (service, _) = CreateService();

        await service.CreateDeploymentAsync(Guid.NewGuid(), "user1", "site1", "webapp", "/path1");
        await service.CreateDeploymentAsync(Guid.NewGuid(), "user1", "site2", "webapp", "/path2");
        await service.CreateDeploymentAsync(Guid.NewGuid(), "user2", "site3", "webapp", "/path3");

        var deployments = await service.GetUserDeploymentsAsync("user1");

        Assert.Equal(2, deployments.Count);
    }

    [Fact]
    public async Task GetLogsAsync_ReturnsLogs()
    {
        var (service, _) = CreateService();

        var deployment = await service.CreateDeploymentAsync(
            Guid.NewGuid(), "user1", "site1", "webapp", "/path");

        var logs = await service.GetLogsAsync(deployment.Id);

        Assert.NotNull(logs);
    }
}
