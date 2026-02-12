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

    // ===== GetOverviewAsync =====

    [Fact]
    public async Task GetOverviewAsync_ReturnsDemoData_WhenNoEvents()
    {
        var service = CreateService();

        var overview = await service.GetOverviewAsync();

        overview.TotalVisitors.Should().Be(12450);
        overview.TotalRegistered.Should().Be(3200);
        overview.TotalTrialUsers.Should().Be(840);
        overview.TotalPaidUsers.Should().Be(210);
        overview.MonthlyGrowthRate.Should().Be(15.3m);
        overview.ConversionRate.Should().Be(25.0m);
        overview.ChurnRate.Should().Be(3.2m);
    }

    [Fact]
    public async Task GetOverviewAsync_ReturnsRealData_WhenEventsExist()
    {
        var db = TestDbContextFactory.Create();
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s2", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = DateTime.UtcNow }); // Duplicate session
        db.PlatformEvents.Add(new PlatformEvent { EventType = "register", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "trial_start", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "paid_conversion", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var overview = await service.GetOverviewAsync();

        overview.TotalVisitors.Should().Be(2); // Distinct sessions
        overview.TotalRegistered.Should().Be(1);
        overview.TotalTrialUsers.Should().Be(1);
        overview.TotalPaidUsers.Should().Be(1);
    }

    [Fact]
    public async Task GetOverviewAsync_CalculatesConversionRate()
    {
        var db = TestDbContextFactory.Create();
        // 4 trial users, 1 paid user => conversion rate = 25%
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = DateTime.UtcNow });
        for (int i = 0; i < 4; i++)
            db.PlatformEvents.Add(new PlatformEvent { EventType = "trial_start", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "paid_conversion", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var overview = await service.GetOverviewAsync();

        overview.ConversionRate.Should().Be(25.0m);
    }

    [Fact]
    public async Task GetOverviewAsync_CalculatesChurnRate()
    {
        var db = TestDbContextFactory.Create();
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = DateTime.UtcNow });
        // 3 paid users, 1 churned => churn = 1/(3+1)*100 = 25%
        for (int i = 0; i < 3; i++)
            db.PlatformEvents.Add(new PlatformEvent { EventType = "paid_conversion", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "churn", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var overview = await service.GetOverviewAsync();

        overview.ChurnRate.Should().Be(25.0m);
    }

    [Fact]
    public async Task GetOverviewAsync_CalculatesMonthlyGrowthRate()
    {
        var db = TestDbContextFactory.Create();
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var prevMonthStart = monthStart.AddMonths(-1);

        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = DateTime.UtcNow });
        // 2 registrations last month
        db.PlatformEvents.Add(new PlatformEvent { EventType = "register", CreatedAt = prevMonthStart.AddDays(1) });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "register", CreatedAt = prevMonthStart.AddDays(5) });
        // 4 registrations this month => growth = (4-2)/2 * 100 = 100%
        for (int i = 0; i < 4; i++)
            db.PlatformEvents.Add(new PlatformEvent { EventType = "register", CreatedAt = monthStart.AddDays(1) });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var overview = await service.GetOverviewAsync();

        overview.MonthlyGrowthRate.Should().Be(100.0m);
    }

    // ===== GetTrendsAsync =====

    [Fact]
    public async Task GetTrendsAsync_ReturnsDemoData_WhenNoData()
    {
        var service = CreateService();

        var trends = await service.GetTrendsAsync(6);

        trends.Should().HaveCount(6);
        trends.All(t => t.Visitors > 0).Should().BeTrue();
    }

    [Fact]
    public async Task GetTrendsAsync_ClampsMonths()
    {
        var service = CreateService();

        var trends = await service.GetTrendsAsync(30);

        trends.Count.Should().BeLessThanOrEqualTo(24);
    }

    [Fact]
    public async Task GetTrendsAsync_ComputesFromEvents()
    {
        var db = TestDbContextFactory.Create();
        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        db.PlatformEvents.Add(new PlatformEvent
        {
            EventType = "visit",
            SessionId = "s1",
            CreatedAt = thisMonthStart.AddDays(1)
        });
        db.PlatformEvents.Add(new PlatformEvent
        {
            EventType = "register",
            CreatedAt = thisMonthStart.AddDays(2)
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var trends = await service.GetTrendsAsync(1);

        trends.Should().HaveCount(1);
        trends[0].Visitors.Should().Be(1);
        trends[0].Registered.Should().Be(1);
    }

    [Fact]
    public async Task GetTrendsAsync_UsesSnapshotsWhenAvailable()
    {
        var db = TestDbContextFactory.Create();
        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        db.GrowthSnapshots.Add(new GrowthSnapshot
        {
            SnapshotDate = thisMonthStart,
            Period = "monthly",
            TotalVisitors = 9999,
            TotalRegistered = 888,
            TotalTrialUsers = 77,
            TotalPaidUsers = 6
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var trends = await service.GetTrendsAsync(1);

        trends.Should().HaveCount(1);
        trends[0].Visitors.Should().Be(9999);
        trends[0].Registered.Should().Be(888);
    }

    // ===== GetFunnelAsync =====

    [Fact]
    public async Task GetFunnelAsync_ReturnsDemoData_WhenNoEvents()
    {
        var service = CreateService();

        var funnel = await service.GetFunnelAsync();

        funnel.Should().HaveCount(4);
        funnel[0].Stage.Should().Be("Visitors");
        funnel[0].Percentage.Should().Be(100m);
        funnel[1].Stage.Should().Be("Registered");
        funnel[2].Stage.Should().Be("Trial Users");
        funnel[3].Stage.Should().Be("Paid Users");
    }

    [Fact]
    public async Task GetFunnelAsync_CalculatesPercentages_FromRealData()
    {
        var db = TestDbContextFactory.Create();
        // 10 visitors, 5 registered => 50%, 2 trial => 20%, 1 paid => 10%
        for (int i = 0; i < 10; i++)
            db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = $"s{i}", CreatedAt = DateTime.UtcNow });
        for (int i = 0; i < 5; i++)
            db.PlatformEvents.Add(new PlatformEvent { EventType = "register", CreatedAt = DateTime.UtcNow });
        for (int i = 0; i < 2; i++)
            db.PlatformEvents.Add(new PlatformEvent { EventType = "trial_start", CreatedAt = DateTime.UtcNow });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "paid_conversion", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var funnel = await service.GetFunnelAsync();

        funnel[0].Count.Should().Be(10);
        funnel[0].Percentage.Should().Be(100m);
        funnel[1].Count.Should().Be(5);
        funnel[1].Percentage.Should().Be(50m);
        funnel[2].Count.Should().Be(2);
        funnel[2].Percentage.Should().Be(20m);
        funnel[3].Count.Should().Be(1);
        funnel[3].Percentage.Should().Be(10m);
    }

    // ===== RecordEventAsync =====

    [Fact]
    public async Task RecordEventAsync_CreatesEvent()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var evt = await service.RecordEventAsync("visit", "user1", "session1");

        evt.EventType.Should().Be("visit");
        evt.UserId.Should().Be("user1");
        evt.SessionId.Should().Be("session1");
        evt.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task RecordEventAsync_SetsCreatedAtToUtcNow()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);
        var before = DateTime.UtcNow;

        var evt = await service.RecordEventAsync("register", null, null);

        evt.CreatedAt.Should().BeOnOrAfter(before);
        evt.CreatedAt.Should().BeOnOrBefore(DateTime.UtcNow);
    }

    [Fact]
    public async Task RecordEventAsync_SavesMetadata()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var evt = await service.RecordEventAsync("visit", null, null, "{\"referrer\":\"google\"}");

        evt.Metadata.Should().Be("{\"referrer\":\"google\"}");
    }

    // ===== GenerateSnapshotAsync =====

    [Fact]
    public async Task GenerateSnapshotAsync_CreatesSnapshot()
    {
        var db = TestDbContextFactory.Create();
        var today = DateTime.UtcNow.Date;
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = today.AddHours(1) });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "register", CreatedAt = today.AddHours(2) });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "trial_start", CreatedAt = today.AddHours(3) });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var snapshot = await service.GenerateSnapshotAsync(today);

        snapshot.Period.Should().Be("daily");
        snapshot.TotalVisitors.Should().Be(1);
        snapshot.TotalRegistered.Should().Be(1);
        snapshot.TotalTrialUsers.Should().Be(1);
        snapshot.Id.Should().BeGreaterThan(0);
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
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s2", CreatedAt = today.AddHours(2) });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var snapshot = await service.GenerateSnapshotAsync(today);

        snapshot.TotalVisitors.Should().Be(2); // Updated, not original 5
    }

    [Fact]
    public async Task GenerateSnapshotAsync_CalculatesConversionAndChurnRates()
    {
        var db = TestDbContextFactory.Create();
        var today = DateTime.UtcNow.Date;

        // 2 trial starts, 1 paid conversion => 50% conversion
        db.PlatformEvents.Add(new PlatformEvent { EventType = "visit", SessionId = "s1", CreatedAt = today.AddHours(1) });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "trial_start", CreatedAt = today.AddHours(1) });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "trial_start", CreatedAt = today.AddHours(2) });
        db.PlatformEvents.Add(new PlatformEvent { EventType = "paid_conversion", CreatedAt = today.AddHours(3) });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var snapshot = await service.GenerateSnapshotAsync(today);

        snapshot.ConversionRate.Should().Be(50.0m);
        snapshot.ChurnRate.Should().Be(0m); // No churn events
    }
}
