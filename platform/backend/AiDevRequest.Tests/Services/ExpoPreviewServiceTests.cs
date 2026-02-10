using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class ExpoPreviewServiceTests
{
    private ExpoPreviewService CreateService(
        AiDevRequest.API.Data.AiDevRequestDbContext? context = null,
        string? projectsBasePath = null)
    {
        context ??= TestDbContextFactory.Create();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Projects:BasePath"] = projectsBasePath ?? Path.GetTempPath()
            })
            .Build();
        var logger = new Mock<ILogger<ExpoPreviewService>>();
        return new ExpoPreviewService(context, config, logger.Object);
    }

    [Fact]
    public async Task GeneratePreviewAsync_ReturnsError_WhenRequestNotFound()
    {
        var service = CreateService();

        var result = await service.GeneratePreviewAsync(Guid.NewGuid());

        Assert.False(result.Success);
        Assert.Equal("Request not found.", result.Error);
    }

    [Fact]
    public async Task GeneratePreviewAsync_ReturnsError_WhenNotMobileProject()
    {
        var context = TestDbContextFactory.Create();
        var entity = new DevRequest
        {
            UserId = "test-user",
            Description = "Build a web dashboard",
            Category = RequestCategory.WebApp,
            Framework = "react",
            ProjectPath = Path.GetTempPath(),
            ProjectId = "proj_test"
        };
        context.DevRequests.Add(entity);
        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GeneratePreviewAsync(entity.Id);

        Assert.False(result.Success);
        Assert.Contains("not a mobile project", result.Error);
    }

    [Fact]
    public async Task GeneratePreviewAsync_ReturnsError_WhenProjectNotBuilt()
    {
        var context = TestDbContextFactory.Create();
        var entity = new DevRequest
        {
            UserId = "test-user",
            Description = "Build a mobile app",
            Category = RequestCategory.MobileApp,
            Framework = "expo",
            ProjectPath = null,
            ProjectId = null
        };
        context.DevRequests.Add(entity);
        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GeneratePreviewAsync(entity.Id);

        Assert.False(result.Success);
        Assert.Contains("not been built", result.Error);
    }

    [Fact]
    public async Task GeneratePreviewAsync_ReturnsSnackUrl_WhenValidMobileProject()
    {
        // Create a temp project directory with App.tsx
        var tempDir = Path.Combine(Path.GetTempPath(), $"expo_test_{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);
        try
        {
            var appCode = "import React from 'react';\nexport default function App() { return null; }";
            await File.WriteAllTextAsync(Path.Combine(tempDir, "App.tsx"), appCode);

            var context = TestDbContextFactory.Create();
            var entity = new DevRequest
            {
                UserId = "test-user",
                Description = "Build a mobile fitness tracker",
                Category = RequestCategory.MobileApp,
                Framework = "expo",
                ProjectPath = tempDir,
                ProjectId = "proj_test123"
            };
            context.DevRequests.Add(entity);
            await context.SaveChangesAsync();

            var service = CreateService(context);

            var result = await service.GeneratePreviewAsync(entity.Id);

            Assert.True(result.Success);
            Assert.Null(result.Error);
            Assert.Contains("snack.expo.dev", result.SnackUrl);
            Assert.Contains("proj_test123", result.SnackUrl);
            Assert.Equal(result.PreviewUrl, result.SnackUrl);

            // Verify PreviewUrl was saved to the entity
            var updated = await context.DevRequests.FindAsync(entity.Id);
            Assert.NotNull(updated!.PreviewUrl);
            Assert.Contains("snack.expo.dev", updated.PreviewUrl);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }

    [Fact]
    public async Task GeneratePreviewAsync_DetectsMobileFromFramework()
    {
        // A project with category=Other but framework=react-native should still work
        var tempDir = Path.Combine(Path.GetTempPath(), $"expo_test_{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);
        try
        {
            await File.WriteAllTextAsync(
                Path.Combine(tempDir, "App.tsx"),
                "export default function App() { return null; }");

            var context = TestDbContextFactory.Create();
            var entity = new DevRequest
            {
                UserId = "test-user",
                Description = "Build something",
                Category = RequestCategory.Other,
                Framework = "react-native",
                ProjectPath = tempDir,
                ProjectId = "proj_rn"
            };
            context.DevRequests.Add(entity);
            await context.SaveChangesAsync();

            var service = CreateService(context);

            var result = await service.GeneratePreviewAsync(entity.Id);

            Assert.True(result.Success);
            Assert.Contains("snack.expo.dev", result.SnackUrl);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }

    [Fact]
    public async Task GeneratePreviewAsync_ReturnsError_WhenNoAppEntryFile()
    {
        // Create empty temp project directory (no App.tsx/App.js)
        var tempDir = Path.Combine(Path.GetTempPath(), $"expo_test_{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);
        try
        {
            var context = TestDbContextFactory.Create();
            var entity = new DevRequest
            {
                UserId = "test-user",
                Description = "Build a mobile app",
                Category = RequestCategory.MobileApp,
                Framework = "expo",
                ProjectPath = tempDir,
                ProjectId = "proj_empty"
            };
            context.DevRequests.Add(entity);
            await context.SaveChangesAsync();

            var service = CreateService(context);

            var result = await service.GeneratePreviewAsync(entity.Id);

            Assert.False(result.Success);
            Assert.Contains("Could not find App.tsx or App.js", result.Error);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }
}
