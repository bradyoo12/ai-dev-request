using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IManagedBackendService
{
    Task<List<ManagedBackend>> GetAllAsync();
    Task<ManagedBackend?> GetByIdAsync(Guid id);
    Task<ManagedBackend?> GetByProjectIdAsync(Guid projectId);
    Task<ManagedBackend> ProvisionAsync(Guid projectId, string userId, string tier);
    Task<ManagedBackend> DeprovisionAsync(Guid id);
    Task<ManagedBackendStats> GetStatsAsync();
    Task<ManagedBackend> HealthCheckAsync(Guid id);
    Task<ManagedBackend> UpdateTierAsync(Guid id, string newTier);
}

public class ManagedBackendService : IManagedBackendService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ManagedBackendService> _logger;

    public ManagedBackendService(
        AiDevRequestDbContext context,
        ILogger<ManagedBackendService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<ManagedBackend>> GetAllAsync()
    {
        return await _context.ManagedBackends
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<ManagedBackend?> GetByIdAsync(Guid id)
    {
        return await _context.ManagedBackends.FindAsync(id);
    }

    public async Task<ManagedBackend?> GetByProjectIdAsync(Guid projectId)
    {
        return await _context.ManagedBackends
            .Where(b => b.ProjectId == projectId && b.Status != "Deleted")
            .FirstOrDefaultAsync();
    }

    public async Task<ManagedBackend> ProvisionAsync(Guid projectId, string userId, string tier)
    {
        // Check if project already has a managed backend
        var existing = await _context.ManagedBackends
            .Where(b => b.ProjectId == projectId && b.Status != "Deleted" && b.Status != "Deprovisioning")
            .FirstOrDefaultAsync();

        if (existing != null)
            throw new InvalidOperationException("This project already has an active managed backend.");

        // Determine resource allocation based on tier
        var (cpuCores, memoryGb, storageLimitGb, monthlyBudget) = tier switch
        {
            "Basic" => (0.5m, 1.0m, 5, 10.0m),
            "Pro" => (1.0m, 2.0m, 20, 50.0m),
            _ => (0.25m, 0.5m, 1, 0.0m) // Free tier
        };

        var shortId = Guid.NewGuid().ToString("N")[..8];
        var previewUrl = $"https://{shortId}.preview.aidevrequest.com";

        // Simulate provisioning — generate configs
        var authConfig = new
        {
            provider = "BradYoo.Core",
            jwtEnabled = true,
            socialProviders = new[] { "google", "github" },
            sessionTimeout = 3600,
        };

        var backend = new ManagedBackend
        {
            ProjectId = projectId,
            UserId = userId,
            DatabaseType = "postgresql",
            DatabaseConnectionString = $"Host=db-{shortId}.postgres.database.azure.com;Database=proj_{shortId};",
            AuthProvider = "BradYoo.Core",
            AuthConfigJson = JsonSerializer.Serialize(authConfig),
            StorageProvider = "AzureBlob",
            StorageBucket = $"proj-{shortId}-storage",
            StorageConnectionString = $"DefaultEndpointsProtocol=https;AccountName=proj{shortId};",
            HostingProvider = "AzureContainerApps",
            ContainerAppId = $"ca-{shortId}",
            ContainerAppUrl = $"https://ca-{shortId}.australiaeast.azurecontainerapps.io",
            PreviewUrl = previewUrl,
            Status = "Active", // Simulated — in production, would start as "Provisioning"
            Region = "australiaeast",
            Tier = tier,
            CpuCores = cpuCores,
            MemoryGb = memoryGb,
            StorageLimitGb = storageLimitGb,
            MonthlyBudget = monthlyBudget,
            CurrentMonthCost = 0,
            ProvisionedAt = DateTime.UtcNow,
            LastHealthCheck = DateTime.UtcNow,
        };

        _context.ManagedBackends.Add(backend);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Provisioned managed backend for project {ProjectId} with tier {Tier}",
            projectId, tier);

        return backend;
    }

    public async Task<ManagedBackend> DeprovisionAsync(Guid id)
    {
        var backend = await _context.ManagedBackends.FindAsync(id)
            ?? throw new InvalidOperationException("Managed backend not found.");

        if (backend.Status is "Deprovisioning" or "Deleted")
            throw new InvalidOperationException($"Cannot deprovision a backend with status '{backend.Status}'.");

        backend.Status = "Deprovisioning";
        backend.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deprovisioning managed backend {Id} for project {ProjectId}",
            id, backend.ProjectId);

        return backend;
    }

    public async Task<ManagedBackendStats> GetStatsAsync()
    {
        var all = await _context.ManagedBackends.ToListAsync();

        return new ManagedBackendStats
        {
            Total = all.Count,
            Active = all.Count(b => b.Status == "Active"),
            Provisioning = all.Count(b => b.Status == "Provisioning"),
            Suspended = all.Count(b => b.Status == "Suspended"),
            Deprovisioning = all.Count(b => b.Status == "Deprovisioning"),
            Deleted = all.Count(b => b.Status == "Deleted"),
            FreeTier = all.Count(b => b.Tier == "Free"),
            BasicTier = all.Count(b => b.Tier == "Basic"),
            ProTier = all.Count(b => b.Tier == "Pro"),
            TotalMonthlyCost = all.Where(b => b.Status == "Active").Sum(b => b.CurrentMonthCost),
        };
    }

    public async Task<ManagedBackend> HealthCheckAsync(Guid id)
    {
        var backend = await _context.ManagedBackends.FindAsync(id)
            ?? throw new InvalidOperationException("Managed backend not found.");

        // Simulate health check — random slight cost increment
        var random = new Random();
        var costIncrement = Math.Round((decimal)(random.NextDouble() * 0.5), 2);
        backend.CurrentMonthCost += costIncrement;
        backend.LastHealthCheck = DateTime.UtcNow;

        // Simulate: if suspended, health check won't change status
        if (backend.Status == "Active")
        {
            backend.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Health check completed for managed backend {Id}, status: {Status}",
            id, backend.Status);

        return backend;
    }

    public async Task<ManagedBackend> UpdateTierAsync(Guid id, string newTier)
    {
        var backend = await _context.ManagedBackends.FindAsync(id)
            ?? throw new InvalidOperationException("Managed backend not found.");

        if (backend.Status != "Active")
            throw new InvalidOperationException($"Can only update tier for active backends. Current status: '{backend.Status}'.");

        var validTiers = new[] { "Free", "Basic", "Pro" };
        if (!validTiers.Contains(newTier))
            throw new InvalidOperationException($"Invalid tier '{newTier}'. Valid tiers: {string.Join(", ", validTiers)}");

        // Update resource allocation based on new tier
        var (cpuCores, memoryGb, storageLimitGb, monthlyBudget) = newTier switch
        {
            "Basic" => (0.5m, 1.0m, 5, 10.0m),
            "Pro" => (1.0m, 2.0m, 20, 50.0m),
            _ => (0.25m, 0.5m, 1, 0.0m)
        };

        backend.Tier = newTier;
        backend.CpuCores = cpuCores;
        backend.MemoryGb = memoryGb;
        backend.StorageLimitGb = storageLimitGb;
        backend.MonthlyBudget = monthlyBudget;
        backend.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated managed backend {Id} to tier {Tier}", id, newTier);

        return backend;
    }
}

public class ManagedBackendStats
{
    public int Total { get; set; }
    public int Active { get; set; }
    public int Provisioning { get; set; }
    public int Suspended { get; set; }
    public int Deprovisioning { get; set; }
    public int Deleted { get; set; }
    public int FreeTier { get; set; }
    public int BasicTier { get; set; }
    public int ProTier { get; set; }
    public decimal TotalMonthlyCost { get; set; }
}
