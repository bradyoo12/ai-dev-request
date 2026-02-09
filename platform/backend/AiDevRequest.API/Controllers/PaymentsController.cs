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

    public PaymentsController(
        IPaymentService paymentService,
        ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
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
                AmountUsd = p.AmountUsd,
                Currency = p.Currency,
                Status = p.Status.ToString(),
                Description = p.Description,
                TokensAwarded = p.TokensAwarded,
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
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        IPaymentService paymentService,
        ILogger<WebhooksController> logger)
    {
        _paymentService = paymentService;
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
}

public record CheckoutRequestDto
{
    public int PackageId { get; init; }
    public string? SuccessUrl { get; init; }
    public string? CancelUrl { get; init; }
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
    public decimal AmountUsd { get; init; }
    public string Currency { get; init; } = "";
    public string Status { get; init; } = "";
    public string? Description { get; init; }
    public int? TokensAwarded { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record PaymentHistoryResponseDto
{
    public List<PaymentDto> Payments { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}
