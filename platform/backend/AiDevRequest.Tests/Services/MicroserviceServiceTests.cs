using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class MicroserviceServiceTests
{
    private MicroserviceService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<MicroserviceService>>();
        return new MicroserviceService(db, logger.Object);
    }

    [Fact]
    public async Task GetBlueprintsAsync_ReturnsUserBlueprints()
    {
        var db = TestDbContextFactory.Create();
        db.ServiceBlueprints.Add(new ServiceBlueprint
        {
            UserId = "user1",
            Name = "Blueprint1",
            ServicesJson = "[]",
            DependenciesJson = "[]"
        });
        db.ServiceBlueprints.Add(new ServiceBlueprint
        {
            UserId = "user2",
            Name = "Blueprint2",
            ServicesJson = "[]",
            DependenciesJson = "[]"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var blueprints = await service.GetBlueprintsAsync("user1");

        Assert.Single(blueprints);
        Assert.Equal("Blueprint1", blueprints[0].Name);
    }

    [Fact]
    public async Task GetBlueprintAsync_ReturnsForOwner()
    {
        var db = TestDbContextFactory.Create();
        var bp = new ServiceBlueprint
        {
            UserId = "user1",
            Name = "Blueprint1",
            ServicesJson = "[]",
            DependenciesJson = "[]"
        };
        db.ServiceBlueprints.Add(bp);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetBlueprintAsync(bp.Id, "user1");

        Assert.NotNull(result);
        Assert.Equal("Blueprint1", result!.Name);
    }

    [Fact]
    public async Task GetBlueprintAsync_ReturnsNullForNonOwner()
    {
        var db = TestDbContextFactory.Create();
        var bp = new ServiceBlueprint
        {
            UserId = "user1",
            Name = "Blueprint1",
            ServicesJson = "[]",
            DependenciesJson = "[]"
        };
        db.ServiceBlueprints.Add(bp);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.GetBlueprintAsync(bp.Id, "user2");

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteBlueprintAsync_DeletesForOwner()
    {
        var db = TestDbContextFactory.Create();
        var bp = new ServiceBlueprint
        {
            UserId = "user1",
            Name = "Blueprint1",
            ServicesJson = "[]",
            DependenciesJson = "[]"
        };
        db.ServiceBlueprints.Add(bp);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.DeleteBlueprintAsync(bp.Id, "user1");

        Assert.True(result);
    }

    [Fact]
    public async Task DeleteBlueprintAsync_ReturnsFalseForNonOwner()
    {
        var db = TestDbContextFactory.Create();
        var bp = new ServiceBlueprint
        {
            UserId = "user1",
            Name = "Blueprint1",
            ServicesJson = "[]",
            DependenciesJson = "[]"
        };
        db.ServiceBlueprints.Add(bp);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var result = await service.DeleteBlueprintAsync(bp.Id, "user2");

        Assert.False(result);
    }

    [Fact]
    public async Task GenerateBlueprintAsync_ThrowsForInvalidRequest()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.GenerateBlueprintAsync(Guid.NewGuid(), "user1"));
    }
}
