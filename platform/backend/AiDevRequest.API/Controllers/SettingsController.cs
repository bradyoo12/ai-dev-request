using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(AiDevRequestDbContext context, ILogger<SettingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetUserId()
    {
        return Request.Headers["X-User-Id"].FirstOrDefault() ?? "anonymous";
    }

    private async Task<TokenBalance> GetOrCreateBalance(string userId)
    {
        var balance = await _context.TokenBalances.FirstOrDefaultAsync(b => b.UserId == userId);
        if (balance != null) return balance;

        balance = new TokenBalance
        {
            UserId = userId,
            Balance = 1000,
            TotalEarned = 1000,
            TotalSpent = 0
        };
        _context.TokenBalances.Add(balance);

        _context.TokenTransactions.Add(new TokenTransaction
        {
            UserId = userId,
            Type = "credit",
            Amount = 1000,
            Action = "welcome_bonus",
            Description = "Welcome bonus - 1,000 free tokens",
            BalanceAfter = 1000
        });

        await _context.SaveChangesAsync();
        return balance;
    }

    /// <summary>
    /// Get current token balance and pricing info
    /// </summary>
    [HttpGet("tokens")]
    public async Task<ActionResult<TokenOverviewDto>> GetTokenOverview()
    {
        var userId = GetUserId();
        var balance = await GetOrCreateBalance(userId);

        var pricing = await _context.TokenPricings
            .Where(p => p.IsActive)
            .OrderBy(p => p.Id)
            .Select(p => new TokenCostDto
            {
                ActionType = p.ActionType,
                TokenCost = p.TokenCost,
                Description = p.Description ?? p.ActionType,
                ApproxUsd = Math.Round(p.TokenCost * 0.01m, 2)
            })
            .ToListAsync();

        return Ok(new TokenOverviewDto
        {
            Balance = balance.Balance,
            TotalEarned = balance.TotalEarned,
            TotalSpent = balance.TotalSpent,
            BalanceValueUsd = Math.Round(balance.Balance * 0.01m, 2),
            Pricing = pricing
        });
    }

    /// <summary>
    /// Get token transaction history
    /// </summary>
    [HttpGet("tokens/history")]
    public async Task<ActionResult<IEnumerable<TokenTransactionDto>>> GetTokenHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? actionFilter = null)
    {
        var userId = GetUserId();
        await GetOrCreateBalance(userId);

        var query = _context.TokenTransactions
            .Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(actionFilter))
        {
            query = query.Where(t => t.Action == actionFilter);
        }

        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TokenTransactionDto
            {
                Id = t.Id,
                Type = t.Type,
                Amount = t.Type == "debit" ? -t.Amount : t.Amount,
                Action = t.Action,
                Description = t.Description ?? "",
                BalanceAfter = t.BalanceAfter,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(transactions);
    }

    /// <summary>
    /// Get available token packages
    /// </summary>
    [HttpGet("tokens/packages")]
    public async Task<ActionResult<IEnumerable<TokenPackageDto>>> GetTokenPackages()
    {
        var packages = await _context.TokenPackages
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .Select(p => new TokenPackageDto
            {
                Id = p.Id,
                Name = p.Name,
                TokenAmount = p.TokenAmount,
                PriceUsd = p.PriceUsd,
                DiscountPercent = p.DiscountPercent
            })
            .ToListAsync();

        return Ok(packages);
    }

    /// <summary>
    /// Purchase a token package (simulated - no real payment)
    /// </summary>
    [HttpPost("tokens/purchase")]
    public async Task<ActionResult<TokenPurchaseResultDto>> PurchaseTokens([FromBody] PurchaseTokensDto dto)
    {
        var userId = GetUserId();
        var balance = await GetOrCreateBalance(userId);

        var package_ = await _context.TokenPackages.FindAsync(dto.PackageId);
        if (package_ == null || !package_.IsActive)
        {
            return NotFound(new { error = "Token package not found." });
        }

        balance.Balance += package_.TokenAmount;
        balance.TotalEarned += package_.TokenAmount;
        balance.UpdatedAt = DateTime.UtcNow;

        _context.TokenTransactions.Add(new TokenTransaction
        {
            UserId = userId,
            Type = "credit",
            Amount = package_.TokenAmount,
            Action = "purchase",
            Description = $"Purchased {package_.Name}",
            BalanceAfter = balance.Balance
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} purchased {Package}: +{Tokens} tokens",
            userId, package_.Name, package_.TokenAmount);

        return Ok(new TokenPurchaseResultDto
        {
            Success = true,
            TokensAdded = package_.TokenAmount,
            NewBalance = balance.Balance
        });
    }

    /// <summary>
    /// Check if user has enough tokens for an action
    /// </summary>
    [HttpGet("tokens/check/{actionType}")]
    public async Task<ActionResult<TokenCheckDto>> CheckTokens(string actionType)
    {
        var userId = GetUserId();
        var balance = await GetOrCreateBalance(userId);

        var pricing = await _context.TokenPricings
            .FirstOrDefaultAsync(p => p.ActionType == actionType && p.IsActive);

        if (pricing == null)
        {
            return NotFound(new { error = $"Unknown action type: {actionType}" });
        }

        var hasEnough = balance.Balance >= pricing.TokenCost;

        return Ok(new TokenCheckDto
        {
            ActionType = actionType,
            TokenCost = pricing.TokenCost,
            CurrentBalance = balance.Balance,
            HasEnough = hasEnough,
            Shortfall = hasEnough ? 0 : pricing.TokenCost - balance.Balance
        });
    }

    /// <summary>
    /// Deduct tokens for an action (called internally after action completes)
    /// </summary>
    [HttpPost("tokens/deduct")]
    public async Task<ActionResult<TokenDeductResultDto>> DeductTokens([FromBody] DeductTokensDto dto)
    {
        var userId = GetUserId();
        var balance = await GetOrCreateBalance(userId);

        var pricing = await _context.TokenPricings
            .FirstOrDefaultAsync(p => p.ActionType == dto.ActionType && p.IsActive);

        if (pricing == null)
        {
            return NotFound(new { error = $"Unknown action type: {dto.ActionType}" });
        }

        if (balance.Balance < pricing.TokenCost)
        {
            return StatusCode(402, new
            {
                error = "Insufficient tokens.",
                required = pricing.TokenCost,
                balance = balance.Balance,
                shortfall = pricing.TokenCost - balance.Balance
            });
        }

        balance.Balance -= pricing.TokenCost;
        balance.TotalSpent += pricing.TokenCost;
        balance.UpdatedAt = DateTime.UtcNow;

        _context.TokenTransactions.Add(new TokenTransaction
        {
            UserId = userId,
            Type = "debit",
            Amount = pricing.TokenCost,
            Action = dto.ActionType,
            ReferenceId = dto.ReferenceId,
            Description = pricing.Description ?? dto.ActionType,
            BalanceAfter = balance.Balance
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} spent {Tokens} tokens on {Action}. Balance: {Balance}",
            userId, pricing.TokenCost, dto.ActionType, balance.Balance);

        return Ok(new TokenDeductResultDto
        {
            Success = true,
            TokensDeducted = pricing.TokenCost,
            NewBalance = balance.Balance
        });
    }

    /// <summary>
    /// Public endpoint: get token costs per action
    /// </summary>
    [HttpGet("/api/pricing/token-costs")]
    public async Task<ActionResult<IEnumerable<TokenCostDto>>> GetTokenCosts()
    {
        var costs = await _context.TokenPricings
            .Where(p => p.IsActive)
            .OrderBy(p => p.Id)
            .Select(p => new TokenCostDto
            {
                ActionType = p.ActionType,
                TokenCost = p.TokenCost,
                Description = p.Description ?? p.ActionType,
                ApproxUsd = Math.Round(p.TokenCost * 0.01m, 2)
            })
            .ToListAsync();

        return Ok(costs);
    }
}

// DTOs
public record TokenOverviewDto
{
    public int Balance { get; init; }
    public int TotalEarned { get; init; }
    public int TotalSpent { get; init; }
    public decimal BalanceValueUsd { get; init; }
    public List<TokenCostDto> Pricing { get; init; } = new();
}

public record TokenCostDto
{
    public string ActionType { get; init; } = "";
    public int TokenCost { get; init; }
    public string Description { get; init; } = "";
    public decimal ApproxUsd { get; init; }
}

public record TokenTransactionDto
{
    public int Id { get; init; }
    public string Type { get; init; } = "";
    public int Amount { get; init; }
    public string Action { get; init; } = "";
    public string Description { get; init; } = "";
    public int BalanceAfter { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record TokenPackageDto
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public int TokenAmount { get; init; }
    public decimal PriceUsd { get; init; }
    public int DiscountPercent { get; init; }
}

public record PurchaseTokensDto
{
    public int PackageId { get; init; }
}

public record TokenPurchaseResultDto
{
    public bool Success { get; init; }
    public int TokensAdded { get; init; }
    public int NewBalance { get; init; }
}

public record TokenCheckDto
{
    public string ActionType { get; init; } = "";
    public int TokenCost { get; init; }
    public int CurrentBalance { get; init; }
    public bool HasEnough { get; init; }
    public int Shortfall { get; init; }
}

public record DeductTokensDto
{
    public string ActionType { get; init; } = "";
    public string? ReferenceId { get; init; }
}

public record TokenDeductResultDto
{
    public bool Success { get; init; }
    public int TokensDeducted { get; init; }
    public int NewBalance { get; init; }
}
