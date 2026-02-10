using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class TechTrendControllerTests
{
    private TechTrendController CreateController(Mock<ITechTrendService>? service = null)
    {
        service ??= new Mock<ITechTrendService>();
        return new TechTrendController(service.Object);
    }

    [Fact]
    public async Task GetTrendReports_ReturnsOk()
    {
        var service = new Mock<ITechTrendService>();
        service.Setup(s => s.GetTrendReportsAsync(It.IsAny<string?>(), It.IsAny<int>()))
            .ReturnsAsync(new List<TrendReport>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTrendReports(null, 10);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GenerateTrendReport_ReturnsOk()
    {
        var service = new Mock<ITechTrendService>();
        service.Setup(s => s.GenerateTrendReportAsync(It.IsAny<string>()))
            .ReturnsAsync(new TrendReport
            {
                Id = 1,
                Category = "frontend",
                SummaryJson = "{}",
                AnalyzedAt = DateTime.UtcNow,
                TrendCount = 5
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GenerateTrendReport(new GenerateTrendDto { Category = "frontend" });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetUserReviews_ReturnsOk()
    {
        var service = new Mock<ITechTrendService>();
        service.Setup(s => s.GetUserReviewsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<ProjectReview>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetUserReviews();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task ReviewProject_ReturnsBadRequest_OnError()
    {
        var service = new Mock<ITechTrendService>();
        service.Setup(s => s.ReviewProjectAsync(It.IsAny<int>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Not found"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ReviewProject(999);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task UpdateRecommendationStatus_ReturnsNotFound_WhenNull()
    {
        var service = new Mock<ITechTrendService>();
        service.Setup(s => s.UpdateRecommendationStatusAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((UpdateRecommendation?)null);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.UpdateRecommendationStatus(999, new UpdateRecStatusDto { Status = "accepted" });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetRecommendations_ReturnsOk()
    {
        var service = new Mock<ITechTrendService>();
        service.Setup(s => s.GetRecommendationsAsync(It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync(new List<UpdateRecommendation>());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetRecommendations(1);

        Assert.IsType<OkObjectResult>(result);
    }
}
