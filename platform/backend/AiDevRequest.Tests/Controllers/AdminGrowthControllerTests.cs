using AiDevRequest.API.Controllers;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class AdminGrowthControllerTests
{
    private AdminGrowthController CreateController(Mock<IGrowthService>? service = null)
    {
        service ??= new Mock<IGrowthService>();
        var logger = new Mock<ILogger<AdminGrowthController>>();
        return new AdminGrowthController(service.Object, logger.Object);
    }

    [Fact]
    public async Task GetOverview_ReturnsOk()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetOverviewAsync())
            .ReturnsAsync(new GrowthOverviewDto());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetOverview();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetOverview_ReturnsOkWithDefault_OnException()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetOverviewAsync()).ThrowsAsync(new Exception("db error"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetOverview();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetTrends_ReturnsOk()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetTrendsAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<GrowthTrendDto>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTrends(12);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetFunnel_ReturnsOk()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetFunnelAsync())
            .ReturnsAsync(new List<FunnelStepDto>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetFunnel();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task RecordEvent_ReturnsBadRequest_WhenEmptyType()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RecordEvent(new RecordEventRequest { EventType = "" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task RecordEvent_ReturnsBadRequest_WhenInvalidType()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RecordEvent(new RecordEventRequest { EventType = "invalid_type" });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task RecordEvent_ReturnsOk_WhenValidType()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.RecordEventAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync(new API.Entities.PlatformEvent { Id = 1, EventType = "visit", CreatedAt = DateTime.UtcNow });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RecordEvent(new RecordEventRequest { EventType = "visit" });

        Assert.IsType<OkObjectResult>(result);
    }
}
