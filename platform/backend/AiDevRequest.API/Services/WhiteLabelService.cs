using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IWhiteLabelService
{
    Task<List<WhiteLabelTenant>> GetTenantsAsync(string userId);
    Task<WhiteLabelTenant?> GetTenantAsync(int id, string userId);
    Task<WhiteLabelTenant> CreateTenantAsync(string userId, string name, string slug);
    Task<WhiteLabelTenant?> UpdateTenantAsync(int id, string userId, Action<WhiteLabelTenant> update);
    Task<bool> DeleteTenantAsync(int id, string userId);
    Task<List<ResellerPartner>> GetPartnersAsync(int tenantId, string userId);
    Task<ResellerPartner> AddPartnerAsync(int tenantId, string userId, string companyName, string? contactEmail, decimal marginPercent);
    Task<bool> UpdatePartnerAsync(int partnerId, string userId, string? status, decimal? marginPercent);
    Task<bool> RemovePartnerAsync(int partnerId, string userId);
    Task<List<TenantUsage>> GetUsageAsync(int tenantId, string userId, DateTime? from, DateTime? to);
    Task<object> GetUsageSummaryAsync(int tenantId, string userId);
}

public class WhiteLabelService : IWhiteLabelService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<WhiteLabelService> _logger;

    public WhiteLabelService(AiDevRequestDbContext db, ILogger<WhiteLabelService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<WhiteLabelTenant>> GetTenantsAsync(string userId)
    {
        return await _db.WhiteLabelTenants
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<WhiteLabelTenant?> GetTenantAsync(int id, string userId)
    {
        return await _db.WhiteLabelTenants
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
    }

    public async Task<WhiteLabelTenant> CreateTenantAsync(string userId, string name, string slug)
    {
        var existing = await _db.WhiteLabelTenants.AnyAsync(t => t.Slug == slug);
        if (existing) throw new InvalidOperationException("Slug already taken.");

        var tenant = new WhiteLabelTenant
        {
            UserId = userId,
            Name = name,
            Slug = slug,
        };

        _db.WhiteLabelTenants.Add(tenant);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created white-label tenant {Slug} for user {UserId}", slug, userId);
        return tenant;
    }

    public async Task<WhiteLabelTenant?> UpdateTenantAsync(int id, string userId, Action<WhiteLabelTenant> update)
    {
        var tenant = await _db.WhiteLabelTenants.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (tenant == null) return null;

        update(tenant);
        tenant.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return tenant;
    }

    public async Task<bool> DeleteTenantAsync(int id, string userId)
    {
        var tenant = await _db.WhiteLabelTenants.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (tenant == null) return false;

        _db.WhiteLabelTenants.Remove(tenant);
        await _db.SaveChangesAsync();
        return true;
    }

    // -- Partners --

    private async Task<bool> IsOwnerAsync(int tenantId, string userId)
    {
        return await _db.WhiteLabelTenants.AnyAsync(t => t.Id == tenantId && t.UserId == userId);
    }

    public async Task<List<ResellerPartner>> GetPartnersAsync(int tenantId, string userId)
    {
        if (!await IsOwnerAsync(tenantId, userId)) return [];

        return await _db.ResellerPartners
            .Where(p => p.TenantId == tenantId)
            .OrderByDescending(p => p.JoinedAt)
            .ToListAsync();
    }

    public async Task<ResellerPartner> AddPartnerAsync(int tenantId, string userId, string companyName, string? contactEmail, decimal marginPercent)
    {
        if (!await IsOwnerAsync(tenantId, userId))
            throw new InvalidOperationException("Not authorized.");

        var partner = new ResellerPartner
        {
            TenantId = tenantId,
            UserId = userId,
            CompanyName = companyName,
            ContactEmail = contactEmail,
            MarginPercent = Math.Clamp(marginPercent, 0, 100),
            CommissionRate = 0,
        };

        _db.ResellerPartners.Add(partner);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Added reseller partner {Company} to tenant {TenantId}", companyName, tenantId);
        return partner;
    }

    public async Task<bool> UpdatePartnerAsync(int partnerId, string userId, string? status, decimal? marginPercent)
    {
        var partner = await _db.ResellerPartners.FindAsync(partnerId);
        if (partner == null) return false;

        if (!await IsOwnerAsync(partner.TenantId, userId)) return false;

        if (status != null) partner.Status = status;
        if (marginPercent.HasValue) partner.MarginPercent = Math.Clamp(marginPercent.Value, 0, 100);

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemovePartnerAsync(int partnerId, string userId)
    {
        var partner = await _db.ResellerPartners.FindAsync(partnerId);
        if (partner == null) return false;

        if (!await IsOwnerAsync(partner.TenantId, userId)) return false;

        _db.ResellerPartners.Remove(partner);
        await _db.SaveChangesAsync();
        return true;
    }

    // -- Usage --

    public async Task<List<TenantUsage>> GetUsageAsync(int tenantId, string userId, DateTime? from, DateTime? to)
    {
        if (!await IsOwnerAsync(tenantId, userId)) return [];

        var query = _db.TenantUsages.Where(u => u.TenantId == tenantId);

        if (from.HasValue) query = query.Where(u => u.RecordedAt >= from.Value);
        if (to.HasValue) query = query.Where(u => u.RecordedAt <= to.Value);

        return await query.OrderByDescending(u => u.RecordedAt).Take(500).ToListAsync();
    }

    public async Task<object> GetUsageSummaryAsync(int tenantId, string userId)
    {
        if (!await IsOwnerAsync(tenantId, userId))
            return new { totalTokens = 0, actionBreakdown = Array.Empty<object>() };

        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var records = await _db.TenantUsages
            .Where(u => u.TenantId == tenantId && u.RecordedAt >= thirtyDaysAgo)
            .ToListAsync();

        var breakdown = records
            .GroupBy(r => r.Action)
            .Select(g => new { action = g.Key, tokens = g.Sum(r => r.TokensUsed), count = g.Count() })
            .OrderByDescending(x => x.tokens)
            .ToList();

        return new
        {
            totalTokens = records.Sum(r => r.TokensUsed),
            totalActions = records.Count,
            actionBreakdown = breakdown,
            period = "last_30_days",
        };
    }
}
