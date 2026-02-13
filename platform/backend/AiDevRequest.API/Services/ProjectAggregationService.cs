using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IProjectAggregationService
{
    Task<List<ProjectSummary>> GetUserProjects(string userId);
    Task<ProjectDetail> GetProjectDetail(Guid projectId, string userId);
}

public class ProjectAggregationService : IProjectAggregationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IProjectCostEstimationService _costEstimationService;
    private readonly ILogger<ProjectAggregationService> _logger;

    public ProjectAggregationService(
        AiDevRequestDbContext context,
        IProjectCostEstimationService costEstimationService,
        ILogger<ProjectAggregationService> logger)
    {
        _context = context;
        _costEstimationService = costEstimationService;
        _logger = logger;
    }

    public async Task<List<ProjectSummary>> GetUserProjects(string userId)
    {
        var projects = await _context.Projects
            .Where(p => p.UserId == userId)
            .Include(p => p.DevRequest)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var summaries = new List<ProjectSummary>();

        foreach (var project in projects)
        {
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

            // Calculate daily cost
            decimal dailyCost = 0m;
            try
            {
                var costEstimate = await _costEstimationService.CalculateDailyCost(project.Id);
                dailyCost = costEstimate.DailyCost;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to calculate cost for project {ProjectId}", project.Id);
            }

            summaries.Add(new ProjectSummary
            {
                Id = project.Id,
                Name = project.Name,
                Status = project.Status,
                ProductionUrl = project.ProductionUrl,
                PreviewUrl = project.PreviewUrl,
                DailyCost = dailyCost,
                PlanName = hostingPlan?.DisplayName ?? "No plan",
                DeploymentStatus = deployment?.Status.ToString() ?? "Unknown",
                LastDeployedAt = project.LastDeployedAt,
                CreatedAt = project.CreatedAt
            });
        }

        return summaries;
    }

    public async Task<ProjectDetail> GetProjectDetail(Guid projectId, string userId)
    {
        var project = await _context.Projects
            .Include(p => p.DevRequest)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

        if (project == null)
        {
            throw new InvalidOperationException($"Project {projectId} not found or access denied");
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

        // Calculate cost breakdown
        ProjectCostBreakdown? costBreakdown = null;
        try
        {
            costBreakdown = await _costEstimationService.GetCostBreakdown(project.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cost breakdown for project {ProjectId}", project.Id);
        }

        return new ProjectDetail
        {
            Id = project.Id,
            Name = project.Name,
            Status = project.Status,
            ProductionUrl = project.ProductionUrl,
            PreviewUrl = project.PreviewUrl,
            DevRequestId = project.DevRequestId,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            LastDeployedAt = project.LastDeployedAt,

            // Deployment info
            DeploymentStatus = deployment?.Status.ToString() ?? "Unknown",
            Region = deployment?.Region,
            ContainerAppName = deployment?.ContainerAppName,

            // Hosting plan info
            PlanName = hostingPlan?.DisplayName,
            PlanCost = hostingPlan?.MonthlyCostUsd,
            PlanVcpu = hostingPlan?.Vcpu,
            PlanMemoryGb = hostingPlan?.MemoryGb,
            PlanStorageGb = hostingPlan?.StorageGb,
            PlanBandwidthGb = hostingPlan?.BandwidthGb,

            // Container info (ContainerConfig doesn't have Vcpu/MemoryGb properties)
            ContainerVcpu = null,
            ContainerMemoryGb = null,

            // Cost breakdown
            CostBreakdown = costBreakdown
        };
    }
}

public class ProjectSummary
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public ProjectStatus Status { get; set; }
    public string? ProductionUrl { get; set; }
    public string? PreviewUrl { get; set; }
    public decimal DailyCost { get; set; }
    public required string PlanName { get; set; }
    public required string DeploymentStatus { get; set; }
    public DateTime? LastDeployedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ProjectDetail
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public ProjectStatus Status { get; set; }
    public string? ProductionUrl { get; set; }
    public string? PreviewUrl { get; set; }
    public Guid? DevRequestId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastDeployedAt { get; set; }

    public required string DeploymentStatus { get; set; }
    public string? Region { get; set; }
    public string? ContainerAppName { get; set; }

    public string? PlanName { get; set; }
    public decimal? PlanCost { get; set; }
    public string? PlanVcpu { get; set; }
    public string? PlanMemoryGb { get; set; }
    public int? PlanStorageGb { get; set; }
    public int? PlanBandwidthGb { get; set; }

    public string? ContainerVcpu { get; set; }
    public string? ContainerMemoryGb { get; set; }

    public ProjectCostBreakdown? CostBreakdown { get; set; }
}
