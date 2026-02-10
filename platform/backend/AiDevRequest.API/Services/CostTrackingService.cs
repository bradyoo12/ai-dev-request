using System.Collections.Concurrent;

namespace AiDevRequest.API.Services;

/// <summary>
/// A single entry in the cost-tracking ledger for one AI call.
/// </summary>
public record CostEntry
{
    public ModelTier Tier { get; init; }
    public TaskCategory Category { get; init; }
    public int InputTokens { get; init; }
    public int OutputTokens { get; init; }
    public decimal EstimatedCost { get; init; }
    public DateTime TrackedAt { get; init; } = DateTime.UtcNow;
}

/// <summary>
/// Aggregated cost report for a single development request.
/// </summary>
public record CostReport
{
    /// <summary>Total estimated cost across all AI calls for the request (USD).</summary>
    public decimal TotalEstimatedCost { get; init; }

    /// <summary>
    /// How much money was saved compared to routing every call through Opus (USD).
    /// A positive value means the heterogeneous approach was cheaper.
    /// </summary>
    public decimal EstimatedSavingsVsOpusOnly { get; init; }

    /// <summary>Per-call breakdown of tier, category, tokens, and cost.</summary>
    public List<CostEntry> TierBreakdown { get; init; } = new();
}

/// <summary>
/// Tracks token usage and estimated costs per development request.
/// </summary>
public interface ICostTrackingService
{
    /// <summary>
    /// Records a single AI call's token usage for a request.
    /// </summary>
    void TrackUsage(Guid requestId, ModelTier tier, int inputTokens, int outputTokens, TaskCategory category);

    /// <summary>
    /// Builds a cost report for the given request, including savings estimate.
    /// </summary>
    CostReport GetCostReport(Guid requestId);
}

/// <summary>
/// In-memory implementation of <see cref="ICostTrackingService"/>.
/// Stores usage per request in a thread-safe dictionary. Not persisted to DB.
/// </summary>
public class CostTrackingService : ICostTrackingService
{
    private readonly IModelRouterService _modelRouter;
    private readonly ILogger<CostTrackingService> _logger;
    private readonly ConcurrentDictionary<Guid, List<CostEntry>> _usageStore = new();

    public CostTrackingService(IModelRouterService modelRouter, ILogger<CostTrackingService> logger)
    {
        _modelRouter = modelRouter;
        _logger = logger;
    }

    /// <inheritdoc />
    public void TrackUsage(Guid requestId, ModelTier tier, int inputTokens, int outputTokens, TaskCategory category)
    {
        var costPerMillion = _modelRouter.GetEstimatedCostPerToken(tier);
        var totalTokens = inputTokens + outputTokens;
        var estimatedCost = totalTokens * costPerMillion / 1_000_000m;

        var entry = new CostEntry
        {
            Tier = tier,
            Category = category,
            InputTokens = inputTokens,
            OutputTokens = outputTokens,
            EstimatedCost = estimatedCost
        };

        _usageStore.AddOrUpdate(
            requestId,
            _ => new List<CostEntry> { entry },
            (_, existing) =>
            {
                lock (existing)
                {
                    existing.Add(entry);
                }
                return existing;
            });

        _logger.LogInformation(
            "Cost tracked for {RequestId}: {Tier}/{Category} — {InputTokens}+{OutputTokens} tokens ≈ ${Cost:F6}",
            requestId, tier, category, inputTokens, outputTokens, estimatedCost);
    }

    /// <inheritdoc />
    public CostReport GetCostReport(Guid requestId)
    {
        if (!_usageStore.TryGetValue(requestId, out var entries) || entries.Count == 0)
        {
            return new CostReport
            {
                TotalEstimatedCost = 0,
                EstimatedSavingsVsOpusOnly = 0,
                TierBreakdown = new List<CostEntry>()
            };
        }

        List<CostEntry> snapshot;
        lock (entries)
        {
            snapshot = new List<CostEntry>(entries);
        }

        var totalCost = snapshot.Sum(e => e.EstimatedCost);

        // Calculate what it would have cost if every call used Opus
        var opusCostPerMillion = _modelRouter.GetEstimatedCostPerToken(ModelTier.Opus);
        var totalTokensAllCalls = snapshot.Sum(e => (long)(e.InputTokens + e.OutputTokens));
        var opusOnlyCost = totalTokensAllCalls * opusCostPerMillion / 1_000_000m;

        var savings = opusOnlyCost - totalCost;

        return new CostReport
        {
            TotalEstimatedCost = totalCost,
            EstimatedSavingsVsOpusOnly = savings,
            TierBreakdown = snapshot
        };
    }
}
