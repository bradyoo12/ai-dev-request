using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class ProjectVersionServiceTests
{
    private ProjectVersionService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var logger = new Mock<ILogger<ProjectVersionService>>();
        return new ProjectVersionService(db, config, logger.Object);
    }

    [Fact]
    public async Task GetVersionsAsync_ReturnsVersions()
    {
        var service = CreateService();

        var versions = await service.GetVersionsAsync(Guid.NewGuid());

        Assert.NotNull(versions);
        Assert.Empty(versions);
    }

    [Fact]
    public async Task CreateSnapshotAsync_CreatesVersion()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);
        File.WriteAllText(Path.Combine(tempDir, "index.html"), "<html></html>");

        try
        {
            var db = TestDbContextFactory.Create();
            var service = CreateService(db);
            var requestId = Guid.NewGuid();

            var version = await service.CreateSnapshotAsync(requestId, tempDir, "Initial", "build");

            Assert.NotNull(version);
            Assert.Equal(requestId, version.DevRequestId);
            Assert.Equal("Initial", version.Label);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }

    [Fact]
    public async Task RollbackAsync_ReturnsNullForInvalidVersion()
    {
        var service = CreateService();

        var result = await service.RollbackAsync(Guid.NewGuid(), Guid.NewGuid());

        Assert.Null(result);
    }
}
