using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/project-index")]
[Authorize]
public class ProjectIndexController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;

    public ProjectIndexController(AiDevRequestDbContext db)
    {
        _db = db;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    /// <summary>
    /// Get index summary for a project — total files, indexed count, stale count
    /// </summary>
    [HttpGet("summary/{projectId:guid}")]
    public async Task<ActionResult<ProjectIndexSummaryDto>> GetSummary(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var indexes = await _db.ProjectIndexes
            .Where(i => i.UserId == userId && i.DevRequestId == projectId)
            .ToListAsync();

        return Ok(new ProjectIndexSummaryDto
        {
            ProjectId = projectId,
            TotalFiles = indexes.Count,
            IndexedFiles = indexes.Count(i => i.EmbeddingJson != null),
            StaleFiles = indexes.Count(i => i.NeedsReindex),
            UserModifiedFiles = indexes.Count(i => i.IsUserModified),
            TotalSizeBytes = indexes.Sum(i => i.FileSize),
            Languages = indexes.Select(i => i.Language).Where(l => !string.IsNullOrEmpty(l)).Distinct().ToArray(),
            LastIndexedAt = indexes.Any() ? indexes.Max(i => i.IndexedAt) : null,
        });
    }

    /// <summary>
    /// Get all indexed files for a project
    /// </summary>
    [HttpGet("files/{projectId:guid}")]
    public async Task<ActionResult<IEnumerable<ProjectIndexFileDto>>> GetFiles(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var files = await _db.ProjectIndexes
            .Where(i => i.UserId == userId && i.DevRequestId == projectId)
            .OrderBy(i => i.FilePath)
            .Select(i => new ProjectIndexFileDto
            {
                Id = i.Id,
                FilePath = i.FilePath,
                Language = i.Language,
                FileSize = i.FileSize,
                ContentHash = i.ContentHash,
                Summary = i.Summary,
                ExportedSymbols = i.ExportedSymbols,
                IsIndexed = i.EmbeddingJson != null,
                IsUserModified = i.IsUserModified,
                NeedsReindex = i.NeedsReindex,
                DependencyCount = CountJsonArray(i.DependenciesJson),
                DependentCount = CountJsonArray(i.DependentsJson),
                IndexedAt = i.IndexedAt,
            })
            .ToListAsync();

        return Ok(files);
    }

    /// <summary>
    /// Index (or re-index) a single file
    /// </summary>
    [HttpPost("index")]
    public async Task<ActionResult<ProjectIndexFileDto>> IndexFile([FromBody] IndexFileDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var existing = await _db.ProjectIndexes
            .FirstOrDefaultAsync(i => i.UserId == userId && i.DevRequestId == dto.ProjectId && i.FilePath == dto.FilePath);

        if (existing != null)
        {
            existing.ContentHash = dto.ContentHash ?? existing.ContentHash;
            existing.FileSize = dto.FileSize;
            existing.Language = dto.Language ?? existing.Language;
            existing.Summary = dto.Summary ?? existing.Summary;
            existing.ExportedSymbols = dto.ExportedSymbols ?? existing.ExportedSymbols;
            existing.DependenciesJson = dto.DependenciesJson ?? existing.DependenciesJson;
            existing.DependentsJson = dto.DependentsJson ?? existing.DependentsJson;
            existing.EmbeddingJson = dto.EmbeddingJson ?? existing.EmbeddingJson;
            existing.IsUserModified = dto.IsUserModified;
            existing.NeedsReindex = false;
            existing.IndexedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new ProjectIndex
            {
                UserId = userId,
                DevRequestId = dto.ProjectId,
                FilePath = dto.FilePath,
                ContentHash = dto.ContentHash ?? "",
                FileSize = dto.FileSize,
                Language = dto.Language ?? "",
                Summary = dto.Summary,
                ExportedSymbols = dto.ExportedSymbols,
                DependenciesJson = dto.DependenciesJson,
                DependentsJson = dto.DependentsJson,
                EmbeddingJson = dto.EmbeddingJson,
                IsUserModified = dto.IsUserModified,
            };
            _db.ProjectIndexes.Add(existing);
        }

        await _db.SaveChangesAsync();

        return Ok(new ProjectIndexFileDto
        {
            Id = existing.Id,
            FilePath = existing.FilePath,
            Language = existing.Language,
            FileSize = existing.FileSize,
            ContentHash = existing.ContentHash,
            Summary = existing.Summary,
            ExportedSymbols = existing.ExportedSymbols,
            IsIndexed = existing.EmbeddingJson != null,
            IsUserModified = existing.IsUserModified,
            NeedsReindex = existing.NeedsReindex,
            DependencyCount = CountJsonArray(existing.DependenciesJson),
            DependentCount = CountJsonArray(existing.DependentsJson),
            IndexedAt = existing.IndexedAt,
        });
    }

    /// <summary>
    /// Retrieve the most relevant files for a query (simulated RAG)
    /// </summary>
    [HttpPost("retrieve")]
    public async Task<ActionResult<IEnumerable<ProjectIndexFileDto>>> RetrieveContext([FromBody] RetrieveContextDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var topK = Math.Min(dto.TopK > 0 ? dto.TopK : 10, 50);

        // Simple retrieval: prioritize user-modified files, then by indexed date
        var files = await _db.ProjectIndexes
            .Where(i => i.UserId == userId && i.DevRequestId == dto.ProjectId && i.EmbeddingJson != null)
            .OrderByDescending(i => i.IsUserModified)
            .ThenByDescending(i => i.IndexedAt)
            .Take(topK)
            .Select(i => new ProjectIndexFileDto
            {
                Id = i.Id,
                FilePath = i.FilePath,
                Language = i.Language,
                FileSize = i.FileSize,
                ContentHash = i.ContentHash,
                Summary = i.Summary,
                ExportedSymbols = i.ExportedSymbols,
                IsIndexed = true,
                IsUserModified = i.IsUserModified,
                NeedsReindex = i.NeedsReindex,
                DependencyCount = CountJsonArray(i.DependenciesJson),
                DependentCount = CountJsonArray(i.DependentsJson),
                IndexedAt = i.IndexedAt,
            })
            .ToListAsync();

        return Ok(files);
    }

    /// <summary>
    /// Get the dependency graph for a project
    /// </summary>
    [HttpGet("dependencies/{projectId:guid}")]
    public async Task<ActionResult<IEnumerable<DependencyEdgeDto>>> GetDependencies(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var indexes = await _db.ProjectIndexes
            .Where(i => i.UserId == userId && i.DevRequestId == projectId && i.DependenciesJson != null)
            .Select(i => new { i.FilePath, i.DependenciesJson })
            .ToListAsync();

        var edges = new List<DependencyEdgeDto>();
        foreach (var idx in indexes)
        {
            if (string.IsNullOrEmpty(idx.DependenciesJson)) continue;
            try
            {
                var deps = System.Text.Json.JsonSerializer.Deserialize<string[]>(idx.DependenciesJson) ?? [];
                foreach (var dep in deps)
                {
                    edges.Add(new DependencyEdgeDto { From = idx.FilePath, To = dep });
                }
            }
            catch { /* skip malformed JSON */ }
        }

        return Ok(edges);
    }

    /// <summary>
    /// Mark files as needing re-index (e.g. after user modifications)
    /// </summary>
    [HttpPost("mark-stale")]
    public async Task<ActionResult> MarkStale([FromBody] MarkStaleDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var files = await _db.ProjectIndexes
            .Where(i => i.UserId == userId && i.DevRequestId == dto.ProjectId && dto.FilePaths.Contains(i.FilePath))
            .ToListAsync();

        foreach (var f in files)
        {
            f.NeedsReindex = true;
            f.IsUserModified = true;
            f.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(new { updated = files.Count });
    }

    private static int CountJsonArray(string? json)
    {
        if (string.IsNullOrEmpty(json)) return 0;
        try { return System.Text.Json.JsonSerializer.Deserialize<string[]>(json)?.Length ?? 0; }
        catch { return 0; }
    }
}

public class ProjectIndexSummaryDto
{
    public Guid ProjectId { get; set; }
    public int TotalFiles { get; set; }
    public int IndexedFiles { get; set; }
    public int StaleFiles { get; set; }
    public int UserModifiedFiles { get; set; }
    public long TotalSizeBytes { get; set; }
    public string[] Languages { get; set; } = [];
    public DateTime? LastIndexedAt { get; set; }
}

public class ProjectIndexFileDto
{
    public Guid Id { get; set; }
    public string FilePath { get; set; } = "";
    public string Language { get; set; } = "";
    public long FileSize { get; set; }
    public string ContentHash { get; set; } = "";
    public string? Summary { get; set; }
    public string? ExportedSymbols { get; set; }
    public bool IsIndexed { get; set; }
    public bool IsUserModified { get; set; }
    public bool NeedsReindex { get; set; }
    public int DependencyCount { get; set; }
    public int DependentCount { get; set; }
    public DateTime IndexedAt { get; set; }
}

public class IndexFileDto
{
    public Guid ProjectId { get; set; }
    public string FilePath { get; set; } = "";
    public string? ContentHash { get; set; }
    public long FileSize { get; set; }
    public string? Language { get; set; }
    public string? Summary { get; set; }
    public string? ExportedSymbols { get; set; }
    public string? DependenciesJson { get; set; }
    public string? DependentsJson { get; set; }
    public string? EmbeddingJson { get; set; }
    public bool IsUserModified { get; set; }
}

public class RetrieveContextDto
{
    public Guid ProjectId { get; set; }
    public string Query { get; set; } = "";
    public int TopK { get; set; } = 10;
}

public class DependencyEdgeDto
{
    public string From { get; set; } = "";
    public string To { get; set; } = "";
}

public class MarkStaleDto
{
    public Guid ProjectId { get; set; }
    public string[] FilePaths { get; set; } = [];
}
