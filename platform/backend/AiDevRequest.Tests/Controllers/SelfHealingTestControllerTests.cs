using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class SelfHealingTestControllerTests
{
    private SelfHealingTestController CreateController(Mock<ISelfHealingTestService>? service = null)
    {
        service ??= new Mock<ISelfHealingTestService>();
        var logger = new Mock<ILogger<SelfHealingTestController>>();
        return new SelfHealingTestController(service.Object, logger.Object);
    }

    [Fact]
    public async Task TriggerSelfHealing_ReturnsOk()
    {
        var devRequestId = Guid.NewGuid();
        var service = new Mock<ISelfHealingTestService>();
        service.Setup(s => s.RunSelfHealingAnalysis(devRequestId))
            .ReturnsAsync(new SelfHealingTestResult
            {
                Id = Guid.NewGuid(),
                DevRequestId = devRequestId,
                Status = "completed",
                TotalTests = 10,
                FailedTests = 2,
                HealedTests = 1,
                SkippedTests = 0,
                ConfidenceScore = 85,
                AnalysisVersion = 1,
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.TriggerSelfHealing(devRequestId);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task TriggerSelfHealing_ReturnsBadRequest_OnInvalidOperation()
    {
        var devRequestId = Guid.NewGuid();
        var service = new Mock<ISelfHealingTestService>();
        service.Setup(s => s.RunSelfHealingAnalysis(devRequestId))
            .ThrowsAsync(new InvalidOperationException("Analysis failed"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.TriggerSelfHealing(devRequestId);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetResults_ReturnsOk_WhenResultExists()
    {
        var devRequestId = Guid.NewGuid();
        var service = new Mock<ISelfHealingTestService>();
        service.Setup(s => s.GetLatestResult(devRequestId))
            .ReturnsAsync(new SelfHealingTestResult
            {
                Id = Guid.NewGuid(),
                DevRequestId = devRequestId,
                Status = "completed",
                AnalysisVersion = 1,
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetResults(devRequestId);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetResults_ReturnsNotFound_WhenNoResult()
    {
        var devRequestId = Guid.NewGuid();
        var service = new Mock<ISelfHealingTestService>();
        service.Setup(s => s.GetLatestResult(devRequestId))
            .ReturnsAsync((SelfHealingTestResult?)null);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetResults(devRequestId);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetHistory_ReturnsOk()
    {
        var devRequestId = Guid.NewGuid();
        var service = new Mock<ISelfHealingTestService>();
        service.Setup(s => s.GetHistory(devRequestId))
            .ReturnsAsync(new List<SelfHealingTestResult>
            {
                new() { DevRequestId = devRequestId, Status = "completed", AnalysisVersion = 2 },
                new() { DevRequestId = devRequestId, Status = "completed", AnalysisVersion = 1 },
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetHistory(devRequestId);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task RepairLocators_ReturnsOk()
    {
        var devRequestId = Guid.NewGuid();
        var service = new Mock<ISelfHealingTestService>();
        service.Setup(s => s.RepairLocatorsAsync(devRequestId, It.IsAny<List<BrokenLocatorInput>>()))
            .ReturnsAsync(new LocatorRepairResult
            {
                TotalRepaired = 2,
                TotalFailed = 0,
                OverallConfidence = 90,
                Summary = "All locators repaired",
                RepairedLocators = new List<RepairedLocator>
                {
                    new() { TestFile = "test.spec.ts", TestName = "test1", OriginalLocator = ".old", RepairedLocatorValue = "[data-testid='new']", Strategy = "data-testid", Confidence = 95, Reason = "Used data-testid" },
                    new() { TestFile = "test.spec.ts", TestName = "test2", OriginalLocator = ".old2", RepairedLocatorValue = "[data-testid='new2']", Strategy = "data-testid", Confidence = 85, Reason = "Used data-testid" },
                }
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var request = new RepairLocatorsRequest
        {
            BrokenLocators = new List<BrokenLocatorInput>
            {
                new() { TestFile = "test.spec.ts", TestName = "test1", OriginalLocator = ".old" },
                new() { TestFile = "test.spec.ts", TestName = "test2", OriginalLocator = ".old2" },
            }
        };

        var result = await controller.RepairLocators(devRequestId, request);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task RepairLocators_ReturnsBadRequest_OnInvalidOperation()
    {
        var devRequestId = Guid.NewGuid();
        var service = new Mock<ISelfHealingTestService>();
        service.Setup(s => s.RepairLocatorsAsync(devRequestId, It.IsAny<List<BrokenLocatorInput>>()))
            .ThrowsAsync(new InvalidOperationException("Repair failed"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var request = new RepairLocatorsRequest
        {
            BrokenLocators = new List<BrokenLocatorInput>
            {
                new() { TestFile = "test.spec.ts", TestName = "test1", OriginalLocator = ".old" },
            }
        };

        var result = await controller.RepairLocators(devRequestId, request);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetHealingTimeline_ReturnsOk()
    {
        var devRequestId = Guid.NewGuid();
        var service = new Mock<ISelfHealingTestService>();
        service.Setup(s => s.GetHealingTimelineAsync(devRequestId))
            .ReturnsAsync(new List<HealingTimelineEntry>
            {
                new() { Id = Guid.NewGuid(), Action = "healed", TestName = "test1", Confidence = 90, AnalysisVersion = 1 },
                new() { Id = Guid.NewGuid(), Action = "failed", TestName = "test2", Confidence = 0, AnalysisVersion = 1 },
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetHealingTimeline(devRequestId);

        Assert.IsType<OkObjectResult>(result);
    }
}
