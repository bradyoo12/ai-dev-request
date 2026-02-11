using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AiDevRequest.API.Controllers;

[ApiController]
[Route("api/nl-schema")]
[Authorize]
public class NlSchemaController : ControllerBase
{
    private readonly AiDevRequestDbContext _db;
    public NlSchemaController(AiDevRequestDbContext db) => _db = db;

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "";

    [HttpGet("schemas")]
    public async Task<IActionResult> ListSchemas([FromQuery] string? dbType = null)
    {
        var userId = GetUserId();
        var query = _db.NlSchemas.Where(s => s.UserId == userId);
        if (!string.IsNullOrEmpty(dbType)) query = query.Where(s => s.DatabaseType == dbType);
        var schemas = await query.OrderByDescending(s => s.UpdatedAt).Take(50).ToListAsync();
        return Ok(schemas);
    }

    [HttpGet("schemas/{id}")]
    public async Task<IActionResult> GetSchema(Guid id)
    {
        var userId = GetUserId();
        var schema = await _db.NlSchemas.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (schema == null) return NotFound();
        return Ok(schema);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateSchema([FromBody] GenerateSchemaRequest request)
    {
        var userId = GetUserId();
        var input = request.Description?.ToLowerInvariant() ?? "";

        // Simulated AI schema generation based on input keywords
        var tables = new List<object>();
        var relationships = new List<object>();
        var indexes = new List<object>();
        var rlsPolicies = new List<object>();

        if (input.Contains("user") || input.Contains("account"))
        {
            tables.Add(new { name = "users", columns = new[] {
                new { name = "id", type = "uuid", primaryKey = true, nullable = false },
                new { name = "email", type = "varchar(255)", primaryKey = false, nullable = false },
                new { name = "name", type = "varchar(100)", primaryKey = false, nullable = false },
                new { name = "role", type = "varchar(20)", primaryKey = false, nullable = false },
                new { name = "avatar_url", type = "text", primaryKey = false, nullable = true },
                new { name = "created_at", type = "timestamptz", primaryKey = false, nullable = false },
                new { name = "updated_at", type = "timestamptz", primaryKey = false, nullable = false },
            }});
            indexes.Add(new { table = "users", columns = new[] { "email" }, unique = true });
            rlsPolicies.Add(new { table = "users", policy = "Users can only read/update their own row", sql = "auth.uid() = id" });
        }

        if (input.Contains("post") || input.Contains("article") || input.Contains("blog"))
        {
            tables.Add(new { name = "posts", columns = new[] {
                new { name = "id", type = "uuid", primaryKey = true, nullable = false },
                new { name = "author_id", type = "uuid", primaryKey = false, nullable = false },
                new { name = "title", type = "varchar(255)", primaryKey = false, nullable = false },
                new { name = "content", type = "text", primaryKey = false, nullable = false },
                new { name = "status", type = "varchar(20)", primaryKey = false, nullable = false },
                new { name = "published_at", type = "timestamptz", primaryKey = false, nullable = true },
                new { name = "created_at", type = "timestamptz", primaryKey = false, nullable = false },
            }});
            relationships.Add(new { from = "posts.author_id", to = "users.id", type = "many-to-one", onDelete = "CASCADE" });
            indexes.Add(new { table = "posts", columns = new[] { "author_id", "status" }, unique = false });
        }

        if (input.Contains("comment"))
        {
            tables.Add(new { name = "comments", columns = new[] {
                new { name = "id", type = "uuid", primaryKey = true, nullable = false },
                new { name = "post_id", type = "uuid", primaryKey = false, nullable = false },
                new { name = "user_id", type = "uuid", primaryKey = false, nullable = false },
                new { name = "content", type = "text", primaryKey = false, nullable = false },
                new { name = "created_at", type = "timestamptz", primaryKey = false, nullable = false },
            }});
            relationships.Add(new { from = "comments.post_id", to = "posts.id", type = "many-to-one", onDelete = "CASCADE" });
            relationships.Add(new { from = "comments.user_id", to = "users.id", type = "many-to-one", onDelete = "CASCADE" });
        }

        if (input.Contains("tag") || input.Contains("category"))
        {
            tables.Add(new { name = "tags", columns = new[] {
                new { name = "id", type = "uuid", primaryKey = true, nullable = false },
                new { name = "name", type = "varchar(50)", primaryKey = false, nullable = false },
                new { name = "slug", type = "varchar(50)", primaryKey = false, nullable = false },
            }});
            tables.Add(new { name = "post_tags", columns = new[] {
                new { name = "post_id", type = "uuid", primaryKey = false, nullable = false },
                new { name = "tag_id", type = "uuid", primaryKey = false, nullable = false },
            }});
            relationships.Add(new { from = "post_tags.post_id", to = "posts.id", type = "many-to-many", onDelete = "CASCADE" });
            relationships.Add(new { from = "post_tags.tag_id", to = "tags.id", type = "many-to-many", onDelete = "CASCADE" });
            indexes.Add(new { table = "tags", columns = new[] { "slug" }, unique = true });
        }

        if (input.Contains("follow"))
        {
            tables.Add(new { name = "follows", columns = new[] {
                new { name = "follower_id", type = "uuid", primaryKey = false, nullable = false },
                new { name = "following_id", type = "uuid", primaryKey = false, nullable = false },
                new { name = "created_at", type = "timestamptz", primaryKey = false, nullable = false },
            }});
            relationships.Add(new { from = "follows.follower_id", to = "users.id", type = "many-to-many", onDelete = "CASCADE" });
            relationships.Add(new { from = "follows.following_id", to = "users.id", type = "many-to-many", onDelete = "CASCADE" });
            indexes.Add(new { table = "follows", columns = new[] { "follower_id", "following_id" }, unique = true });
        }

        if (tables.Count == 0)
        {
            tables.Add(new { name = "items", columns = new[] {
                new { name = "id", type = "uuid", primaryKey = true, nullable = false },
                new { name = "name", type = "varchar(255)", primaryKey = false, nullable = false },
                new { name = "description", type = "text", primaryKey = false, nullable = true },
                new { name = "created_at", type = "timestamptz", primaryKey = false, nullable = false },
            }});
        }

        var totalColumns = 0;
        foreach (var t in tables)
        {
            var cols = t.GetType().GetProperty("columns")?.GetValue(t) as Array;
            totalColumns += cols?.Length ?? 0;
        }

        var sql = GenerateSqlDdl(tables, relationships, indexes, rlsPolicies);

        var schema = new NlSchema
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SchemaName = request.SchemaName ?? "Untitled Schema",
            NaturalLanguageInput = request.Description ?? "",
            GeneratedSql = sql,
            TablesJson = JsonSerializer.Serialize(tables),
            RelationshipsJson = JsonSerializer.Serialize(relationships),
            IndexesJson = JsonSerializer.Serialize(indexes),
            RlsPoliciesJson = JsonSerializer.Serialize(rlsPolicies),
            DatabaseType = request.DatabaseType ?? "postgresql",
            TableCount = tables.Count,
            ColumnCount = totalColumns,
            RelationshipCount = relationships.Count,
            TokensUsed = input.Length * 15,
            EstimatedCost = input.Length * 15 * 0.000003m,
            GenerationTimeMs = 800 + tables.Count * 200,
        };
        _db.NlSchemas.Add(schema);
        await _db.SaveChangesAsync();

        return Ok(schema);
    }

    [HttpPost("schemas/{id}/refine")]
    public async Task<IActionResult> RefineSchema(Guid id, [FromBody] RefineSchemaRequest request)
    {
        var userId = GetUserId();
        var schema = await _db.NlSchemas.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        if (schema == null) return NotFound();

        schema.RefinementCount++;
        schema.UpdatedAt = DateTime.UtcNow;
        var conversation = JsonSerializer.Deserialize<List<object>>(schema.ConversationJson) ?? new List<object>();
        conversation.Add(new { role = "user", content = request.Message, timestamp = DateTime.UtcNow });
        conversation.Add(new { role = "assistant", content = $"Applied refinement: {request.Message}", timestamp = DateTime.UtcNow });
        schema.ConversationJson = JsonSerializer.Serialize(conversation);
        await _db.SaveChangesAsync();
        return Ok(schema);
    }

    [HttpGet("export-formats")]
    public IActionResult GetExportFormats()
    {
        var formats = new[]
        {
            new { id = "sql", name = "Raw SQL (DDL)", description = "PostgreSQL CREATE TABLE statements", extension = ".sql" },
            new { id = "prisma", name = "Prisma Schema", description = "Prisma ORM schema file", extension = ".prisma" },
            new { id = "drizzle", name = "Drizzle Schema", description = "Drizzle ORM TypeScript schema", extension = ".ts" },
            new { id = "supabase", name = "Supabase Migration", description = "Supabase CLI migration file", extension = ".sql" },
            new { id = "typeorm", name = "TypeORM Entities", description = "TypeORM entity classes", extension = ".ts" },
        };
        return Ok(formats);
    }

    [HttpGet("gallery")]
    public async Task<IActionResult> GetGallery()
    {
        var schemas = await _db.NlSchemas.Where(s => s.IsPublic)
            .OrderByDescending(s => s.ViewCount + s.ForkCount)
            .Take(20).ToListAsync();
        return Ok(schemas);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var schemas = await _db.NlSchemas.Where(s => s.UserId == userId).ToListAsync();
        return Ok(new
        {
            totalSchemas = schemas.Count,
            totalTables = schemas.Sum(s => s.TableCount),
            totalRelationships = schemas.Sum(s => s.RelationshipCount),
            totalRefinements = schemas.Sum(s => s.RefinementCount),
            totalTokensUsed = schemas.Sum(s => s.TokensUsed),
            favoriteDatabase = schemas.GroupBy(s => s.DatabaseType).OrderByDescending(g => g.Count()).FirstOrDefault()?.Key ?? "postgresql",
            recentSchemas = schemas.OrderByDescending(s => s.UpdatedAt).Take(5).Select(s => new { s.SchemaName, s.DatabaseType, s.TableCount, s.CreatedAt }),
        });
    }

    private static string GenerateSqlDdl(List<object> tables, List<object> relationships, List<object> indexes, List<object> rlsPolicies)
    {
        var lines = new List<string> { "-- Generated by AI Dev Request NL Schema Designer", "-- PostgreSQL DDL", "" };
        foreach (var table in tables)
        {
            var name = table.GetType().GetProperty("name")?.GetValue(table)?.ToString() ?? "unknown";
            var cols = table.GetType().GetProperty("columns")?.GetValue(table) as Array;
            lines.Add($"CREATE TABLE {name} (");
            if (cols != null)
            {
                var colLines = new List<string>();
                foreach (var col in cols)
                {
                    var cName = col.GetType().GetProperty("name")?.GetValue(col)?.ToString() ?? "";
                    var cType = col.GetType().GetProperty("type")?.GetValue(col)?.ToString() ?? "";
                    var pk = (bool)(col.GetType().GetProperty("primaryKey")?.GetValue(col) ?? false);
                    var nullable = (bool)(col.GetType().GetProperty("nullable")?.GetValue(col) ?? true);
                    var constraint = pk ? " PRIMARY KEY DEFAULT gen_random_uuid()" : nullable ? "" : " NOT NULL";
                    colLines.Add($"  {cName} {cType}{constraint}");
                }
                lines.Add(string.Join(",\n", colLines));
            }
            lines.Add(");");
            lines.Add("");
        }
        return string.Join("\n", lines);
    }
}

public class GenerateSchemaRequest
{
    public string? Description { get; set; }
    public string? SchemaName { get; set; }
    public string? DatabaseType { get; set; }
}

public class RefineSchemaRequest
{
    public string? Message { get; set; }
}
