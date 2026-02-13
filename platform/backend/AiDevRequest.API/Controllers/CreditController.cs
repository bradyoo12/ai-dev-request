using System.Security.Claims;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using AiDevRequest.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/credits")]
public class CreditController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly IExchangeRateService _exchangeRateService;
    private readonly ITokenService _tokenService;
    private readonly IPaymentService _paymentService;
    private readonly ILogger<CreditController> _logger;

    public CreditController(
        AiDevRequestDbContext context,
        IExchangeRateService exchangeRateService,
        ITokenService tokenService,
        IPaymentService paymentService,
        ILogger<CreditController> logger)
    {
        _context = context;
        _exchangeRateService = exchangeRateService;
        _tokenService = tokenService;
        _paymentService = paymentService;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// Get credit packages with local prices and dynamically calculated credit amounts.
    /// </summary>
    [HttpGet("packages")]
    [ProducesResponseType(typeof(CreditPackagesResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CreditPackagesResponseDto>> GetPackages([FromQuery] string currency = "USD")
    {
        try
        {
            var currencyCode = currency.ToUpperInvariant();
            var rate = await _exchangeRateService.GetRateAsync(currencyCode);

            // Get the latest exchange rate record for the timestamp
            var rateRecord = await _context.ExchangeRates
                .Where(r => r.CurrencyCode == currencyCode)
                .OrderByDescending(r => r.FetchedAt)
                .FirstOrDefaultAsync();

            var rateUpdatedAt = rateRecord?.FetchedAt ?? DateTime.UtcNow;

            // Get active token packages
            var tokenPackages = await _context.TokenPackages
                .Where(p => p.IsActive)
                .OrderBy(p => p.SortOrder)
                .ToListAsync();

            // Get fixed local prices for this currency
            var localPrices = await _context.CreditPackagePrices
                .Where(p => p.CurrencyCode == currencyCode && p.IsActive)
                .ToDictionaryAsync(p => p.TokenPackageId, p => p.Price);

            var packages = new List<CreditPackageItemDto>();

            foreach (var pkg in tokenPackages)
            {
                decimal localPrice;
                int credits;

                if (currencyCode == "USD")
                {
                    // For USD, use the existing PriceUsd and TokenAmount directly
                    localPrice = pkg.PriceUsd;
                    credits = pkg.TokenAmount;
                }
                else if (localPrices.TryGetValue(pkg.Id, out var fixedPrice))
                {
                    // Use the fixed local price and calculate credits from exchange rate
                    localPrice = fixedPrice;
                    credits = _exchangeRateService.CalculateCredits(fixedPrice, rate);
                }
                else
                {
                    // Fallback: convert USD price to local currency
                    localPrice = Math.Round(pkg.PriceUsd * rate, 0);
                    credits = _exchangeRateService.CalculateCredits(localPrice, rate);
                }

                packages.Add(new CreditPackageItemDto
                {
                    Id = pkg.Id,
                    Name = pkg.Name,
                    Price = localPrice,
                    Credits = credits,
                    IsPopular = pkg.DiscountPercent > 0,
                });
            }

            return Ok(new CreditPackagesResponseDto
            {
                Currency = currencyCode,
                ExchangeRate = rate,
                RateUpdatedAt = rateUpdatedAt,
                Packages = packages,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get credit packages for currency {Currency}", currency);
            return StatusCode(500, new { error = "Failed to load credit packages." });
        }
    }

    /// <summary>
    /// Get user's credit balance (reads from existing TokenBalance).
    /// </summary>
    [HttpGet("balance")]
    [ProducesResponseType(typeof(CreditBalanceDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CreditBalanceDto>> GetBalance()
    {
        try
        {
            var userId = GetUserId();
            var balance = await _tokenService.GetOrCreateBalance(userId);

            return Ok(new CreditBalanceDto
            {
                Balance = balance.Balance,
                TotalEarned = balance.TotalEarned,
                TotalSpent = balance.TotalSpent,
                ValueUsd = Math.Round(balance.Balance * TokenPricing.TokenToUsdRate, 2),
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get credit balance");
            return Ok(new CreditBalanceDto
            {
                Balance = 0,
                TotalEarned = 0,
                TotalSpent = 0,
                ValueUsd = 0,
            });
        }
    }

    /// <summary>
    /// Get credit transaction history (reads from existing TokenTransaction).
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(CreditHistoryResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CreditHistoryResponseDto>> GetHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? action = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        var userId = GetUserId();
        await _tokenService.GetOrCreateBalance(userId);

        var query = _context.TokenTransactions
            .Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(action))
            query = query.Where(t => t.Action == action);

        var totalCount = await query.CountAsync();

        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new CreditTransactionDto
            {
                Id = t.Id,
                Type = t.Type,
                Amount = t.Type == "debit" ? -t.Amount : t.Amount,
                Action = t.Action,
                Description = t.Description ?? "",
                BalanceAfter = t.BalanceAfter,
                CreatedAt = t.CreatedAt,
            })
            .ToListAsync();

        return Ok(new CreditHistoryResponseDto
        {
            Transactions = transactions,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        });
    }

    /// <summary>
    /// Get all exchange rates.
    /// </summary>
    [HttpGet("rates")]
    [ProducesResponseType(typeof(List<ExchangeRateDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ExchangeRateDto>>> GetRates()
    {
        try
        {
            var rates = await _exchangeRateService.GetAllRatesAsync();

            var result = rates.Select(r => new ExchangeRateDto
            {
                CurrencyCode = r.CurrencyCode,
                RateToUsd = r.RateToUsd,
                FetchedAt = r.FetchedAt,
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get exchange rates");
            return Ok(new List<ExchangeRateDto>());
        }
    }

    /// <summary>
    /// Create Stripe checkout in user's local currency.
    /// </summary>
    [HttpPost("checkout")]
    [ProducesResponseType(typeof(CreditCheckoutResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreditCheckoutResponseDto>> CreateCheckout([FromBody] CreditCheckoutRequestDto dto)
    {
        var userId = GetUserId();
        var successUrl = dto.SuccessUrl ?? $"{Request.Scheme}://{Request.Host}/settings?payment=success";
        var cancelUrl = dto.CancelUrl ?? $"{Request.Scheme}://{Request.Host}/settings?payment=cancelled";

        try
        {
            // Delegate to existing PaymentService (which handles Stripe)
            var url = await _paymentService.CreateCheckoutSessionAsync(userId, dto.PackageId, successUrl, cancelUrl);

            _logger.LogInformation(
                "Credit checkout created for user {UserId}, package {PackageId}, currency {Currency}",
                userId, dto.PackageId, dto.Currency);

            return Ok(new CreditCheckoutResponseDto
            {
                CheckoutUrl = url,
                IsSimulation = url.StartsWith("SIMULATION_SUCCESS:"),
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create credit checkout for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to create checkout session." });
        }
    }
}

// ===== DTOs =====

public record CreditPackagesResponseDto
{
    public string Currency { get; init; } = "USD";
    public decimal ExchangeRate { get; init; } = 1.0m;
    public DateTime RateUpdatedAt { get; init; }
    public List<CreditPackageItemDto> Packages { get; init; } = [];
}

public record CreditPackageItemDto
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public decimal Price { get; init; }
    public int Credits { get; init; }
    public bool IsPopular { get; init; }
}

public record CreditBalanceDto
{
    public int Balance { get; init; }
    public int TotalEarned { get; init; }
    public int TotalSpent { get; init; }
    public decimal ValueUsd { get; init; }
}

public record CreditTransactionDto
{
    public int Id { get; init; }
    public string Type { get; init; } = "";
    public int Amount { get; init; }
    public string Action { get; init; } = "";
    public string Description { get; init; } = "";
    public int BalanceAfter { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CreditHistoryResponseDto
{
    public List<CreditTransactionDto> Transactions { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public record ExchangeRateDto
{
    public string CurrencyCode { get; init; } = "";
    public decimal RateToUsd { get; init; }
    public DateTime FetchedAt { get; init; }
}

public record CreditCheckoutRequestDto
{
    public int PackageId { get; init; }
    public string Currency { get; init; } = "USD";
    public string? SuccessUrl { get; init; }
    public string? CancelUrl { get; init; }
}

public record CreditCheckoutResponseDto
{
    public string CheckoutUrl { get; init; } = "";
    public bool IsSimulation { get; init; }
}
