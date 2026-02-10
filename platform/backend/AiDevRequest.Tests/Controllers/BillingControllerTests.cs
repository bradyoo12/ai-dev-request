using AiDevRequest.API.Controllers;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class BillingControllerTests
{
    private BillingController CreateController(Mock<IBillingService>? billingService = null)
    {
        billingService ??= new Mock<IBillingService>();
        var logger = new Mock<ILogger<BillingController>>();
        return new BillingController(billingService.Object, logger.Object);
    }

    [Fact]
    public async Task GetBillingOverview_ReturnsOk()
    {
        var billingService = new Mock<IBillingService>();
        billingService.Setup(s => s.GetBillingOverviewAsync(It.IsAny<string>()))
            .ReturnsAsync(new BillingOverview
            {
                PaymentMethods = new List<PaymentMethodInfo>(),
                AutoTopUp = new API.Entities.AutoTopUpConfig { UserId = "user1" },
                IsSimulation = true
            });

        var controller = CreateController(billingService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetBillingOverview();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<BillingOverviewDto>(okResult.Value);
    }

    [Fact]
    public async Task GetAutoTopUpConfig_ReturnsOk()
    {
        var billingService = new Mock<IBillingService>();
        billingService.Setup(s => s.GetOrCreateAutoTopUpConfigAsync(It.IsAny<string>()))
            .ReturnsAsync(new API.Entities.AutoTopUpConfig { UserId = "user1" });

        var controller = CreateController(billingService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetAutoTopUpConfig();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateAutoTopUpConfig_ReturnsOk()
    {
        var billingService = new Mock<IBillingService>();
        billingService.Setup(s => s.UpdateAutoTopUpConfigAsync(It.IsAny<string>(), It.IsAny<AutoTopUpConfigUpdate>()))
            .ReturnsAsync(new API.Entities.AutoTopUpConfig { UserId = "user1", IsEnabled = true });

        var controller = CreateController(billingService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.UpdateAutoTopUpConfig(new UpdateAutoTopUpDto { IsEnabled = true });

        Assert.IsType<OkObjectResult>(result.Result);
    }
}
