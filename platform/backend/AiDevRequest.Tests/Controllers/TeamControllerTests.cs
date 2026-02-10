using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class TeamControllerTests
{
    private TeamController CreateController(Mock<ITeamService>? service = null)
    {
        service ??= new Mock<ITeamService>();
        return new TeamController(service.Object);
    }

    [Fact]
    public async Task GetTeams_ReturnsOk()
    {
        var service = new Mock<ITeamService>();
        service.Setup(s => s.GetUserTeamsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<TeamWorkspace>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTeams();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task CreateTeam_ReturnsOk()
    {
        var service = new Mock<ITeamService>();
        service.Setup(s => s.CreateTeamAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .ReturnsAsync(new TeamWorkspace { Id = 1, Name = "Team1", OwnerId = "user1" });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.CreateTeam(new CreateTeamDto { Name = "Team1" });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetTeam_ReturnsNotFound_WhenNull()
    {
        var service = new Mock<ITeamService>();
        service.Setup(s => s.GetTeamAsync(It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync((TeamWorkspace?)null);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTeam(999);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task DeleteTeam_ReturnsOk_WhenDeleted()
    {
        var service = new Mock<ITeamService>();
        service.Setup(s => s.DeleteTeamAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(true);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteTeam(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task DeleteTeam_ReturnsNotFound_WhenNotDeleted()
    {
        var service = new Mock<ITeamService>();
        service.Setup(s => s.DeleteTeamAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(false);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DeleteTeam(999);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetMembers_ReturnsOk()
    {
        var service = new Mock<ITeamService>();
        service.Setup(s => s.GetMembersAsync(It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync(new List<TeamMember>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetMembers(1);

        Assert.IsType<OkObjectResult>(result);
    }
}
