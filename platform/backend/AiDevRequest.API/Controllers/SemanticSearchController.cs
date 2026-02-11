using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/semantic-search")]
public class SemanticSearchController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public SemanticSearchController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() => User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? "anonymous";

    // GET /api/semantic-search/index/{sourceType}
    [HttpGet("index/{sourceType}")]
    public async Task<IActionResult> ListBySourceType(string sourceType)
    {
        var userId = GetUserId();
        var items = await _db.SemanticIndexes
            .Where(s => s.UserId == userId && s.SourceType == sourceType)
            .OrderByDescending(s => s.IndexedAt)
            .Take(100)
            .Select(s => new
            {
                s.Id,
                s.SourceType,
                s.SourceId,
                s.Title,
                s.ContentHash,
                s.Dimensions,
                s.IndexedAt,
                s.CreatedAt,
                s.UpdatedAt
            })
            .ToListAsync();
        return Ok(items);
    }

    // POST /api/semantic-search/index
    [HttpPost("index")]
    public async Task<IActionResult> IndexItem([FromBody] IndexItemRequest req)
    {
        var userId = GetUserId();

        // Compute content hash for dedup
        var contentHash = ComputeSha256(req.Content);

        // Check for duplicate
        var existing = await _db.SemanticIndexes
            .FirstOrDefaultAsync(s => s.UserId == userId && s.ContentHash == contentHash);
        if (existing != null)
        {
            existing.Title = req.Title;
            existing.SourceType = req.SourceType;
            existing.SourceId = req.SourceId;
            existing.Content = req.Content;
            existing.EmbeddingJson = JsonSerializer.Serialize(GeneratePseudoEmbedding(req.Content, 1536));
            existing.IndexedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        var embedding = GeneratePseudoEmbedding(req.Content, 1536);

        var item = new SemanticIndex
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SourceType = req.SourceType,
            SourceId = req.SourceId,
            Title = req.Title,
            Content = req.Content,
            ContentHash = contentHash,
            EmbeddingJson = JsonSerializer.Serialize(embedding),
            Dimensions = 1536,
            IndexedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.SemanticIndexes.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item);
    }

    // POST /api/semantic-search/query
    [HttpPost("query")]
    public async Task<IActionResult> SemanticQuery([FromBody] SemanticQueryRequest req)
    {
        var userId = GetUserId();
        var topK = req.TopK > 0 ? Math.Min(req.TopK, 50) : 5;

        var queryEmbedding = GeneratePseudoEmbedding(req.Query, 1536);

        var query = _db.SemanticIndexes.Where(s => s.UserId == userId);
        if (!string.IsNullOrEmpty(req.SourceType))
        {
            query = query.Where(s => s.SourceType == req.SourceType);
        }

        var allItems = await query.ToListAsync();

        var results = allItems
            .Select(item =>
            {
                var itemEmbedding = JsonSerializer.Deserialize<float[]>(item.EmbeddingJson) ?? Array.Empty<float>();
                var similarity = CosineSimilarity(queryEmbedding, itemEmbedding);
                return new
                {
                    item.Id,
                    item.SourceType,
                    item.SourceId,
                    item.Title,
                    item.Content,
                    item.IndexedAt,
                    Similarity = Math.Round(similarity, 4)
                };
            })
            .OrderByDescending(r => r.Similarity)
            .Take(topK)
            .ToList();

        return Ok(results);
    }

    // DELETE /api/semantic-search/index/{id}
    [HttpDelete("index/{id}")]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        var userId = GetUserId();
        var item = await _db.SemanticIndexes
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (item == null) return NotFound();

        _db.SemanticIndexes.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { deleted = true });
    }

    // GET /api/semantic-search/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var items = await _db.SemanticIndexes
            .Where(s => s.UserId == userId)
            .ToListAsync();

        var totalIndexed = items.Count;
        var bySourceType = items
            .GroupBy(s => s.SourceType)
            .Select(g => new { sourceType = g.Key, count = g.Count() })
            .ToList();
        var dimensions = items.FirstOrDefault()?.Dimensions ?? 1536;
        var lastIndexed = items.OrderByDescending(s => s.IndexedAt).FirstOrDefault()?.IndexedAt;
        var totalContentSize = items.Sum(s => (long)s.Content.Length);

        return Ok(new
        {
            totalIndexed,
            bySourceType,
            dimensions,
            lastIndexed,
            totalContentSize
        });
    }

    // --- Helpers ---

    private static string ComputeSha256(string text)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Generate a deterministic pseudo-embedding from text content.
    /// Uses SHA-256 hash as seed for reproducible float values.
    /// </summary>
    private static float[] GeneratePseudoEmbedding(string text, int dimensions)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(text));
        var seed = BitConverter.ToInt32(hash, 0);
        var rng = new Random(seed);

        var embedding = new float[dimensions];
        double magnitude = 0;
        for (int i = 0; i < dimensions; i++)
        {
            embedding[i] = (float)(rng.NextDouble() * 2 - 1);
            magnitude += embedding[i] * embedding[i];
        }

        // Normalize to unit vector
        magnitude = Math.Sqrt(magnitude);
        if (magnitude > 0)
        {
            for (int i = 0; i < dimensions; i++)
            {
                embedding[i] /= (float)magnitude;
            }
        }

        return embedding;
    }

    /// <summary>
    /// Compute cosine similarity between two vectors.
    /// </summary>
    private static double CosineSimilarity(float[] a, float[] b)
    {
        if (a.Length == 0 || b.Length == 0) return 0;
        var len = Math.Min(a.Length, b.Length);

        double dot = 0, magA = 0, magB = 0;
        for (int i = 0; i < len; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }

        var denominator = Math.Sqrt(magA) * Math.Sqrt(magB);
        if (denominator == 0) return 0;
        return dot / denominator;
    }
}

public record IndexItemRequest(string SourceType, string SourceId, string Title, string Content);
public record SemanticQueryRequest(string Query, string? SourceType, int TopK = 5);
