using AiDevRequest.API.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace AiDevRequest.Tests.Services;

public class ModelRouterServiceTests
{
    private ModelRouterService CreateService()
    {
        var logger = new Mock<ILogger<ModelRouterService>>();
        var providers = new List<IModelProviderService>();
        return new ModelRouterService(logger.Object, providers);
    }

    // --- GetRecommendedTier tests ---

    [Theory]
    [InlineData(TaskCategory.Planning, ModelTier.Haiku)]
    [InlineData(TaskCategory.Analysis, ModelTier.Haiku)]
    [InlineData(TaskCategory.Scaffolding, ModelTier.Haiku)]
    [InlineData(TaskCategory.StandardGeneration, ModelTier.Sonnet)]
    [InlineData(TaskCategory.ComplexGeneration, ModelTier.Opus)]
    [InlineData(TaskCategory.Review, ModelTier.Opus)]
    public void GetRecommendedTier_ReturnsExpectedTier(TaskCategory category, ModelTier expectedTier)
    {
        var service = CreateService();

        var tier = service.GetRecommendedTier(category);

        Assert.Equal(expectedTier, tier);
    }

    [Fact]
    public void GetRecommendedTier_LightweightTasks_UseHaiku()
    {
        var service = CreateService();

        Assert.Equal(ModelTier.Haiku, service.GetRecommendedTier(TaskCategory.Planning));
        Assert.Equal(ModelTier.Haiku, service.GetRecommendedTier(TaskCategory.Analysis));
        Assert.Equal(ModelTier.Haiku, service.GetRecommendedTier(TaskCategory.Scaffolding));
    }

    [Fact]
    public void GetRecommendedTier_HeavyTasks_UseOpus()
    {
        var service = CreateService();

        Assert.Equal(ModelTier.Opus, service.GetRecommendedTier(TaskCategory.ComplexGeneration));
        Assert.Equal(ModelTier.Opus, service.GetRecommendedTier(TaskCategory.Review));
    }

    // --- GetModelId tests ---

    [Theory]
    [InlineData(ModelTier.Haiku, "claude:claude-haiku-4-5-20251001")]
    [InlineData(ModelTier.Sonnet, "claude:claude-sonnet-4-5-20250929")]
    [InlineData(ModelTier.Opus, "claude:claude-opus-4-6")]
    public void GetModelId_ReturnsExpectedModelId(ModelTier tier, string expectedModelId)
    {
        var service = CreateService();

        var modelId = service.GetModelId(tier);

        Assert.Equal(expectedModelId, modelId);
    }

    [Fact]
    public void GetModelId_AllTiers_ReturnNonEmptyString()
    {
        var service = CreateService();

        foreach (ModelTier tier in Enum.GetValues<ModelTier>())
        {
            var modelId = service.GetModelId(tier);
            Assert.False(string.IsNullOrEmpty(modelId), $"Model ID for {tier} should not be empty");
        }
    }

    // --- GetEstimatedCostPerToken tests ---

    [Theory]
    [InlineData(ModelTier.Haiku, 1.00)]
    [InlineData(ModelTier.Sonnet, 3.00)]
    [InlineData(ModelTier.Opus, 15.00)]
    public void GetEstimatedCostPerToken_ReturnsExpectedCost(ModelTier tier, decimal expectedCost)
    {
        var service = CreateService();

        var cost = service.GetEstimatedCostPerToken(tier);

        Assert.Equal(expectedCost, cost);
    }

    [Fact]
    public void GetEstimatedCostPerToken_HaikuIsCheapest()
    {
        var service = CreateService();

        var haikuCost = service.GetEstimatedCostPerToken(ModelTier.Haiku);
        var sonnetCost = service.GetEstimatedCostPerToken(ModelTier.Sonnet);
        var opusCost = service.GetEstimatedCostPerToken(ModelTier.Opus);

        Assert.True(haikuCost < sonnetCost);
        Assert.True(sonnetCost < opusCost);
    }

    [Fact]
    public void GetEstimatedCostPerToken_AllTiers_ReturnPositiveValue()
    {
        var service = CreateService();

        foreach (ModelTier tier in Enum.GetValues<ModelTier>())
        {
            var cost = service.GetEstimatedCostPerToken(tier);
            Assert.True(cost > 0, $"Cost for {tier} should be positive");
        }
    }

    // --- Integration: tier selection → model resolution ---

    [Fact]
    public void FullRouting_AnalysisTask_ResolvesToHaikuModel()
    {
        var service = CreateService();

        var tier = service.GetRecommendedTier(TaskCategory.Analysis);
        var modelId = service.GetModelId(tier);

        Assert.Equal(ModelTier.Haiku, tier);
        Assert.Contains("haiku", modelId);
    }

    [Fact]
    public void FullRouting_ComplexGeneration_ResolvesToOpusModel()
    {
        var service = CreateService();

        var tier = service.GetRecommendedTier(TaskCategory.ComplexGeneration);
        var modelId = service.GetModelId(tier);

        Assert.Equal(ModelTier.Opus, tier);
        Assert.Contains("opus", modelId);
    }
}
