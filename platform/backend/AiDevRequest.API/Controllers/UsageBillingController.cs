using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/billing")]
public class UsageBillingController : ControllerBase
{
    private readonly IUsageBillingService _usageBillingService;
    private readonly ILogger<UsageBillingController> _logger;

    public UsageBillingController(IUsageBillingService usageBillingService, ILogger<UsageBillingController> logger)
    {
        _usageBillingService = usageBillingService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpGet("account")]
    [ProducesResponseType(typeof(BillingAccountDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BillingAccountDto>> GetAccount()
    {
        var userId = GetUserId();
        var account = await _usageBillingService.GetAccountAsync(userId);
        return Ok(MapAccountDto(account));
    }

    [HttpPost("subscribe")]
    [ProducesResponseType(typeof(BillingAccountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BillingAccountDto>> Subscribe([FromBody] SubscribeDto dto)
    {
        try
        {
            var userId = GetUserId();
            var account = await _usageBillingService.SubscribeAsync(userId, dto.Plan);
            _logger.LogInformation("User {UserId} subscribed to plan {Plan}", userId, dto.Plan);
            return Ok(MapAccountDto(account));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("cancel")]
    [ProducesResponseType(typeof(BillingAccountDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BillingAccountDto>> CancelSubscription()
    {
        var userId = GetUserId();
        var account = await _usageBillingService.CancelSubscriptionAsync(userId);
        _logger.LogInformation("User {UserId} cancelled subscription", userId);
        return Ok(MapAccountDto(account));
    }

    [HttpGet("usage")]
    [ProducesResponseType(typeof(BillingUsageSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BillingUsageSummaryDto>> GetUsageSummary()
    {
        var userId = GetUserId();
        var summary = await _usageBillingService.GetUsageSummaryAsync(userId);
        return Ok(new BillingUsageSummaryDto
        {
            Plan = summary.Plan,
            Status = summary.Status,
            RequestsUsed = summary.RequestsUsed,
            RequestsLimit = summary.RequestsLimit,
            TokensUsed = summary.TokensUsed,
            OverageCharges = summary.OverageCharges,
            MonthlyRate = summary.MonthlyRate,
            TotalEstimated = summary.TotalEstimated,
            PeriodStart = summary.PeriodStart,
            PeriodEnd = summary.PeriodEnd,
            DaysRemaining = summary.DaysRemaining,
        });
    }

    [HttpGet("invoices")]
    [ProducesResponseType(typeof(List<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<InvoiceDto>>> GetInvoices()
    {
        var userId = GetUserId();
        var invoices = await _usageBillingService.GetInvoicesAsync(userId);
        return Ok(invoices.Select(i => new InvoiceDto
        {
            Id = i.Id,
            Date = i.Date,
            Amount = i.Amount,
            Status = i.Status,
            Description = i.Description,
            PlanName = i.PlanName,
            DownloadUrl = i.DownloadUrl,
        }).ToList());
    }

    [HttpGet("plans")]
    [ProducesResponseType(typeof(List<BillingPricingPlanDto>), StatusCodes.Status200OK)]
    public ActionResult<List<BillingPricingPlanDto>> GetPlans()
    {
        var plans = _usageBillingService.GetPlansAsync();
        return Ok(plans.Select(p => new BillingPricingPlanDto
        {
            Id = p.Id,
            Name = p.Name,
            MonthlyRate = p.MonthlyRate,
            RequestsLimit = p.RequestsLimit,
            PerRequestOverageRate = p.PerRequestOverageRate,
            Features = p.Features,
        }).ToList());
    }

    [HttpPost("portal")]
    [ProducesResponseType(typeof(PortalSessionDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PortalSessionDto>> CreatePortalSession()
    {
        var userId = GetUserId();
        var session = await _usageBillingService.CreatePortalSessionAsync(userId);
        return Ok(new PortalSessionDto
        {
            Url = session.Url,
            ExpiresAt = session.ExpiresAt,
        });
    }

    [AllowAnonymous]
    [HttpPost("/api/webhooks/stripe")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult StripeWebhook()
    {
        // Stripe webhook receiver - in production, validate signature and process events
        _logger.LogInformation("Stripe webhook received");
        return Ok(new { received = true });
    }

    private static BillingAccountDto MapAccountDto(Entities.BillingAccount a) => new()
    {
        Id = a.Id,
        Plan = a.Plan,
        Status = a.Status,
        StripeCustomerId = a.StripeCustomerId,
        StripeSubscriptionId = a.StripeSubscriptionId,
        RequestsThisPeriod = a.RequestsThisPeriod,
        RequestsLimit = a.RequestsLimit,
        TokensUsedThisPeriod = a.TokensUsedThisPeriod,
        OverageCharges = a.OverageCharges,
        MonthlyRate = a.MonthlyRate,
        PerRequestOverageRate = a.PerRequestOverageRate,
        PeriodStart = a.PeriodStart,
        PeriodEnd = a.PeriodEnd,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt,
    };
}

// === DTOs ===

public record BillingAccountDto
{
    public Guid Id { get; init; }
    public string Plan { get; init; } = "";
    public string Status { get; init; } = "";
    public string? StripeCustomerId { get; init; }
    public string? StripeSubscriptionId { get; init; }
    public int RequestsThisPeriod { get; init; }
    public int RequestsLimit { get; init; }
    public int TokensUsedThisPeriod { get; init; }
    public decimal OverageCharges { get; init; }
    public decimal MonthlyRate { get; init; }
    public decimal PerRequestOverageRate { get; init; }
    public DateTime PeriodStart { get; init; }
    public DateTime PeriodEnd { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record SubscribeDto
{
    public string Plan { get; init; } = "";
}

public record BillingUsageSummaryDto
{
    public string Plan { get; init; } = "";
    public string Status { get; init; } = "";
    public int RequestsUsed { get; init; }
    public int RequestsLimit { get; init; }
    public int TokensUsed { get; init; }
    public decimal OverageCharges { get; init; }
    public decimal MonthlyRate { get; init; }
    public decimal TotalEstimated { get; init; }
    public DateTime PeriodStart { get; init; }
    public DateTime PeriodEnd { get; init; }
    public int DaysRemaining { get; init; }
}

public record InvoiceDto
{
    public string Id { get; init; } = "";
    public DateTime Date { get; init; }
    public decimal Amount { get; init; }
    public string Status { get; init; } = "";
    public string Description { get; init; } = "";
    public string PlanName { get; init; } = "";
    public string? DownloadUrl { get; init; }
}

public record BillingPricingPlanDto
{
    public string Id { get; init; } = "";
    public string Name { get; init; } = "";
    public decimal MonthlyRate { get; init; }
    public int RequestsLimit { get; init; }
    public decimal PerRequestOverageRate { get; init; }
    public List<string> Features { get; init; } = [];
}

public record PortalSessionDto
{
    public string Url { get; init; } = "";
    public DateTime ExpiresAt { get; init; }
}
