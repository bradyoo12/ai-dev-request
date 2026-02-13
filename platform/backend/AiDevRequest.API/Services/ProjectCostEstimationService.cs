using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IProjectCostEstimationService
{
    Task<ProjectCostEstimate> CalculateDailyCost(Guid projectId);
    Task<ProjectCostBreakdown> GetCostBreakdown(Guid projectId);
}

public class ProjectCostEstimationService : IProjectCostEstimationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ProjectCostEstimationService> _logger;

    // Cost constants
    private const decimal AI_TOKEN_COST_PER_1K = 0.003m;
    private const decimal CONTAINER_COST_PER_VCPU_DAY = 0.50m;
    private const decimal STORAGE_COST_PER_GB_DAY = 0.01m;
    private const decimal BANDWIDTH_COST_PER_GB = 0.05m;

    public ProjectCostEstimationService(
        AiDevRequestDbContext context,
        ILogger<ProjectCostEstimationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ProjectCostEstimate> CalculateDailyCost(Guid projectId)
    {
        var project = await _context.Projects
            .Include(p => p.DevRequest)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
        {
            throw new InvalidOperationException($"Project {projectId} not found");
        }

        // Get deployment info
        var deployment = await _context.Deployments
            .FirstOrDefaultAsync(d => d.DevRequestId == project.DevRequestId);

        // Get hosting plan
        HostingPlan? hostingPlan = null;
        if (deployment?.HostingPlanId != null)
        {
            hostingPlan = await _context.HostingPlans
                .FirstOrDefaultAsync(h => h.Id == deployment.HostingPlanId);
        }

        // Get container config (note: ContainerConfig.ProjectId is int, not Guid)
        // This relationship needs to be fixed in the schema
        var containerConfig = await _context.ContainerConfigs
            .FirstOrDefaultAsync();

        // Calculate costs
        decimal hostingCostPerDay = 0m;
        if (hostingPlan != null)
        {
            hostingCostPerDay = hostingPlan.MonthlyCostUsd / 30m;
        }

        // Calculate AI usage cost (average from last 30 days)
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var aiUsage = await _context.UsageMeters
            .Where(u => u.UserId == project.UserId
                     && u.DevRequestId == project.DevRequestId
                     && u.MeterType == "ai_compute"
                     && u.CreatedAt >= thirtyDaysAgo)
            .SumAsync(u => u.Units);

        var avgDailyAiUnits = aiUsage / 30m;
        var aiCostPerDay = avgDailyAiUnits * AI_TOKEN_COST_PER_1K;

        // Container costs (ContainerConfig doesn't have Vcpu property - using placeholder)
        decimal containerCostPerDay = 0m;
        if (containerConfig != null)
        {
            // TODO: Add Vcpu property to ContainerConfig or calculate from actual container metrics
            containerCostPerDay = 0m;
        }

        // Storage costs
        decimal storageCostPerDay = 0m;
        if (hostingPlan != null)
        {
            storageCostPerDay = hostingPlan.StorageGb * STORAGE_COST_PER_GB_DAY;
        }

        var totalDailyCost = hostingCostPerDay + aiCostPerDay + containerCostPerDay + storageCostPerDay;

        return new ProjectCostEstimate
        {
            ProjectId = projectId,
            DailyCost = totalDailyCost,
            MonthlyCost = totalDailyCost * 30m,
            CalculatedAt = DateTime.UtcNow
        };
    }

    public async Task<ProjectCostBreakdown> GetCostBreakdown(Guid projectId)
    {
        var project = await _context.Projects
            .Include(p => p.DevRequest)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
        {
            throw new InvalidOperationException($"Project {projectId} not found");
        }

        // Get deployment info
        var deployment = await _context.Deployments
            .FirstOrDefaultAsync(d => d.DevRequestId == project.DevRequestId);

        // Get hosting plan
        HostingPlan? hostingPlan = null;
        if (deployment?.HostingPlanId != null)
        {
            hostingPlan = await _context.HostingPlans
                .FirstOrDefaultAsync(h => h.Id == deployment.HostingPlanId);
        }

        // Get container config (note: ContainerConfig.ProjectId is int, not Guid)
        // This relationship needs to be fixed in the schema
        var containerConfig = await _context.ContainerConfigs
            .FirstOrDefaultAsync();

        // Calculate individual cost components
        decimal hostingCost = hostingPlan != null ? hostingPlan.MonthlyCostUsd / 30m : 0m;

        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var aiUsage = await _context.UsageMeters
            .Where(u => u.UserId == project.UserId
                     && u.DevRequestId == project.DevRequestId
                     && u.MeterType == "ai_compute"
                     && u.CreatedAt >= thirtyDaysAgo)
            .SumAsync(u => u.Units);

        var avgDailyAiUnits = aiUsage / 30m;
        var aiCost = avgDailyAiUnits * AI_TOKEN_COST_PER_1K;

        decimal containerCost = 0m;
        if (containerConfig != null)
        {
            // TODO: Add Vcpu property to ContainerConfig or calculate from actual container metrics
            containerCost = 0m;
        }

        decimal storageCost = hostingPlan != null ? hostingPlan.StorageGb * STORAGE_COST_PER_GB_DAY : 0m;

        return new ProjectCostBreakdown
        {
            ProjectId = projectId,
            HostingCost = hostingCost,
            AiUsageCost = aiCost,
            ContainerCost = containerCost,
            StorageCost = storageCost,
            BandwidthCost = 0m, // TODO: Calculate from actual usage
            TotalDailyCost = hostingCost + aiCost + containerCost + storageCost,
            CalculatedAt = DateTime.UtcNow
        };
    }
}

public class ProjectCostEstimate
{
    public Guid ProjectId { get; set; }
    public decimal DailyCost { get; set; }
    public decimal MonthlyCost { get; set; }
    public DateTime CalculatedAt { get; set; }
}

public class ProjectCostBreakdown
{
    public Guid ProjectId { get; set; }
    public decimal HostingCost { get; set; }
    public decimal AiUsageCost { get; set; }
    public decimal ContainerCost { get; set; }
    public decimal StorageCost { get; set; }
    public decimal BandwidthCost { get; set; }
    public decimal TotalDailyCost { get; set; }
    public DateTime CalculatedAt { get; set; }
}
