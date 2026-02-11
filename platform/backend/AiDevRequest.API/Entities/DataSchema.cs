using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

/// <summary>
/// Natural language data schema design with entities, relationships, and generated code artifacts.
/// </summary>
public class DataSchema
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DevRequestId { get; set; }

    [Required]
    [MaxLength(100)]
    public string UserId { get; set; } = "";

    /// <summary>Original natural language description</summary>
    [MaxLength(2000)]
    public string Prompt { get; set; } = "";

    /// <summary>JSON array of entity definitions (name, columns, constraints)</summary>
    public string EntitiesJson { get; set; } = "[]";

    /// <summary>JSON array of relationship definitions (from, to, type, fk)</summary>
    public string RelationshipsJson { get; set; } = "[]";

    /// <summary>Number of entities in schema</summary>
    public int EntityCount { get; set; }

    /// <summary>Number of relationships in schema</summary>
    public int RelationshipCount { get; set; }

    /// <summary>JSON array of validation issues</summary>
    public string ValidationJson { get; set; } = "[]";

    /// <summary>Generated SQL DDL statements</summary>
    public string GeneratedSql { get; set; } = "";

    /// <summary>Generated EF Core entity classes (C#)</summary>
    public string GeneratedEntities { get; set; } = "";

    /// <summary>Generated REST controllers (C#)</summary>
    public string GeneratedControllers { get; set; } = "";

    /// <summary>Generated TypeScript interfaces + React hooks</summary>
    public string GeneratedFrontend { get; set; } = "";

    [MaxLength(50)]
    public string Status { get; set; } = "designing";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
