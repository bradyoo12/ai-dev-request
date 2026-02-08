using System.Security.Claims;
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
        var jwtUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(jwtUserId)) return jwtUserId;
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
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load token overview");
            // Return a default response so the frontend doesn't break
            return Ok(new TokenOverviewDto
            {
                Balance = 0,
                TotalEarned = 0,
                TotalSpent = 0,
                BalanceValueUsd = 0,
                Pricing = new List<TokenCostDto>()
            });
        }
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

    // ===== Usage Endpoints =====

    /// <summary>
    /// Get usage summary for the current month
    /// </summary>
    [HttpGet("usage/summary")]
    public async Task<ActionResult<UsageSummaryDto>> GetUsageSummary()
    {
        var userId = GetUserId();
        var balance = await GetOrCreateBalance(userId);

        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var monthlyStats = await _context.TokenTransactions
            .Where(t => t.UserId == userId && t.CreatedAt >= monthStart)
            .GroupBy(t => t.Type)
            .Select(g => new { Type = g.Key, Total = g.Sum(t => t.Amount) })
            .ToListAsync();

        var usedThisMonth = monthlyStats.FirstOrDefault(s => s.Type == "debit")?.Total ?? 0;
        var addedThisMonth = monthlyStats.FirstOrDefault(s => s.Type == "credit")?.Total ?? 0;

        var projectCount = await _context.TokenTransactions
            .Where(t => t.UserId == userId && t.Type == "debit" && t.ReferenceId != null && t.CreatedAt >= monthStart)
            .Select(t => t.ReferenceId)
            .Distinct()
            .CountAsync();

        return Ok(new UsageSummaryDto
        {
            Balance = balance.Balance,
            BalanceValueUsd = Math.Round(balance.Balance * 0.01m, 2),
            UsedThisMonth = usedThisMonth,
            AddedThisMonth = addedThisMonth,
            ProjectsThisMonth = projectCount
        });
    }

    /// <summary>
    /// Get enhanced transaction list with date range filtering
    /// </summary>
    [HttpGet("usage/transactions")]
    public async Task<ActionResult<UsageTransactionsResultDto>> GetUsageTransactions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? type = null,
        [FromQuery] string? action = null,
        [FromQuery] string? projectId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var userId = GetUserId();
        await GetOrCreateBalance(userId);

        var query = _context.TokenTransactions
            .Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(t => t.Type == type);
        if (!string.IsNullOrEmpty(action))
            query = query.Where(t => t.Action == action);
        if (!string.IsNullOrEmpty(projectId))
            query = query.Where(t => t.ReferenceId == projectId);
        if (from.HasValue)
            query = query.Where(t => t.CreatedAt >= from.Value.ToUniversalTime());
        if (to.HasValue)
            query = query.Where(t => t.CreatedAt <= to.Value.ToUniversalTime());

        var totalCount = await query.CountAsync();

        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new UsageTransactionDto
            {
                Id = t.Id,
                Type = t.Type,
                Amount = t.Type == "debit" ? -t.Amount : t.Amount,
                Action = t.Action,
                ReferenceId = t.ReferenceId,
                Description = t.Description ?? "",
                BalanceAfter = t.BalanceAfter,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(new UsageTransactionsResultDto
        {
            Transactions = transactions,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get per-project token usage breakdown
    /// </summary>
    [HttpGet("usage/by-project")]
    public async Task<ActionResult<IEnumerable<ProjectUsageDto>>> GetUsageByProject()
    {
        var userId = GetUserId();
        await GetOrCreateBalance(userId);

        var projectUsage = await _context.TokenTransactions
            .Where(t => t.UserId == userId && t.Type == "debit" && t.ReferenceId != null)
            .GroupBy(t => new { t.ReferenceId, t.Action })
            .Select(g => new
            {
                g.Key.ReferenceId,
                g.Key.Action,
                Total = g.Sum(t => t.Amount)
            })
            .ToListAsync();

        var grouped = projectUsage
            .GroupBy(p => p.ReferenceId!)
            .Select(g => new ProjectUsageDto
            {
                ProjectId = g.Key,
                Analysis = g.Where(x => x.Action == "analysis").Sum(x => x.Total),
                Proposal = g.Where(x => x.Action == "proposal").Sum(x => x.Total),
                Build = g.Where(x => x.Action == "build").Sum(x => x.Total),
                Total = g.Sum(x => x.Total)
            })
            .OrderByDescending(p => p.Total)
            .ToList();

        return Ok(grouped);
    }

    /// <summary>
    /// Export token transactions as CSV
    /// </summary>
    [HttpGet("usage/export")]
    public async Task<IActionResult> ExportUsage(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var userId = GetUserId();
        await GetOrCreateBalance(userId);

        var query = _context.TokenTransactions
            .Where(t => t.UserId == userId);

        if (from.HasValue)
            query = query.Where(t => t.CreatedAt >= from.Value.ToUniversalTime());
        if (to.HasValue)
            query = query.Where(t => t.CreatedAt <= to.Value.ToUniversalTime());

        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Date,Type,Action,Description,Amount,Balance After");
        foreach (var t in transactions)
        {
            var amount = t.Type == "debit" ? -t.Amount : t.Amount;
            var desc = (t.Description ?? "").Replace("\"", "\"\"");
            csv.AppendLine($"{t.CreatedAt:yyyy-MM-dd HH:mm:ss},{t.Type},{t.Action},\"{desc}\",{amount},{t.BalanceAfter}");
        }

        return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "token-usage.csv");
    }

    /// <summary>
    /// Public endpoint: get token costs per action
    /// </summary>
    [HttpGet("/api/pricing/token-costs")]
    public async Task<ActionResult<IEnumerable<TokenCostDto>>> GetTokenCosts()
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load token costs");
            return Ok(Array.Empty<TokenCostDto>());
        }
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

// Usage DTOs
public record UsageSummaryDto
{
    public int Balance { get; init; }
    public decimal BalanceValueUsd { get; init; }
    public int UsedThisMonth { get; init; }
    public int AddedThisMonth { get; init; }
    public int ProjectsThisMonth { get; init; }
}

public record UsageTransactionDto
{
    public int Id { get; init; }
    public string Type { get; init; } = "";
    public int Amount { get; init; }
    public string Action { get; init; } = "";
    public string? ReferenceId { get; init; }
    public string Description { get; init; } = "";
    public int BalanceAfter { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record UsageTransactionsResultDto
{
    public List<UsageTransactionDto> Transactions { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public record ProjectUsageDto
{
    public string ProjectId { get; init; } = "";
    public int Analysis { get; init; }
    public int Proposal { get; init; }
    public int Build { get; init; }
    public int Total { get; init; }
}
