using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class SitesControllerTests
{
    private SitesController CreateController(
        Mock<IDeploymentService>? deploymentService = null,
        AiDevRequestDbContext? db = null)
    {
        deploymentService ??= new Mock<IDeploymentService>();
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<SitesController>>();
        return new SitesController(deploymentService.Object, db, logger.Object);
    }

    [Fact]
    public async Task GetSites_ReturnsOk()
    {
        var deploymentService = new Mock<IDeploymentService>();
        deploymentService.Setup(s => s.GetUserDeploymentsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<Deployment>());

        var controller = CreateController(deploymentService: deploymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetSites();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetSite_ReturnsNotFound_WhenMissing()
    {
        var deploymentService = new Mock<IDeploymentService>();
        deploymentService.Setup(s => s.GetDeploymentAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Deployment?)null);

        var controller = CreateController(deploymentService: deploymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetSite(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetSite_ReturnsNotFound_WhenNotOwned()
    {
        var deploymentId = Guid.NewGuid();
        var deploymentService = new Mock<IDeploymentService>();
        deploymentService.Setup(s => s.GetDeploymentAsync(deploymentId))
            .ReturnsAsync(new Deployment
            {
                Id = deploymentId,
                DevRequestId = Guid.NewGuid(),
                UserId = "other-user",
                SiteName = "test",
                Region = "eastus",
                Status = DeploymentStatus.Running
            });

        var controller = CreateController(deploymentService: deploymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetSite(deploymentId);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task DeleteSite_ReturnsNotFound_WhenMissing()
    {
        var deploymentService = new Mock<IDeploymentService>();
        deploymentService.Setup(s => s.GetDeploymentAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Deployment?)null);

        var controller = CreateController(deploymentService: deploymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteSite(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task DeleteSite_ReturnsNoContent_WhenOwned()
    {
        var deploymentId = Guid.NewGuid();
        var deploymentService = new Mock<IDeploymentService>();
        deploymentService.Setup(s => s.GetDeploymentAsync(deploymentId))
            .ReturnsAsync(new Deployment
            {
                Id = deploymentId,
                DevRequestId = Guid.NewGuid(),
                UserId = "test-user-id",
                SiteName = "test",
                Region = "eastus",
                Status = DeploymentStatus.Running
            });

        var controller = CreateController(deploymentService: deploymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteSite(deploymentId);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task GetLogs_ReturnsNotFound_WhenMissing()
    {
        var deploymentService = new Mock<IDeploymentService>();
        deploymentService.Setup(s => s.GetDeploymentAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Deployment?)null);

        var controller = CreateController(deploymentService: deploymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetLogs(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task RedeploySite_ReturnsNotFound_WhenMissing()
    {
        var deploymentService = new Mock<IDeploymentService>();
        deploymentService.Setup(s => s.GetDeploymentAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Deployment?)null);

        var controller = CreateController(deploymentService: deploymentService);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RedeploySite(Guid.NewGuid());

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateSite_ReturnsBadRequest_WhenDevRequestMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db: db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateSite(new CreateSiteDto
        {
            DevRequestId = Guid.NewGuid(),
            SiteName = "test-site"
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
