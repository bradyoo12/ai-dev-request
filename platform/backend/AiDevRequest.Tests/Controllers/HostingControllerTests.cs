using AiDevRequest.API.Controllers;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.Tests.Controllers;

public class HostingControllerTests
{
    private HostingController CreateController(AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        return new HostingController(db);
    }

    [Fact]
    public async Task GetPlans_ReturnsOk()
    {
        // The DB has seed data (4 hosting plans), so we just verify the endpoint returns OK
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);

        var result = await controller.GetPlans();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetPlans_ReturnsOnlyActivePlans()
    {
        // The DB has 4 seeded active plans. Deactivate one and verify it's excluded.
        var db = TestDbContextFactory.Create();
        var seededPlan = await db.HostingPlans.FirstAsync(p => p.Name == "premium");
        seededPlan.IsActive = false;
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        var result = await controller.GetPlans();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var plans = Assert.IsAssignableFrom<IEnumerable<HostingPlanDto>>(okResult.Value);
        var planList = plans.ToList();
        Assert.Equal(3, planList.Count);
        Assert.DoesNotContain(planList, p => p.Name == "premium");
    }

    [Fact]
    public async Task GetPlan_ReturnsNotFound_WhenMissing()
    {
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);

        var result = await controller.GetPlan(999);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetPlan_ReturnsNotFound_WhenInactive()
    {
        // Deactivate a seeded plan and verify it returns NotFound
        var db = TestDbContextFactory.Create();
        var seededPlan = await db.HostingPlans.FirstAsync(p => p.Name == "free");
        seededPlan.IsActive = false;
        await db.SaveChangesAsync();

        var controller = CreateController(db);

        var result = await controller.GetPlan(seededPlan.Id);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetRecommendedPlan_ReturnsOk_WhenMatchingPlanExists()
    {
        // Seed data already includes hosting plans, so recommendations should work
        var db = TestDbContextFactory.Create();
        var controller = CreateController(db);

        var result = await controller.GetRecommendedPlan("simple");

        Assert.IsType<OkObjectResult>(result.Result);
    }
}
