using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class AdminChurnControllerTests
{
    private AdminChurnController CreateController(AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminChurnController>>();
        return new AdminChurnController(db, logger.Object);
    }

    [Fact]
    public async Task GetOverview_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetOverview();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetTrends_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTrends(6);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetByPlan_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetByPlan();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetEvents_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetEvents();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task ExportCsv_ReturnsFile()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ExportCsv();

        Assert.IsType<FileContentResult>(result);
    }
}
