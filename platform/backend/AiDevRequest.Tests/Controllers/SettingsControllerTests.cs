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

    [Fact]
    public async Task GetTokenOverview_ReturnsOk()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500, TotalEarned = 500, TotalSpent = 0 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenOverview();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetTokenHistory_ReturnsOk()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenHistory();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetTokenPackages_ReturnsOk()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTokenPackages();

        Assert.IsType<OkObjectResult>(result.Result);
    }

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

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

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

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

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

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

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

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetUsageTransactions_ReturnsOk()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(s => s.GetOrCreateBalance(It.IsAny<string>()))
            .ReturnsAsync(new TokenBalance { UserId = "test-user-id", Balance = 500 });

        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db, tokenService: tokenService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetUsageTransactions();

        Assert.IsType<OkObjectResult>(result.Result);
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

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public void GetPricingPlans_ReturnsOk()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = controller.GetPricingPlans();

        Assert.IsType<OkObjectResult>(result.Result);
    }
}
