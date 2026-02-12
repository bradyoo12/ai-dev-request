using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Controllers;

public class AdminChurnControllerTests
{
    private AdminChurnController CreateController(AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<AdminChurnController>>();
        return new AdminChurnController(db, logger.Object);
    }

    // ===== GetOverview =====

    [Fact]
    public async Task GetOverview_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetOverview();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var overview = okResult.Value.Should().BeOfType<ChurnOverviewDto>().Subject;
        overview.ActiveSubscribers.Should().Be(0);
        overview.ChurnRate.Should().Be(0);
    }

    [Fact]
    public async Task GetOverview_CalculatesChurnRate_WithData()
    {
        var db = TestDbContextFactory.Create();
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // 10 active subscribers
        for (int i = 0; i < 10; i++)
        {
            db.SubscriptionRecords.Add(new SubscriptionRecord
            {
                UserId = $"user-{i}",
                PlanType = SubscriptionPlan.Pro,
                Status = SubscriptionStatus.Active,
                StartedAt = monthStart.AddDays(-30)
            });
        }

        // 2 new this month
        db.SubscriptionEvents.Add(new SubscriptionEvent
        {
            UserId = "user-new-1",
            EventType = SubscriptionEventType.Created,
            CreatedAt = monthStart.AddDays(1)
        });
        db.SubscriptionEvents.Add(new SubscriptionEvent
        {
            UserId = "user-new-2",
            EventType = SubscriptionEventType.Created,
            CreatedAt = monthStart.AddDays(2)
        });

        // 1 churned this month
        db.SubscriptionEvents.Add(new SubscriptionEvent
        {
            UserId = "user-churned-1",
            EventType = SubscriptionEventType.Canceled,
            CreatedAt = monthStart.AddDays(5)
        });

        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetOverview();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var overview = okResult.Value.Should().BeOfType<ChurnOverviewDto>().Subject;
        overview.ActiveSubscribers.Should().Be(10);
        overview.NewThisMonth.Should().Be(2);
        overview.ChurnedThisMonth.Should().Be(1);
        overview.NetGrowth.Should().Be(1); // 2 new - 1 churned
    }

    // ===== GetTrends =====

    [Fact]
    public async Task GetTrends_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTrends(6);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var trends = okResult.Value.Should().BeAssignableTo<List<ChurnTrendDto>>().Subject;
        trends.Should().HaveCount(6);
    }

    [Fact]
    public async Task GetTrends_ClampsMonths()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        // 30 months should be clamped to 24
        var result = await controller.GetTrends(30);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var trends = okResult.Value.Should().BeAssignableTo<List<ChurnTrendDto>>().Subject;
        trends.Count.Should().BeLessThanOrEqualTo(24);
    }

    [Fact]
    public async Task GetTrends_UsesSnapshotData_WhenAvailable()
    {
        var db = TestDbContextFactory.Create();
        var now = DateTime.UtcNow;
        var periodStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        db.ChurnMetricSnapshots.Add(new ChurnMetricSnapshot
        {
            PeriodStart = periodStart,
            PeriodEnd = periodStart.AddMonths(1),
            TotalSubscribers = 100,
            NewSubscribers = 20,
            ChurnedSubscribers = 5,
            ChurnRate = 5.0m,
            Mrr = 1000000m,
            NetGrowth = 15
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetTrends(1);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var trends = okResult.Value.Should().BeAssignableTo<List<ChurnTrendDto>>().Subject;
        trends.Should().HaveCount(1);
        trends[0].TotalSubscribers.Should().Be(100);
        trends[0].ChurnRate.Should().Be(5.0m);
    }

    // ===== GetByPlan =====

    [Fact]
    public async Task GetByPlan_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetByPlan();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var byPlan = okResult.Value.Should().BeAssignableTo<List<ChurnByPlanDto>>().Subject;
        byPlan.Should().NotBeEmpty(); // Returns an entry for each SubscriptionPlan enum value
    }

    [Fact]
    public async Task GetByPlan_CalculatesRevenueLost()
    {
        var db = TestDbContextFactory.Create();
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // 5 active Pro subscribers
        for (int i = 0; i < 5; i++)
        {
            db.SubscriptionRecords.Add(new SubscriptionRecord
            {
                UserId = $"pro-user-{i}",
                PlanType = SubscriptionPlan.Pro,
                Status = SubscriptionStatus.Active,
                StartedAt = monthStart.AddDays(-60)
            });
        }

        // 2 Pro users churned this month
        db.SubscriptionEvents.Add(new SubscriptionEvent
        {
            UserId = "pro-churned-1",
            EventType = SubscriptionEventType.Canceled,
            FromPlan = SubscriptionPlan.Pro,
            CreatedAt = monthStart.AddDays(3)
        });
        db.SubscriptionEvents.Add(new SubscriptionEvent
        {
            UserId = "pro-churned-2",
            EventType = SubscriptionEventType.Canceled,
            FromPlan = SubscriptionPlan.Pro,
            CreatedAt = monthStart.AddDays(5)
        });

        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetByPlan();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var byPlan = okResult.Value.Should().BeAssignableTo<List<ChurnByPlanDto>>().Subject;
        var proPlan = byPlan.FirstOrDefault(p => p.Plan == "Pro");
        proPlan.Should().NotBeNull();
        proPlan!.ChurnedSubscribers.Should().Be(2);
        proPlan.RevenueLost.Should().Be(2 * 149000); // Pro plan pricing
    }

    // ===== GetEvents =====

    [Fact]
    public async Task GetEvents_ReturnsOk_WhenEmpty()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetEvents();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var eventList = okResult.Value.Should().BeOfType<SubscriptionEventListDto>().Subject;
        eventList.Items.Should().BeEmpty();
        eventList.Total.Should().Be(0);
    }

    [Fact]
    public async Task GetEvents_FiltersByEventType()
    {
        var db = TestDbContextFactory.Create();
        db.SubscriptionEvents.Add(new SubscriptionEvent
        {
            UserId = "user-1",
            EventType = SubscriptionEventType.Created,
            CreatedAt = DateTime.UtcNow
        });
        db.SubscriptionEvents.Add(new SubscriptionEvent
        {
            UserId = "user-2",
            EventType = SubscriptionEventType.Canceled,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetEvents(eventType: "Canceled");

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var eventList = okResult.Value.Should().BeOfType<SubscriptionEventListDto>().Subject;
        eventList.Items.Should().HaveCount(1);
        eventList.Items[0].EventType.Should().Be("Canceled");
    }

    [Fact]
    public async Task GetEvents_PaginatesCorrectly()
    {
        var db = TestDbContextFactory.Create();
        for (int i = 0; i < 25; i++)
        {
            db.SubscriptionEvents.Add(new SubscriptionEvent
            {
                UserId = $"user-{i}",
                EventType = SubscriptionEventType.Created,
                CreatedAt = DateTime.UtcNow.AddMinutes(-i)
            });
        }
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.GetEvents(page: 1, pageSize: 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var eventList = okResult.Value.Should().BeOfType<SubscriptionEventListDto>().Subject;
        eventList.Items.Should().HaveCount(10);
        eventList.Total.Should().Be(25);
        eventList.Page.Should().Be(1);
        eventList.PageSize.Should().Be(10);
    }

    // ===== ExportCsv =====

    [Fact]
    public async Task ExportCsv_ReturnsFile()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ExportCsv();

        var fileResult = result.Should().BeOfType<FileContentResult>().Subject;
        fileResult.ContentType.Should().Be("text/csv");
        fileResult.FileDownloadName.Should().Be("churn-events.csv");
    }

    [Fact]
    public async Task ExportCsv_ContainsEvents()
    {
        var db = TestDbContextFactory.Create();
        db.SubscriptionEvents.Add(new SubscriptionEvent
        {
            UserId = "user-1",
            UserEmail = "test@example.com",
            EventType = SubscriptionEventType.Canceled,
            FromPlan = SubscriptionPlan.Pro,
            Reason = "Too expensive",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        ControllerTestHelper.SetupUser(controller);

        var result = await controller.ExportCsv();

        var fileResult = result.Should().BeOfType<FileContentResult>().Subject;
        var csvContent = System.Text.Encoding.UTF8.GetString(fileResult.FileContents);
        csvContent.Should().Contain("Id,UserId,UserEmail,EventType,FromPlan,ToPlan,Reason,CreatedAt");
        csvContent.Should().Contain("user-1");
        csvContent.Should().Contain("test@example.com");
        csvContent.Should().Contain("Too expensive");
    }
}
