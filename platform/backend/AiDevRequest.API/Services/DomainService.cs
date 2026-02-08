using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IDomainService
{
    Task<List<DomainSearchResult>> SearchDomainsAsync(string query, string[]? tlds = null);
    Task<Domain> PurchaseDomainAsync(Guid deploymentId, string userId, string domainName, string tld, decimal priceUsd, DomainPaymentMethod paymentMethod);
    Task<Domain?> GetDomainByDeploymentAsync(Guid deploymentId, string userId);
    Task<List<Domain>> GetUserDomainsAsync(string userId);
    Task<Domain?> GetDomainAsync(Guid domainId, string userId);
    Task SetupDomainAsync(Guid domainId);
    Task RemoveDomainAsync(Guid domainId, string userId);
}

public class DomainSearchResult
{
    public string DomainName { get; set; } = "";
    public string Tld { get; set; } = "";
    public bool Available { get; set; }
    public decimal? PriceUsd { get; set; }
}

public class CloudflareDomainService : IDomainService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CloudflareDomainService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    private static readonly string[] DefaultTlds = ["com", "net", "io", "dev", "kr", "app"];

    // Cloudflare at-cost pricing (approximate USD/year)
    private static readonly Dictionary<string, decimal> TldPricing = new()
    {
        ["com"] = 10.11m,
        ["net"] = 10.11m,
        ["org"] = 10.11m,
        ["io"] = 33.98m,
        ["dev"] = 13.00m,
        ["app"] = 15.00m,
        ["kr"] = 18.00m,
        ["co"] = 11.50m,
        ["xyz"] = 10.00m,
    };

    public CloudflareDomainService(
        AiDevRequestDbContext context,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<CloudflareDomainService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task<List<DomainSearchResult>> SearchDomainsAsync(string query, string[]? tlds = null)
    {
        var searchTlds = tlds?.Length > 0 ? tlds : DefaultTlds;
        var sanitized = SanitizeDomainName(query);

        if (string.IsNullOrEmpty(sanitized))
            return [];

        var apiToken = _configuration["Cloudflare:ApiToken"];
        var accountId = _configuration["Cloudflare:AccountId"];

        // If Cloudflare is not configured, use simulation mode
        if (string.IsNullOrEmpty(apiToken) || string.IsNullOrEmpty(accountId))
        {
            _logger.LogInformation("Cloudflare not configured. Using simulation mode for domain search.");
            return SimulateSearch(sanitized, searchTlds);
        }

        var results = new List<DomainSearchResult>();

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

            foreach (var tld in searchTlds)
            {
                var fullDomain = $"{sanitized}.{tld}";
                try
                {
                    var response = await client.GetAsync(
                        $"https://api.cloudflare.com/client/v4/accounts/{accountId}/registrar/domains/{fullDomain}");

                    if (response.IsSuccessStatusCode)
                    {
                        // Domain exists in our account = taken
                        results.Add(new DomainSearchResult
                        {
                            DomainName = fullDomain,
                            Tld = tld,
                            Available = false,
                            PriceUsd = null
                        });
                    }
                    else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        // Check availability via registrar check
                        var checkResponse = await client.GetAsync(
                            $"https://api.cloudflare.com/client/v4/accounts/{accountId}/registrar/domains/{fullDomain}/check");

                        if (checkResponse.IsSuccessStatusCode)
                        {
                            var json = await checkResponse.Content.ReadAsStringAsync();
                            var checkResult = JsonSerializer.Deserialize<CloudflareCheckResponse>(json);
                            var available = checkResult?.Result?.Available ?? false;
                            var price = TldPricing.GetValueOrDefault(tld, 15.00m);

                            results.Add(new DomainSearchResult
                            {
                                DomainName = fullDomain,
                                Tld = tld,
                                Available = available,
                                PriceUsd = available ? price : null
                            });
                        }
                        else
                        {
                            results.Add(new DomainSearchResult
                            {
                                DomainName = fullDomain,
                                Tld = tld,
                                Available = false,
                                PriceUsd = null
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to check domain {Domain}", fullDomain);
                    results.Add(new DomainSearchResult
                    {
                        DomainName = fullDomain,
                        Tld = tld,
                        Available = false,
                        PriceUsd = null
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cloudflare API error during domain search");
            return SimulateSearch(sanitized, searchTlds);
        }

        return results;
    }

    public async Task<Domain> PurchaseDomainAsync(
        Guid deploymentId, string userId, string domainName, string tld,
        decimal priceUsd, DomainPaymentMethod paymentMethod)
    {
        // Check if domain already assigned to this deployment
        var existing = await _context.Domains
            .FirstOrDefaultAsync(d => d.DeploymentId == deploymentId && d.Status != DomainStatus.Cancelled);
        if (existing != null)
            throw new InvalidOperationException("This site already has a custom domain configured.");

        // Check if domain name is already registered in our system
        var fullDomain = $"{domainName}.{tld}";
        if (domainName.Contains('.'))
        {
            fullDomain = domainName;
            var parts = domainName.Split('.');
            tld = parts[^1];
        }

        var domainTaken = await _context.Domains
            .AnyAsync(d => d.DomainName == fullDomain && d.Status != DomainStatus.Cancelled);
        if (domainTaken)
            throw new InvalidOperationException("This domain is already registered in our system.");

        var domain = new Domain
        {
            DeploymentId = deploymentId,
            UserId = userId,
            DomainName = fullDomain,
            Tld = tld,
            AnnualCostUsd = priceUsd,
            Status = DomainStatus.Pending
        };

        _context.Domains.Add(domain);

        // Create transaction record
        var transaction = new DomainTransaction
        {
            DomainId = domain.Id,
            UserId = userId,
            Type = DomainTransactionType.Purchase,
            AmountUsd = priceUsd,
            PaymentMethod = paymentMethod,
            TokenAmount = paymentMethod == DomainPaymentMethod.Tokens
                ? (int)(priceUsd * 100) // 100 tokens per dollar
                : null,
            Description = $"Domain registration: {fullDomain} (1 year)"
        };

        _context.DomainTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Domain purchase initiated: {Domain} for deployment {DeploymentId} by user {UserId}",
            fullDomain, deploymentId, userId);

        return domain;
    }

    public async Task<Domain?> GetDomainByDeploymentAsync(Guid deploymentId, string userId)
    {
        return await _context.Domains
            .FirstOrDefaultAsync(d => d.DeploymentId == deploymentId && d.UserId == userId && d.Status != DomainStatus.Cancelled);
    }

    public async Task<List<Domain>> GetUserDomainsAsync(string userId)
    {
        return await _context.Domains
            .Where(d => d.UserId == userId && d.Status != DomainStatus.Cancelled)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<Domain?> GetDomainAsync(Guid domainId, string userId)
    {
        return await _context.Domains
            .FirstOrDefaultAsync(d => d.Id == domainId && d.UserId == userId);
    }

    public async Task SetupDomainAsync(Guid domainId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AiDevRequestDbContext>();

        var domain = await context.Domains.FindAsync(domainId);
        if (domain == null) return;

        var apiToken = _configuration["Cloudflare:ApiToken"];
        var accountId = _configuration["Cloudflare:AccountId"];
        var zoneId = _configuration["Cloudflare:ZoneId"];

        // If Cloudflare not configured, simulate the setup pipeline
        if (string.IsNullOrEmpty(apiToken) || string.IsNullOrEmpty(accountId))
        {
            _logger.LogInformation("Cloudflare not configured. Simulating domain setup for {Domain}", domain.DomainName);
            await SimulateDomainSetupAsync(context, domain);
            return;
        }

        try
        {
            // Step 1: Register domain
            domain.Status = DomainStatus.Registering;
            domain.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

            var registerPayload = new
            {
                name = domain.DomainName,
                auto_renew = domain.AutoRenew
            };

            var registerResponse = await client.PostAsJsonAsync(
                $"https://api.cloudflare.com/client/v4/accounts/{accountId}/registrar/domains/{domain.DomainName}/register",
                registerPayload);

            if (!registerResponse.IsSuccessStatusCode)
            {
                var errorBody = await registerResponse.Content.ReadAsStringAsync();
                _logger.LogError("Domain registration failed for {Domain}: {Error}", domain.DomainName, errorBody);
                domain.Status = DomainStatus.Pending;
                domain.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
                return;
            }

            domain.RegisteredAt = DateTime.UtcNow;
            domain.ExpiresAt = DateTime.UtcNow.AddYears(1);
            domain.Status = DomainStatus.Active;
            domain.UpdatedAt = DateTime.UtcNow;

            // Step 2: Configure DNS
            domain.DnsStatus = DomainDnsStatus.Configuring;
            await context.SaveChangesAsync();

            var deployment = await context.Deployments.FindAsync(domain.DeploymentId);
            if (deployment?.PreviewUrl != null)
            {
                var targetHost = new Uri(deployment.PreviewUrl).Host;

                // Create CNAME record
                var dnsPayload = new
                {
                    type = "CNAME",
                    name = domain.DomainName,
                    content = targetHost,
                    ttl = 300,
                    proxied = true
                };

                if (!string.IsNullOrEmpty(zoneId))
                {
                    await client.PostAsJsonAsync(
                        $"https://api.cloudflare.com/client/v4/zones/{zoneId}/dns_records",
                        dnsPayload);
                }

                domain.DnsStatus = DomainDnsStatus.Propagated;
            }
            else
            {
                domain.DnsStatus = DomainDnsStatus.Failed;
            }

            // Step 3: SSL (Cloudflare provides automatic SSL)
            domain.SslStatus = DomainSslStatus.Active;
            domain.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            _logger.LogInformation("Domain setup completed for {Domain}", domain.DomainName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Domain setup failed for {Domain}", domain.DomainName);

            domain.Status = DomainStatus.Pending;
            domain.DnsStatus = DomainDnsStatus.Failed;
            domain.SslStatus = DomainSslStatus.Failed;
            domain.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }
    }

    public async Task RemoveDomainAsync(Guid domainId, string userId)
    {
        var domain = await _context.Domains
            .FirstOrDefaultAsync(d => d.Id == domainId && d.UserId == userId);

        if (domain == null)
            throw new InvalidOperationException("Domain not found.");

        domain.Status = DomainStatus.Cancelled;
        domain.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Domain {Domain} removed (cancelled) by user {UserId}", domain.DomainName, userId);
    }

    private static string SanitizeDomainName(string query)
    {
        // Remove protocol, path, and whitespace
        var name = query.Trim().ToLowerInvariant();
        if (name.Contains("://"))
            name = name[(name.IndexOf("://") + 3)..];
        if (name.Contains('/'))
            name = name[..name.IndexOf('/')];
        // Remove any existing TLD for the search base
        if (name.Contains('.'))
            name = name[..name.IndexOf('.')];
        // Keep only valid domain chars
        name = new string(name.Where(c => char.IsLetterOrDigit(c) || c == '-').ToArray());
        // Remove leading/trailing hyphens
        name = name.Trim('-');
        // Max 63 chars per DNS label
        if (name.Length > 63) name = name[..63];
        return name;
    }

    private static List<DomainSearchResult> SimulateSearch(string name, string[] tlds)
    {
        // Deterministic simulation: .com/.app "taken", others available
        var takenTlds = new HashSet<string> { "com", "app" };
        return tlds.Select(tld => new DomainSearchResult
        {
            DomainName = $"{name}.{tld}",
            Tld = tld,
            Available = !takenTlds.Contains(tld),
            PriceUsd = takenTlds.Contains(tld) ? null : TldPricing.GetValueOrDefault(tld, 15.00m)
        }).ToList();
    }

    private static async Task SimulateDomainSetupAsync(AiDevRequestDbContext context, Domain domain)
    {
        // Step 1: Registering
        domain.Status = DomainStatus.Registering;
        domain.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await Task.Delay(1000);

        // Step 2: Registered
        domain.RegisteredAt = DateTime.UtcNow;
        domain.ExpiresAt = DateTime.UtcNow.AddYears(1);
        domain.Status = DomainStatus.Active;
        domain.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await Task.Delay(500);

        // Step 3: DNS
        domain.DnsStatus = DomainDnsStatus.Configuring;
        await context.SaveChangesAsync();
        await Task.Delay(500);

        domain.DnsStatus = DomainDnsStatus.Propagated;
        await context.SaveChangesAsync();
        await Task.Delay(500);

        // Step 4: SSL
        domain.SslStatus = DomainSslStatus.Provisioning;
        await context.SaveChangesAsync();
        await Task.Delay(500);

        domain.SslStatus = DomainSslStatus.Active;
        domain.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
    }
}

// Cloudflare API response models
internal class CloudflareCheckResponse
{
    [JsonPropertyName("result")]
    public CloudflareCheckResult? Result { get; set; }
}

internal class CloudflareCheckResult
{
    [JsonPropertyName("available")]
    public bool Available { get; set; }
}
