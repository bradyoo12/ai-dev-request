using AiDevRequest.API.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class CostTrackingServiceTests
{
    private (CostTrackingService service, ModelRouterService router) CreateService()
    {
        var routerLogger = new Mock<ILogger<ModelRouterService>>();
        var router = new ModelRouterService(routerLogger.Object);
        var logger = new Mock<ILogger<CostTrackingService>>();
        var service = new CostTrackingService(router, logger.Object);
        return (service, router);
    }

    // --- Empty / missing request ---

    [Fact]
    public void GetCostReport_ReturnsEmptyReport_WhenNoUsageTracked()
    {
        var (service, _) = CreateService();

        var report = service.GetCostReport(Guid.NewGuid());

        Assert.Equal(0m, report.TotalEstimatedCost);
        Assert.Equal(0m, report.EstimatedSavingsVsOpusOnly);
        Assert.Empty(report.TierBreakdown);
    }

    // --- Single usage tracking ---

    [Fact]
    public void TrackUsage_SingleCall_ReflectedInReport()
    {
        var (service, _) = CreateService();
        var requestId = Guid.NewGuid();

        service.TrackUsage(requestId, ModelTier.Haiku, inputTokens: 1000, outputTokens: 500, TaskCategory.Analysis);

        var report = service.GetCostReport(requestId);

        Assert.Single(report.TierBreakdown);
        Assert.True(report.TotalEstimatedCost > 0);
        Assert.Equal(ModelTier.Haiku, report.TierBreakdown[0].Tier);
        Assert.Equal(TaskCategory.Analysis, report.TierBreakdown[0].Category);
        Assert.Equal(1000, report.TierBreakdown[0].InputTokens);
        Assert.Equal(500, report.TierBreakdown[0].OutputTokens);
    }

    // --- Multiple usage tracking ---

    [Fact]
    public void TrackUsage_MultipleCalls_AccumulatesInReport()
    {
        var (service, _) = CreateService();
        var requestId = Guid.NewGuid();

        service.TrackUsage(requestId, ModelTier.Haiku, 1000, 500, TaskCategory.Analysis);
        service.TrackUsage(requestId, ModelTier.Sonnet, 2000, 1000, TaskCategory.StandardGeneration);
        service.TrackUsage(requestId, ModelTier.Opus, 3000, 2000, TaskCategory.ComplexGeneration);

        var report = service.GetCostReport(requestId);

        Assert.Equal(3, report.TierBreakdown.Count);
        Assert.True(report.TotalEstimatedCost > 0);
    }

    // --- Savings calculation ---

    [Fact]
    public void GetCostReport_CalculatesSavings_WhenUsingCheaperTiers()
    {
        var (service, router) = CreateService();
        var requestId = Guid.NewGuid();

        // Track usage with Haiku (cheapest tier)
        service.TrackUsage(requestId, ModelTier.Haiku, 10000, 5000, TaskCategory.Analysis);

        var report = service.GetCostReport(requestId);

        // Savings should be positive because Haiku is cheaper than Opus
        Assert.True(report.EstimatedSavingsVsOpusOnly > 0,
            "Using Haiku should show savings compared to Opus-only approach");
    }

    [Fact]
    public void GetCostReport_ZeroSavings_WhenAllOpus()
    {
        var (service, _) = CreateService();
        var requestId = Guid.NewGuid();

        // Track usage with Opus only
        service.TrackUsage(requestId, ModelTier.Opus, 5000, 3000, TaskCategory.ComplexGeneration);

        var report = service.GetCostReport(requestId);

        // No savings when everything uses Opus
        Assert.Equal(0m, report.EstimatedSavingsVsOpusOnly);
    }

    [Fact]
    public void GetCostReport_SavingsIncrease_WithMoreHaikuUsage()
    {
        var (service, _) = CreateService();
        var requestId1 = Guid.NewGuid();
        var requestId2 = Guid.NewGuid();

        // Request 1: mixed tiers
        service.TrackUsage(requestId1, ModelTier.Haiku, 5000, 2000, TaskCategory.Analysis);
        service.TrackUsage(requestId1, ModelTier.Opus, 5000, 2000, TaskCategory.ComplexGeneration);

        // Request 2: all Haiku
        service.TrackUsage(requestId2, ModelTier.Haiku, 10000, 4000, TaskCategory.Analysis);

        var report1 = service.GetCostReport(requestId1);
        var report2 = service.GetCostReport(requestId2);

        // Request 2 (all Haiku) should have greater savings vs Opus-only than Request 1 (mixed)
        Assert.True(report2.EstimatedSavingsVsOpusOnly > report1.EstimatedSavingsVsOpusOnly);
    }

    // --- Isolation between requests ---

    [Fact]
    public void TrackUsage_DifferentRequests_AreIsolated()
    {
        var (service, _) = CreateService();
        var requestId1 = Guid.NewGuid();
        var requestId2 = Guid.NewGuid();

        service.TrackUsage(requestId1, ModelTier.Haiku, 1000, 500, TaskCategory.Analysis);
        service.TrackUsage(requestId2, ModelTier.Opus, 5000, 3000, TaskCategory.ComplexGeneration);

        var report1 = service.GetCostReport(requestId1);
        var report2 = service.GetCostReport(requestId2);

        Assert.Single(report1.TierBreakdown);
        Assert.Single(report2.TierBreakdown);
        Assert.Equal(ModelTier.Haiku, report1.TierBreakdown[0].Tier);
        Assert.Equal(ModelTier.Opus, report2.TierBreakdown[0].Tier);
        Assert.NotEqual(report1.TotalEstimatedCost, report2.TotalEstimatedCost);
    }

    // --- Cost calculation correctness ---

    [Fact]
    public void TrackUsage_CostCalculation_IsCorrect()
    {
        var (service, router) = CreateService();
        var requestId = Guid.NewGuid();

        // 1M tokens with Haiku at $1.00/1M
        service.TrackUsage(requestId, ModelTier.Haiku, 500_000, 500_000, TaskCategory.Analysis);

        var report = service.GetCostReport(requestId);

        // Expected: 1,000,000 tokens * $1.00 / 1,000,000 = $1.00
        var expectedCost = 1.00m;
        Assert.Equal(expectedCost, report.TotalEstimatedCost);
    }

    [Fact]
    public void TrackUsage_SmallTokenCount_ProducesSmallCost()
    {
        var (service, _) = CreateService();
        var requestId = Guid.NewGuid();

        service.TrackUsage(requestId, ModelTier.Haiku, 100, 50, TaskCategory.Planning);

        var report = service.GetCostReport(requestId);

        // 150 tokens * $1.00/1M = $0.000150
        Assert.True(report.TotalEstimatedCost > 0);
        Assert.True(report.TotalEstimatedCost < 0.01m);
    }
}
