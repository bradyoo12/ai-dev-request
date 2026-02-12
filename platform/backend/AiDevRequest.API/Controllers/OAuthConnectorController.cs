using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/oauth-connectors")]
public class OAuthConnectorController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<OAuthConnectorController> _logger;

    public OAuthConnectorController(AiDevRequestDbContext db, ILogger<OAuthConnectorController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    /// <summary>
    /// List user's connected OAuth connectors
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListConnectors()
    {
        var userId = GetUserId();
        var connectors = await _db.OAuthConnectors
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
        return Ok(connectors);
    }

    /// <summary>
    /// Connect a provider (simulated OAuth flow)
    /// </summary>
    [HttpPost("connect")]
    public async Task<IActionResult> Connect([FromBody] ConnectProviderRequest req)
    {
        var userId = GetUserId();

        // Check if already connected
        var existing = await _db.OAuthConnectors
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == req.Provider && c.Status == "connected");

        if (existing != null)
            return BadRequest(new { error = $"Provider '{req.Provider}' is already connected." });

        var providerMeta = GetProviderMetadata().FirstOrDefault(p => p.Name == req.Provider);
        if (providerMeta == null)
            return BadRequest(new { error = $"Unknown provider: {req.Provider}" });

        // Simulate OAuth token generation
        var fakeToken = GenerateSimulatedToken();
        var tokenHash = HashToken(fakeToken);

        var connector = new OAuthConnector
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Provider = req.Provider,
            DisplayName = providerMeta.DisplayName,
            Status = "connected",
            Scopes = string.Join(", ", providerMeta.Scopes),
            AccessTokenHash = tokenHash,
            RefreshTokenHash = HashToken(GenerateSimulatedToken()),
            TokenExpiresAt = DateTime.UtcNow.AddHours(1),
            ConnectedAt = DateTime.UtcNow,
            IconUrl = providerMeta.IconUrl,
            Category = providerMeta.Category,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.OAuthConnectors.Add(connector);
        await _db.SaveChangesAsync();

        _logger.LogInformation("OAuth connector connected for user {UserId}: {Provider}", userId, req.Provider);

        return Ok(connector);
    }

    /// <summary>
    /// Disconnect (delete) a connector
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Disconnect(Guid id)
    {
        var userId = GetUserId();
        var connector = await _db.OAuthConnectors
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (connector == null)
            return NotFound(new { error = "Connector not found." });

        _db.OAuthConnectors.Remove(connector);
        await _db.SaveChangesAsync();

        _logger.LogInformation("OAuth connector disconnected for user {UserId}: {Provider}", userId, connector.Provider);

        return Ok(new { message = $"Disconnected {connector.Provider}." });
    }

    /// <summary>
    /// List available OAuth providers with metadata
    /// </summary>
    [HttpGet("providers")]
    public IActionResult ListProviders()
    {
        var providers = GetProviderMetadata();
        return Ok(providers);
    }

    /// <summary>
    /// Refresh a connector's token (simulated)
    /// </summary>
    [HttpPost("{id:guid}/refresh")]
    public async Task<IActionResult> RefreshToken(Guid id)
    {
        var userId = GetUserId();
        var connector = await _db.OAuthConnectors
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (connector == null)
            return NotFound(new { error = "Connector not found." });

        if (connector.Status != "connected" && connector.Status != "expired")
            return BadRequest(new { error = "Connector is not in a refreshable state." });

        // Simulate token refresh
        connector.AccessTokenHash = HashToken(GenerateSimulatedToken());
        connector.RefreshTokenHash = HashToken(GenerateSimulatedToken());
        connector.TokenExpiresAt = DateTime.UtcNow.AddHours(1);
        connector.Status = "connected";
        connector.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("OAuth token refreshed for user {UserId}: {Provider}", userId, connector.Provider);

        return Ok(connector);
    }

    /// <summary>
    /// Get connector stats for current user
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var connectors = await _db.OAuthConnectors
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var totalConnected = connectors.Count(c => c.Status == "connected");
        var totalApiCalls = connectors.Sum(c => c.TotalApiCalls);
        var failedApiCalls = connectors.Sum(c => c.FailedApiCalls);

        var byCategory = connectors
            .Where(c => c.Status == "connected")
            .GroupBy(c => c.Category)
            .Select(g => new { category = g.Key, count = g.Count() })
            .ToList();

        return Ok(new
        {
            totalConnected,
            totalApiCalls,
            failedApiCalls,
            byCategory,
            connectors = connectors.Select(c => new
            {
                c.Provider,
                c.DisplayName,
                c.Status,
                c.Category,
                c.TotalApiCalls,
                c.FailedApiCalls,
                c.ConnectedAt,
                c.LastUsedAt
            })
        });
    }

    private static List<ProviderMetadata> GetProviderMetadata() =>
    [
        new ProviderMetadata
        {
            Name = "stripe",
            DisplayName = "Stripe",
            Description = "Payment processing, subscriptions, invoicing, and financial reporting",
            Category = "payments",
            IconUrl = "/icons/stripe.svg",
            Scopes = ["read_write", "payment_intents", "subscriptions", "customers"]
        },
        new ProviderMetadata
        {
            Name = "google",
            DisplayName = "Google",
            Description = "Google Workspace integration: Drive, Sheets, Calendar, and Gmail APIs",
            Category = "productivity",
            IconUrl = "/icons/google.svg",
            Scopes = ["drive.readonly", "sheets", "calendar.events", "gmail.send"]
        },
        new ProviderMetadata
        {
            Name = "notion",
            DisplayName = "Notion",
            Description = "Workspace pages, databases, comments, and content management",
            Category = "productivity",
            IconUrl = "/icons/notion.svg",
            Scopes = ["read_content", "update_content", "insert_content", "read_users"]
        },
        new ProviderMetadata
        {
            Name = "slack",
            DisplayName = "Slack",
            Description = "Channel messaging, user profiles, file sharing, and bot interactions",
            Category = "communication",
            IconUrl = "/icons/slack.svg",
            Scopes = ["channels:read", "chat:write", "users:read", "files:write"]
        },
        new ProviderMetadata
        {
            Name = "github",
            DisplayName = "GitHub",
            Description = "Repository management, issues, pull requests, and Actions workflows",
            Category = "development",
            IconUrl = "/icons/github.svg",
            Scopes = ["repo", "workflow", "read:org", "read:user"]
        },
        new ProviderMetadata
        {
            Name = "supabase",
            DisplayName = "Supabase",
            Description = "Database queries, authentication, storage buckets, and edge functions",
            Category = "database",
            IconUrl = "/icons/supabase.svg",
            Scopes = ["database.read", "database.write", "storage", "auth.admin"]
        }
    ];

    private static string GenerateSimulatedToken()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string HashToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }
}

public record ConnectProviderRequest(string Provider);

public class ProviderMetadata
{
    public string Name { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public string IconUrl { get; set; } = "";
    public string[] Scopes { get; set; } = [];
}
