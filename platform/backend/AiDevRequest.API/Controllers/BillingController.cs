using System.Security.Claims;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/settings/billing")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;
    private readonly ILogger<BillingController> _logger;

    public BillingController(IBillingService billingService, ILogger<BillingController> logger)
    {
        _billingService = billingService;
        _logger = logger;
    }

    private string GetUserId()
    {
        var jwtUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(jwtUserId)) return jwtUserId;
        return Request.Headers["X-User-Id"].FirstOrDefault() ?? "anonymous";
    }

    [HttpGet]
    [ProducesResponseType(typeof(BillingOverviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BillingOverviewDto>> GetBillingOverview()
    {
        var userId = GetUserId();
        var overview = await _billingService.GetBillingOverviewAsync(userId);

        return Ok(new BillingOverviewDto
        {
            PaymentMethods = overview.PaymentMethods.Select(pm => new PaymentMethodDto
            {
                Id = pm.Id,
                Brand = pm.Brand,
                Last4 = pm.Last4,
                ExpMonth = pm.ExpMonth,
                ExpYear = pm.ExpYear,
                IsDefault = pm.IsDefault,
            }).ToList(),
            AutoTopUp = new AutoTopUpConfigDto
            {
                IsEnabled = overview.AutoTopUp.IsEnabled,
                Threshold = overview.AutoTopUp.Threshold,
                TokenPackageId = overview.AutoTopUp.TokenPackageId,
                MonthlyLimitUsd = overview.AutoTopUp.MonthlyLimitUsd,
                MonthlySpentUsd = overview.AutoTopUp.MonthlySpentUsd,
                LastTriggeredAt = overview.AutoTopUp.LastTriggeredAt,
                LastFailedAt = overview.AutoTopUp.LastFailedAt,
                FailureReason = overview.AutoTopUp.FailureReason,
            },
            IsSimulation = overview.IsSimulation,
        });
    }

    [HttpGet("auto-topup")]
    [ProducesResponseType(typeof(AutoTopUpConfigDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AutoTopUpConfigDto>> GetAutoTopUpConfig()
    {
        var userId = GetUserId();
        var config = await _billingService.GetOrCreateAutoTopUpConfigAsync(userId);

        return Ok(new AutoTopUpConfigDto
        {
            IsEnabled = config.IsEnabled,
            Threshold = config.Threshold,
            TokenPackageId = config.TokenPackageId,
            MonthlyLimitUsd = config.MonthlyLimitUsd,
            MonthlySpentUsd = config.MonthlySpentUsd,
            LastTriggeredAt = config.LastTriggeredAt,
            LastFailedAt = config.LastFailedAt,
            FailureReason = config.FailureReason,
        });
    }

    [HttpPut("auto-topup")]
    [ProducesResponseType(typeof(AutoTopUpConfigDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AutoTopUpConfigDto>> UpdateAutoTopUpConfig([FromBody] UpdateAutoTopUpDto dto)
    {
        var userId = GetUserId();
        var config = await _billingService.UpdateAutoTopUpConfigAsync(userId, new AutoTopUpConfigUpdate
        {
            IsEnabled = dto.IsEnabled,
            Threshold = dto.Threshold,
            TokenPackageId = dto.TokenPackageId,
            MonthlyLimitUsd = dto.MonthlyLimitUsd,
        });

        _logger.LogInformation("Auto top-up config updated for user {UserId}", userId);

        return Ok(new AutoTopUpConfigDto
        {
            IsEnabled = config.IsEnabled,
            Threshold = config.Threshold,
            TokenPackageId = config.TokenPackageId,
            MonthlyLimitUsd = config.MonthlyLimitUsd,
            MonthlySpentUsd = config.MonthlySpentUsd,
            LastTriggeredAt = config.LastTriggeredAt,
            LastFailedAt = config.LastFailedAt,
            FailureReason = config.FailureReason,
        });
    }
}

// DTOs
public record BillingOverviewDto
{
    public List<PaymentMethodDto> PaymentMethods { get; init; } = [];
    public AutoTopUpConfigDto AutoTopUp { get; init; } = new();
    public bool IsSimulation { get; init; }
}

public record PaymentMethodDto
{
    public string Id { get; init; } = "";
    public string Brand { get; init; } = "";
    public string Last4 { get; init; } = "";
    public int ExpMonth { get; init; }
    public int ExpYear { get; init; }
    public bool IsDefault { get; init; }
}

public record AutoTopUpConfigDto
{
    public bool IsEnabled { get; init; }
    public int Threshold { get; init; }
    public int TokenPackageId { get; init; }
    public decimal? MonthlyLimitUsd { get; init; }
    public decimal MonthlySpentUsd { get; init; }
    public DateTime? LastTriggeredAt { get; init; }
    public DateTime? LastFailedAt { get; init; }
    public string? FailureReason { get; init; }
}

public record UpdateAutoTopUpDto
{
    public bool IsEnabled { get; init; }
    public int Threshold { get; init; } = 100;
    public int TokenPackageId { get; init; } = 2;
    public decimal? MonthlyLimitUsd { get; init; }
}
