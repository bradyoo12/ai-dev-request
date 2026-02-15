using AiDevRequest.API.Controllers;
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
    private readonly Mock<ILiveBrowserTestRunner> _mockBrowserTestRunner;

    public AutonomousTestingServiceTests()
    {
        var options = new DbContextOptionsBuilder<AiDevRequestDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AiDevRequestDbContext(options);
        _mockLogger = new Mock<ILogger<AutonomousTestingService>>();
        _mockConfig = new Mock<IConfiguration>();
        _mockBrowserTestRunner = new Mock<ILiveBrowserTestRunner>();

        // Setup configuration
        _mockConfig.Setup(c => c["Projects:BasePath"]).Returns("./test-projects");
        _mockConfig.Setup(c => c["Anthropic:ApiKey"]).Returns("test-api-key");
    }

    private AutonomousTestingService CreateService() => new(
        _context,
        _mockConfig.Object,
        _mockLogger.Object,
        _mockBrowserTestRunner.Object);

    [Fact]
    public async Task StartBrowserTestingLoopAsync_ShouldCreateExecution()
    {
        // Arrange
        var devRequestId = Guid.NewGuid();
        var service = CreateService();

        // Act
        var result = await service.StartBrowserTestingLoopAsync(
            "test-user", devRequestId, "https://example.com", "Test Project", "chromium", 3);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be("test-user");
        result.DevRequestId.Should().Be(devRequestId);
        result.TargetUrl.Should().Be("https://example.com");
        result.ProjectName.Should().Be("Test Project");
        result.BrowserType.Should().Be("chromium");
        result.MaxIterations.Should().Be(3);
        result.Status.Should().Be("running");

        // Verify persisted to database
        var saved = await _context.AutonomousTestExecutions.FindAsync(result.Id);
        saved.Should().NotBeNull();
        saved!.UserId.Should().Be("test-user");
    }

    [Fact]
    public async Task GetUserExecutionsAsync_ShouldReturnOnlyUserExecutions()
    {
        // Arrange
        _context.AutonomousTestExecutions.AddRange(
            new AutonomousTestExecution
            {
                UserId = "user-a",
                DevRequestId = Guid.NewGuid(),
                TargetUrl = "https://a.com",
                BrowserType = "chromium"
            },
            new AutonomousTestExecution
            {
                UserId = "user-a",
                DevRequestId = Guid.NewGuid(),
                TargetUrl = "https://a2.com",
                BrowserType = "chromium"
            },
            new AutonomousTestExecution
            {
                UserId = "user-b",
                DevRequestId = Guid.NewGuid(),
                TargetUrl = "https://b.com",
                BrowserType = "chromium"
            });
        await _context.SaveChangesAsync();

        var service = CreateService();

        // Act
        var result = await service.GetUserExecutionsAsync("user-a");

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(e => e.UserId == "user-a");
    }

    [Fact]
    public async Task GetUserExecutionsAsync_ShouldOrderByCreatedAtDescending()
    {
        // Arrange
        var older = new AutonomousTestExecution
        {
            UserId = "test-user",
            DevRequestId = Guid.NewGuid(),
            TargetUrl = "https://old.com",
            BrowserType = "chromium",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        var newer = new AutonomousTestExecution
        {
            UserId = "test-user",
            DevRequestId = Guid.NewGuid(),
            TargetUrl = "https://new.com",
            BrowserType = "chromium",
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };
        _context.AutonomousTestExecutions.AddRange(older, newer);
        await _context.SaveChangesAsync();

        var service = CreateService();

        // Act
        var result = await service.GetUserExecutionsAsync("test-user");

        // Assert
        result.Should().HaveCount(2);
        result[0].Id.Should().Be(newer.Id);
        result[1].Id.Should().Be(older.Id);
    }

    [Fact]
    public async Task GetExecutionByIdAsync_ShouldReturnExecution()
    {
        // Arrange
        var execution = new AutonomousTestExecution
        {
            UserId = "test-user",
            DevRequestId = Guid.NewGuid(),
            TargetUrl = "https://test.com",
            BrowserType = "chromium",
            Status = "completed"
        };
        _context.AutonomousTestExecutions.Add(execution);
        await _context.SaveChangesAsync();

        var service = CreateService();

        // Act
        var result = await service.GetExecutionByIdAsync(execution.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(execution.Id);
        result.Status.Should().Be("completed");
    }

    [Fact]
    public async Task GetExecutionByIdAsync_ShouldReturnNullForMissingId()
    {
        // Arrange
        var service = CreateService();

        // Act
        var result = await service.GetExecutionByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CancelExecutionAsync_ShouldCancelRunningExecution()
    {
        // Arrange
        var execution = new AutonomousTestExecution
        {
            UserId = "test-user",
            DevRequestId = Guid.NewGuid(),
            TargetUrl = "https://test.com",
            BrowserType = "chromium",
            Status = "running"
        };
        _context.AutonomousTestExecutions.Add(execution);
        await _context.SaveChangesAsync();

        var service = CreateService();

        // Act
        var result = await service.CancelExecutionAsync(execution.Id);

        // Assert
        result.Status.Should().Be("cancelled");
        result.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task CancelExecutionAsync_ShouldThrowForCompletedExecution()
    {
        // Arrange
        var execution = new AutonomousTestExecution
        {
            UserId = "test-user",
            DevRequestId = Guid.NewGuid(),
            TargetUrl = "https://test.com",
            BrowserType = "chromium",
            Status = "completed"
        };
        _context.AutonomousTestExecutions.Add(execution);
        await _context.SaveChangesAsync();

        var service = CreateService();

        // Act & Assert
        var act = () => service.CancelExecutionAsync(execution.Id);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Cannot cancel*");
    }

    [Fact]
    public async Task CancelExecutionAsync_ShouldThrowForMissingExecution()
    {
        // Arrange
        var service = CreateService();

        // Act & Assert
        var act = () => service.CancelExecutionAsync(Guid.NewGuid());
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task GetStatsAsync_ShouldReturnCorrectStats()
    {
        // Arrange
        _context.AutonomousTestExecutions.AddRange(
            new AutonomousTestExecution
            {
                UserId = "test-user",
                DevRequestId = Guid.NewGuid(),
                TargetUrl = "https://test.com",
                BrowserType = "chromium",
                Status = "completed",
                CurrentIteration = 1,
                IssuesDetected = 3,
                IssuesFixed = 3,
                VisionAnalysisCount = 1,
                TotalDurationMs = 5000
            },
            new AutonomousTestExecution
            {
                UserId = "test-user",
                DevRequestId = Guid.NewGuid(),
                TargetUrl = "https://test2.com",
                BrowserType = "firefox",
                Status = "failed",
                CurrentIteration = 3,
                IssuesDetected = 5,
                IssuesFixed = 2,
                VisionAnalysisCount = 3,
                TotalDurationMs = 15000
            },
            new AutonomousTestExecution
            {
                UserId = "other-user",
                DevRequestId = Guid.NewGuid(),
                TargetUrl = "https://other.com",
                BrowserType = "chromium",
                Status = "completed"
            });
        await _context.SaveChangesAsync();

        var service = CreateService();

        // Act
        var stats = await service.GetStatsAsync("test-user");

        // Assert
        stats.TotalExecutions.Should().Be(2);
        stats.CompletedExecutions.Should().Be(1);
        stats.FailedExecutions.Should().Be(1);
        stats.TotalIssuesDetected.Should().Be(8);
        stats.TotalIssuesFixed.Should().Be(5);
        stats.TotalVisionAnalyses.Should().Be(4);
        stats.ByBrowser.Should().ContainKey("chromium").WhoseValue.Should().Be(1);
        stats.ByBrowser.Should().ContainKey("firefox").WhoseValue.Should().Be(1);
    }

    [Fact]
    public async Task GetStatsAsync_ShouldReturnEmptyStatsForNewUser()
    {
        // Arrange
        var service = CreateService();

        // Act
        var stats = await service.GetStatsAsync("new-user");

        // Assert
        stats.TotalExecutions.Should().Be(0);
        stats.CompletedExecutions.Should().Be(0);
        stats.PassRate.Should().Be(0);
        stats.AvgIterations.Should().Be(0);
    }

    [Fact]
    public async Task GetScreenshotsAsync_ShouldReturnEmptyListWhenNoScreenshots()
    {
        // Arrange
        var execution = new AutonomousTestExecution
        {
            UserId = "test-user",
            DevRequestId = Guid.NewGuid(),
            TargetUrl = "https://test.com",
            BrowserType = "chromium",
            ScreenshotsJson = null
        };
        _context.AutonomousTestExecutions.Add(execution);
        await _context.SaveChangesAsync();

        var service = CreateService();

        // Act
        var result = await service.GetScreenshotsAsync(execution.Id);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetScreenshotsAsync_ShouldReturnEmptyListForMissingExecution()
    {
        // Arrange
        var service = CreateService();

        // Act
        var result = await service.GetScreenshotsAsync(Guid.NewGuid());

        // Assert
        result.Should().BeEmpty();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
