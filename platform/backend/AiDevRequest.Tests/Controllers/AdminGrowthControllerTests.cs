using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
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

    // ===== GetOverview =====

    [Fact]
    public async Task GetOverview_ReturnsOk_WithData()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetOverviewAsync())
            .ReturnsAsync(new GrowthOverviewDto
            {
                TotalVisitors = 5000,
                TotalRegistered = 1200,
                TotalTrialUsers = 300,
                TotalPaidUsers = 75,
                MonthlyGrowthRate = 12.5m,
                ConversionRate = 25.0m,
                ChurnRate = 3.0m
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetOverview();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var overview = okResult.Value.Should().BeOfType<GrowthOverviewDto>().Subject;
        overview.TotalVisitors.Should().Be(5000);
        overview.TotalRegistered.Should().Be(1200);
        overview.ConversionRate.Should().Be(25.0m);
    }

    [Fact]
    public async Task GetOverview_ReturnsOkWithDefault_OnException()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetOverviewAsync()).ThrowsAsync(new Exception("db error"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetOverview();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var overview = okResult.Value.Should().BeOfType<GrowthOverviewDto>().Subject;
        overview.TotalVisitors.Should().Be(0);
        overview.TotalRegistered.Should().Be(0);
    }

    // ===== GetTrends =====

    [Fact]
    public async Task GetTrends_ReturnsOk_WithTrendData()
    {
        var service = new Mock<IGrowthService>();
        var trendList = new List<GrowthTrendDto>
        {
            new() { Month = "2025-01", Visitors = 100, Registered = 20, TrialUsers = 5, PaidUsers = 1 },
            new() { Month = "2025-02", Visitors = 150, Registered = 30, TrialUsers = 8, PaidUsers = 2 },
        };
        service.Setup(s => s.GetTrendsAsync(12))
            .ReturnsAsync(trendList);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTrends(12);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var trends = okResult.Value.Should().BeAssignableTo<List<GrowthTrendDto>>().Subject;
        trends.Should().HaveCount(2);
        trends[0].Month.Should().Be("2025-01");
    }

    [Fact]
    public async Task GetTrends_ReturnsEmptyList_OnException()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetTrendsAsync(It.IsAny<int>())).ThrowsAsync(new Exception("timeout"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTrends(6);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var trends = okResult.Value.Should().BeAssignableTo<List<GrowthTrendDto>>().Subject;
        trends.Should().BeEmpty();
    }

    // ===== GetFunnel =====

    [Fact]
    public async Task GetFunnel_ReturnsOk_WithFunnelSteps()
    {
        var service = new Mock<IGrowthService>();
        var funnelSteps = new List<FunnelStepDto>
        {
            new() { Stage = "Visitors", Count = 1000, Percentage = 100 },
            new() { Stage = "Registered", Count = 250, Percentage = 25 },
            new() { Stage = "Trial Users", Count = 60, Percentage = 6 },
            new() { Stage = "Paid Users", Count = 15, Percentage = 1.5m },
        };
        service.Setup(s => s.GetFunnelAsync()).ReturnsAsync(funnelSteps);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetFunnel();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var funnel = okResult.Value.Should().BeAssignableTo<List<FunnelStepDto>>().Subject;
        funnel.Should().HaveCount(4);
        funnel[0].Stage.Should().Be("Visitors");
        funnel[0].Percentage.Should().Be(100);
    }

    [Fact]
    public async Task GetFunnel_ReturnsEmptyList_OnException()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetFunnelAsync()).ThrowsAsync(new Exception("error"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetFunnel();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var funnel = okResult.Value.Should().BeAssignableTo<List<FunnelStepDto>>().Subject;
        funnel.Should().BeEmpty();
    }

    // ===== RecordEvent =====

    [Fact]
    public async Task RecordEvent_ReturnsBadRequest_WhenEmptyType()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RecordEvent(new RecordEventRequest { EventType = "" });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task RecordEvent_ReturnsBadRequest_WhenWhitespaceType()
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RecordEvent(new RecordEventRequest { EventType = "   " });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData("invalid_type")]
    [InlineData("signup")]
    [InlineData("purchase")]
    public async Task RecordEvent_ReturnsBadRequest_WhenInvalidType(string eventType)
    {
        var controller = CreateController();
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RecordEvent(new RecordEventRequest { EventType = eventType });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData("visit")]
    [InlineData("register")]
    [InlineData("trial_start")]
    [InlineData("paid_conversion")]
    [InlineData("churn")]
    public async Task RecordEvent_ReturnsOk_WhenValidType(string eventType)
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.RecordEventAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync(new PlatformEvent { Id = 1, EventType = eventType, CreatedAt = DateTime.UtcNow });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RecordEvent(new RecordEventRequest
        {
            EventType = eventType,
            UserId = "user-1",
            SessionId = "session-1",
            Metadata = "{\"source\":\"test\"}"
        });

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task RecordEvent_Returns500_WhenServiceFails()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.RecordEventAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ThrowsAsync(new Exception("DB error"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.RecordEvent(new RecordEventRequest { EventType = "visit" });

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task RecordEvent_PassesMetadata_ToService()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.RecordEventAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync(new PlatformEvent { Id = 1, EventType = "visit", CreatedAt = DateTime.UtcNow });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        await controller.RecordEvent(new RecordEventRequest
        {
            EventType = "visit",
            UserId = "user-1",
            SessionId = "session-1",
            Metadata = "{\"browser\":\"Chrome\"}"
        });

        service.Verify(s => s.RecordEventAsync("visit", "user-1", "session-1", "{\"browser\":\"Chrome\"}"), Times.Once);
    }

    // ===== ExportCsv =====

    [Fact]
    public async Task ExportCsv_ReturnsFileResult()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetTrendsAsync(24)).ReturnsAsync(new List<GrowthTrendDto>());
        service.Setup(s => s.GetFunnelAsync()).ReturnsAsync(new List<FunnelStepDto>());
        service.Setup(s => s.GetOverviewAsync()).ReturnsAsync(new GrowthOverviewDto());

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ExportCsv();

        var fileResult = result.Should().BeOfType<FileContentResult>().Subject;
        fileResult.ContentType.Should().Be("text/csv");
        fileResult.FileDownloadName.Should().StartWith("growth-metrics-");
    }

    [Fact]
    public async Task ExportCsv_Returns500_OnException()
    {
        var service = new Mock<IGrowthService>();
        service.Setup(s => s.GetTrendsAsync(It.IsAny<int>())).ThrowsAsync(new Exception("export failed"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ExportCsv();

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(500);
    }
}
