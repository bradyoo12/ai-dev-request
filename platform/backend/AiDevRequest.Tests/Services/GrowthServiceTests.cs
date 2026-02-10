using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class GrowthServiceTests
{
    private GrowthService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<GrowthService>>();
        return new GrowthService(db, logger.Object);
    }

    [Fact]
    public async Task GetOverviewAsync_ReturnsDemoDataWhenNoEvents()
    {
        var service = CreateService();

        var overview = await service.GetOverviewAsync();

        Assert.Equal(12450, overview.TotalVisitors);
        Assert.Equal(3200, overview.TotalRegistered);
    }

    [Fact]
    public async Task GetOverviewAsync_ReturnsRealDataWhenEventsExist()
    {
        var db = TestDbContextFactory.Create();
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s2", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "register", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "trial_start", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "paid_conversion", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var overview = await service.GetOverviewAsync();

        Assert.Equal(2, overview.TotalVisitors);
        Assert.Equal(1, overview.TotalRegistered);
        Assert.Equal(1, overview.TotalTrialUsers);
        Assert.Equal(1, overview.TotalPaidUsers);
    }

    [Fact]
    public async Task GetTrendsAsync_ReturnsDemoDataWhenNoData()
    {
        var service = CreateService();

        var trends = await service.GetTrendsAsync(6);

        Assert.Equal(6, trends.Count);
    }

    [Fact]
    public async Task GetFunnelAsync_ReturnsDemoDataWhenNoEvents()
    {
        var service = CreateService();

        var funnel = await service.GetFunnelAsync();

        Assert.Equal(4, funnel.Count);
        Assert.Equal("Visitors", funnel[0].Stage);
        Assert.Equal(100m, funnel[0].Percentage);
    }

    [Fact]
    public async Task RecordEventAsync_CreatesEvent()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var evt = await service.RecordEventAsync("visit", "user1", "session1");

        Assert.Equal("visit", evt.EventType);
        Assert.Equal("user1", evt.UserId);
        Assert.Equal("session1", evt.SessionId);
        Assert.True(evt.Id > 0);
    }

    [Fact]
    public async Task GenerateSnapshotAsync_CreatesSnapshot()
    {
        var db = TestDbContextFactory.Create();
        var today = DateTime.UtcNow.Date;
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = today.AddHours(1) });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "register", CreatedAt = today.AddHours(2) });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var snapshot = await service.GenerateSnapshotAsync(today);

        Assert.Equal("daily", snapshot.Period);
        Assert.Equal(1, snapshot.TotalVisitors);
        Assert.Equal(1, snapshot.TotalRegistered);
    }

    [Fact]
    public async Task GenerateSnapshotAsync_UpdatesExistingSnapshot()
    {
        var db = TestDbContextFactory.Create();
        var today = DateTime.UtcNow.Date;
        var dayStart = new DateTime(today.Year, today.Month, today.Day, 0, 0, 0, DateTimeKind.Utc);
        db.GrowthSnapshots.Add(new GrowthSnapshot
        {
            SnapshotDate = dayStart,
            Period = "daily",
            TotalVisitors = 5
        });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = today.AddHours(1) });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var snapshot = await service.GenerateSnapshotAsync(today);

        Assert.Equal(1, snapshot.TotalVisitors);
    }
}
