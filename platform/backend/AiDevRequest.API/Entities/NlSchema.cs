namespace AiDevRequest.API.Entities;

public class NlSchema
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string SchemaName { get; set; } = string.Empty;
    public string NaturalLanguageInput { get; set; } = string.Empty;
    public string GeneratedSql { get; set; } = string.Empty;
    public string TablesJson { get; set; } = "[]";
    public string RelationshipsJson { get; set; } = "[]";
    public string IndexesJson { get; set; } = "[]";
    public string RlsPoliciesJson { get; set; } = "[]";
    public string SeedDataJson { get; set; } = "[]";
    public string ConversationJson { get; set; } = "[]";
    public string ExportFormat { get; set; } = "sql";
    public string DatabaseType { get; set; } = "postgresql";
    public int TableCount { get; set; }
    public int ColumnCount { get; set; }
    public int RelationshipCount { get; set; }
    public int RefinementCount { get; set; }
    public int TokensUsed { get; set; }
    public decimal EstimatedCost { get; set; }
    public int GenerationTimeMs { get; set; }
    public bool IsPublic { get; set; }
    public int ViewCount { get; set; }
    public int ForkCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
