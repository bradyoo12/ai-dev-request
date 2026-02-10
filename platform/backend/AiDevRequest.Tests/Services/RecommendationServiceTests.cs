using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using AiDevRequest.Tests.Helpers;

namespace AiDevRequest.Tests.Services;

public class RecommendationServiceTests
{
    private RecommendationService CreateService(API.Data.AiDevRequestDbContext? db = null)
    {
        db ??= TestDbContextFactory.Create();
        return new RecommendationService(db);
    }

    [Fact]
    public async Task GetInterestsAsync_ReturnsUserInterests()
    {
        var db = TestDbContextFactory.Create();
        db.UserInterests.Add(new UserInterest { UserId = "user1", Category = "web", Source = "manual" });
        db.UserInterests.Add(new UserInterest { UserId = "user1", Category = "mobile", Source = "manual" });
        db.UserInterests.Add(new UserInterest { UserId = "user2", Category = "ai", Source = "manual" });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var interests = await service.GetInterestsAsync("user1");

        Assert.Equal(2, interests.Count);
    }

    [Fact]
    public async Task AddInterestAsync_CreatesInterest()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var interest = await service.AddInterestAsync("user1", "web development");

        Assert.Equal("web development", interest.Category);
        Assert.Equal("user1", interest.UserId);
    }

    [Fact]
    public async Task DeleteInterestAsync_DeletesInterest()
    {
        var db = TestDbContextFactory.Create();
        var service = CreateService(db);

        var interest = await service.AddInterestAsync("user1", "web");
        await service.DeleteInterestAsync("user1", interest.Id);

        var interests = await service.GetInterestsAsync("user1");
        Assert.Empty(interests);
    }

    [Fact]
    public async Task GetRecommendationsAsync_ReturnsUserRecommendations()
    {
        var db = TestDbContextFactory.Create();
        db.AppRecommendations.Add(new AppRecommendation
        {
            UserId = "user1",
            Title = "Build a Portfolio",
            Description = "Create a web portfolio",
            Reason = "Based on your interest in web development",
            PromptTemplate = "Create a portfolio site",
            InterestCategory = "web"
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var recs = await service.GetRecommendationsAsync("user1");

        Assert.Single(recs);
    }

    [Fact]
    public async Task DismissRecommendationAsync_DismissesRecommendation()
    {
        var db = TestDbContextFactory.Create();
        var rec = new AppRecommendation
        {
            UserId = "user1",
            Title = "Build a Portfolio",
            Description = "Create a web portfolio",
            Reason = "Interest",
            PromptTemplate = "Create portfolio",
            InterestCategory = "web"
        };
        db.AppRecommendations.Add(rec);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        await service.DismissRecommendationAsync("user1", rec.Id);

        // Verify the recommendation was marked as dismissed by querying the DB directly
        // (GetRecommendationsAsync auto-generates new recommendations when none are non-dismissed)
        var dismissed = db.AppRecommendations.First(r => r.Id == rec.Id);
        Assert.True(dismissed.IsDismissed);
    }

    [Fact]
    public async Task GenerateRecommendationsAsync_GeneratesBasedOnInterests()
    {
        var db = TestDbContextFactory.Create();
        db.UserInterests.Add(new UserInterest { UserId = "user1", Category = "e-commerce", Source = "manual", Confidence = 0.9 });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var recs = await service.GenerateRecommendationsAsync("user1");

        Assert.NotEmpty(recs);
    }
}
