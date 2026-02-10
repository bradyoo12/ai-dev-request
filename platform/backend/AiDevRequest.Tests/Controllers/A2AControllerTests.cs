using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class A2AControllerTests
{
    private A2AController CreateController(Mock<IA2AService>? service = null)
    {
        service ??= new Mock<IA2AService>();
        var logger = new Mock<ILogger<A2AController>>();
        return new A2AController(service.Object, logger.Object);
    }

    [Fact]
    public async Task RegisterAgent_ReturnsOk()
    {
        var service = new Mock<IA2AService>();
        service.Setup(s => s.RegisterAgentAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync(new AgentCard { Id = 1, AgentKey = "test", Name = "Test", OwnerId = "user1" });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RegisterAgent(new RegisterAgentDto { AgentKey = "test", Name = "Test" });

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task RegisterAgent_ReturnsBadRequest_OnDuplicate()
    {
        var service = new Mock<IA2AService>();
        service.Setup(s => s.RegisterAgentAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ThrowsAsync(new InvalidOperationException("Already exists"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RegisterAgent(new RegisterAgentDto { AgentKey = "test", Name = "Test" });

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetAgents_ReturnsOk()
    {
        var service = new Mock<IA2AService>();
        service.Setup(s => s.GetAgentsAsync(It.IsAny<string?>()))
            .ReturnsAsync(new List<AgentCard>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetAgents();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetAgent_ReturnsNotFound_WhenNull()
    {
        var service = new Mock<IA2AService>();
        service.Setup(s => s.GetAgentByKeyAsync(It.IsAny<string>()))
            .ReturnsAsync((AgentCard?)null);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetAgent("nonexistent");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetTask_ReturnsNotFound_WhenNull()
    {
        var service = new Mock<IA2AService>();
        service.Setup(s => s.GetTaskAsync(It.IsAny<string>()))
            .ReturnsAsync((A2ATask?)null);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTask("nonexistent");

        Assert.IsType<NotFoundResult>(result.Result);
    }
}
