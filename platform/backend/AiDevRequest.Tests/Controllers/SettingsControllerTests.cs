using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class SettingsControllerTests
{
    private SettingsController CreateController(
        AiDevRequestDbContext? db = null,
        Mock<ITokenService>? tokenService = null)
    {
        db ??= TestDbContextFactory.Create();
        tokenService ??= new Mock<ITokenService>();
        var logger = new Mock<ILogger<SettingsController>>();
        return new SettingsController(db, logger.Object, tokenService.Object);
    }

    // ===== GetTokenOverview =====

    [Fact]
    public async Task GetTokenOverview_ReturnsOk_WithBalance()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 750, TotalEarned = 1000, TotalSpent = 250 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenOverview();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var overview = okResult.Value.Should().BeOfType<TokenOverviewDto>().Subject;
        overview.Balance.Should().Be(750);
        overview.TotalEarned.Should().Be(1000);
        overview.TotalSpent.Should().Be(250);
        overview.BalanceValueUsd.Should().Be(7.50m); // 750 * 0.01
    }

    [Fact]
    public async Task GetTokenOverview_IncludesActivePricing()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500, TotalEarned = 500, TotalSpent = 0 });

        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "analysis", TokenCost = 50, Description = "AI Analysis", IsActive = true });
        db.TokenPricings.Add(new TokenPricing { ActionType = "inactive_action", TokenCost = 999, IsActive = false });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenOverview();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var overview = okResult.Value.Should().BeOfType<TokenOverviewDto>().Subject;
        // DbContext seeds 5 default active pricing items + 1 added by test = 6 active
        overview.Pricing.Should().HaveCountGreaterThanOrEqualTo(1);
        overview.Pricing.Should().Contain(p => p.ActionType == "analysis" && p.TokenCost == 50);
    }

    [Fact]
    public async Task GetTokenOverview_ReturnsDefault_WhenExceptionOccurs()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ThrowsAsync(new Exception("DB connection failed"));

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenOverview();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var overview = okResult.Value.Should().BeOfType<TokenOverviewDto>().Subject;
        overview.Balance.Should().Be(0);
        overview.Pricing.Should().BeEmpty();
    }

    // ===== GetTokenHistory =====

    [Fact]
    public async Task GetTokenHistory_ReturnsOk_WithEmptyList()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenHistory();

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetTokenHistory_FiltersTransactionsByUser()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        db.TokenTransactions.Add(new TokenTransaction { UserId = "test-user-id", Type = "debit", Action = "analysis", Amount = 50, BalanceAfter = 950 });
        db.TokenTransactions.Add(new TokenTransaction { UserId = "other-user", Type = "debit", Action = "analysis", Amount = 50, BalanceAfter = 950 });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenHistory();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var transactions = okResult.Value.Should().BeAssignableTo<IEnumerable<TokenTransactionDto>>().Subject;
        transactions.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetTokenHistory_FiltersTransactionsByAction()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        db.TokenTransactions.Add(new TokenTransaction { UserId = "test-user-id", Type = "debit", Action = "analysis", Amount = 50, BalanceAfter = 950 });
        db.TokenTransactions.Add(new TokenTransaction { UserId = "test-user-id", Type = "credit", Action = "purchase", Amount = 500, BalanceAfter = 1500 });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenHistory(actionFilter: "analysis");

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var transactions = okResult.Value.Should().BeAssignableTo<IEnumerable<TokenTransactionDto>>().Subject;
        transactions.Should().HaveCount(1);
        transactions.First().Action.Should().Be("analysis");
    }

    [Fact]
    public async Task GetTokenHistory_ClampsPageSize()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        // pageSize of 200 should be clamped to 100
        var result = await controller.GetTokenHistory(pageSize: 200);

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    // ===== GetTokenPackages =====

    [Fact]
    public async Task GetTokenPackages_ReturnsOnlyActivePackages()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPackages.Add(new TokenPackage { Name = "Starter", TokenAmount = 500, PriceUsd = 4.99m, IsActive = true, SortOrder = 1 });
        db.TokenPackages.Add(new TokenPackage { Name = "Pro", TokenAmount = 2000, PriceUsd = 14.99m, IsActive = true, SortOrder = 2 });
        db.TokenPackages.Add(new TokenPackage { Name = "Legacy", TokenAmount = 100, PriceUsd = 1.99m, IsActive = false, SortOrder = 0 });
        await db.SaveChangesAsync();

        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenPackages();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var packages = okResult.Value.Should().BeAssignableTo<IEnumerable<TokenPackageDto>>().Subject;
        // DbContext seeds 4 default active packages + 2 added by test = 6 active
        packages.Should().HaveCountGreaterThanOrEqualTo(2);
        packages.Should().Contain(p => p.Name == "Starter");
        packages.Should().NotContain(p => p.Name == "Legacy"); // inactive excluded
    }

    // ===== PurchaseTokens =====

    [Fact]
    public async Task PurchaseTokens_ReturnsNotFound_WhenPackageMissing()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.PurchaseTokens(new PurchaseTokensDto { PackageId = 999 });

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task PurchaseTokens_ReturnsNotFound_WhenPackageInactive()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var inactivePackage = new TokenPackage { Name = "Inactive", TokenAmount = 100, PriceUsd = 1m, IsActive = false };
        db.TokenPackages.Add(inactivePackage);
        await db.SaveChangesAsync();

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.PurchaseTokens(new PurchaseTokensDto { PackageId = inactivePackage.Id });

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task PurchaseTokens_ReturnsOk_AndCreditsBalance()
    {
        var db = TestDbContextFactory.Create();
        var balance = new TokenBalance { UserId = "test-user-id", Balance = 500, TotalEarned = 500, TotalSpent = 0 };
        db.TokenBalances.Add(balance);
        var package = new TokenPackage { Name = "Starter Pack", TokenAmount = 1000, PriceUsd = 9.99m, IsActive = true };
        db.TokenPackages.Add(package);
        await db.SaveChangesAsync();

        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance("test-user-id")).ReturnsAsync(balance);

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.PurchaseTokens(new PurchaseTokensDto { PackageId = package.Id });

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var purchase = okResult.Value.Should().BeOfType<TokenPurchaseResultDto>().Subject;
        purchase.Success.Should().BeTrue();
        purchase.TokensAdded.Should().Be(1000);
        purchase.NewBalance.Should().Be(1500);
    }

    // ===== CheckTokens =====

    [Fact]
    public async Task CheckTokens_ReturnsNotFound_WhenUnknownAction()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CheckTokens("nonexistent_action");

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CheckTokens_ReturnsHasEnough_WhenSufficientBalance()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "analysis", TokenCost = 50, IsActive = true });
        await db.SaveChangesAsync();

        var balance = new TokenBalance { UserId = "test-user-id", Balance = 500 };
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance("test-user-id")).ReturnsAsync(balance);

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CheckTokens("analysis");

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var check = okResult.Value.Should().BeOfType<TokenCheckDto>().Subject;
        check.HasEnough.Should().BeTrue();
        check.TokenCost.Should().Be(50);
        check.CurrentBalance.Should().Be(500);
        check.Shortfall.Should().Be(0);
    }

    [Fact]
    public async Task CheckTokens_ReturnsShortfall_WhenInsufficientBalance()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "build", TokenCost = 300, IsActive = true });
        await db.SaveChangesAsync();

        var balance = new TokenBalance { UserId = "test-user-id", Balance = 100 };
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance("test-user-id")).ReturnsAsync(balance);

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CheckTokens("build");

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var check = okResult.Value.Should().BeOfType<TokenCheckDto>().Subject;
        check.HasEnough.Should().BeFalse();
        check.Shortfall.Should().Be(200);
    }

    // ===== DeductTokens =====

    [Fact]
    public async Task DeductTokens_ReturnsNotFound_WhenUnknownAction()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeductTokens(new DeductTokensDto { ActionType = "nonexistent" });

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeductTokens_Returns402_WhenInsufficientTokens()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "build", TokenCost = 300, IsActive = true });
        await db.SaveChangesAsync();

        var balance = new TokenBalance { UserId = "test-user-id", Balance = 100 };
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance("test-user-id")).ReturnsAsync(balance);

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeductTokens(new DeductTokensDto { ActionType = "build" });

        var statusResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(402);
    }

    [Fact]
    public async Task DeductTokens_ReturnsOk_AndDeductsBalance()
    {
        var db = TestDbContextFactory.Create();
        db.TokenPricings.Add(new TokenPricing { ActionType = "analysis", TokenCost = 50, Description = "AI Analysis", IsActive = true });
        var balance = new TokenBalance { UserId = "test-user-id", Balance = 500, TotalEarned = 500, TotalSpent = 0 };
        db.TokenBalances.Add(balance);
        await db.SaveChangesAsync();

        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance("test-user-id")).ReturnsAsync(balance);

        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeductTokens(new DeductTokensDto { ActionType = "analysis", ReferenceId = "ref-123" });

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var deduct = okResult.Value.Should().BeOfType<TokenDeductResultDto>().Subject;
        deduct.Success.Should().BeTrue();
        deduct.TokensDeducted.Should().Be(50);
        deduct.NewBalance.Should().Be(450);
    }

    // ===== Usage Endpoints =====

    [Fact]
    public async Task GetUsageSummary_ReturnsOk()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetUsageSummary();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var summary = okResult.Value.Should().BeOfType<UsageSummaryDto>().Subject;
        summary.Balance.Should().Be(500);
    }

    [Fact]
    public async Task GetUsageTransactions_ReturnsOk_WithPagination()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetUsageTransactions(page: 1, pageSize: 10);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var txResult = okResult.Value.Should().BeOfType<UsageTransactionsResultDto>().Subject;
        txResult.Page.Should().Be(1);
        txResult.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task GetUsageByProject_ReturnsOk()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetUsageByProject();

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    // ===== Public Token Costs Endpoint =====

    [Fact]
    public async Task GetTokenCosts_ReturnsOk_WithPricing()
    {
        var db = TestDbContextFactory.Create();
        // Note: DbContext seeds 5 default pricing items via HasData
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupAnonymous(controller);

        var result = await controller.GetTokenCosts();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var costs = okResult.Value.Should().BeAssignableTo<IEnumerable<TokenCostDto>>().Subject;
        costs.Should().HaveCountGreaterThanOrEqualTo(5);
        costs.Should().Contain(c => c.ActionType == "analysis");
        costs.Should().Contain(c => c.ActionType == "build");
    }
}
