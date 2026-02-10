using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class BillingServiceTests
{
    private BillingService CreateService(
        API.Data.AiDevRequestDbContext? db = null,
        Mock<IPaymentService>? paymentService = null)
    {
        db ??= TestDbContextFactory.Create();
        paymentService ??= new Mock<IPaymentService>();
        var logger = new Mock<ILogger<BillingService>>();
        return new BillingService(db, paymentService.Object, logger.Object);
    }

    [Fact]
    public async Task GetBillingOverviewAsync_ReturnsOverview()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var overview = await service.GetBillingOverviewAsync("user1");

        Assert.NotNull(overview);
    }

    [Fact]
    public async Task GetOrCreateAutoTopUpConfigAsync_CreatesDefault()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var config = await service.GetOrCreateAutoTopUpConfigAsync("user1");

        Assert.NotNull(config);
        Assert.Equal("user1", config.UserId);
        Assert.False(config.IsEnabled);
    }

    [Fact]
    public async Task GetOrCreateAutoTopUpConfigAsync_ReturnsExisting()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var config1 = await service.GetOrCreateAutoTopUpConfigAsync("user1");
        var config2 = await service.GetOrCreateAutoTopUpConfigAsync("user1");

        Assert.Equal(config1.Id, config2.Id);
    }

    [Fact]
    public async Task UpdateAutoTopUpConfigAsync_UpdatesConfig()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.GetOrCreateAutoTopUpConfigAsync("user1");

        var updated = await service.UpdateAutoTopUpConfigAsync("user1", new AutoTopUpConfigUpdate
        {
            IsEnabled = true,
            Threshold = 200,
            TokenPackageId = 3,
            MonthlyLimitUsd = 100m
        });

        Assert.True(updated.IsEnabled);
        Assert.Equal(200, updated.Threshold);
        Assert.Equal(3, updated.TokenPackageId);
    }

    [Fact]
    public async Task TryAutoTopUpAsync_ReturnsFalseWhenDisabled()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.GetOrCreateAutoTopUpConfigAsync("user1");
        var result = await service.TryAutoTopUpAsync("user1", 50);

        Assert.Null(result);
    }
}
