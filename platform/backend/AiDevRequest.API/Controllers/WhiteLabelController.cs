using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/whitelabel")]
[Authorize]
public class WhiteLabelController : ControllerBase
{
    private readonly IWhiteLabelService _service;
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    public WhiteLabelController(IWhiteLabelService service) => _service = service;

    // -- Tenants --

    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants()
    {
        var tenants = await _service.GetTenantsAsync(UserId);
        return Ok(tenants.Select(t => new TenantDto(t.Id, t.Name, t.Slug, t.CustomDomain, t.LogoUrl,
            t.PrimaryColor, t.SecondaryColor, t.IsActive, t.CreatedAt)));
    }

    [HttpGet("tenants/{id}")]
    public async Task<IActionResult> GetTenant(int id)
    {
        var t = await _service.GetTenantAsync(id, UserId);
        if (t == null) return NotFound();
        return Ok(new TenantDetailDto(t.Id, t.Name, t.Slug, t.CustomDomain, t.LogoUrl,
            t.PrimaryColor, t.SecondaryColor, t.FaviconUrl, t.CustomCss,
            t.AiPromptGuidelines, t.WelcomeMessage, t.IsActive, t.CreatedAt, t.UpdatedAt));
    }

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantDto dto)
    {
        try
        {
            var tenant = await _service.CreateTenantAsync(UserId, dto.Name, dto.Slug);
            return Ok(new { tenant.Id, tenant.Name, tenant.Slug });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("tenants/{id}")]
    public async Task<IActionResult> UpdateTenant(int id, [FromBody] UpdateTenantDto dto)
    {
        var result = await _service.UpdateTenantAsync(id, UserId, t =>
        {
            if (dto.Name != null) t.Name = dto.Name;
            if (dto.CustomDomain != null) t.CustomDomain = dto.CustomDomain;
            if (dto.LogoUrl != null) t.LogoUrl = dto.LogoUrl;
            if (dto.PrimaryColor != null) t.PrimaryColor = dto.PrimaryColor;
            if (dto.SecondaryColor != null) t.SecondaryColor = dto.SecondaryColor;
            if (dto.FaviconUrl != null) t.FaviconUrl = dto.FaviconUrl;
            if (dto.CustomCss != null) t.CustomCss = dto.CustomCss;
            if (dto.AiPromptGuidelines != null) t.AiPromptGuidelines = dto.AiPromptGuidelines;
            if (dto.WelcomeMessage != null) t.WelcomeMessage = dto.WelcomeMessage;
            if (dto.IsActive.HasValue) t.IsActive = dto.IsActive.Value;
        });

        if (result == null) return NotFound();
        return Ok(new { result.Id, result.Name, updated = true });
    }

    [HttpDelete("tenants/{id}")]
    public async Task<IActionResult> DeleteTenant(int id)
    {
        var ok = await _service.DeleteTenantAsync(id, UserId);
        return ok ? Ok(new { deleted = true }) : NotFound();
    }

    // -- Partners --

    [HttpGet("tenants/{tenantId}/partners")]
    public async Task<IActionResult> GetPartners(int tenantId)
    {
        var partners = await _service.GetPartnersAsync(tenantId, UserId);
        return Ok(partners.Select(p => new PartnerDto(p.Id, p.CompanyName, p.ContactEmail,
            p.MarginPercent, p.CommissionRate, p.Status, p.JoinedAt)));
    }

    [HttpPost("tenants/{tenantId}/partners")]
    public async Task<IActionResult> AddPartner(int tenantId, [FromBody] AddPartnerDto dto)
    {
        try
        {
            var partner = await _service.AddPartnerAsync(tenantId, UserId, dto.CompanyName, dto.ContactEmail, dto.MarginPercent);
            return Ok(new { partner.Id, partner.CompanyName });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("partners/{partnerId}")]
    public async Task<IActionResult> UpdatePartner(int partnerId, [FromBody] UpdatePartnerDto dto)
    {
        var ok = await _service.UpdatePartnerAsync(partnerId, UserId, dto.Status, dto.MarginPercent);
        return ok ? Ok(new { updated = true }) : NotFound();
    }

    [HttpDelete("partners/{partnerId}")]
    public async Task<IActionResult> RemovePartner(int partnerId)
    {
        var ok = await _service.RemovePartnerAsync(partnerId, UserId);
        return ok ? Ok(new { deleted = true }) : NotFound();
    }

    // -- Usage --

    [HttpGet("tenants/{tenantId}/usage")]
    public async Task<IActionResult> GetUsage(int tenantId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var records = await _service.GetUsageAsync(tenantId, UserId, from, to);
        return Ok(records);
    }

    [HttpGet("tenants/{tenantId}/usage/summary")]
    public async Task<IActionResult> GetUsageSummary(int tenantId)
    {
        var summary = await _service.GetUsageSummaryAsync(tenantId, UserId);
        return Ok(summary);
    }
}

// DTOs
public record TenantDto(int Id, string Name, string Slug, string? CustomDomain, string? LogoUrl,
    string? PrimaryColor, string? SecondaryColor, bool IsActive, DateTime CreatedAt);
public record TenantDetailDto(int Id, string Name, string Slug, string? CustomDomain, string? LogoUrl,
    string? PrimaryColor, string? SecondaryColor, string? FaviconUrl, string? CustomCss,
    string? AiPromptGuidelines, string? WelcomeMessage, bool IsActive, DateTime CreatedAt, DateTime UpdatedAt);
public record CreateTenantDto(string Name, string Slug);
public record UpdateTenantDto(string? Name, string? CustomDomain, string? LogoUrl,
    string? PrimaryColor, string? SecondaryColor, string? FaviconUrl, string? CustomCss,
    string? AiPromptGuidelines, string? WelcomeMessage, bool? IsActive);
public record PartnerDto(int Id, string CompanyName, string? ContactEmail,
    decimal MarginPercent, decimal CommissionRate, string? Status, DateTime JoinedAt);
public record AddPartnerDto(string CompanyName, string? ContactEmail, decimal MarginPercent);
public record UpdatePartnerDto(string? Status, decimal? MarginPercent);
