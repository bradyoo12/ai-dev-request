using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ITokenService
{
    Task<int> GetCostForAction(string actionType);
    Task<TokenBalance> GetOrCreateBalance(string userId);
    Task<(bool HasEnough, int Cost, int Balance)> CheckBalance(string userId, string actionType);
    Task<TokenTransaction> DebitTokens(string userId, string actionType, string? referenceId = null);
    Task<TokenTransaction> CreditTokens(string userId, int amount, string action, string? referenceId = null, string? description = null);
}

public class TokenService : ITokenService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<TokenService> _logger;

    public TokenService(AiDevRequestDbContext context, ILogger<TokenService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> GetCostForAction(string actionType)
    {
        var pricing = await _context.TokenPricings
            .FirstOrDefaultAsync(p => p.ActionType == actionType && p.IsActive);
        return pricing?.TokenCost ?? 0;
    }

    public async Task<TokenBalance> GetOrCreateBalance(string userId)
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

    public async Task<(bool HasEnough, int Cost, int Balance)> CheckBalance(string userId, string actionType)
    {
        var cost = await GetCostForAction(actionType);
        if (cost == 0) return (true, 0, 0);

        var balance = await GetOrCreateBalance(userId);
        return (balance.Balance >= cost, cost, balance.Balance);
    }

    public async Task<TokenTransaction> DebitTokens(string userId, string actionType, string? referenceId = null)
    {
        var pricing = await _context.TokenPricings
            .FirstOrDefaultAsync(p => p.ActionType == actionType && p.IsActive);

        if (pricing == null)
            throw new InvalidOperationException($"Unknown action type: {actionType}");

        // Ensure balance row exists before atomic update
        await GetOrCreateBalance(userId);

        // Detach any tracked TokenBalance to avoid stale state conflicts
        var tracked = _context.ChangeTracker.Entries<TokenBalance>()
            .FirstOrDefault(e => e.Entity.UserId == userId);
        if (tracked != null) tracked.State = EntityState.Detached;

        // Atomic debit: UPDATE only succeeds if balance >= cost (prevents race condition)
        var rowsAffected = await _context.Database.ExecuteSqlRawAsync(
            "UPDATE token_balances SET balance = balance - {0}, total_spent = total_spent + {0}, updated_at = NOW() WHERE user_id = {1} AND balance >= {0}",
            pricing.TokenCost, userId);

        if (rowsAffected == 0)
            throw new InvalidOperationException("Insufficient tokens");

        // Re-read the updated balance for the transaction log
        var newBalance = await _context.TokenBalances
            .AsNoTracking()
            .FirstAsync(b => b.UserId == userId);

        var transaction = new TokenTransaction
        {
            UserId = userId,
            Type = "debit",
            Amount = pricing.TokenCost,
            Action = actionType,
            ReferenceId = referenceId,
            Description = pricing.Description ?? actionType,
            BalanceAfter = newBalance.Balance
        };
        _context.TokenTransactions.Add(transaction);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "User {UserId} spent {Tokens} tokens on {Action}. Balance: {Balance}",
            userId, pricing.TokenCost, actionType, newBalance.Balance);

        return transaction;
    }

    public async Task<TokenTransaction> CreditTokens(string userId, int amount, string action, string? referenceId = null, string? description = null)
    {
        // Ensure balance row exists before atomic update
        await GetOrCreateBalance(userId);

        // Detach any tracked TokenBalance to avoid stale state conflicts
        var tracked = _context.ChangeTracker.Entries<TokenBalance>()
            .FirstOrDefault(e => e.Entity.UserId == userId);
        if (tracked != null) tracked.State = EntityState.Detached;

        // Atomic credit: prevents race condition on concurrent credit operations
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE token_balances SET balance = balance + {0}, total_earned = total_earned + {0}, updated_at = NOW() WHERE user_id = {1}",
            amount, userId);

        // Re-read the updated balance for the transaction log
        var newBalance = await _context.TokenBalances
            .AsNoTracking()
            .FirstAsync(b => b.UserId == userId);

        var transaction = new TokenTransaction
        {
            UserId = userId,
            Type = "credit",
            Amount = amount,
            Action = action,
            ReferenceId = referenceId,
            Description = description ?? action,
            BalanceAfter = newBalance.Balance
        };
        _context.TokenTransactions.Add(transaction);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "User {UserId} earned {Tokens} tokens for {Action}. Balance: {Balance}",
            userId, amount, action, newBalance.Balance);

        return transaction;
    }
}
