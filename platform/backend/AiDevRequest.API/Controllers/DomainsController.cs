using System.Security.Claims;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DomainsController : ControllerBase
{
    private readonly IDomainService _domainService;
    private readonly IDeploymentService _deploymentService;
    private readonly ILogger<DomainsController> _logger;

    public DomainsController(
        IDomainService domainService,
        IDeploymentService deploymentService,
        ILogger<DomainsController> logger)
    {
        _domainService = domainService;
        _deploymentService = deploymentService;
        _logger = logger;
    }

    private string GetUserId()
    {
        var jwtUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(jwtUserId)) return jwtUserId;
        return Request.Headers["X-User-Id"].FirstOrDefault() ?? "anonymous";
    }

    /// <summary>Search for available domains.</summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<DomainSearchResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DomainSearchResultDto>>> SearchDomains(
        [FromQuery] string query,
        [FromQuery] string? tlds = null)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(new { error = "Query is required." });

        var tldArray = string.IsNullOrWhiteSpace(tlds)
            ? null
            : tlds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var results = await _domainService.SearchDomainsAsync(query, tldArray);

        return Ok(results.Select(r => new DomainSearchResultDto
        {
            DomainName = r.DomainName,
            Tld = r.Tld,
            Available = r.Available,
            PriceUsd = r.PriceUsd
        }).ToList());
    }

    /// <summary>Purchase and configure a domain for a site.</summary>
    [HttpPost("sites/{siteId:guid}/domain")]
    [ProducesResponseType(typeof(DomainResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DomainResponseDto>> PurchaseDomain(
        Guid siteId,
        [FromBody] PurchaseDomainDto dto)
    {
        var userId = GetUserId();

        // Verify deployment exists and belongs to user
        var deployment = await _deploymentService.GetDeploymentAsync(siteId);
        if (deployment == null || deployment.UserId != userId)
            return NotFound(new { error = "Site not found." });

        if (deployment.Status != DeploymentStatus.Running)
            return BadRequest(new { error = "Site must be running before adding a custom domain." });

        try
        {
            var domain = await _domainService.PurchaseDomainAsync(
                siteId, userId, dto.DomainName, dto.Tld, dto.PriceUsd, dto.PaymentMethod);

            // Start domain setup in background
            _ = Task.Run(async () =>
            {
                try
                {
                    await _domainService.SetupDomainAsync(domain.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Background domain setup failed for {DomainId}", domain.Id);
                }
            });

            var response = MapToDto(domain);
            return CreatedAtAction(nameof(GetSiteDomain), new { siteId }, response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Get domain details for a site.</summary>
    [HttpGet("sites/{siteId:guid}/domain")]
    [ProducesResponseType(typeof(DomainResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DomainResponseDto>> GetSiteDomain(Guid siteId)
    {
        var userId = GetUserId();
        var domain = await _domainService.GetDomainByDeploymentAsync(siteId, userId);
        if (domain == null)
            return NotFound(new { error = "No custom domain configured for this site." });

        return Ok(MapToDto(domain));
    }

    /// <summary>List all user's domains.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<DomainResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DomainResponseDto>>> GetUserDomains()
    {
        var userId = GetUserId();
        var domains = await _domainService.GetUserDomainsAsync(userId);
        return Ok(domains.Select(MapToDto).ToList());
    }

    /// <summary>Remove custom domain from a site (does not cancel registration).</summary>
    [HttpDelete("sites/{siteId:guid}/domain")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveDomain(Guid siteId)
    {
        var userId = GetUserId();
        var domain = await _domainService.GetDomainByDeploymentAsync(siteId, userId);
        if (domain == null)
            return NotFound(new { error = "No custom domain configured for this site." });

        try
        {
            await _domainService.RemoveDomainAsync(domain.Id, userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static DomainResponseDto MapToDto(Domain domain) => new()
    {
        Id = domain.Id,
        DeploymentId = domain.DeploymentId,
        DomainName = domain.DomainName,
        Tld = domain.Tld,
        Status = domain.Status.ToString(),
        SslStatus = domain.SslStatus.ToString(),
        DnsStatus = domain.DnsStatus.ToString(),
        RegisteredAt = domain.RegisteredAt,
        ExpiresAt = domain.ExpiresAt,
        AutoRenew = domain.AutoRenew,
        AnnualCostUsd = domain.AnnualCostUsd,
        CreatedAt = domain.CreatedAt,
        UpdatedAt = domain.UpdatedAt
    };
}

public record DomainSearchResultDto
{
    public string DomainName { get; init; } = "";
    public string Tld { get; init; } = "";
    public bool Available { get; init; }
    public decimal? PriceUsd { get; init; }
}

public record PurchaseDomainDto
{
    public required string DomainName { get; init; }
    public required string Tld { get; init; }
    public decimal PriceUsd { get; init; }
    public DomainPaymentMethod PaymentMethod { get; init; } = DomainPaymentMethod.Card;
}

public record DomainResponseDto
{
    public Guid Id { get; init; }
    public Guid DeploymentId { get; init; }
    public string DomainName { get; init; } = "";
    public string Tld { get; init; } = "";
    public string Status { get; init; } = "";
    public string SslStatus { get; init; } = "";
    public string DnsStatus { get; init; } = "";
    public DateTime? RegisteredAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public bool AutoRenew { get; init; }
    public decimal AnnualCostUsd { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
