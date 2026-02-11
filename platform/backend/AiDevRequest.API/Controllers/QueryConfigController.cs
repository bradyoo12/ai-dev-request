using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/query-config")]
[Authorize]
public class QueryConfigController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public QueryConfigController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var userId = GetUserId();
        var config = await _db.QueryConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null)
        {
            config = new QueryConfig { Id = Guid.NewGuid(), UserId = userId };
            _db.QueryConfigs.Add(config);
            await _db.SaveChangesAsync();
        }
        return Ok(config);
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateConfig([FromBody] UpdateQueryConfigRequest request)
    {
        var userId = GetUserId();
        var config = await _db.QueryConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config == null) return NotFound();

        if (request.StaleTimeMs.HasValue) config.StaleTimeMs = request.StaleTimeMs.Value;
        if (request.CacheTimeMs.HasValue) config.CacheTimeMs = request.CacheTimeMs.Value;
        if (request.RetryCount.HasValue) config.RetryCount = request.RetryCount.Value;
        if (request.RetryDelayMs.HasValue) config.RetryDelayMs = request.RetryDelayMs.Value;
        if (request.RefetchOnWindowFocus.HasValue) config.RefetchOnWindowFocus = request.RefetchOnWindowFocus.Value;
        if (request.RefetchOnReconnect.HasValue) config.RefetchOnReconnect = request.RefetchOnReconnect.Value;
        if (request.RefetchOnMount.HasValue) config.RefetchOnMount = request.RefetchOnMount.Value;
        if (request.EnableDevtools.HasValue) config.EnableDevtools = request.EnableDevtools.Value;
        if (request.EnableGarbageCollection.HasValue) config.EnableGarbageCollection = request.EnableGarbageCollection.Value;
        if (request.EnableOptimisticUpdates.HasValue) config.EnableOptimisticUpdates = request.EnableOptimisticUpdates.Value;

        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(config);
    }

    [HttpGet("presets")]
    public IActionResult GetPresets()
    {
        var presets = new[]
        {
            new { id = "aggressive", name = "Aggressive Caching", description = "Long stale time, aggressive background refetch", staleTimeMs = 600000, cacheTimeMs = 1800000, retryCount = 3, refetchOnWindowFocus = true },
            new { id = "balanced", name = "Balanced", description = "Default balance of freshness and performance", staleTimeMs = 300000, cacheTimeMs = 600000, retryCount = 2, refetchOnWindowFocus = true },
            new { id = "fresh", name = "Always Fresh", description = "Short stale time, frequent refetching for real-time data", staleTimeMs = 30000, cacheTimeMs = 60000, retryCount = 1, refetchOnWindowFocus = true },
            new { id = "offline", name = "Offline First", description = "Maximum caching for offline-capable apps", staleTimeMs = 3600000, cacheTimeMs = 86400000, retryCount = 5, refetchOnWindowFocus = false },
        };
        return Ok(presets);
    }

    [HttpGet("query-patterns")]
    public IActionResult GetQueryPatterns()
    {
        var patterns = new[]
        {
            new { id = "basic", name = "Basic Query", description = "Simple data fetching with useQuery", code = "const { data, isLoading } = useQuery({\n  queryKey: ['items'],\n  queryFn: () => fetchItems(),\n})", category = "Fetching" },
            new { id = "dependent", name = "Dependent Query", description = "Query that depends on another query's result", code = "const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })\nconst { data: posts } = useQuery({\n  queryKey: ['posts', user?.id],\n  queryFn: () => fetchPosts(user!.id),\n  enabled: !!user?.id,\n})", category = "Fetching" },
            new { id = "paginated", name = "Paginated Query", description = "Fetch data page by page with keepPreviousData", code = "const { data } = useQuery({\n  queryKey: ['items', page],\n  queryFn: () => fetchItems(page),\n  placeholderData: keepPreviousData,\n})", category = "Fetching" },
            new { id = "mutation", name = "Basic Mutation", description = "Create/update/delete operations", code = "const mutation = useMutation({\n  mutationFn: createItem,\n  onSuccess: () => {\n    queryClient.invalidateQueries({ queryKey: ['items'] })\n  },\n})", category = "Mutations" },
            new { id = "optimistic", name = "Optimistic Update", description = "Instant UI feedback before server confirms", code = "const mutation = useMutation({\n  mutationFn: updateItem,\n  onMutate: async (newItem) => {\n    await queryClient.cancelQueries({ queryKey: ['items'] })\n    const prev = queryClient.getQueryData(['items'])\n    queryClient.setQueryData(['items'], old => [...old, newItem])\n    return { prev }\n  },\n  onError: (err, item, ctx) => {\n    queryClient.setQueryData(['items'], ctx.prev)\n  },\n})", category = "Mutations" },
            new { id = "prefetch", name = "Prefetch on Hover", description = "Prefetch data when user hovers over a link", code = "const prefetchItem = (id) => {\n  queryClient.prefetchQuery({\n    queryKey: ['item', id],\n    queryFn: () => fetchItem(id),\n    staleTime: 60000,\n  })\n}", category = "Advanced" },
        };
        return Ok(patterns);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var config = await _db.QueryConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        return Ok(new
        {
            totalQueries = config?.TotalQueries ?? 0,
            totalMutations = config?.TotalMutations ?? 0,
            cacheHits = config?.CacheHits ?? 0,
            cacheMisses = config?.CacheMisses ?? 0,
            cacheHitRate = config != null && (config.CacheHits + config.CacheMisses) > 0
                ? Math.Round((double)config.CacheHits / (config.CacheHits + config.CacheMisses) * 100, 1)
                : 0,
            staleTimeMs = config?.StaleTimeMs ?? 300000,
            cacheTimeMs = config?.CacheTimeMs ?? 600000,
            retryCount = config?.RetryCount ?? 2,
            activePreset = config?.StaleTimeMs switch
            {
                600000 => "Aggressive Caching",
                30000 => "Always Fresh",
                3600000 => "Offline First",
                _ => "Balanced"
            },
        });
    }
}

public class UpdateQueryConfigRequest
{
    public int? StaleTimeMs { get; set; }
    public int? CacheTimeMs { get; set; }
    public int? RetryCount { get; set; }
    public int? RetryDelayMs { get; set; }
    public bool? RefetchOnWindowFocus { get; set; }
    public bool? RefetchOnReconnect { get; set; }
    public bool? RefetchOnMount { get; set; }
    public bool? EnableDevtools { get; set; }
    public bool? EnableGarbageCollection { get; set; }
    public bool? EnableOptimisticUpdates { get; set; }
}
