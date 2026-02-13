using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AiDevRequest.Tests.Services;

public class WorkflowOrchestrationServiceIntegrationTests : IDisposable
{
    private readonly AiDevRequestDbContext _context;
    private readonly Mock<ILogger<WorkflowOrchestrationService>> _mockLogger;
    private readonly Mock<IPreviewDeploymentService> _mockPreviewDeploymentService;
    private readonly Mock<ISandboxExecutionService> _mockSandboxExecutionService;
    private readonly Mock<ILogStreamService> _mockLogStreamService;
    private readonly Mock<IAutonomousTestingService> _mockAutonomousTestingService;

    public WorkflowOrchestrationServiceIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<AiDevRequestDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AiDevRequestDbContext(options);
        _mockLogger = new Mock<ILogger<WorkflowOrchestrationService>>();
        _mockPreviewDeploymentService = new Mock<IPreviewDeploymentService>();
        _mockSandboxExecutionService = new Mock<ISandboxExecutionService>();
        _mockLogStreamService = new Mock<ILogStreamService>();
        _mockAutonomousTestingService = new Mock<IAutonomousTestingService>();
    }

    [Fact]
    public async Task StartWorkflowAsync_ShouldIncludePreviewDeploymentAndAutonomousTestingSteps()
    {
        // Arrange
        var devRequestId = Guid.NewGuid();

        var devRequest = new DevRequest
        {
            Id = devRequestId,
            UserId = "test-user",
            Description = "Test project",
            ProjectPath = "./test-project"
        };
        _context.DevRequests.Add(devRequest);
        await _context.SaveChangesAsync();

        var service = new WorkflowOrchestrationService(
            _context,
            _mockLogger.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object,
            _mockLogStreamService.Object,
            _mockAutonomousTestingService.Object);

        // Act
        var result = await service.StartWorkflowAsync(devRequestId, "full-pipeline");

        // Assert
        result.Should().NotBeNull();
        result.WorkflowType.Should().Be("full-pipeline");
        result.Status.Should().Be(WorkflowStatus.Running);

        var steps = System.Text.Json.JsonSerializer.Deserialize<List<WorkflowStep>>(result.StepsJson);
        steps.Should().NotBeNull();
        steps!.Should().Contain(s => s.Name == "preview_deployment");
        steps.Should().Contain(s => s.Name == "autonomous_testing_loop");
    }

    [Fact]
    public async Task ExecutePreviewDeploymentStepAsync_ShouldDeployPreviewAndStartSandbox()
    {
        // Arrange
        var devRequestId = Guid.NewGuid();

        var devRequest = new DevRequest
        {
            Id = devRequestId,
            UserId = "test-user",
            Description = "Test project",
            ProjectPath = "./test-project"
        };
        _context.DevRequests.Add(devRequest);
        await _context.SaveChangesAsync();

        var service = new WorkflowOrchestrationService(
            _context,
            _mockLogger.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object,
            _mockLogStreamService.Object,
            _mockAutonomousTestingService.Object);

        var execution = await service.StartWorkflowAsync(devRequestId, "full-pipeline");

        var preview = new PreviewDeployment
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            UserId = "test-user",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "https://preview-test.example.com"
        };

        _mockPreviewDeploymentService
            .Setup(s => s.DeployPreviewAsync(devRequestId, "test-user"))
            .ReturnsAsync(preview);

        var sandboxExecution = new SandboxExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            Status = "completed",
            ExitCode = 0
        };

        _mockSandboxExecutionService
            .Setup(s => s.ExecuteInSandbox(
                devRequestId,
                "preview",
                "npm run build && npm run preview",
                "container"))
            .ReturnsAsync(sandboxExecution);

        // Act
        var result = await service.ExecutePreviewDeploymentStepAsync(execution.Id);

        // Assert
        result.Should().NotBeNull();

        var steps = System.Text.Json.JsonSerializer.Deserialize<List<WorkflowStep>>(result.StepsJson);
        var previewStep = steps?.FirstOrDefault(s => s.Name == "preview_deployment");

        previewStep.Should().NotBeNull();
        previewStep!.Status.Should().Be("completed");
        previewStep.CompletedAt.Should().NotBeNull();

        _mockPreviewDeploymentService.Verify(
            s => s.DeployPreviewAsync(devRequestId, "test-user"),
            Times.Once);

        _mockSandboxExecutionService.Verify(
            s => s.ExecuteInSandbox(devRequestId, "preview", It.IsAny<string>(), "container"),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAutonomousTestingStepAsync_ShouldStartAutonomousTestingLoop()
    {
        // Arrange
        var devRequestId = Guid.NewGuid();
        var previewId = Guid.NewGuid();

        var devRequest = new DevRequest
        {
            Id = devRequestId,
            UserId = "test-user",
            Description = "Test project",
            ProjectPath = "./test-project"
        };
        _context.DevRequests.Add(devRequest);

        var preview = new PreviewDeployment
        {
            Id = previewId,
            DevRequestId = devRequestId,
            UserId = "test-user",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "https://preview-test.example.com"
        };
        _context.PreviewDeployments.Add(preview);

        await _context.SaveChangesAsync();

        var service = new WorkflowOrchestrationService(
            _context,
            _mockLogger.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object,
            _mockLogStreamService.Object,
            _mockAutonomousTestingService.Object);

        var execution = await service.StartWorkflowAsync(devRequestId, "full-pipeline");

        var testExecution = new AutonomousTestExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            PreviewDeploymentId = previewId,
            Status = "completed",
            TestsPassed = true
        };

        _mockAutonomousTestingService
            .Setup(s => s.StartAutonomousTestingLoopAsync(devRequestId, previewId, 3))
            .ReturnsAsync(testExecution);

        // Act
        var result = await service.ExecuteAutonomousTestingStepAsync(execution.Id);

        // Assert
        result.Should().NotBeNull();

        // Note: The autonomous testing step runs async, so we just verify it started
        var steps = System.Text.Json.JsonSerializer.Deserialize<List<WorkflowStep>>(result.StepsJson);
        var testingStep = steps?.FirstOrDefault(s => s.Name == "autonomous_testing_loop");

        testingStep.Should().NotBeNull();
        testingStep!.Status.Should().Be("running");
    }

    [Fact]
    public async Task ExecutePreviewDeploymentStepAsync_WhenFails_ShouldMarkStepAsFailed()
    {
        // Arrange
        var devRequestId = Guid.NewGuid();

        var devRequest = new DevRequest
        {
            Id = devRequestId,
            UserId = "test-user",
            Description = "Test project",
            ProjectPath = "./test-project"
        };
        _context.DevRequests.Add(devRequest);
        await _context.SaveChangesAsync();

        var service = new WorkflowOrchestrationService(
            _context,
            _mockLogger.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object,
            _mockLogStreamService.Object,
            _mockAutonomousTestingService.Object);

        var execution = await service.StartWorkflowAsync(devRequestId, "full-pipeline");

        _mockPreviewDeploymentService
            .Setup(s => s.DeployPreviewAsync(devRequestId, "test-user"))
            .ThrowsAsync(new Exception("Deployment failed"));

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(async () =>
            await service.ExecutePreviewDeploymentStepAsync(execution.Id));

        var updatedExecution = await _context.WorkflowExecutions.FindAsync(execution.Id);
        updatedExecution.Should().NotBeNull();
        updatedExecution!.Status.Should().Be(WorkflowStatus.Failed);

        var steps = System.Text.Json.JsonSerializer.Deserialize<List<WorkflowStep>>(updatedExecution.StepsJson);
        var previewStep = steps?.FirstOrDefault(s => s.Name == "preview_deployment");

        previewStep.Should().NotBeNull();
        previewStep!.Status.Should().Be("failed");
        previewStep.Error.Should().Contain("Deployment failed");
    }

    [Fact]
    public async Task FullWorkflow_PreviewToAutonomousTesting_ShouldExecuteInOrder()
    {
        // Arrange
        var devRequestId = Guid.NewGuid();
        var previewId = Guid.NewGuid();

        var devRequest = new DevRequest
        {
            Id = devRequestId,
            UserId = "test-user",
            Description = "Test project",
            ProjectPath = "./test-project"
        };
        _context.DevRequests.Add(devRequest);
        await _context.SaveChangesAsync();

        var preview = new PreviewDeployment
        {
            Id = previewId,
            DevRequestId = devRequestId,
            UserId = "test-user",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "https://preview-test.example.com"
        };

        _mockPreviewDeploymentService
            .Setup(s => s.DeployPreviewAsync(devRequestId, "test-user"))
            .ReturnsAsync(preview);

        var sandboxExecution = new SandboxExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            Status = "completed",
            ExitCode = 0
        };

        _mockSandboxExecutionService
            .Setup(s => s.ExecuteInSandbox(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(sandboxExecution);

        var testExecution = new AutonomousTestExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            PreviewDeploymentId = previewId,
            Status = "completed",
            TestsPassed = true
        };

        _mockAutonomousTestingService
            .Setup(s => s.StartAutonomousTestingLoopAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), 3))
            .ReturnsAsync(testExecution);

        var service = new WorkflowOrchestrationService(
            _context,
            _mockLogger.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object,
            _mockLogStreamService.Object,
            _mockAutonomousTestingService.Object);

        // Act
        var execution = await service.StartWorkflowAsync(devRequestId, "full-pipeline");

        // Store preview for autonomous testing step
        _context.PreviewDeployments.Add(preview);
        await _context.SaveChangesAsync();

        var afterPreview = await service.ExecutePreviewDeploymentStepAsync(execution.Id);
        var afterTesting = await service.ExecuteAutonomousTestingStepAsync(afterPreview.Id);

        // Assert
        var steps = System.Text.Json.JsonSerializer.Deserialize<List<WorkflowStep>>(afterTesting.StepsJson);

        var previewStep = steps?.FirstOrDefault(s => s.Name == "preview_deployment");
        var testingStep = steps?.FirstOrDefault(s => s.Name == "autonomous_testing_loop");

        previewStep.Should().NotBeNull();
        previewStep!.Status.Should().Be("completed");

        testingStep.Should().NotBeNull();
        testingStep!.Status.Should().Be("running");

        _mockPreviewDeploymentService.Verify(
            s => s.DeployPreviewAsync(devRequestId, "test-user"),
            Times.Once);

        _mockSandboxExecutionService.Verify(
            s => s.ExecuteInSandbox(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Once);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
