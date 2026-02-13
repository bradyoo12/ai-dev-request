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

public class AutonomousTestingServiceTests : IDisposable
{
    private readonly AiDevRequestDbContext _context;
    private readonly Mock<ILogger<AutonomousTestingService>> _mockLogger;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly Mock<ISelfHealingTestService> _mockSelfHealingTestService;
    private readonly Mock<IPreviewDeploymentService> _mockPreviewDeploymentService;
    private readonly Mock<ISandboxExecutionService> _mockSandboxExecutionService;

    public AutonomousTestingServiceTests()
    {
        var options = new DbContextOptionsBuilder<AiDevRequestDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AiDevRequestDbContext(options);
        _mockLogger = new Mock<ILogger<AutonomousTestingService>>();
        _mockConfig = new Mock<IConfiguration>();
        _mockSelfHealingTestService = new Mock<ISelfHealingTestService>();
        _mockPreviewDeploymentService = new Mock<IPreviewDeploymentService>();
        _mockSandboxExecutionService = new Mock<ISandboxExecutionService>();

        // Setup configuration
        _mockConfig.Setup(c => c["Projects:BasePath"]).Returns("./test-projects");
        _mockConfig.Setup(c => c["Anthropic:ApiKey"]).Returns("test-api-key");
    }

    [Fact]
    public async Task StartAutonomousTestingLoopAsync_ShouldCreateExecution()
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

        var sandboxExecution = new SandboxExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            Status = "completed",
            ExitCode = 0
        };

        _mockSandboxExecutionService
            .Setup(s => s.ExecuteInSandbox(devRequestId, "test", "npm test", "container"))
            .ReturnsAsync(sandboxExecution);

        var service = new AutonomousTestingService(
            _context,
            _mockConfig.Object,
            _mockLogger.Object,
            _mockSelfHealingTestService.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object);

        // Act
        var result = await service.StartAutonomousTestingLoopAsync(devRequestId, previewId, maxIterations: 3);

        // Assert
        result.Should().NotBeNull();
        result.DevRequestId.Should().Be(devRequestId);
        result.PreviewDeploymentId.Should().Be(previewId);
        result.MaxIterations.Should().Be(3);
        result.Status.Should().Be("completed");
        result.TestsPassed.Should().BeTrue();
    }

    [Fact]
    public async Task StartAutonomousTestingLoopAsync_WhenTestsPass_ShouldCompleteOnFirstIteration()
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

        var sandboxExecution = new SandboxExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            Status = "completed",
            ExitCode = 0
        };

        _mockSandboxExecutionService
            .Setup(s => s.ExecuteInSandbox(devRequestId, "test", "npm test", "container"))
            .ReturnsAsync(sandboxExecution);

        var service = new AutonomousTestingService(
            _context,
            _mockConfig.Object,
            _mockLogger.Object,
            _mockSelfHealingTestService.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object);

        // Act
        var result = await service.StartAutonomousTestingLoopAsync(devRequestId, previewId, maxIterations: 3);

        // Assert
        result.CurrentIteration.Should().Be(1);
        result.Status.Should().Be("completed");
        result.TestsPassed.Should().BeTrue();
    }

    [Fact]
    public async Task StartAutonomousTestingLoopAsync_ShouldEnforceMaxIterations()
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

        // Simulate failing tests on all iterations
        var sandboxExecution = new SandboxExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            Status = "completed",
            ExitCode = 1,
            ErrorLog = "Test failed: expected true but got false"
        };

        _mockSandboxExecutionService
            .Setup(s => s.ExecuteInSandbox(devRequestId, "test", "npm test", "container"))
            .ReturnsAsync(sandboxExecution);

        _mockSelfHealingTestService
            .Setup(s => s.RunSelfHealingAnalysis(devRequestId))
            .ReturnsAsync(new SelfHealingTestResult
            {
                Id = Guid.NewGuid(),
                DevRequestId = devRequestId,
                Status = "completed",
                FailedTests = 1
            });

        _mockPreviewDeploymentService
            .Setup(s => s.DeployPreviewAsync(devRequestId, "test-user"))
            .ReturnsAsync(new PreviewDeployment
            {
                Id = Guid.NewGuid(),
                DevRequestId = devRequestId,
                UserId = "test-user",
                Status = PreviewDeploymentStatus.Deployed
            });

        var service = new AutonomousTestingService(
            _context,
            _mockConfig.Object,
            _mockLogger.Object,
            _mockSelfHealingTestService.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object);

        // Act
        var result = await service.StartAutonomousTestingLoopAsync(devRequestId, previewId, maxIterations: 3);

        // Assert
        result.CurrentIteration.Should().Be(3);
        result.Status.Should().Be("failed");
        result.TestsPassed.Should().BeFalse();
        result.FinalTestResult.Should().Contain("3 iterations");

        // Verify services were called correct number of times
        _mockSandboxExecutionService.Verify(
            s => s.ExecuteInSandbox(devRequestId, "test", "npm test", "container"),
            Times.Exactly(3));

        _mockSelfHealingTestService.Verify(
            s => s.RunSelfHealingAnalysis(devRequestId),
            Times.Exactly(3));

        _mockPreviewDeploymentService.Verify(
            s => s.DeployPreviewAsync(devRequestId, "test-user"),
            Times.Exactly(3));
    }

    [Fact]
    public async Task GetLatestExecutionAsync_ShouldReturnLatestExecution()
    {
        // Arrange
        var devRequestId = Guid.NewGuid();

        var execution1 = new AutonomousTestExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            PreviewDeploymentId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        var execution2 = new AutonomousTestExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            PreviewDeploymentId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };

        _context.AutonomousTestExecutions.AddRange(execution1, execution2);
        await _context.SaveChangesAsync();

        var service = new AutonomousTestingService(
            _context,
            _mockConfig.Object,
            _mockLogger.Object,
            _mockSelfHealingTestService.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object);

        // Act
        var result = await service.GetLatestExecutionAsync(devRequestId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(execution2.Id);
    }

    [Fact]
    public async Task GetExecutionHistoryAsync_ShouldReturnAllExecutionsForDevRequest()
    {
        // Arrange
        var devRequestId = Guid.NewGuid();
        var otherDevRequestId = Guid.NewGuid();

        var execution1 = new AutonomousTestExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            PreviewDeploymentId = Guid.NewGuid()
        };

        var execution2 = new AutonomousTestExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequestId,
            PreviewDeploymentId = Guid.NewGuid()
        };

        var execution3 = new AutonomousTestExecution
        {
            Id = Guid.NewGuid(),
            DevRequestId = otherDevRequestId,
            PreviewDeploymentId = Guid.NewGuid()
        };

        _context.AutonomousTestExecutions.AddRange(execution1, execution2, execution3);
        await _context.SaveChangesAsync();

        var service = new AutonomousTestingService(
            _context,
            _mockConfig.Object,
            _mockLogger.Object,
            _mockSelfHealingTestService.Object,
            _mockPreviewDeploymentService.Object,
            _mockSandboxExecutionService.Object);

        // Act
        var result = await service.GetExecutionHistoryAsync(devRequestId);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(e => e.DevRequestId == devRequestId);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
