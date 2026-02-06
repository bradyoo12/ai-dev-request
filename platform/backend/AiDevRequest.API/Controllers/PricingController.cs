using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PricingController : ControllerBase
{
    /// <summary>
    /// Get all pricing plans
    /// </summary>
    [HttpGet("plans")]
    [ProducesResponseType(typeof(IEnumerable<PricingPlanDto>), StatusCodes.Status200OK)]
    public ActionResult<IEnumerable<PricingPlanDto>> GetPlans()
    {
        var plans = PricingPlan.GetAllPlans().Select(p => new PricingPlanDto
        {
            Id = p.Id,
            Name = p.Name,
            NameKorean = p.NameKorean,
            PriceMonthly = p.PriceMonthly,
            PriceYearly = p.PriceYearly,
            Currency = p.Currency,
            ProjectLimit = p.ProjectLimit,
            Features = p.Features,
            IsPopular = p.IsPopular
        });

        return Ok(plans);
    }

    /// <summary>
    /// Get a specific pricing plan
    /// </summary>
    [HttpGet("plans/{id}")]
    [ProducesResponseType(typeof(PricingPlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<PricingPlanDto> GetPlan(string id)
    {
        var plan = PricingPlan.GetAllPlans().FirstOrDefault(p => p.Id == id);

        if (plan == null)
        {
            return NotFound();
        }

        return Ok(new PricingPlanDto
        {
            Id = plan.Id,
            Name = plan.Name,
            NameKorean = plan.NameKorean,
            PriceMonthly = plan.PriceMonthly,
            PriceYearly = plan.PriceYearly,
            Currency = plan.Currency,
            ProjectLimit = plan.ProjectLimit,
            Features = plan.Features,
            IsPopular = plan.IsPopular
        });
    }

    /// <summary>
    /// Calculate project cost estimate
    /// </summary>
    [HttpPost("estimate")]
    [ProducesResponseType(typeof(CostEstimateDto), StatusCodes.Status200OK)]
    public ActionResult<CostEstimateDto> CalculateEstimate([FromBody] EstimateRequestDto request)
    {
        // Base cost calculation based on complexity
        var baseCost = request.Complexity.ToLower() switch
        {
            "simple" => 500000,      // ₩50만
            "medium" => 2000000,     // ₩200만
            "complex" => 8000000,    // ₩800만
            "enterprise" => 30000000, // ₩3000만
            _ => 1000000             // Default ₩100만
        };

        // Estimated days
        var estimatedDays = request.Complexity.ToLower() switch
        {
            "simple" => 3,
            "medium" => 10,
            "complex" => 25,
            "enterprise" => 60,
            _ => 7
        };

        // Monthly costs
        var hostingCost = request.Complexity.ToLower() switch
        {
            "simple" => 10000,
            "medium" => 30000,
            "complex" => 100000,
            "enterprise" => 300000,
            _ => 20000
        };

        var maintenanceCost = (long)(baseCost * 0.1 / 12); // 10% of dev cost per year / 12 months
        var apiCost = request.Complexity.ToLower() switch
        {
            "simple" => 5000,
            "medium" => 20000,
            "complex" => 50000,
            "enterprise" => 200000,
            _ => 10000
        };

        return Ok(new CostEstimateDto
        {
            DevelopmentCost = baseCost,
            EstimatedDays = estimatedDays,
            MonthlyCosts = new MonthlyCostBreakdownDto
            {
                Hosting = hostingCost,
                Maintenance = maintenanceCost,
                ApiCosts = apiCost,
                Total = hostingCost + maintenanceCost + apiCost
            },
            Currency = "KRW",
            Note = request.Complexity.ToLower() == "enterprise"
                ? "대규모 프로젝트는 상담 후 정확한 견적을 드립니다."
                : "실제 비용은 세부 요구사항에 따라 달라질 수 있습니다."
        });
    }
}

public record PricingPlanDto
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public string NameKorean { get; init; } = "";
    public long PriceMonthly { get; init; }
    public long PriceYearly { get; init; }
    public string Currency { get; init; } = "KRW";
    public int ProjectLimit { get; init; }
    public List<string> Features { get; init; } = new();
    public bool IsPopular { get; init; }
}

public record EstimateRequestDto
{
    public string Complexity { get; init; } = "medium";
    public string Category { get; init; } = "webapp";
}

public record CostEstimateDto
{
    public long DevelopmentCost { get; init; }
    public int EstimatedDays { get; init; }
    public MonthlyCostBreakdownDto MonthlyCosts { get; init; } = new();
    public string Currency { get; init; } = "KRW";
    public string Note { get; init; } = "";
}

public record MonthlyCostBreakdownDto
{
    public long Hosting { get; init; }
    public long Maintenance { get; init; }
    public long ApiCosts { get; init; }
    public long Total { get; init; }
}
