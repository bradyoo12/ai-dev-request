using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/turso-database")]
[Authorize]
public class TursoDatabaseController(AiDevRequestDbContext db) : ControllerBase
{
    private static readonly string[] Regions = ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"];

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.TursoDatabases
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("provision")]
    public async Task<IActionResult> Provision([FromBody] ProvisionRequest req)
    {
        var rng = new Random();
        var primaryRegion = req.Region ?? Regions[rng.Next(Regions.Length)];
        var replicaCount = req.EnableGlobalReplication ? rng.Next(2, 5) : 0;
        var replicaRegions = req.EnableGlobalReplication
            ? Regions.Where(r => r != primaryRegion).OrderBy(_ => rng.Next()).Take(replicaCount).ToArray()
            : [];

        var entity = new TursoDatabase
        {
            ProjectName = req.ProjectName,
            DatabaseName = $"{req.ProjectName.ToLower().Replace(" ", "-")}-db",
            Region = primaryRegion,
            ReplicaCount = replicaCount,
            ReplicaRegions = replicaRegions,
            SizeBytes = rng.Next(1024, 10485760),
            TableCount = rng.Next(3, 20),
            VectorSearchEnabled = req.EnableVectorSearch,
            VectorDimensions = req.EnableVectorSearch ? (req.VectorDimensions > 0 ? req.VectorDimensions : 1536) : 0,
            SchemaBranchingEnabled = req.EnableSchemaBranching,
            ActiveBranches = req.EnableSchemaBranching ? 1 : 0,
            EmbeddedReplicaEnabled = req.EnableEmbeddedReplica,
            ReadLatencyMs = Math.Round(rng.NextDouble() * 5 + 0.5, 2),
            WriteLatencyMs = Math.Round(rng.NextDouble() * 15 + 2, 2),
            TotalReads = 0,
            TotalWrites = 0,
            SyncMode = req.SyncMode ?? "automatic",
            Status = "active"
        };

        db.TursoDatabases.Add(entity);
        await db.SaveChangesAsync();

        return Ok(new
        {
            database = entity,
            connectionUrl = $"libsql://{entity.DatabaseName}.turso.io",
            features = new
            {
                vectorSearch = entity.VectorSearchEnabled ? new { enabled = true, dimensions = entity.VectorDimensions, similarity = "cosine" } : null,
                schemaBranching = entity.SchemaBranchingEnabled ? new { enabled = true, activeBranches = entity.ActiveBranches, mainBranch = "main" } : null,
                embeddedReplica = entity.EmbeddedReplicaEnabled ? new { enabled = true, syncInterval = "5s", offlineCapable = true } : null,
                globalReplication = replicaCount > 0 ? new { enabled = true, primary = primaryRegion, replicas = replicaRegions } : null
            },
            provisionTimeMs = rng.Next(50, 300)
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var entity = await db.TursoDatabases.FindAsync(id);
        if (entity == null) return NotFound();
        db.TursoDatabases.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var all = await db.TursoDatabases.ToListAsync();
        if (all.Count == 0) return Ok(new { totalDatabases = 0 });

        var byRegion = all.GroupBy(x => x.Region).Select(g => new
        {
            region = g.Key,
            count = g.Count(),
            avgReadLatencyMs = Math.Round(g.Average(x => x.ReadLatencyMs), 2)
        }).ToList();

        return Ok(new
        {
            totalDatabases = all.Count,
            totalReplicas = all.Sum(x => x.ReplicaCount),
            vectorEnabled = all.Count(x => x.VectorSearchEnabled),
            branchingEnabled = all.Count(x => x.SchemaBranchingEnabled),
            avgReadLatencyMs = Math.Round(all.Average(x => x.ReadLatencyMs), 2),
            avgWriteLatencyMs = Math.Round(all.Average(x => x.WriteLatencyMs), 2),
            totalSizeBytes = all.Sum(x => x.SizeBytes),
            byRegion
        });
    }

    [AllowAnonymous]
    [HttpGet("regions")]
    public IActionResult GetRegions()
    {
        return Ok(new[]
        {
            new { id = "us-east-1", name = "US East (Virginia)", latency = "~5ms" },
            new { id = "us-west-2", name = "US West (Oregon)", latency = "~8ms" },
            new { id = "eu-west-1", name = "Europe (Ireland)", latency = "~12ms" },
            new { id = "eu-central-1", name = "Europe (Frankfurt)", latency = "~10ms" },
            new { id = "ap-southeast-1", name = "Asia Pacific (Singapore)", latency = "~15ms" },
            new { id = "ap-northeast-1", name = "Asia Pacific (Tokyo)", latency = "~12ms" }
        });
    }

    public record ProvisionRequest(
        string ProjectName,
        string? Region = null,
        bool EnableVectorSearch = false,
        int VectorDimensions = 1536,
        bool EnableSchemaBranching = false,
        bool EnableEmbeddedReplica = false,
        bool EnableGlobalReplication = false,
        string? SyncMode = "automatic"
    );
}
