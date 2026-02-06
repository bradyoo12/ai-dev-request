using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/hosting")]
public class HostingController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;

    public HostingController(AiDevRequestDbContext context)
    {
        _context = context;
    }

    [HttpGet("plans")]
    [ProducesResponseType(typeof(List<HostingPlanDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<HostingPlanDto>>> GetPlans()
    {
        var plans = await _context.HostingPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .Select(p => new HostingPlanDto
            {
                Id = p.Id,
                Name = p.Name,
                DisplayName = p.DisplayName,
                MonthlyCostUsd = p.MonthlyCostUsd,
                Vcpu = p.Vcpu,
                MemoryGb = p.MemoryGb,
                StorageGb = p.StorageGb,
                BandwidthGb = p.BandwidthGb,
                SupportsCustomDomain = p.SupportsCustomDomain,
                SupportsAutoscale = p.SupportsAutoscale,
                SupportsSla = p.SupportsSla,
                MaxInstances = p.MaxInstances,
                Description = p.Description,
                BestFor = p.BestFor,
            })
            .ToListAsync();

        return Ok(plans);
    }

    [HttpGet("plans/{id:int}")]
    [ProducesResponseType(typeof(HostingPlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HostingPlanDto>> GetPlan(int id)
    {
        var plan = await _context.HostingPlans.FindAsync(id);
        if (plan == null || !plan.IsActive)
            return NotFound();

        return Ok(new HostingPlanDto
        {
            Id = plan.Id,
            Name = plan.Name,
            DisplayName = plan.DisplayName,
            MonthlyCostUsd = plan.MonthlyCostUsd,
            Vcpu = plan.Vcpu,
            MemoryGb = plan.MemoryGb,
            StorageGb = plan.StorageGb,
            BandwidthGb = plan.BandwidthGb,
            SupportsCustomDomain = plan.SupportsCustomDomain,
            SupportsAutoscale = plan.SupportsAutoscale,
            SupportsSla = plan.SupportsSla,
            MaxInstances = plan.MaxInstances,
            Description = plan.Description,
            BestFor = plan.BestFor,
        });
    }

    [HttpGet("recommended/{complexity}")]
    [ProducesResponseType(typeof(HostingPlanDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<HostingPlanDto>> GetRecommendedPlan(string complexity)
    {
        // Recommend based on project complexity
        var recommendedName = complexity.ToLower() switch
        {
            "simple" => "free",
            "medium" => "basic",
            "complex" => "standard",
            "enterprise" => "premium",
            _ => "basic"
        };

        var plan = await _context.HostingPlans
            .FirstOrDefaultAsync(p => p.Name == recommendedName && p.IsActive);

        if (plan == null)
        {
            plan = await _context.HostingPlans
                .Where(p => p.IsActive)
                .OrderBy(p => p.SortOrder)
                .FirstOrDefaultAsync();
        }

        if (plan == null) return NotFound();

        return Ok(new HostingPlanDto
        {
            Id = plan.Id,
            Name = plan.Name,
            DisplayName = plan.DisplayName,
            MonthlyCostUsd = plan.MonthlyCostUsd,
            Vcpu = plan.Vcpu,
            MemoryGb = plan.MemoryGb,
            StorageGb = plan.StorageGb,
            BandwidthGb = plan.BandwidthGb,
            SupportsCustomDomain = plan.SupportsCustomDomain,
            SupportsAutoscale = plan.SupportsAutoscale,
            SupportsSla = plan.SupportsSla,
            MaxInstances = plan.MaxInstances,
            Description = plan.Description,
            BestFor = plan.BestFor,
        });
    }
}

public record HostingPlanDto
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public decimal MonthlyCostUsd { get; init; }
    public string Vcpu { get; init; } = "";
    public string MemoryGb { get; init; } = "";
    public int StorageGb { get; init; }
    public int BandwidthGb { get; init; }
    public bool SupportsCustomDomain { get; init; }
    public bool SupportsAutoscale { get; init; }
    public bool SupportsSla { get; init; }
    public int MaxInstances { get; init; }
    public string? Description { get; init; }
    public string? BestFor { get; init; }
}
