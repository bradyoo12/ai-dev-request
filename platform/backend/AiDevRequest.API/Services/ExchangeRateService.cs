using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace AiDevRequest.API.Services;

public interface IExchangeRateService
{
    /// <summary>
    /// Returns the current exchange rate for a currency code (from DB/cache). USD always returns 1.0.
    /// </summary>
    Task<decimal> GetRateAsync(string currencyCode);

    /// <summary>
    /// Simulated daily sync — stores demo rates for KRW=1400, JPY=155, EUR=0.92.
    /// </summary>
    Task SyncRatesAsync();

    /// <summary>
    /// Calculates credit amount from a local price and exchange rate: floor(localPrice / rate * 100).
    /// </summary>
    int CalculateCredits(decimal localPrice, decimal rate);

    /// <summary>
    /// Returns all stored exchange rates.
    /// </summary>
    Task<List<ExchangeRate>> GetAllRatesAsync();
}

public class ExchangeRateService : IExchangeRateService
{
    private readonly AiDevRequestDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ExchangeRateService> _logger;

    private const string CacheKeyPrefix = "exchange_rate_";
    private const string AllRatesCacheKey = "exchange_rates_all";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(24);

    public ExchangeRateService(
        AiDevRequestDbContext context,
        IMemoryCache cache,
        ILogger<ExchangeRateService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<decimal> GetRateAsync(string currencyCode)
    {
        var code = currencyCode.ToUpperInvariant();

        // USD is always 1.0
        if (code == "USD")
            return 1.0m;

        var cacheKey = CacheKeyPrefix + code;

        if (_cache.TryGetValue(cacheKey, out decimal cachedRate))
            return cachedRate;

        var rate = await _context.ExchangeRates
            .Where(r => r.CurrencyCode == code)
            .OrderByDescending(r => r.FetchedAt)
            .Select(r => r.RateToUsd)
            .FirstOrDefaultAsync();

        if (rate == 0)
        {
            _logger.LogWarning("Exchange rate not found for {CurrencyCode}, returning 1.0", code);
            return 1.0m;
        }

        _cache.Set(cacheKey, rate, CacheDuration);
        return rate;
    }

    public async Task SyncRatesAsync()
    {
        var demoRates = new Dictionary<string, decimal>
        {
            ["KRW"] = 1400m,
            ["JPY"] = 155m,
            ["EUR"] = 0.92m,
        };

        var now = DateTime.UtcNow;

        foreach (var (code, rate) in demoRates)
        {
            var existing = await _context.ExchangeRates
                .Where(r => r.CurrencyCode == code)
                .OrderByDescending(r => r.FetchedAt)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.RateToUsd = rate;
                existing.FetchedAt = now;
            }
            else
            {
                _context.ExchangeRates.Add(new ExchangeRate
                {
                    CurrencyCode = code,
                    RateToUsd = rate,
                    FetchedAt = now,
                });
            }

            // Invalidate cache for this currency
            _cache.Remove(CacheKeyPrefix + code);
        }

        // Invalidate all-rates cache
        _cache.Remove(AllRatesCacheKey);

        await _context.SaveChangesAsync();
        _logger.LogInformation("Exchange rates synced: {Rates}", string.Join(", ", demoRates.Select(r => $"{r.Key}={r.Value}")));
    }

    public int CalculateCredits(decimal localPrice, decimal rate)
    {
        if (rate <= 0)
            return 0;

        // floor(localPrice / rate * 100)
        return (int)Math.Floor(localPrice / rate * 100);
    }

    public async Task<List<ExchangeRate>> GetAllRatesAsync()
    {
        if (_cache.TryGetValue(AllRatesCacheKey, out List<ExchangeRate>? cachedRates) && cachedRates != null)
            return cachedRates;

        // Get the latest rate for each currency
        var rates = await _context.ExchangeRates
            .GroupBy(r => r.CurrencyCode)
            .Select(g => g.OrderByDescending(r => r.FetchedAt).First())
            .ToListAsync();

        _cache.Set(AllRatesCacheKey, rates, CacheDuration);
        return rates;
    }
}
