using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/vector-search")]
[Authorize]
public class VectorSearchController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public VectorSearchController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet]
    public async Task<IActionResult> ListConfigs()
    {
        var userId = GetUserId();
        var configs = await _db.VectorSearchConfigs.Where(c => c.UserId == userId).OrderByDescending(c => c.UpdatedAt).Take(50).ToListAsync();
        return Ok(configs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetConfig(Guid id)
    {
        var userId = GetUserId();
        var config = await _db.VectorSearchConfigs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (config == null) return NotFound();
        return Ok(config);
    }

    public record CreateConfigRequest(string? IndexName, string? Provider, string? SearchMode, string? FusionAlgorithm, double? VectorWeight, double? KeywordWeight, int? TopK, double? SimilarityThreshold, bool? QueryExpansion, bool? MetadataFiltering);

    [HttpPost]
    public async Task<IActionResult> CreateConfig([FromBody] CreateConfigRequest req)
    {
        var userId = GetUserId();
        var count = await _db.VectorSearchConfigs.CountAsync(c => c.UserId == userId);
        if (count >= 20) return BadRequest("Maximum 20 indexes per user");

        var config = new VectorSearchConfig
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            IndexName = req.IndexName ?? "default",
            Provider = req.Provider ?? "qdrant",
            SearchMode = req.SearchMode ?? "hybrid",
            FusionAlgorithm = req.FusionAlgorithm ?? "rrf",
            VectorWeight = req.VectorWeight ?? 0.7,
            KeywordWeight = req.KeywordWeight ?? 0.3,
            TopK = req.TopK ?? 10,
            SimilarityThreshold = req.SimilarityThreshold ?? 0.7,
            QueryExpansion = req.QueryExpansion ?? true,
            MetadataFiltering = req.MetadataFiltering ?? true,
        };

        _db.VectorSearchConfigs.Add(config);
        await _db.SaveChangesAsync();
        return Ok(config);
    }

    public record SearchRequest(string Query, string? SearchMode, string? Provider);

    [HttpPost("query")]
    public async Task<IActionResult> RunQuery([FromBody] SearchRequest req)
    {
        var userId = GetUserId();
        var rng = new Random();

        // Simulated search results
        var results = Enumerable.Range(0, rng.Next(3, 8)).Select(i => new
        {
            id = Guid.NewGuid().ToString(),
            title = GetSampleTitle(rng),
            content = "Matched organizational memory content...",
            score = Math.Round(rng.NextDouble() * 0.3 + 0.7, 3),
            vectorScore = Math.Round(rng.NextDouble() * 0.3 + 0.7, 3),
            keywordScore = Math.Round(rng.NextDouble() * 0.4 + 0.5, 3),
            fusedScore = Math.Round(rng.NextDouble() * 0.2 + 0.8, 3),
            source = new[] { "decision", "pattern", "standard", "runbook" }[rng.Next(4)],
            latencyMs = Math.Round(rng.NextDouble() * 25 + 5, 1),
        }).OrderByDescending(r => r.fusedScore).ToList();

        // Update stats on a random config
        var config = await _db.VectorSearchConfigs.FirstOrDefaultAsync(c => c.UserId == userId);
        if (config != null)
        {
            config.TotalQueries++;
            config.AvgQueryLatencyMs = Math.Round((config.AvgQueryLatencyMs * (config.TotalQueries - 1) + results.Average(r => r.latencyMs)) / config.TotalQueries, 1);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            query = req.Query,
            mode = req.SearchMode ?? "hybrid",
            totalResults = results.Count,
            avgLatencyMs = Math.Round(results.Average(r => r.latencyMs), 1),
            results,
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteConfig(Guid id)
    {
        var userId = GetUserId();
        var config = await _db.VectorSearchConfigs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (config == null) return NotFound();

        _db.VectorSearchConfigs.Remove(config);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var configs = await _db.VectorSearchConfigs.Where(c => c.UserId == userId).ToListAsync();
        if (configs.Count == 0)
            return Ok(new { totalIndexes = 0, totalVectors = 0L, totalQueries = 0L, avgLatency = 0.0, byProvider = Array.Empty<object>(), byMode = Array.Empty<object>() });

        var byProvider = configs.GroupBy(c => c.Provider).Select(g => new { provider = g.Key, count = g.Count(), queries = g.Sum(c => c.TotalQueries) }).ToList();
        var byMode = configs.GroupBy(c => c.SearchMode).Select(g => new { mode = g.Key, count = g.Count() }).ToList();

        return Ok(new
        {
            totalIndexes = configs.Count,
            totalVectors = configs.Sum(c => c.TotalVectors),
            totalQueries = configs.Sum(c => c.TotalQueries),
            avgLatency = Math.Round(configs.Where(c => c.AvgQueryLatencyMs > 0).DefaultIfEmpty().Average(c => c?.AvgQueryLatencyMs ?? 0), 1),
            byProvider,
            byMode
        });
    }

    [AllowAnonymous]
    [HttpGet("providers")]
    public IActionResult GetProviders()
    {
        var providers = new[]
        {
            new { id = "qdrant", name = "Qdrant", description = "Universal Query API with multi-stage hybrid search", color = "#DC382C" },
            new { id = "pinecone", name = "Pinecone", description = "Managed vector database with metadata filtering fusion", color = "#000000" },
            new { id = "weaviate", name = "Weaviate", description = "Hybrid search with BM25 + vector similarity", color = "#00A98E" },
            new { id = "pgvector", name = "pgvector", description = "PostgreSQL extension for vector similarity search", color = "#336791" },
        };
        return Ok(providers);
    }

    private static string GetSampleTitle(Random rng)
    {
        var titles = new[]
        {
            "Architecture decision: microservices vs monolith",
            "TypeScript strict mode enforcement pattern",
            "Database migration strategy for v2.0",
            "CI/CD pipeline optimization runbook",
            "Security audit checklist standard",
            "React component naming convention",
        };
        return titles[rng.Next(titles.Length)];
    }
}
