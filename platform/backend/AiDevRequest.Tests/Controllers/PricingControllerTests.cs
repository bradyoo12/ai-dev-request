using AiDevRequest.API.Controllers;
using AiDevRequest.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.Tests.Controllers;

public class PricingControllerTests
{
    private PricingController CreateController()
    {
        return new PricingController();
    }

    [Fact]
    public void GetPlans_ReturnsOk()
    {
        var controller = CreateController();

        var result = controller.GetPlans();

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public void GetPlan_ReturnsNotFound_WhenMissing()
    {
        var controller = CreateController();

        var result = controller.GetPlan("nonexistent");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public void CalculateEstimate_ReturnsOk_ForSimple()
    {
        var controller = CreateController();

        var result = controller.CalculateEstimate(new EstimateRequestDto { Complexity = "simple" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var estimate = Assert.IsType<CostEstimateDto>(okResult.Value);
        Assert.Equal(500000, estimate.DevelopmentCost);
        Assert.Equal(3, estimate.EstimatedDays);
    }

    [Fact]
    public void CalculateEstimate_ReturnsOk_ForComplex()
    {
        var controller = CreateController();

        var result = controller.CalculateEstimate(new EstimateRequestDto { Complexity = "complex" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var estimate = Assert.IsType<CostEstimateDto>(okResult.Value);
        Assert.Equal(8000000, estimate.DevelopmentCost);
        Assert.Equal(25, estimate.EstimatedDays);
    }

    [Fact]
    public void CalculateEstimate_ReturnsOk_ForEnterprise()
    {
        var controller = CreateController();

        var result = controller.CalculateEstimate(new EstimateRequestDto { Complexity = "enterprise" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var estimate = Assert.IsType<CostEstimateDto>(okResult.Value);
        Assert.Equal(30000000, estimate.DevelopmentCost);
        Assert.Equal(60, estimate.EstimatedDays);
    }

    [Fact]
    public void CalculateEstimate_ReturnsDefaultForUnknown()
    {
        var controller = CreateController();

        var result = controller.CalculateEstimate(new EstimateRequestDto { Complexity = "unknown" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var estimate = Assert.IsType<CostEstimateDto>(okResult.Value);
        Assert.Equal(1000000, estimate.DevelopmentCost);
    }
}
