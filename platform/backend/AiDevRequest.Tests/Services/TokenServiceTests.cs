using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
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

    // ===== GetOrCreateBalance =====

    [Fact]
    public async Task GetOrCreateBalance_CreatesNewBalance_WithWelcomeBonus()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var balance = await service.GetOrCreateBalance("user1");

        balance.Should().NotBeNull();
        balance.UserId.Should().Be("user1");
        balance.Balance.Should().Be(1000);
        balance.TotalEarned.Should().Be(1000);
        balance.TotalSpent.Should().Be(0);
    }

    [Fact]
    public async Task GetOrCreateBalance_CreatesWelcomeTransaction()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.GetOrCreateBalance("user1");

        var transactions = db.TokenTransactions.Where(t => t.UserId == "user1").ToList();
        transactions.Should().HaveCount(1);
        transactions[0].Type.Should().Be("credit");
        transactions[0].Amount.Should().Be(1000);
        transactions[0].Action.Should().Be("welcome_bonus");
        transactions[0].Description.Should().Contain("Welcome bonus");
        transactions[0].BalanceAfter.Should().Be(1000);
    }

    [Fact]
    public async Task GetOrCreateBalance_ReturnsExistingBalance()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var balance1 = await service.GetOrCreateBalance("user1");
        var balance2 = await service.GetOrCreateBalance("user1");

        balance1.Id.Should().Be(balance2.Id);
    }

    [Fact]
    public async Task GetOrCreateBalance_DoesNotDuplicate_OnMultipleCalls()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.GetOrCreateBalance("user1");
        await service.GetOrCreateBalance("user1");
        await service.GetOrCreateBalance("user1");

        db.TokenBalances.Count(b => b.UserId == "user1").Should().Be(1);
    }

    [Fact]
    public async Task GetOrCreateBalance_CreatesIndependentBalances_ForDifferentUsers()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var balance1 = await service.GetOrCreateBalance("user1");
        var balance2 = await service.GetOrCreateBalance("user2");

        balance1.Id.Should().NotBe(balance2.Id);
        db.TokenBalances.Count().Should().Be(2);
    }

    // ===== GetCostForAction =====

    [Fact]
    public async Task GetCostForAction_ReturnsCost_WhenPricingExists()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "analysis", TokenCost = 50, IsActive = true });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var cost = await service.GetCostForAction("analysis");

        cost.Should().Be(50);
    }

    [Fact]
    public async Task GetCostForAction_ReturnsZero_ForUnknownAction()
    {
        var service = CreateService();

        var cost = await service.GetCostForAction("unknown_action");

        cost.Should().Be(0);
    }

    [Fact]
    public async Task GetCostForAction_IgnoresInactivePricing()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "old_analysis", TokenCost = 100, IsActive = false });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var cost = await service.GetCostForAction("old_analysis");

        cost.Should().Be(0);
    }

    // ===== CheckBalance =====

    [Fact]
    public async Task CheckBalance_ReturnsTrueWhenSufficient()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "analysis", TokenCost = 50, IsActive = true });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.GetOrCreateBalance("user1"); // balance = 1000

        var (hasEnough, cost, balance) = await service.CheckBalance("user1", "analysis");

        hasEnough.Should().BeTrue();
        cost.Should().Be(50);
        balance.Should().Be(1000);
    }

    [Fact]
    public async Task CheckBalance_ReturnsFalseWhenInsufficient()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "expensive_action", TokenCost = 2000, IsActive = true });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.GetOrCreateBalance("user1"); // balance = 1000

        var (hasEnough, cost, balance) = await service.CheckBalance("user1", "expensive_action");

        hasEnough.Should().BeFalse();
        cost.Should().Be(2000);
        balance.Should().Be(1000);
    }

    [Fact]
    public async Task CheckBalance_ReturnsTrueWithZeroCost_ForUnknownAction()
    {
        var service = CreateService();

        var (hasEnough, cost, balance) = await service.CheckBalance("user1", "free_action");

        hasEnough.Should().BeTrue();
        cost.Should().Be(0);
    }

    [Fact]
    public async Task CheckBalance_ReturnsTrueWhenExactBalance()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "exact", TokenCost = 1000, IsActive = true });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.GetOrCreateBalance("user1"); // balance = 1000

        var (hasEnough, cost, balance) = await service.CheckBalance("user1", "exact");

        hasEnough.Should().BeTrue();
        cost.Should().Be(1000);
    }

    // ===== DebitTokens =====

    [Fact]
    public async Task DebitTokens_Throws_ForUnknownAction()
    {
        var service = CreateService();

        var act = () => service.DebitTokens("user1", "nonexistent");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Unknown action type*");
    }

    [Fact]
    public async Task DebitTokens_ThrowsWithInMemoryProvider()
    {
        // DebitTokens uses ExecuteSqlRawAsync which is not supported by InMemory provider.
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "analysis", TokenCost = 50, IsActive = true });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.GetOrCreateBalance("user1");

        // ExecuteSqlRawAsync doesn't work with InMemory - we just verify the exception behavior
        var act = () => service.DebitTokens("user1", "analysis", "ref-123");

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    // ===== CreditTokens =====

    [Fact]
    public async Task CreditTokens_ThrowsWithInMemoryProvider()
    {
        // CreditTokens uses ExecuteSqlRawAsync which is not supported by InMemory provider.
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        await service.GetOrCreateBalance("user1");

        var act = () => service.CreditTokens("user1", 500, "purchase", "ref1", "Test purchase");

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
