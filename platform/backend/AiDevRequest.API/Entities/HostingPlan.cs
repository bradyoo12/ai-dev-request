namespace AiDevRequest.API.Entities;

public class HostingPlan
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string DisplayName { get; set; }
    public decimal MonthlyCostUsd { get; set; }
    public string Vcpu { get; set; } = "";
    public string MemoryGb { get; set; } = "";
    public int StorageGb { get; set; }
    public int BandwidthGb { get; set; }
    public bool SupportsCustomDomain { get; set; }
    public bool SupportsAutoscale { get; set; }
    public bool SupportsSla { get; set; }
    public int MaxInstances { get; set; } = 1;
    public string? AzureSku { get; set; }
    public string? Description { get; set; }
    public string? BestFor { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
