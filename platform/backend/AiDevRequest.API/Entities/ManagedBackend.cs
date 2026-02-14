namespace AiDevRequest.API.Entities;

public class ManagedBackend
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string UserId { get; set; } = "";

    // Database
    public string DatabaseType { get; set; } = "postgresql";
    public string DatabaseConnectionString { get; set; } = "";

    // Auth
    public string AuthProvider { get; set; } = "BradYoo.Core";
    public string? AuthConfigJson { get; set; }

    // Storage
    public string StorageProvider { get; set; } = "AzureBlob";
    public string StorageBucket { get; set; } = "";
    public string StorageConnectionString { get; set; } = "";

    // Hosting
    public string HostingProvider { get; set; } = "AzureContainerApps";
    public string ContainerAppId { get; set; } = "";
    public string ContainerAppUrl { get; set; } = "";

    // Preview & Domain
    public string PreviewUrl { get; set; } = "";
    public string? CustomDomain { get; set; }

    // Status & Config
    public string Status { get; set; } = "Provisioning"; // Provisioning, Active, Suspended, Deprovisioning, Deleted
    public string Region { get; set; } = "australiaeast";
    public string Tier { get; set; } = "Free"; // Free, Basic, Pro

    // Resource Limits
    public decimal CpuCores { get; set; } = 0.25m;
    public decimal MemoryGb { get; set; } = 0.5m;
    public int StorageLimitGb { get; set; } = 1;

    // Cost Tracking
    public decimal MonthlyBudget { get; set; }
    public decimal CurrentMonthCost { get; set; }

    // Timestamps
    public DateTime? ProvisionedAt { get; set; }
    public DateTime? LastHealthCheck { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
