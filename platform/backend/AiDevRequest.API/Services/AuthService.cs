using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AiDevRequest.API.Services;

public interface IAuthService
{
    Task<(User User, string Token)> RegisterAsync(string email, string password, string? displayName, string? anonymousUserId);
    Task<(User User, string Token)> LoginAsync(string email, string password);
    Task<User?> GetUserAsync(string userId);
    string GenerateJwt(User user);
}

public class AuthService : IAuthService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AiDevRequestDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<(User User, string Token)> RegisterAsync(string email, string password, string? displayName, string? anonymousUserId)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            throw new InvalidOperationException("An account with this email already exists.");
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            DisplayName = displayName?.Trim(),
            AnonymousUserId = anonymousUserId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Migrate anonymous data if provided
        if (!string.IsNullOrEmpty(anonymousUserId))
        {
            await MigrateAnonymousDataAsync(anonymousUserId, user.Id.ToString());
        }

        _logger.LogInformation("User registered: {Email} (migrated from {AnonymousId})", normalizedEmail, anonymousUserId ?? "none");

        var token = GenerateJwt(user);
        return (user, token);
    }

    public async Task<(User User, string Token)> LoginAsync(string email, string password)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            throw new InvalidOperationException("Invalid email or password.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("User logged in: {Email}", normalizedEmail);

        var token = GenerateJwt(user);
        return (user, token);
    }

    public async Task<User?> GetUserAsync(string userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    public string GenerateJwt(User user)
    {
        var secret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        var issuer = _configuration["Jwt:Issuer"] ?? "AiDevRequest";
        var expiryDays = int.TryParse(_configuration["Jwt:ExpiryDays"], out var days) ? days : 7;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("display_name", user.DisplayName ?? user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (user.IsAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expiryDays),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task MigrateAnonymousDataAsync(string anonymousUserId, string newUserId)
    {
        try
        {
            // Migrate token balances
            var balances = await _context.TokenBalances
                .Where(t => t.UserId == anonymousUserId)
                .ToListAsync();
            foreach (var b in balances) b.UserId = newUserId;

            // Migrate token transactions
            var transactions = await _context.TokenTransactions
                .Where(t => t.UserId == anonymousUserId)
                .ToListAsync();
            foreach (var t in transactions) t.UserId = newUserId;

            // Migrate payments
            var payments = await _context.Payments
                .Where(p => p.UserId == anonymousUserId)
                .ToListAsync();
            foreach (var p in payments) p.UserId = newUserId;

            // Migrate deployments
            var deployments = await _context.Deployments
                .Where(d => d.UserId == anonymousUserId)
                .ToListAsync();
            foreach (var d in deployments) d.UserId = newUserId;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Migrated data from anonymous user {OldId} to {NewId}", anonymousUserId, newUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to migrate data from {OldId} to {NewId}", anonymousUserId, newUserId);
        }
    }
}
