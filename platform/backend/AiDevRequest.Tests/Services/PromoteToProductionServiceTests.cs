using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class PromoteToProductionServiceTests
{
    private (PromoteToProductionService service, API.Data.AiDevRequestDbContext db, Mock<IDeploymentService> deploymentService) CreateService()
    {
        var db = TestDbContextFactory.Create();
        var deploymentService = new Mock<IDeploymentService>();
        var logger = new Mock<ILogger<PromoteToProductionService>>();
        var service = new PromoteToProductionService(db, deploymentService.Object, logger.Object);
        return (service, db, deploymentService);
    }

    [Fact]
    public async Task PromotePreview_WithDeployedStatus_Succeeds()
    {
        var (service, db, deploymentServiceMock) = CreateService();

        // Arrange: Create a DevRequest
        var devRequest = new DevRequest
        {
            UserId = "user1",
            Description = "Test Request",
            Framework = "react"
        };
        db.DevRequests.Add(devRequest);
        await db.SaveChangesAsync();

        // Arrange: Create a deployed preview
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequest.Id,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "https://preview.example.com",
            DeployedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        // Arrange: Mock deployment service
        var deployment = new Deployment
        {
            Id = Guid.NewGuid(),
            DevRequestId = devRequest.Id,
            UserId = "user1",
            SiteName = "test-site-prod",
            Status = DeploymentStatus.Pending
        };

        deploymentServiceMock
            .Setup(x => x.CreateDeploymentAsync(
                devRequest.Id,
                "user1",
                It.IsAny<string>(),
                "react",
                null))
            .ReturnsAsync(deployment);

        deployment.Status = DeploymentStatus.Running;
        deployment.PreviewUrl = "https://production.example.com";
        deploymentServiceMock
            .Setup(x => x.DeployAsync(deployment.Id))
            .ReturnsAsync(deployment);

        // Act
        var result = await service.PromotePreviewAsync(preview.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(DeploymentStatus.Running, result.Status);
        Assert.Equal("https://production.example.com", result.PreviewUrl);
        deploymentServiceMock.Verify(x => x.CreateDeploymentAsync(
            devRequest.Id,
            "user1",
            It.IsAny<string>(),
            "react",
            null), Times.Once);
        deploymentServiceMock.Verify(x => x.DeployAsync(deployment.Id), Times.Once);
    }

    [Fact]
    public async Task PromotePreview_WithExpiredPreview_Throws()
    {
        var (service, db, _) = CreateService();

        // Arrange: Create a DevRequest
        var devRequest = new DevRequest
        {
            UserId = "user1",
            Description = "Test Request",
            Framework = "react"
        };
        db.DevRequests.Add(devRequest);
        await db.SaveChangesAsync();

        // Arrange: Create an expired preview
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequest.Id,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "https://preview.example.com",
            DeployedAt = DateTime.UtcNow.AddDays(-10),
            ExpiresAt = DateTime.UtcNow.AddDays(-3) // Expired 3 days ago
        };
        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.PromotePreviewAsync(preview.Id));
        Assert.Contains("expired", exception.Message.ToLower());
    }

    [Fact]
    public async Task PromotePreview_WithNonDeployedStatus_Throws()
    {
        var (service, db, _) = CreateService();

        // Arrange: Create a DevRequest
        var devRequest = new DevRequest
        {
            UserId = "user1",
            Description = "Test Request",
            Framework = "react"
        };
        db.DevRequests.Add(devRequest);
        await db.SaveChangesAsync();

        // Arrange: Create a pending preview
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequest.Id,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.PromotePreviewAsync(preview.Id));
        Assert.Contains("Deployed", exception.Message);
    }

    [Fact]
    public async Task ValidatePreview_WithValidPreview_ReturnsTrue()
    {
        var (service, db, _) = CreateService();

        // Arrange: Create a DevRequest
        var devRequest = new DevRequest
        {
            UserId = "user1",
            Description = "Test Request",
            Framework = "react"
        };
        db.DevRequests.Add(devRequest);
        await db.SaveChangesAsync();

        // Arrange: Create a valid deployed preview
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequest.Id,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "https://preview.example.com",
            DeployedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        // Act
        var (isValid, errorMessage) = await service.ValidatePreviewAsync(preview.Id);

        // Assert
        Assert.True(isValid);
        Assert.Null(errorMessage);
    }

    [Fact]
    public async Task ValidatePreview_WithExpiredPreview_ReturnsFalse()
    {
        var (service, db, _) = CreateService();

        // Arrange: Create a DevRequest
        var devRequest = new DevRequest
        {
            UserId = "user1",
            Description = "Test Request",
            Framework = "react"
        };
        db.DevRequests.Add(devRequest);
        await db.SaveChangesAsync();

        // Arrange: Create an expired preview
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequest.Id,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "https://preview.example.com",
            DeployedAt = DateTime.UtcNow.AddDays(-10),
            ExpiresAt = DateTime.UtcNow.AddDays(-3)
        };
        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        // Act
        var (isValid, errorMessage) = await service.ValidatePreviewAsync(preview.Id);

        // Assert
        Assert.False(isValid);
        Assert.NotNull(errorMessage);
        Assert.Contains("expired", errorMessage.ToLower());
    }

    [Fact]
    public async Task CanPromoteAsync_WithValidPreview_ReturnsTrue()
    {
        var (service, db, _) = CreateService();

        // Arrange: Create a DevRequest
        var devRequest = new DevRequest
        {
            UserId = "user1",
            Description = "Test Request",
            Framework = "react"
        };
        db.DevRequests.Add(devRequest);
        await db.SaveChangesAsync();

        // Arrange: Create a valid deployed preview
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequest.Id,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "https://preview.example.com",
            DeployedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        // Act
        var canPromote = await service.CanPromoteAsync(preview.Id);

        // Assert
        Assert.True(canPromote);
    }

    [Fact]
    public async Task CanPromoteAsync_WithInvalidPreview_ReturnsFalse()
    {
        var (service, db, _) = CreateService();

        // Arrange: Create a DevRequest
        var devRequest = new DevRequest
        {
            UserId = "user1",
            Description = "Test Request",
            Framework = "react"
        };
        db.DevRequests.Add(devRequest);
        await db.SaveChangesAsync();

        // Arrange: Create a pending preview
        var preview = new PreviewDeployment
        {
            DevRequestId = devRequest.Id,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        // Act
        var canPromote = await service.CanPromoteAsync(preview.Id);

        // Assert
        Assert.False(canPromote);
    }
}
