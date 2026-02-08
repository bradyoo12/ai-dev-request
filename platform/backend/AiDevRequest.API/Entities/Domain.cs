namespace AiDevRequest.API.Entities;

public class Domain
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DeploymentId { get; set; }

    public required string UserId { get; set; }

    public required string DomainName { get; set; }

    public required string Tld { get; set; }

    public string Registrar { get; set; } = "cloudflare";

    public string? RegistrarDomainId { get; set; }

    public DomainStatus Status { get; set; } = DomainStatus.Pending;

    public DateTime? RegisteredAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public bool AutoRenew { get; set; } = true;

    public decimal AnnualCostUsd { get; set; }

    public DomainSslStatus SslStatus { get; set; } = DomainSslStatus.Pending;

    public DomainDnsStatus DnsStatus { get; set; } = DomainDnsStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum DomainStatus
{
    Pending,
    Registering,
    Active,
    Expired,
    Cancelled
}

public enum DomainSslStatus
{
    Pending,
    Provisioning,
    Active,
    Failed
}

public enum DomainDnsStatus
{
    Pending,
    Configuring,
    Propagated,
    Failed
}
