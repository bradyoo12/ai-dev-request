using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class FigmaImportServiceTests
{
    private const string TestUserId = "test-user-123";

    private FigmaImportService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<FigmaImportService>>();
        return new FigmaImportService(db, logger.Object);
    }

    [Fact]
    public async Task ListImportsAsync_ReturnsUserImports()
    {
        var db = TestDbContextFactory.Create();
        var import1 = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design1",
            FigmaFileKey = "key1",
            Status = "completed"
        };
        var import2 = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design2",
            FigmaFileKey = "key2",
            Status = "completed"
        };
        db.FigmaImports.Add(import1);
        db.FigmaImports.Add(import2);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.ListImportsAsync(TestUserId);

        result.Should().HaveCount(2);
        result.Should().Contain(i => i.DesignName == "Design1");
        result.Should().Contain(i => i.DesignName == "Design2");
    }

    [Fact]
    public async Task ListImportsAsync_OnlyReturnsUserImports()
    {
        var db = TestDbContextFactory.Create();
        var import1 = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design1",
            FigmaFileKey = "key1",
            Status = "completed"
        };
        var import2 = new FigmaImport
        {
            UserId = "other-user",
            DesignName = "Design2",
            FigmaFileKey = "key2",
            Status = "completed"
        };
        db.FigmaImports.Add(import1);
        db.FigmaImports.Add(import2);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.ListImportsAsync(TestUserId);

        result.Should().HaveCount(1);
        result[0].DesignName.Should().Be("Design1");
    }

    [Fact]
    public async Task ImportFromUrlAsync_CreatesNewImport()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.ImportFromUrlAsync(
            TestUserId,
            "https://www.figma.com/file/abc123/MyDesign",
            null,
            "Test Design",
            "react",
            "tailwind"
        );

        result.Should().NotBeNull();
        result.UserId.Should().Be(TestUserId);
        result.DesignName.Should().Be("Test Design");
        result.Framework.Should().Be("react");
        result.StylingLib.Should().Be("tailwind");
        result.Status.Should().Be("completed");
        result.FigmaFileKey.Should().NotBeEmpty();
        result.ComponentCount.Should().BeGreaterThan(0);
        result.TokenCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task ImportFromUrlAsync_PersistsToDatabase()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.ImportFromUrlAsync(
            TestUserId,
            "https://www.figma.com/file/xyz789/Design",
            null,
            "Persisted Design",
            "nextjs",
            "css-modules"
        );

        var persisted = await db.FigmaImports.FindAsync(result.Id);
        persisted.Should().NotBeNull();
        persisted!.DesignName.Should().Be("Persisted Design");
        persisted.Framework.Should().Be("nextjs");
    }

    [Fact]
    public async Task ImportFromScreenshotAsync_CreatesNewImport()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var result = await service.ImportFromScreenshotAsync(
            TestUserId,
            null,
            "Screenshot Design",
            "vue",
            "styled-components"
        );

        result.Should().NotBeNull();
        result.UserId.Should().Be(TestUserId);
        result.DesignName.Should().Be("Screenshot Design");
        result.SourceType.Should().Be("screenshot");
        result.Framework.Should().Be("vue");
        result.StylingLib.Should().Be("styled-components");
        result.Status.Should().Be("completed");
    }

    [Fact]
    public async Task GetImportAsync_ReturnsImportForUser()
    {
        var db = TestDbContextFactory.Create();
        var import = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design1",
            FigmaFileKey = "key1",
            Status = "completed"
        };
        db.FigmaImports.Add(import);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetImportAsync(import.Id, TestUserId);

        result.Should().NotBeNull();
        result!.DesignName.Should().Be("Design1");
    }

    [Fact]
    public async Task GetImportAsync_ReturnsNullForOtherUser()
    {
        var db = TestDbContextFactory.Create();
        var import = new FigmaImport
        {
            UserId = "other-user",
            DesignName = "Design1",
            FigmaFileKey = "key1",
            Status = "completed"
        };
        db.FigmaImports.Add(import);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetImportAsync(import.Id, TestUserId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetTokensAsync_ReturnsDesignTokens()
    {
        var db = TestDbContextFactory.Create();
        var import = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design1",
            FigmaFileKey = "key1",
            DesignTokensJson = "{\"colors\":{\"primary\":\"#3B82F6\"}}",
            ComponentTreeJson = "[{\"name\":\"Header\"}]",
            Status = "completed"
        };
        db.FigmaImports.Add(import);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var (tokens, components) = await service.GetTokensAsync(import.Id, TestUserId);

        tokens.Should().Contain("primary");
        components.Should().Contain("Header");
    }

    [Fact]
    public async Task GetCodeAsync_ReturnsGeneratedCode()
    {
        var db = TestDbContextFactory.Create();
        var import = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design1",
            FigmaFileKey = "key1",
            Framework = "react",
            StylingLib = "tailwind",
            GeneratedCodeJson = "{\"files\":[]}",
            Status = "completed"
        };
        db.FigmaImports.Add(import);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var (code, framework, styling) = await service.GetCodeAsync(import.Id, TestUserId);

        code.Should().NotBeEmpty();
        framework.Should().Be("react");
        styling.Should().Be("tailwind");
    }

    [Fact]
    public async Task DeleteImportAsync_RemovesImport()
    {
        var db = TestDbContextFactory.Create();
        var import = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design1",
            FigmaFileKey = "key1",
            Status = "completed"
        };
        db.FigmaImports.Add(import);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.DeleteImportAsync(import.Id, TestUserId);

        result.Should().BeTrue();
        var persisted = await db.FigmaImports.FindAsync(import.Id);
        persisted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteImportAsync_ReturnsFalseForOtherUser()
    {
        var db = TestDbContextFactory.Create();
        var import = new FigmaImport
        {
            UserId = "other-user",
            DesignName = "Design1",
            FigmaFileKey = "key1",
            Status = "completed"
        };
        db.FigmaImports.Add(import);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.DeleteImportAsync(import.Id, TestUserId);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetStatsAsync_ReturnsCorrectStats()
    {
        var db = TestDbContextFactory.Create();
        var import1 = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design1",
            FigmaFileKey = "key1",
            Status = "completed",
            ComponentCount = 5,
            TokenCount = 10,
            ProcessingTimeMs = 1000
        };
        var import2 = new FigmaImport
        {
            UserId = TestUserId,
            DesignName = "Design2",
            FigmaFileKey = "key2",
            Status = "completed",
            ComponentCount = 3,
            TokenCount = 8,
            ProcessingTimeMs = 2000
        };
        db.FigmaImports.Add(import1);
        db.FigmaImports.Add(import2);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        dynamic stats = await service.GetStatsAsync(TestUserId);

        Assert.Equal(2, stats.totalImports);
        Assert.Equal(2, stats.completedImports);
        Assert.Equal(8, stats.totalComponents);
        Assert.Equal(18, stats.totalTokens);
        Assert.Equal(1500, stats.avgProcessingTime);
    }

    [Fact]
    public async Task GetStatsAsync_HandlesEmptyImports()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        dynamic stats = await service.GetStatsAsync(TestUserId);

        Assert.Equal(0, stats.totalImports);
        Assert.Equal(0, stats.completedImports);
        Assert.Equal(0, stats.totalComponents);
        Assert.Equal(0, stats.totalTokens);
        Assert.Equal(0, stats.avgProcessingTime);
    }
}
