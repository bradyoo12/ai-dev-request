using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class PreviewDeploymentServiceTests
{
    private PreviewDeploymentService CreateService(
        API.Data.AiDevRequestDbContext? db = null,
        IConfiguration? config = null)
    {
        db ??= TestDbContextFactory.Create();
        config ??= new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Azure:SubscriptionId"] = "",
                ["Azure:ResourceGroupName"] = "rg-test",
                ["Azure:Region"] = "eastus",
                ["Azure:ContainerRegistry:Server"] = "testacr.azurecr.io",
                ["Azure:ContainerRegistry:Name"] = "testacr",
                ["Azure:ContainerInstances:DefaultPort"] = "3000",
                ["Azure:ContainerInstances:DefaultCpu"] = "1.0",
                ["Azure:ContainerInstances:DefaultMemoryGb"] = "1.5",
                ["Azure:ContainerInstances:RetentionHours"] = "24"
            })
            .Build();
        var logger = new Mock<ILogger<PreviewDeploymentService>>();
        return new PreviewDeploymentService(db, logger.Object, config);
    }

    // ===== GetPreviewStatusAsync =====

    [Fact]
    public async Task GetPreviewStatusAsync_ReturnsNull_WhenNoPreviewExists()
    {
        var service = CreateService();

        var result = await service.GetPreviewStatusAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetPreviewStatusAsync_ReturnsLatestPreview()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        var preview1 = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        var preview2 = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };

        db.PreviewDeployments.AddRange(preview1, preview2);
        await db.SaveChangesAsync();

        var result = await service.GetPreviewStatusAsync(devRequestId);

        result.Should().NotBeNull();
        result!.Id.Should().Be(preview2.Id);
    }

    // ===== GetPreviewUrlAsync =====

    [Fact]
    public async Task GetPreviewUrlAsync_ReturnsNull_WhenNoDeployedPreview()
    {
        var service = CreateService();

        var result = await service.GetPreviewUrlAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetPreviewUrlAsync_ReturnsUrl_WhenDeployedPreviewExists()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        var preview = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            PreviewUrl = "http://test.example.com"
        };

        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        var result = await service.GetPreviewUrlAsync(devRequestId);

        result.Should().Be("http://test.example.com");
    }

    [Fact]
    public async Task GetPreviewUrlAsync_IgnoresNonDeployedPreviews()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        var preview = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Failed,
            PreviewUrl = "http://test.example.com"
        };

        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        var result = await service.GetPreviewUrlAsync(devRequestId);

        result.Should().BeNull();
    }

    // ===== ListPreviewsAsync =====

    [Fact]
    public async Task ListPreviewsAsync_ReturnsEmptyList_WhenNoPreviews()
    {
        var service = CreateService();

        var result = await service.ListPreviewsAsync(Guid.NewGuid());

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ListPreviewsAsync_ReturnsAllPreviews_ForDevRequest()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        var preview1 = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed
        };
        var preview2 = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Failed
        };
        var otherPreview = new PreviewDeployment
        {
            DevRequestId = Guid.NewGuid(),
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed
        };

        db.PreviewDeployments.AddRange(preview1, preview2, otherPreview);
        await db.SaveChangesAsync();

        var result = await service.ListPreviewsAsync(devRequestId);

        result.Should().HaveCount(2);
        result.Should().Contain(p => p.Id == preview1.Id);
        result.Should().Contain(p => p.Id == preview2.Id);
    }

    [Fact]
    public async Task ListPreviewsAsync_OrdersByCreatedAtDescending()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        var preview1 = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        var preview2 = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };

        db.PreviewDeployments.AddRange(preview1, preview2);
        await db.SaveChangesAsync();

        var result = await service.ListPreviewsAsync(devRequestId);

        result.Should().HaveCount(2);
        result[0].Id.Should().Be(preview2.Id);
        result[1].Id.Should().Be(preview1.Id);
    }

    // ===== DeployPreviewAsync =====

    [Fact]
    public async Task DeployPreviewAsync_CreatesPreviewRecord()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        // Note: This will fail when Azure SDK is called, but that's expected in unit tests
        // The test verifies that the initial record is created
        try
        {
            await service.DeployPreviewAsync(devRequestId, "user1");
        }
        catch
        {
            // Expected to fail due to missing Azure configuration
        }

        var preview = await service.GetPreviewStatusAsync(devRequestId);
        preview.Should().NotBeNull();
        preview!.DevRequestId.Should().Be(devRequestId);
        preview.UserId.Should().Be("user1");
    }

    [Fact]
    public async Task DeployPreviewAsync_SetsInitialStatus()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        try
        {
            await service.DeployPreviewAsync(devRequestId, "user1");
        }
        catch
        {
            // Expected to fail due to missing Azure configuration
        }

        var preview = await service.GetPreviewStatusAsync(devRequestId);
        preview.Should().NotBeNull();
        // Status should be Failed after Azure SDK error, or Deploying if it hasn't started yet
        preview!.Status.Should().BeOneOf(PreviewDeploymentStatus.Deploying, PreviewDeploymentStatus.Failed);
    }

    [Fact]
    public async Task DeployPreviewAsync_SetsRegionAndResourceGroup()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        try
        {
            await service.DeployPreviewAsync(devRequestId, "user1");
        }
        catch
        {
            // Expected to fail due to missing Azure configuration
        }

        var preview = await service.GetPreviewStatusAsync(devRequestId);
        preview.Should().NotBeNull();
        preview!.Region.Should().Be("eastus");
        preview.ResourceGroupName.Should().Be("rg-test");
        preview.Port.Should().Be(3000);
    }

    // ===== ExpirePreviewAsync =====

    [Fact]
    public async Task ExpirePreviewAsync_ThrowsWhenNoActivePreview()
    {
        var service = CreateService();

        var act = () => service.ExpirePreviewAsync(Guid.NewGuid());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*No active preview*");
    }

    [Fact]
    public async Task ExpirePreviewAsync_UpdatesStatus()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        var preview = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            ContainerGroupName = null // No actual container to delete
        };

        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        var result = await service.ExpirePreviewAsync(devRequestId);

        result.Status.Should().Be(PreviewDeploymentStatus.Expired);
        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ===== GetContainerLogsAsync =====

    [Fact]
    public async Task GetContainerLogsAsync_ThrowsWhenNoActivePreview()
    {
        var service = CreateService();

        var act = () => service.GetContainerLogsAsync(Guid.NewGuid());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*No active preview*");
    }

    [Fact]
    public async Task GetContainerLogsAsync_ThrowsWhenContainerInfoMissing()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        var preview = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            ContainerGroupName = null,
            ContainerName = null
        };

        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        var act = () => service.GetContainerLogsAsync(devRequestId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Container information not available*");
    }

    [Fact]
    public async Task GetContainerLogsAsync_ThrowsWhenAzureNotConfigured()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var devRequestId = Guid.NewGuid();

        var preview = new PreviewDeployment
        {
            DevRequestId = devRequestId,
            UserId = "user1",
            Status = PreviewDeploymentStatus.Deployed,
            ContainerGroupName = "test-group",
            ContainerName = "test-container"
        };

        db.PreviewDeployments.Add(preview);
        await db.SaveChangesAsync();

        var act = () => service.GetContainerLogsAsync(devRequestId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Azure subscription ID*");
    }
}
