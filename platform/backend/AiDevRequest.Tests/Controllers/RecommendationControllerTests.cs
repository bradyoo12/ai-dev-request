using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class RecommendationControllerTests
{
    private RecommendationController CreateController(Mock<IRecommendationService>? service = null)
    {
        service ??= new Mock<IRecommendationService>();
        return new RecommendationController(service.Object);
    }

    [Fact]
    public async Task GetRecommendations_ReturnsOk()
    {
        var service = new Mock<IRecommendationService>();
        service.Setup(s => s.GetRecommendationsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<AppRecommendation>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRecommendations();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task RefreshRecommendations_ReturnsOk()
    {
        var service = new Mock<IRecommendationService>();
        service.Setup(s => s.GenerateRecommendationsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<AppRecommendation>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RefreshRecommendations();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task DismissRecommendation_ReturnsOk()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.DismissRecommendation(1);

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task GetInterests_ReturnsOk()
    {
        var service = new Mock<IRecommendationService>();
        service.Setup(s => s.GetInterestsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<UserInterest>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetInterests();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task AddInterest_ReturnsOk()
    {
        var service = new Mock<IRecommendationService>();
        service.Setup(s => s.AddInterestAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double>(), It.IsAny<string>()))
            .ReturnsAsync(new UserInterest { Id = 1, UserId = "user1", Category = "web", Source = "manual" });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AddInterest(new AddInterestDto { Category = "web" });

        Assert.IsType<OkObjectResult>(result.Result);
    }
}
