using AiDevRequest.API.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class PaymentServiceTests
{
    [Fact]
    public void Constructor_SucceedsWithConfiguration()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Stripe:SecretKey"] = "sk_test_fake",
                ["Stripe:WebhookSecret"] = "whsec_test_fake"
            })
            .Build();

        var scopeFactory = new Mock<IServiceScopeFactory>();
        var logger = new Mock<ILogger<StripePaymentService>>();
        var env = new Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns("Development");

        var service = new StripePaymentService(scopeFactory.Object, config, logger.Object, env.Object);

        Assert.NotNull(service);
    }

    [Fact]
    public async Task GetPaymentHistoryAsync_ReturnsEmptyListForNewUser()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Stripe:SecretKey"] = "sk_test_fake",
                ["Stripe:WebhookSecret"] = "whsec_test_fake"
            })
            .Build();

        var db = Helpers.TestDbContextFactory.Create();
        var scope = new Mock<IServiceScope>();
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider.Setup(x => x.GetService(typeof(API.Data.AiDevRequestDbContext))).Returns(db);
        scope.Setup(x => x.ServiceProvider).Returns(serviceProvider.Object);
        var scopeFactory = new Mock<IServiceScopeFactory>();
        scopeFactory.Setup(x => x.CreateScope()).Returns(scope.Object);

        var logger = new Mock<ILogger<StripePaymentService>>();
        var env = new Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns("Development");

        var service = new StripePaymentService(scopeFactory.Object, config, logger.Object, env.Object);
        var history = await service.GetPaymentHistoryAsync("user1", 1, 20);

        Assert.Empty(history);
    }

    [Fact]
    public async Task GetPaymentCountAsync_ReturnsZeroForNewUser()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Stripe:SecretKey"] = "sk_test_fake",
                ["Stripe:WebhookSecret"] = "whsec_test_fake"
            })
            .Build();

        var db = Helpers.TestDbContextFactory.Create();
        var scope = new Mock<IServiceScope>();
        var serviceProvider = new Mock<IServiceProvider>();
        serviceProvider.Setup(x => x.GetService(typeof(API.Data.AiDevRequestDbContext))).Returns(db);
        scope.Setup(x => x.ServiceProvider).Returns(serviceProvider.Object);
        var scopeFactory = new Mock<IServiceScopeFactory>();
        scopeFactory.Setup(x => x.CreateScope()).Returns(scope.Object);

        var logger = new Mock<ILogger<StripePaymentService>>();
        var env = new Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns("Development");

        var service = new StripePaymentService(scopeFactory.Object, config, logger.Object, env.Object);
        var count = await service.GetPaymentCountAsync("user1");

        Assert.Equal(0, count);
    }
}
