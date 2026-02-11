using System.Text;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface ISchemaDesignerService
{
    Task<DataSchema> DesignAsync(Guid devRequestId, string userId, string prompt);
    Task<DataSchema?> GetAsync(Guid devRequestId, string userId);
    Task<DataSchema> UpdateAsync(Guid schemaId, string userId, string entitiesJson, string relationshipsJson);
    Task<DataSchema> ValidateAsync(Guid schemaId, string userId);
    Task<DataSchema> GenerateCodeAsync(Guid schemaId, string userId);
}

public class SchemaDesignerService : ISchemaDesignerService
{
    private readonly AiDevRequestDbContext _db;
    private readonly ILogger<SchemaDesignerService> _logger;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = true };

    public SchemaDesignerService(AiDevRequestDbContext db, ILogger<SchemaDesignerService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<DataSchema> DesignAsync(Guid devRequestId, string userId, string prompt)
    {
        _logger.LogInformation("Designing schema from NL prompt for request {RequestId}", devRequestId);

        var (entities, relationships) = ParsePromptToSchema(prompt);
        var validations = ValidateSchema(entities, relationships);

        var schema = new DataSchema
        {
            DevRequestId = devRequestId,
            UserId = userId,
            Prompt = prompt,
            EntitiesJson = JsonSerializer.Serialize(entities, JsonOpts),
            RelationshipsJson = JsonSerializer.Serialize(relationships, JsonOpts),
            EntityCount = entities.Count,
            RelationshipCount = relationships.Count,
            ValidationJson = JsonSerializer.Serialize(validations, JsonOpts),
            Status = validations.Count == 0 ? "valid" : "has_warnings"
        };

        _db.DataSchemas.Add(schema);
        await _db.SaveChangesAsync();
        return schema;
    }

    public async Task<DataSchema?> GetAsync(Guid devRequestId, string userId)
    {
        return await _db.DataSchemas
            .Where(s => s.DevRequestId == devRequestId && s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<DataSchema> UpdateAsync(Guid schemaId, string userId, string entitiesJson, string relationshipsJson)
    {
        var schema = await _db.DataSchemas
            .FirstOrDefaultAsync(s => s.Id == schemaId && s.UserId == userId)
            ?? throw new InvalidOperationException("Schema not found");

        var entities = JsonSerializer.Deserialize<List<SchemaEntity>>(entitiesJson, JsonOpts) ?? [];
        var relationships = JsonSerializer.Deserialize<List<SchemaRelationship>>(relationshipsJson, JsonOpts) ?? [];

        schema.EntitiesJson = entitiesJson;
        schema.RelationshipsJson = relationshipsJson;
        schema.EntityCount = entities.Count;
        schema.RelationshipCount = relationships.Count;
        schema.ValidationJson = JsonSerializer.Serialize(ValidateSchema(entities, relationships), JsonOpts);

        await _db.SaveChangesAsync();
        return schema;
    }

    public async Task<DataSchema> ValidateAsync(Guid schemaId, string userId)
    {
        var schema = await _db.DataSchemas
            .FirstOrDefaultAsync(s => s.Id == schemaId && s.UserId == userId)
            ?? throw new InvalidOperationException("Schema not found");

        var entities = JsonSerializer.Deserialize<List<SchemaEntity>>(schema.EntitiesJson, JsonOpts) ?? [];
        var relationships = JsonSerializer.Deserialize<List<SchemaRelationship>>(schema.RelationshipsJson, JsonOpts) ?? [];

        schema.ValidationJson = JsonSerializer.Serialize(ValidateSchema(entities, relationships), JsonOpts);
        schema.Status = schema.ValidationJson == "[]" ? "valid" : "has_warnings";
        await _db.SaveChangesAsync();
        return schema;
    }

    public async Task<DataSchema> GenerateCodeAsync(Guid schemaId, string userId)
    {
        var schema = await _db.DataSchemas
            .FirstOrDefaultAsync(s => s.Id == schemaId && s.UserId == userId)
            ?? throw new InvalidOperationException("Schema not found");

        _logger.LogInformation("Generating code from schema {SchemaId}", schemaId);

        var entities = JsonSerializer.Deserialize<List<SchemaEntity>>(schema.EntitiesJson, JsonOpts) ?? [];
        var relationships = JsonSerializer.Deserialize<List<SchemaRelationship>>(schema.RelationshipsJson, JsonOpts) ?? [];

        schema.GeneratedSql = GenerateSql(entities, relationships);
        schema.GeneratedEntities = GenerateEfCoreEntities(entities, relationships);
        schema.GeneratedControllers = GenerateControllers(entities);
        schema.GeneratedFrontend = GenerateFrontend(entities);
        schema.Status = "generated";

        await _db.SaveChangesAsync();
        return schema;
    }

    private static (List<SchemaEntity>, List<SchemaRelationship>) ParsePromptToSchema(string prompt)
    {
        var entities = new List<SchemaEntity>();
        var relationships = new List<SchemaRelationship>();
        var lower = prompt.ToLowerInvariant();

        var entityKeywords = new[] { "user", "post", "comment", "tag", "category", "product", "order", "item", "review", "message", "project", "task", "team", "role", "file", "image", "notification", "payment", "invoice", "subscription" };

        foreach (var keyword in entityKeywords)
        {
            if (!lower.Contains(keyword)) continue;
            var name = char.ToUpper(keyword[0]) + keyword[1..];
            var columns = new List<SchemaColumn>
            {
                new() { Name = "id", Type = "uuid", IsPrimaryKey = true, IsNullable = false },
                new() { Name = "createdAt", Type = "timestamp", IsNullable = false },
                new() { Name = "updatedAt", Type = "timestamp", IsNullable = false },
            };

            switch (keyword)
            {
                case "user":
                    columns.AddRange([new() { Name = "name", Type = "varchar(100)", IsNullable = false }, new() { Name = "email", Type = "varchar(255)", IsNullable = false, IsUnique = true }]);
                    break;
                case "post":
                    columns.AddRange([new() { Name = "title", Type = "varchar(200)", IsNullable = false }, new() { Name = "body", Type = "text", IsNullable = false }, new() { Name = "userId", Type = "uuid", IsNullable = false, IsForeignKey = true }]);
                    break;
                case "comment":
                    columns.AddRange([new() { Name = "text", Type = "text", IsNullable = false }, new() { Name = "postId", Type = "uuid", IsNullable = false, IsForeignKey = true }, new() { Name = "userId", Type = "uuid", IsNullable = false, IsForeignKey = true }]);
                    break;
                case "tag":
                    columns.AddRange([new() { Name = "name", Type = "varchar(100)", IsNullable = false, IsUnique = true }]);
                    break;
                case "product":
                    columns.AddRange([new() { Name = "name", Type = "varchar(200)", IsNullable = false }, new() { Name = "description", Type = "text" }, new() { Name = "price", Type = "decimal(10,2)", IsNullable = false }]);
                    break;
                case "order":
                    columns.AddRange([new() { Name = "userId", Type = "uuid", IsNullable = false, IsForeignKey = true }, new() { Name = "total", Type = "decimal(10,2)", IsNullable = false }, new() { Name = "status", Type = "varchar(50)", IsNullable = false }]);
                    break;
                default:
                    columns.Add(new() { Name = "name", Type = "varchar(200)", IsNullable = false });
                    break;
            }
            entities.Add(new SchemaEntity { Name = name, Columns = columns });
        }

        // Detect relationships from prompt
        if (entities.Any(e => e.Name == "User") && entities.Any(e => e.Name == "Post"))
            relationships.Add(new() { FromEntity = "User", ToEntity = "Post", Type = "one-to-many", ForeignKey = "userId" });
        if (entities.Any(e => e.Name == "Post") && entities.Any(e => e.Name == "Comment"))
            relationships.Add(new() { FromEntity = "Post", ToEntity = "Comment", Type = "one-to-many", ForeignKey = "postId" });
        if (entities.Any(e => e.Name == "User") && entities.Any(e => e.Name == "Comment"))
            relationships.Add(new() { FromEntity = "User", ToEntity = "Comment", Type = "one-to-many", ForeignKey = "userId" });
        if (entities.Any(e => e.Name == "Post") && entities.Any(e => e.Name == "Tag"))
        {
            relationships.Add(new() { FromEntity = "Post", ToEntity = "Tag", Type = "many-to-many", ForeignKey = "postId" });
            entities.Add(new SchemaEntity
            {
                Name = "PostTag",
                Columns = [
                    new() { Name = "postId", Type = "uuid", IsNullable = false, IsForeignKey = true, IsPrimaryKey = true },
                    new() { Name = "tagId", Type = "uuid", IsNullable = false, IsForeignKey = true, IsPrimaryKey = true },
                ]
            });
        }
        if (entities.Any(e => e.Name == "User") && entities.Any(e => e.Name == "Order"))
            relationships.Add(new() { FromEntity = "User", ToEntity = "Order", Type = "one-to-many", ForeignKey = "userId" });
        if (entities.Any(e => e.Name == "Product") && entities.Any(e => e.Name == "Order"))
            relationships.Add(new() { FromEntity = "Order", ToEntity = "Product", Type = "many-to-many", ForeignKey = "orderId" });

        return (entities, relationships);
    }

    private static List<SchemaValidation> ValidateSchema(List<SchemaEntity> entities, List<SchemaRelationship> relationships)
    {
        var issues = new List<SchemaValidation>();
        var entityNames = entities.Select(e => e.Name).ToHashSet();

        foreach (var rel in relationships)
        {
            if (!entityNames.Contains(rel.FromEntity))
                issues.Add(new() { Severity = "error", Message = $"Relationship references unknown entity '{rel.FromEntity}'" });
            if (!entityNames.Contains(rel.ToEntity))
                issues.Add(new() { Severity = "error", Message = $"Relationship references unknown entity '{rel.ToEntity}'" });
        }

        foreach (var entity in entities)
        {
            if (!entity.Columns.Any(c => c.IsPrimaryKey))
                issues.Add(new() { Severity = "warning", Message = $"Entity '{entity.Name}' has no primary key" });
        }

        return issues;
    }

    private static string GenerateSql(List<SchemaEntity> entities, List<SchemaRelationship> relationships)
    {
        var sb = new StringBuilder();
        sb.AppendLine("-- Generated by AI Dev Request Schema Designer");
        sb.AppendLine();

        foreach (var entity in entities)
        {
            var tableName = ToSnakeCase(entity.Name) + "s";
            sb.AppendLine($"CREATE TABLE {tableName} (");
            var cols = new List<string>();
            foreach (var col in entity.Columns)
            {
                var line = $"  {ToSnakeCase(col.Name)} {col.Type}";
                if (!col.IsNullable) line += " NOT NULL";
                if (col.IsUnique) line += " UNIQUE";
                if (col.Type == "uuid" && col.IsPrimaryKey) line += " DEFAULT gen_random_uuid()";
                cols.Add(line);
            }
            var pks = entity.Columns.Where(c => c.IsPrimaryKey).Select(c => ToSnakeCase(c.Name)).ToList();
            if (pks.Count > 0)
                cols.Add($"  PRIMARY KEY ({string.Join(", ", pks)})");
            sb.AppendLine(string.Join(",\n", cols));
            sb.AppendLine(");");
            sb.AppendLine();
        }
        return sb.ToString();
    }

    private static string GenerateEfCoreEntities(List<SchemaEntity> entities, List<SchemaRelationship> relationships)
    {
        var sb = new StringBuilder();
        sb.AppendLine("using System.ComponentModel.DataAnnotations;");
        sb.AppendLine();

        foreach (var entity in entities)
        {
            sb.AppendLine($"public class {entity.Name}");
            sb.AppendLine("{");
            foreach (var col in entity.Columns)
            {
                var csType = MapToCSharpType(col.Type);
                if (col.IsPrimaryKey && col.Type == "uuid")
                    sb.AppendLine($"    public Guid {ToPascalCase(col.Name)} {{ get; set; }} = Guid.NewGuid();");
                else
                {
                    if (!col.IsNullable) sb.AppendLine("    [Required]");
                    if (col.Type.Contains("varchar"))
                    {
                        var len = col.Type.Replace("varchar(", "").Replace(")", "");
                        sb.AppendLine($"    [MaxLength({len})]");
                    }
                    sb.AppendLine($"    public {csType} {ToPascalCase(col.Name)} {{ get; set; }}{(csType == "string" ? " = \"\";" : "")}");
                }
            }
            // Navigation properties
            foreach (var rel in relationships.Where(r => r.FromEntity == entity.Name && r.Type == "one-to-many"))
                sb.AppendLine($"    public List<{rel.ToEntity}> {rel.ToEntity}s {{ get; set; }} = [];");
            sb.AppendLine("}");
            sb.AppendLine();
        }
        return sb.ToString();
    }

    private static string GenerateControllers(List<SchemaEntity> entities)
    {
        var sb = new StringBuilder();
        foreach (var entity in entities.Where(e => !e.Name.Contains("Tag") || e.Name == "Tag"))
        {
            var route = ToSnakeCase(entity.Name).Replace("_", "-") + "s";
            sb.AppendLine($"[ApiController]");
            sb.AppendLine($"[Route(\"api/{route}\")]");
            sb.AppendLine($"public class {entity.Name}Controller : ControllerBase");
            sb.AppendLine("{");
            sb.AppendLine($"    // GET api/{route}");
            sb.AppendLine($"    [HttpGet] public async Task<IActionResult> GetAll() {{ ... }}");
            sb.AppendLine($"    // GET api/{route}/{{id}}");
            sb.AppendLine($"    [HttpGet(\"{{id}}\")] public async Task<IActionResult> GetById(Guid id) {{ ... }}");
            sb.AppendLine($"    // POST api/{route}");
            sb.AppendLine($"    [HttpPost] public async Task<IActionResult> Create([FromBody] {entity.Name}Dto dto) {{ ... }}");
            sb.AppendLine($"    // PUT api/{route}/{{id}}");
            sb.AppendLine($"    [HttpPut(\"{{id}}\")] public async Task<IActionResult> Update(Guid id, [FromBody] {entity.Name}Dto dto) {{ ... }}");
            sb.AppendLine($"    // DELETE api/{route}/{{id}}");
            sb.AppendLine($"    [HttpDelete(\"{{id}}\")] public async Task<IActionResult> Delete(Guid id) {{ ... }}");
            sb.AppendLine("}");
            sb.AppendLine();
        }
        return sb.ToString();
    }

    private static string GenerateFrontend(List<SchemaEntity> entities)
    {
        var sb = new StringBuilder();
        sb.AppendLine("// TypeScript interfaces");
        foreach (var entity in entities)
        {
            sb.AppendLine($"export interface {entity.Name} {{");
            foreach (var col in entity.Columns)
            {
                var tsType = MapToTypeScriptType(col.Type);
                sb.AppendLine($"  {col.Name}{(col.IsNullable ? "?" : "")}: {tsType}");
            }
            sb.AppendLine("}");
            sb.AppendLine();
        }

        sb.AppendLine("// React hooks");
        foreach (var entity in entities.Where(e => !e.Name.Contains("Tag") || e.Name == "Tag"))
        {
            var route = ToSnakeCase(entity.Name).Replace("_", "-") + "s";
            sb.AppendLine($"export function use{entity.Name}s() {{");
            sb.AppendLine($"  return useQuery<{entity.Name}[]>('{route}', () => fetch('/api/{route}').then(r => r.json()))");
            sb.AppendLine("}");
            sb.AppendLine();
        }
        return sb.ToString();
    }

    private static string MapToCSharpType(string sqlType) => sqlType switch
    {
        "uuid" => "Guid",
        "text" => "string",
        "timestamp" => "DateTime",
        _ when sqlType.StartsWith("varchar") => "string",
        _ when sqlType.StartsWith("decimal") => "decimal",
        "integer" or "int" => "int",
        "boolean" => "bool",
        _ => "string"
    };

    private static string MapToTypeScriptType(string sqlType) => sqlType switch
    {
        "uuid" => "string",
        "text" => "string",
        "timestamp" => "string",
        _ when sqlType.StartsWith("varchar") => "string",
        _ when sqlType.StartsWith("decimal") => "number",
        "integer" or "int" => "number",
        "boolean" => "boolean",
        _ => "string"
    };

    private static string ToSnakeCase(string input) =>
        string.Concat(input.Select((c, i) => i > 0 && char.IsUpper(c) ? "_" + char.ToLower(c) : char.ToLower(c).ToString()));

    private static string ToPascalCase(string input) =>
        char.ToUpper(input[0]) + input[1..];
}

public record SchemaEntity
{
    public string Name { get; set; } = "";
    public List<SchemaColumn> Columns { get; set; } = [];
}

public record SchemaColumn
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "varchar(255)";
    public bool IsPrimaryKey { get; set; }
    public bool IsForeignKey { get; set; }
    public bool IsNullable { get; set; } = true;
    public bool IsUnique { get; set; }
}

public record SchemaRelationship
{
    public string FromEntity { get; set; } = "";
    public string ToEntity { get; set; } = "";
    public string Type { get; set; } = "one-to-many";
    public string ForeignKey { get; set; } = "";
}

public record SchemaValidation
{
    public string Severity { get; set; } = "warning";
    public string Message { get; set; } = "";
}
