using System.Security.Claims;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;

    private readonly ICryptoPaymentService _cryptoPaymentService;

    public PaymentsController(
        IPaymentService paymentService,
        ICryptoPaymentService cryptoPaymentService,
        ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _cryptoPaymentService = cryptoPaymentService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    [HttpPost("checkout")]
    [ProducesResponseType(typeof(CheckoutResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CheckoutResponseDto>> CreateCheckout([FromBody] CheckoutRequestDto dto)
    {
        var userId = GetUserId();
        var successUrl = dto.SuccessUrl ?? $"{Request.Scheme}://{Request.Host}/settings?payment=success";
        var cancelUrl = dto.CancelUrl ?? $"{Request.Scheme}://{Request.Host}/settings?payment=cancelled";

        try
        {
            if (dto.PaymentMethod == "crypto")
            {
                var result = await _cryptoPaymentService.CreateCryptoCheckoutAsync(userId, dto.PackageId, successUrl, cancelUrl);

                _logger.LogInformation("Crypto checkout created for user {UserId}, package {PackageId}", userId, dto.PackageId);

                return Ok(new CheckoutResponseDto
                {
                    CheckoutUrl = result.CheckoutUrl,
                    IsSimulation = result.IsSimulation,
                });
            }

            var url = await _paymentService.CreateCheckoutSessionAsync(userId, dto.PackageId, successUrl, cancelUrl);

            _logger.LogInformation("Checkout created for user {UserId}, package {PackageId}", userId, dto.PackageId);

            return Ok(new CheckoutResponseDto
            {
                CheckoutUrl = url,
                IsSimulation = url.StartsWith("SIMULATION_SUCCESS:")
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create checkout for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to create checkout session." });
        }
    }

    [HttpGet("history")]
    [ProducesResponseType(typeof(PaymentHistoryResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaymentHistoryResponseDto>> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var userId = GetUserId();
        var payments = await _paymentService.GetPaymentHistoryAsync(userId, page, pageSize);
        var totalCount = await _paymentService.GetPaymentCountAsync(userId);

        return Ok(new PaymentHistoryResponseDto
        {
            Payments = payments.Select(p => new PaymentDto
            {
                Id = p.Id,
                Type = p.Type.ToString(),
                Provider = p.Provider.ToString(),
                AmountUsd = p.AmountUsd,
                Currency = p.Currency,
                Status = p.Status.ToString(),
                Description = p.Description,
                TokensAwarded = p.TokensAwarded,
                CryptoCurrency = p.CryptoCurrency,
                CryptoTransactionHash = p.CryptoTransactionHash,
                CreatedAt = p.CreatedAt,
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        });
    }
}

[ApiController]
[Route("api/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ICryptoPaymentService _cryptoPaymentService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        IPaymentService paymentService,
        ICryptoPaymentService cryptoPaymentService,
        ILogger<WebhooksController> logger)
    {
        _paymentService = paymentService;
        _cryptoPaymentService = cryptoPaymentService;
        _logger = logger;
    }

    [HttpPost("stripe")]
    public async Task<IActionResult> StripeWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault() ?? "";

        try
        {
            await _paymentService.HandleWebhookAsync(json, signature);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stripe webhook processing failed");
            return BadRequest(new { error = "Webhook processing failed." });
        }
    }

    [HttpPost("coinbase")]
    public async Task<IActionResult> CoinbaseWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["X-CC-Webhook-Signature"].FirstOrDefault() ?? "";

        try
        {
            await _cryptoPaymentService.HandleCoinbaseWebhookAsync(json, signature);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Coinbase webhook processing failed");
            return BadRequest(new { error = "Webhook processing failed." });
        }
    }
}

public record CheckoutRequestDto
{
    public int PackageId { get; init; }
    public string? SuccessUrl { get; init; }
    public string? CancelUrl { get; init; }
    public string PaymentMethod { get; init; } = "stripe";
}

public record CheckoutResponseDto
{
    public string CheckoutUrl { get; init; } = "";
    public bool IsSimulation { get; init; }
}

public record PaymentDto
{
    public int Id { get; init; }
    public string Type { get; init; } = "";
    public string Provider { get; init; } = "Stripe";
    public decimal AmountUsd { get; init; }
    public string Currency { get; init; } = "";
    public string Status { get; init; } = "";
    public string? Description { get; init; }
    public int? TokensAwarded { get; init; }
    public string? CryptoCurrency { get; init; }
    public string? CryptoTransactionHash { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record PaymentHistoryResponseDto
{
    public List<PaymentDto> Payments { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}
