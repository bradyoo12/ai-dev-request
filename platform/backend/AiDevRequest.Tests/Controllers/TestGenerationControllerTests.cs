using AiDevRequest.API.Controllers;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class TestGenerationControllerTests
{
    private TestGenerationController CreateController(Mock<ITestGenerationService>? service = null)
    {
        service ??= new Mock<ITestGenerationService>();
        var logger = new Mock<ILogger<TestGenerationController>>();
        return new TestGenerationController(service.Object, logger.Object);
    }

    [Fact]
    public async Task TriggerGeneration_ReturnsOk()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.TriggerGenerationAsync(1))
            .ReturnsAsync(new TestGenerationRecord
            {
                Id = Guid.NewGuid(),
                ProjectId = 1,
                Status = "completed",
                TestFilesGenerated = 3,
                TotalTestCount = 15,
                CoverageEstimate = 72,
                TestFramework = "Vitest + React Testing Library + Playwright",
                Summary = "Generated 15 tests across 3 files",
                GenerationVersion = 1,
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.TriggerGeneration(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task TriggerGeneration_ReturnsBadRequest_OnInvalidOperation()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.TriggerGenerationAsync(1))
            .ThrowsAsync(new InvalidOperationException("Generation failed"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.TriggerGeneration(1);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetResults_ReturnsOk_WhenResultExists()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.GetResultAsync(1))
            .ReturnsAsync(new TestGenerationRecord
            {
                Id = Guid.NewGuid(),
                ProjectId = 1,
                Status = "completed",
                GenerationVersion = 1,
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetResults(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetResults_ReturnsNotFound_WhenNoResult()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.GetResultAsync(1))
            .ReturnsAsync((TestGenerationRecord?)null);

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetResults(1);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetHistory_ReturnsOk()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.GetHistoryAsync(1))
            .ReturnsAsync(new List<TestGenerationRecord>
            {
                new() { ProjectId = 1, Status = "completed", GenerationVersion = 2 },
                new() { ProjectId = 1, Status = "completed", GenerationVersion = 1 },
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetHistory(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GenerateFromNaturalLanguage_ReturnsOk()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.GenerateFromNaturalLanguageAsync(1, "user logs in and sees dashboard", "e2e"))
            .ReturnsAsync(new TestGenerationRecord
            {
                Id = Guid.NewGuid(),
                ProjectId = 1,
                Status = "completed",
                TestFilesGenerated = 1,
                TotalTestCount = 3,
                CoverageEstimate = 40,
                TestFramework = "Playwright",
                Summary = "Generated login and dashboard e2e tests",
                GenerationVersion = 1,
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var request = new NaturalLanguageTestRequest
        {
            Scenario = "user logs in and sees dashboard",
            TestType = "e2e",
        };

        var result = await controller.GenerateFromNaturalLanguage(1, request);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GenerateFromNaturalLanguage_ReturnsBadRequest_OnInvalidOperation()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.GenerateFromNaturalLanguageAsync(1, It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("NL generation failed"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var request = new NaturalLanguageTestRequest
        {
            Scenario = "some scenario",
            TestType = "e2e",
        };

        var result = await controller.GenerateFromNaturalLanguage(1, request);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetMcpStatus_ReturnsOk()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.GetMcpConnectionStatusAsync(1))
            .ReturnsAsync(new McpConnectionStatus
            {
                IsConfigured = true,
                Status = "connected",
                ServerUrl = "http://localhost:3000",
                Transport = "sse",
                AutoHealEnabled = true,
                HealingConfidenceThreshold = 70,
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetMcpStatus(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task ConfigureMcp_ReturnsOk()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.ConfigureMcpAsync(1, "http://localhost:3000", "sse", null, null))
            .ReturnsAsync(new PlaywrightMcpConfig
            {
                Id = Guid.NewGuid(),
                ProjectId = 1,
                ServerUrl = "http://localhost:3000",
                Transport = "sse",
                Status = "connected",
                AutoHealEnabled = true,
                HealingConfidenceThreshold = 70,
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var request = new McpConfigRequest
        {
            ServerUrl = "http://localhost:3000",
            Transport = "sse",
        };

        var result = await controller.ConfigureMcp(1, request);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task ConfigureMcp_ReturnsBadRequest_OnInvalidOperation()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.ConfigureMcpAsync(1, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ThrowsAsync(new InvalidOperationException("Config failed"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var request = new McpConfigRequest
        {
            ServerUrl = "http://localhost:3000",
        };

        var result = await controller.ConfigureMcp(1, request);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task AnalyzeCoverage_ReturnsOk()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.AnalyzeCoverageAsync(1))
            .ReturnsAsync(new CoverageAnalysisResult
            {
                OverallCoverage = 65,
                LineCoverage = 70,
                BranchCoverage = 55,
                FunctionCoverage = 60,
                Summary = "Moderate test coverage",
            });

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AnalyzeCoverage(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task AnalyzeCoverage_ReturnsBadRequest_OnInvalidOperation()
    {
        var service = new Mock<ITestGenerationService>();
        service.Setup(s => s.AnalyzeCoverageAsync(1))
            .ThrowsAsync(new InvalidOperationException("Coverage analysis failed"));

        var controller = CreateController(service);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.AnalyzeCoverage(1);

        Assert.IsType<BadRequestObjectResult>(result);
    }
}
