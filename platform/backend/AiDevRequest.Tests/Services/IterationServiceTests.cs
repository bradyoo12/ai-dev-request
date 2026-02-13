using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class IterationServiceTests
{
    [Fact]
    public async Task IterateAsync_ThrowsException_WhenDevRequestNotFound()
    {
        var db = TestDbContextFactory.Create();
        var refinementService = new Mock<IRefinementService>();
        var versionService = new Mock<IProjectVersionService>();
        var logger = new Mock<ILogger<IterationService>>();

        var service = new IterationService(
            refinementService.Object,
            versionService.Object,
            db,
            logger.Object);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.IterateAsync(Guid.NewGuid(), "Test message", "test-user"));
    }

    [Fact]
    public async Task IterateAsync_ThrowsException_WhenUserDoesNotOwnRequest()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();

        db.DevRequests.Add(new DevRequest
        {
            Id = requestId,
            UserId = "owner-user",
            Description = "Test project"
        });
        await db.SaveChangesAsync();

        var refinementService = new Mock<IRefinementService>();
        var versionService = new Mock<IProjectVersionService>();
        var logger = new Mock<ILogger<IterationService>>();

        var service = new IterationService(
            refinementService.Object,
            versionService.Object,
            db,
            logger.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.IterateAsync(requestId, "Test message", "different-user"));
    }

    [Fact]
    public async Task IterateAsync_CreatesSnapshot_BeforeApplyingChanges()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        var projectPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());

        try
        {
            Directory.CreateDirectory(projectPath);
            File.WriteAllText(Path.Combine(projectPath, "test.txt"), "initial content");

            db.DevRequests.Add(new DevRequest
            {
                Id = requestId,
                UserId = "test-user",
                Description = "Test project",
                ProjectPath = projectPath
            });
            await db.SaveChangesAsync();

            var refinementMessage = new RefinementMessage
            {
                DevRequestId = requestId,
                Role = "assistant",
                Content = "Test response",
                FileChangesJson = "[]",
                TokensUsed = 10
            };

            var refinementService = new Mock<IRefinementService>();
            refinementService.Setup(x => x.SendMessageAsync(requestId, "Test message"))
                .ReturnsAsync(refinementMessage);
            refinementService.Setup(x => x.ApplyChangesAsync(requestId, "Test response"))
                .ReturnsAsync(new ApplyChangesResult
                {
                    ModifiedFiles = new List<string> { "test.txt" },
                    CreatedFiles = new List<string>(),
                    TotalChanges = 1
                });

            var versionService = new Mock<IProjectVersionService>();
            var logger = new Mock<ILogger<IterationService>>();

            var service = new IterationService(
                refinementService.Object,
                versionService.Object,
                db,
                logger.Object);

            var result = await service.IterateAsync(requestId, "Test message", "test-user");

            Assert.NotNull(result);
            Assert.Equal("Test response", result.AssistantMessage);
            Assert.Single(result.ChangedFiles);
            Assert.Equal(1, result.TotalChanges);

            // Verify snapshot was created
            versionService.Verify(x => x.CreateSnapshotAsync(
                requestId,
                projectPath,
                "Pre-iteration snapshot",
                "iteration"), Times.Once);
        }
        finally
        {
            if (Directory.Exists(projectPath))
                Directory.Delete(projectPath, true);
        }
    }

    [Fact]
    public async Task IterateAsync_ContinuesIfSnapshotFails()
    {
        var db = TestDbContextFactory.Create();
        var requestId = Guid.NewGuid();
        var projectPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());

        try
        {
            Directory.CreateDirectory(projectPath);

            db.DevRequests.Add(new DevRequest
            {
                Id = requestId,
                UserId = "test-user",
                Description = "Test project",
                ProjectPath = projectPath
            });
            await db.SaveChangesAsync();

            var refinementMessage = new RefinementMessage
            {
                DevRequestId = requestId,
                Role = "assistant",
                Content = "Test response",
                TokensUsed = 10
            };

            var refinementService = new Mock<IRefinementService>();
            refinementService.Setup(x => x.SendMessageAsync(requestId, "Test message"))
                .ReturnsAsync(refinementMessage);
            refinementService.Setup(x => x.ApplyChangesAsync(requestId, "Test response"))
                .ReturnsAsync(new ApplyChangesResult
                {
                    ModifiedFiles = new List<string>(),
                    CreatedFiles = new List<string>(),
                    TotalChanges = 0
                });

            var versionService = new Mock<IProjectVersionService>();
            versionService.Setup(x => x.CreateSnapshotAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .ThrowsAsync(new Exception("Snapshot failed"));

            var logger = new Mock<ILogger<IterationService>>();

            var service = new IterationService(
                refinementService.Object,
                versionService.Object,
                db,
                logger.Object);

            // Should not throw - iteration continues even if snapshot fails
            var result = await service.IterateAsync(requestId, "Test message", "test-user");

            Assert.NotNull(result);
            Assert.Equal("Test response", result.AssistantMessage);
        }
        finally
        {
            if (Directory.Exists(projectPath))
                Directory.Delete(projectPath, true);
        }
    }
}
