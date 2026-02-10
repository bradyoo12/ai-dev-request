using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class TechTrendServiceTests
{
    private TechTrendService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        var logger = new Mock<ILogger<TechTrendService>>();
        return new TechTrendService(db, logger.Object);
    }

    [Fact]
    public async Task GetTrendReportsAsync_ReturnsReports()
    {
        var db = TestDbContextFactory.Create();
        db.TrendReports.Add(new TrendReport
        {
            Category = "frontend",
            SummaryJson = "{}",
            TrendCount = 5
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var reports = await service.GetTrendReportsAsync(null, 10);

        Assert.Single(reports);
    }

    [Fact]
    public async Task GetTrendReportsAsync_FiltersByCategory()
    {
        var db = TestDbContextFactory.Create();
        db.TrendReports.Add(new TrendReport { Category = "frontend", SummaryJson = "{}", TrendCount = 5 });
        db.TrendReports.Add(new TrendReport { Category = "backend", SummaryJson = "{}", TrendCount = 3 });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var reports = await service.GetTrendReportsAsync("frontend", 10);

        Assert.Single(reports);
    }

    [Fact]
    public async Task GenerateTrendReportAsync_GeneratesReport()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var report = await service.GenerateTrendReportAsync("frontend");

        Assert.NotNull(report);
        Assert.Equal("frontend", report.Category);
    }

    [Fact]
    public async Task GetUserReviewsAsync_ReturnsUserReviews()
    {
        var db = TestDbContextFactory.Create();
        db.ProjectReviews.Add(new ProjectReview
        {
            UserId = "user1",
            DevRequestId = 1,
            ProjectName = "Project1",
            HealthScore = 85,
            FindingsJson = "[]"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var reviews = await service.GetUserReviewsAsync("user1");

        Assert.Single(reviews);
    }

    [Fact]
    public async Task GetRecommendationsAsync_ReturnsReviewRecommendations()
    {
        var db = TestDbContextFactory.Create();
        var review = new ProjectReview
        {
            UserId = "user1",
            DevRequestId = 1,
            ProjectName = "Project1",
            HealthScore = 85,
            FindingsJson = "[]"
        };
        db.ProjectReviews.Add(review);
        await db.SaveChangesAsync();

        db.UpdateRecommendations.Add(new UpdateRecommendation
        {
            ProjectReviewId = review.Id,
            UserId = "user1",
            Category = "dependency",
            Severity = "high",
            Title = "Update React",
            Description = "React is outdated",
            EffortEstimate = "low",
            Status = "pending"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var recs = await service.GetRecommendationsAsync(review.Id, "user1");

        Assert.Single(recs);
    }

    [Fact]
    public async Task UpdateRecommendationStatusAsync_UpdatesStatus()
    {
        var db = TestDbContextFactory.Create();
        var review = new ProjectReview
        {
            UserId = "user1",
            DevRequestId = 1,
            ProjectName = "Project1",
            HealthScore = 85,
            FindingsJson = "[]"
        };
        db.ProjectReviews.Add(review);
        await db.SaveChangesAsync();

        var rec = new UpdateRecommendation
        {
            ProjectReviewId = review.Id,
            UserId = "user1",
            Category = "dependency",
            Severity = "high",
            Title = "Update React",
            Description = "Outdated",
            EffortEstimate = "low",
            Status = "pending"
        };
        db.UpdateRecommendations.Add(rec);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var updated = await service.UpdateRecommendationStatusAsync(rec.Id, "user1", "in_progress");

        Assert.NotNull(updated);
        Assert.Equal("in_progress", updated!.Status);
    }
}
