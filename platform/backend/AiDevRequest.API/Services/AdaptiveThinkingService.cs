using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IAdaptiveThinkingService
{
    Task<AdaptiveThinkingConfig?> GetConfigAsync(string userId);
    Task<AdaptiveThinkingConfig> CreateOrUpdateConfigAsync(string userId, bool enabled, string modelName, string configJson);
}

public class AdaptiveThinkingService : IAdaptiveThinkingService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<AdaptiveThinkingService> _logger;

    public AdaptiveThinkingService(AiDevRequestDbContext db, ILogger<AdaptiveThinkingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<AdaptiveThinkingConfig?> GetConfigAsync(string userId)
    {
        return await _db.AdaptiveThinkingConfigs
            .FirstOrDefaultAsync(c => c.UserId == userId);
    }

    public async Task<AdaptiveThinkingConfig> CreateOrUpdateConfigAsync(string userId, bool enabled, string modelName, string configJson)
    {
        var config = await GetConfigAsync(userId);

        if (config == null)
        {
            config = new AdaptiveThinkingConfig
            {
                UserId = userId,
                Enabled = enabled,
                ModelName = modelName,
                ConfigJson = configJson,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.AdaptiveThinkingConfigs.Add(config);
        }
        else
        {
            config.Enabled = enabled;
            config.ModelName = modelName;
            config.ConfigJson = configJson;
            config.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return config;
    }
}
