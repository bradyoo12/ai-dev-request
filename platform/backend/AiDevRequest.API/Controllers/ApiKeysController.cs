using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ApiKeysController : ControllerBase
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<ApiKeysController> _logger;

    public ApiKeysController(AiDevRequestDbContext context, ILogger<ApiKeysController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("User not authenticated.");

    /// <summary>
    /// List all API keys for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ApiKeyDto>>> ListKeys()
    {
        var userId = GetUserId();
        var keys = await _context.ApiKeys
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyDto
            {
                Id = k.Id,
                Name = k.Name,
                KeyPrefix = k.KeyPrefix,
                Status = k.Status.ToString(),
                RequestCount = k.RequestCount,
                CreatedAt = k.CreatedAt,
                LastUsedAt = k.LastUsedAt,
            })
            .ToListAsync();

        return Ok(keys);
    }

    /// <summary>
    /// Generate a new API key
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<GenerateKeyResponseDto>> GenerateKey([FromBody] GenerateKeyRequestDto request)
    {
        var userId = GetUserId();

        // Limit to 5 active keys per user
        var activeCount = await _context.ApiKeys
            .CountAsync(k => k.UserId == userId && k.Status == ApiKeyStatus.Active);

        if (activeCount >= 5)
            return BadRequest(new { error = "Maximum of 5 active API keys allowed." });

        // Generate a secure random key
        var rawKey = GenerateSecureKey();
        var keyHash = HashKey(rawKey);
        var keyPrefix = $"aidev_...{rawKey[^4..]}";

        var apiKey = new ApiKey
        {
            UserId = userId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? "Default" : request.Name.Trim(),
            KeyHash = keyHash,
            KeyPrefix = keyPrefix,
        };

        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync();

        _logger.LogInformation("API key generated for user {UserId}: {KeyId}", userId, apiKey.Id);

        return Ok(new GenerateKeyResponseDto
        {
            Id = apiKey.Id,
            Name = apiKey.Name,
            Key = rawKey, // Only returned once at creation time
            KeyPrefix = keyPrefix,
            CreatedAt = apiKey.CreatedAt,
        });
    }

    /// <summary>
    /// Revoke an API key
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> RevokeKey(Guid id)
    {
        var userId = GetUserId();
        var key = await _context.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == id && k.UserId == userId);

        if (key == null)
            return NotFound(new { error = "API key not found." });

        if (key.Status == ApiKeyStatus.Revoked)
            return BadRequest(new { error = "API key is already revoked." });

        key.Status = ApiKeyStatus.Revoked;
        key.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("API key revoked for user {UserId}: {KeyId}", userId, id);

        return Ok(new { message = "API key revoked." });
    }

    private static string GenerateSecureKey()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return $"aidev_{Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "")[..40]}";
    }

    private static string HashKey(string key)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        return Convert.ToBase64String(hash);
    }
}

public class ApiKeyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string KeyPrefix { get; set; } = "";
    public string Status { get; set; } = "";
    public int RequestCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
}

public class GenerateKeyRequestDto
{
    public string? Name { get; set; }
}

public class GenerateKeyResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Key { get; set; } = "";
    public string KeyPrefix { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
