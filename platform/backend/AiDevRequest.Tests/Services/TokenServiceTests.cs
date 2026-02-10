using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class TokenServiceTests
{
    private TokenService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TokenService>>();
        return new TokenService(db, logger.Object);
    }

    [Fact]
    public async Task GetOrCreateBalance_CreatesNewBalance()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var balance = await service.GetOrCreateBalance("user1");

        Assert.NotNull(balance);
        Assert.Equal("user1", balance.UserId);
        Assert.Equal(1000, balance.Balance); // default
    }

    [Fact]
    public async Task GetOrCreateBalance_ReturnsExistingBalance()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var balance1 = await service.GetOrCreateBalance("user1");
        var balance2 = await service.GetOrCreateBalance("user1");

        Assert.Equal(balance1.Id, balance2.Id);
    }

    [Fact]
    public async Task GetCostForAction_ReturnsCostFromSeedData()
    {
        // Seed data includes: analysis=50, proposal=100, build=300, staging=50, refinement=10
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var cost = await service.GetCostForAction("analysis");

        Assert.Equal(50, cost);
    }

    [Fact]
    public async Task GetCostForAction_ReturnsZeroForUnknown()
    {
        var service = CreateService();

        var cost = await service.GetCostForAction("unknown_action");

        Assert.Equal(0, cost); // Unknown actions have zero cost
    }

    [Fact]
    public async Task CheckBalance_ReturnsTrueWhenSufficient()
    {
        // Seed data includes "analysis" pricing with cost 50
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        await service.GetOrCreateBalance("user1"); // balance = 1000

        var (hasEnough, cost, balance) = await service.CheckBalance("user1", "analysis");

        Assert.True(hasEnough);
        Assert.Equal(50, cost);
        Assert.Equal(1000, balance);
    }

    [Fact]
    public async Task CheckBalance_ReturnsFalseWhenInsufficient()
    {
        // Use a custom action type with a high cost that exceeds the default 1000 balance
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "expensive_action", TokenCost = 2000, IsActive = true });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.GetOrCreateBalance("user1"); // balance = 1000

        var (hasEnough, cost, balance) = await service.CheckBalance("user1", "expensive_action");

        Assert.False(hasEnough);
        Assert.Equal(2000, cost);
    }

    [Fact]
    public async Task CreditTokens_ThrowsWithInMemoryProvider()
    {
        // CreditTokens uses ExecuteSqlRawAsync which is not supported by InMemory provider.
        // Verify the expected behavior: it throws InvalidOperationException.
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.GetOrCreateBalance("user1");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreditTokens("user1", 500, "purchase", "ref1", "Test purchase"));
    }
}
