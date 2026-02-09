namespace AiDevRequest.API.Entities;

public class WhiteLabelTenant
{
    public int Id { get; set; }
    public required string UserId { get; set; } // owner
    public required string Name { get; set; }
    public required string Slug { get; set; } // unique subdomain/identifier
    public string? CustomDomain { get; set; }
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; } // hex color
    public string? SecondaryColor { get; set; }
    public string? FaviconUrl { get; set; }
    public string? CustomCss { get; set; }
    public string? AiPromptGuidelines { get; set; } // custom AI instructions
    public string? WelcomeMessage { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ResellerPartner
{
    public int Id { get; set; }
    public required string UserId { get; set; } // partner user
    public int TenantId { get; set; }
    public required string CompanyName { get; set; }
    public string? ContactEmail { get; set; }
    public decimal MarginPercent { get; set; } // reseller margin 0-100
    public decimal CommissionRate { get; set; } // commission per transaction
    public string? Status { get; set; } = "active"; // active, suspended, inactive
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class TenantUsage
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public required string Action { get; set; } // analysis, proposal, build, etc.
    public int TokensUsed { get; set; }
    public string? UserId { get; set; } // tenant user who performed the action
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}
