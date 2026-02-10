using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class MicroserviceControllerTests
{
    private MicroserviceController CreateController(Mock<IMicroserviceService>? service = null)
    {
        service ??= new Mock<IMicroserviceService>();
        return new MicroserviceController(service.Object);
    }

    [Fact]
    public async Task GetBlueprints_ReturnsOk()
    {
        var service = new Mock<IMicroserviceService>();
        service.Setup(s => s.GetBlueprintsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<ServiceBlueprint>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetBlueprints();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetBlueprint_ReturnsNotFound_WhenNull()
    {
        var service = new Mock<IMicroserviceService>();
        service.Setup(s => s.GetBlueprintAsync(It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync((ServiceBlueprint?)null);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetBlueprint(999);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task DeleteBlueprint_ReturnsOk_WhenDeleted()
    {
        var service = new Mock<IMicroserviceService>();
        service.Setup(s => s.DeleteBlueprintAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(true);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteBlueprint(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task DeleteBlueprint_ReturnsNotFound_WhenNotDeleted()
    {
        var service = new Mock<IMicroserviceService>();
        service.Setup(s => s.DeleteBlueprintAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(false);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteBlueprint(999);

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
