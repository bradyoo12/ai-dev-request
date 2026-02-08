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

        var balance = await GetOrCreateBalance(userId);

        if (balance.Balance < pricing.TokenCost)
            throw new InvalidOperationException("Insufficient tokens");

        balance.Balance -= pricing.TokenCost;
        balance.TotalSpent += pricing.TokenCost;
        balance.UpdatedAt = DateTime.UtcNow;

        var transaction = new TokenTransaction
        {
            UserId = userId,
            Type = "debit",
            Amount = pricing.TokenCost,
            Action = actionType,
            ReferenceId = referenceId,
            Description = pricing.Description ?? actionType,
            BalanceAfter = balance.Balance
        };
        _context.TokenTransactions.Add(transaction);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "User {UserId} spent {Tokens} tokens on {Action}. Balance: {Balance}",
            userId, pricing.TokenCost, actionType, balance.Balance);

        return transaction;
    }

    public async Task<TokenTransaction> CreditTokens(string userId, int amount, string action, string? referenceId = null, string? description = null)
    {
        var balance = await GetOrCreateBalance(userId);

        balance.Balance += amount;
        balance.TotalEarned += amount;
        balance.UpdatedAt = DateTime.UtcNow;

        var transaction = new TokenTransaction
        {
            UserId = userId,
            Type = "credit",
            Amount = amount,
            Action = action,
            ReferenceId = referenceId,
            Description = description ?? action,
            BalanceAfter = balance.Balance
        };
        _context.TokenTransactions.Add(transaction);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "User {UserId} earned {Tokens} tokens for {Action}. Balance: {Balance}",
            userId, amount, action, balance.Balance);

        return transaction;
    }
}
