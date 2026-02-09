namespace AiDevRequest.API.Services;

public interface IDatabaseSchemaService
{
    Task<DatabaseSchemaResult> GenerateSchemaAsync(string projectPath, string projectType, string description);
}

public class DatabaseSchemaService : IDatabaseSchemaService
{
    private readonly ILogger<DatabaseSchemaService> _logger;

    public DatabaseSchemaService(ILogger<DatabaseSchemaService> logger)
    {
        _logger = logger;
    }

    public async Task<DatabaseSchemaResult> GenerateSchemaAsync(string projectPath, string projectType, string description)
    {
        _logger.LogInformation("Generating database schema for {ProjectPath} ({ProjectType})", projectPath, projectType);

        // Analyze project files to determine if database is needed
        var tables = ExtractTablesFromDescription(description);

        if (tables.Count == 0)
        {
            return new DatabaseSchemaResult
            {
                HasDatabase = false,
                Summary = "No database required for this project."
            };
        }

        // Determine DB provider based on project type
        var provider = projectType.ToLowerInvariant() switch
        {
            "dotnet" => "PostgreSQL",
            "python" => "PostgreSQL",
            _ => "Supabase"
        };

        // Generate schema SQL file
        var schemaDir = Path.Combine(projectPath, "database");
        Directory.CreateDirectory(schemaDir);

        var schemaContent = GenerateSchemaSQL(tables, provider);
        await File.WriteAllTextAsync(Path.Combine(schemaDir, "schema.sql"), schemaContent);

        // Generate migration file
        var migrationContent = GenerateMigration(tables, provider);
        await File.WriteAllTextAsync(Path.Combine(schemaDir, "001_initial.sql"), migrationContent);

        // Generate seed data file
        var seedContent = GenerateSeedSQL(tables);
        await File.WriteAllTextAsync(Path.Combine(schemaDir, "seed.sql"), seedContent);

        // Generate .env.database template
        var envContent = GenerateEnvTemplate(provider);
        await File.WriteAllTextAsync(Path.Combine(schemaDir, ".env.database"), envContent);

        // Calculate relationships
        var relationships = ExtractRelationships(tables);

        _logger.LogInformation("Generated database schema: {Tables} tables, {Relationships} relationships, provider: {Provider}",
            tables.Count, relationships.Count, provider);

        return new DatabaseSchemaResult
        {
            HasDatabase = true,
            Provider = provider,
            Tables = tables,
            Relationships = relationships,
            MigrationCount = 1,
            Summary = $"{tables.Count} tables with {relationships.Count} relationships using {provider}",
            ConnectionStringTemplate = GetConnectionStringTemplate(provider)
        };
    }

    private static List<TableInfo> ExtractTablesFromDescription(string description)
    {
        var tables = new List<TableInfo>();
        var desc = description.ToLowerInvariant();

        // Common patterns that indicate database needs
        if (desc.Contains("user") || desc.Contains("account") || desc.Contains("사용자") || desc.Contains("회원"))
        {
            tables.Add(new TableInfo
            {
                Name = "users",
                Columns = new List<ColumnInfo>
                {
                    new() { Name = "id", Type = "UUID", IsPrimaryKey = true },
                    new() { Name = "email", Type = "VARCHAR(255)", IsUnique = true, IsNullable = false },
                    new() { Name = "password_hash", Type = "VARCHAR(255)", IsNullable = false },
                    new() { Name = "display_name", Type = "VARCHAR(100)" },
                    new() { Name = "avatar_url", Type = "TEXT" },
                    new() { Name = "created_at", Type = "TIMESTAMP", IsNullable = false },
                    new() { Name = "updated_at", Type = "TIMESTAMP", IsNullable = false }
                }
            });
        }

        if (desc.Contains("product") || desc.Contains("item") || desc.Contains("상품") || desc.Contains("제품") ||
            desc.Contains("shop") || desc.Contains("store") || desc.Contains("쇼핑") || desc.Contains("마켓"))
        {
            tables.Add(new TableInfo
            {
                Name = "products",
                Columns = new List<ColumnInfo>
                {
                    new() { Name = "id", Type = "UUID", IsPrimaryKey = true },
                    new() { Name = "name", Type = "VARCHAR(255)", IsNullable = false },
                    new() { Name = "description", Type = "TEXT" },
                    new() { Name = "price", Type = "DECIMAL(10,2)", IsNullable = false },
                    new() { Name = "image_url", Type = "TEXT" },
                    new() { Name = "category", Type = "VARCHAR(100)" },
                    new() { Name = "stock", Type = "INTEGER", IsNullable = false },
                    new() { Name = "created_at", Type = "TIMESTAMP", IsNullable = false }
                }
            });
        }

        if (desc.Contains("order") || desc.Contains("cart") || desc.Contains("주문") || desc.Contains("장바구니"))
        {
            tables.Add(new TableInfo
            {
                Name = "orders",
                Columns = new List<ColumnInfo>
                {
                    new() { Name = "id", Type = "UUID", IsPrimaryKey = true },
                    new() { Name = "user_id", Type = "UUID", ForeignKey = "users(id)" },
                    new() { Name = "total_amount", Type = "DECIMAL(10,2)", IsNullable = false },
                    new() { Name = "status", Type = "VARCHAR(50)", IsNullable = false },
                    new() { Name = "created_at", Type = "TIMESTAMP", IsNullable = false }
                }
            });
        }

        if (desc.Contains("post") || desc.Contains("article") || desc.Contains("blog") ||
            desc.Contains("게시") || desc.Contains("글") || desc.Contains("블로그"))
        {
            tables.Add(new TableInfo
            {
                Name = "posts",
                Columns = new List<ColumnInfo>
                {
                    new() { Name = "id", Type = "UUID", IsPrimaryKey = true },
                    new() { Name = "author_id", Type = "UUID", ForeignKey = "users(id)" },
                    new() { Name = "title", Type = "VARCHAR(255)", IsNullable = false },
                    new() { Name = "content", Type = "TEXT", IsNullable = false },
                    new() { Name = "published", Type = "BOOLEAN", IsNullable = false },
                    new() { Name = "created_at", Type = "TIMESTAMP", IsNullable = false },
                    new() { Name = "updated_at", Type = "TIMESTAMP", IsNullable = false }
                }
            });
        }

        if (desc.Contains("booking") || desc.Contains("reservation") || desc.Contains("appointment") ||
            desc.Contains("예약"))
        {
            tables.Add(new TableInfo
            {
                Name = "bookings",
                Columns = new List<ColumnInfo>
                {
                    new() { Name = "id", Type = "UUID", IsPrimaryKey = true },
                    new() { Name = "user_id", Type = "UUID", ForeignKey = "users(id)" },
                    new() { Name = "service_name", Type = "VARCHAR(255)", IsNullable = false },
                    new() { Name = "booking_date", Type = "DATE", IsNullable = false },
                    new() { Name = "booking_time", Type = "TIME", IsNullable = false },
                    new() { Name = "status", Type = "VARCHAR(50)", IsNullable = false },
                    new() { Name = "notes", Type = "TEXT" },
                    new() { Name = "created_at", Type = "TIMESTAMP", IsNullable = false }
                }
            });
        }

        if (desc.Contains("task") || desc.Contains("todo") || desc.Contains("할일") || desc.Contains("작업"))
        {
            tables.Add(new TableInfo
            {
                Name = "tasks",
                Columns = new List<ColumnInfo>
                {
                    new() { Name = "id", Type = "UUID", IsPrimaryKey = true },
                    new() { Name = "user_id", Type = "UUID", ForeignKey = "users(id)" },
                    new() { Name = "title", Type = "VARCHAR(255)", IsNullable = false },
                    new() { Name = "description", Type = "TEXT" },
                    new() { Name = "priority", Type = "VARCHAR(20)" },
                    new() { Name = "completed", Type = "BOOLEAN", IsNullable = false },
                    new() { Name = "due_date", Type = "DATE" },
                    new() { Name = "created_at", Type = "TIMESTAMP", IsNullable = false }
                }
            });
        }

        if (desc.Contains("chat") || desc.Contains("message") || desc.Contains("채팅") || desc.Contains("메시지"))
        {
            tables.Add(new TableInfo
            {
                Name = "messages",
                Columns = new List<ColumnInfo>
                {
                    new() { Name = "id", Type = "UUID", IsPrimaryKey = true },
                    new() { Name = "sender_id", Type = "UUID", ForeignKey = "users(id)" },
                    new() { Name = "content", Type = "TEXT", IsNullable = false },
                    new() { Name = "channel", Type = "VARCHAR(100)" },
                    new() { Name = "created_at", Type = "TIMESTAMP", IsNullable = false }
                }
            });
        }

        // If we have domain tables but no users table, add a basic users table
        if (tables.Count > 0 && !tables.Any(t => t.Name == "users"))
        {
            tables.Insert(0, new TableInfo
            {
                Name = "users",
                Columns = new List<ColumnInfo>
                {
                    new() { Name = "id", Type = "UUID", IsPrimaryKey = true },
                    new() { Name = "email", Type = "VARCHAR(255)", IsUnique = true, IsNullable = false },
                    new() { Name = "display_name", Type = "VARCHAR(100)" },
                    new() { Name = "created_at", Type = "TIMESTAMP", IsNullable = false }
                }
            });
        }

        return tables;
    }

    private static List<RelationshipInfo> ExtractRelationships(List<TableInfo> tables)
    {
        var relationships = new List<RelationshipInfo>();
        foreach (var table in tables)
        {
            foreach (var col in table.Columns.Where(c => c.ForeignKey != null))
            {
                var fkParts = col.ForeignKey!.Split('(');
                var refTable = fkParts[0];
                relationships.Add(new RelationshipInfo
                {
                    FromTable = table.Name,
                    FromColumn = col.Name,
                    ToTable = refTable,
                    Type = "many-to-one"
                });
            }
        }
        return relationships;
    }

    private static string GenerateSchemaSQL(List<TableInfo> tables, string provider)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"-- Database Schema ({provider})");
        sb.AppendLine($"-- Generated by AI Dev Request");
        sb.AppendLine($"-- Created: {DateTime.UtcNow:yyyy-MM-dd}");
        sb.AppendLine();

        if (provider == "PostgreSQL")
        {
            sb.AppendLine("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
            sb.AppendLine();
        }

        foreach (var table in tables)
        {
            sb.AppendLine($"CREATE TABLE {table.Name} (");
            var columnDefs = new List<string>();

            foreach (var col in table.Columns)
            {
                var def = $"    {col.Name} {col.Type}";
                if (col.IsPrimaryKey)
                    def += " PRIMARY KEY DEFAULT uuid_generate_v4()";
                else if (!col.IsNullable)
                    def += " NOT NULL";
                if (col.IsUnique)
                    def += " UNIQUE";
                if (col.Name.EndsWith("_at") && col.Type == "TIMESTAMP")
                    def += " DEFAULT NOW()";
                if (col.Name == "completed" || col.Name == "published")
                    def += " DEFAULT FALSE";
                if (col.Name == "stock")
                    def += " DEFAULT 0";
                columnDefs.Add(def);
            }

            // Add foreign key constraints
            foreach (var col in table.Columns.Where(c => c.ForeignKey != null))
            {
                var fkParts = col.ForeignKey!.Split('(');
                var refTable = fkParts[0];
                var refCol = fkParts[1].TrimEnd(')');
                columnDefs.Add($"    CONSTRAINT fk_{table.Name}_{col.Name} FOREIGN KEY ({col.Name}) REFERENCES {refTable}({refCol}) ON DELETE CASCADE");
            }

            sb.AppendLine(string.Join(",\n", columnDefs));
            sb.AppendLine(");");
            sb.AppendLine();
        }

        return sb.ToString();
    }

    private static string GenerateMigration(List<TableInfo> tables, string provider)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("-- Migration: 001_initial");
        sb.AppendLine($"-- Provider: {provider}");
        sb.AppendLine($"-- Date: {DateTime.UtcNow:yyyy-MM-dd}");
        sb.AppendLine();
        sb.AppendLine("BEGIN;");
        sb.AppendLine();
        sb.AppendLine(GenerateSchemaSQL(tables, provider));
        sb.AppendLine("-- Add indexes for common queries");
        foreach (var table in tables)
        {
            foreach (var col in table.Columns.Where(c => c.ForeignKey != null))
            {
                sb.AppendLine($"CREATE INDEX idx_{table.Name}_{col.Name} ON {table.Name}({col.Name});");
            }
            if (table.Columns.Any(c => c.Name == "created_at"))
            {
                sb.AppendLine($"CREATE INDEX idx_{table.Name}_created_at ON {table.Name}(created_at DESC);");
            }
        }
        sb.AppendLine();
        sb.AppendLine("COMMIT;");
        return sb.ToString();
    }

    private static string GenerateSeedSQL(List<TableInfo> tables)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("-- Seed Data");
        sb.AppendLine("-- Run this after schema migration to populate initial data");
        sb.AppendLine();

        if (tables.Any(t => t.Name == "users"))
        {
            sb.AppendLine("INSERT INTO users (email, display_name) VALUES");
            sb.AppendLine("    ('admin@example.com', 'Admin'),");
            sb.AppendLine("    ('demo@example.com', 'Demo User');");
            sb.AppendLine();
        }

        return sb.ToString();
    }

    private static string GenerateEnvTemplate(string provider)
    {
        return provider switch
        {
            "Supabase" => """
                # Supabase Configuration
                SUPABASE_URL=https://your-project.supabase.co
                SUPABASE_ANON_KEY=your-anon-key
                SUPABASE_SERVICE_KEY=your-service-key
                """,
            _ => """
                # PostgreSQL Configuration
                DATABASE_URL=postgresql://user:password@localhost:5432/mydb
                DB_HOST=localhost
                DB_PORT=5432
                DB_NAME=mydb
                DB_USER=user
                DB_PASSWORD=password
                """
        };
    }

    private static string GetConnectionStringTemplate(string provider)
    {
        return provider switch
        {
            "Supabase" => "https://<project>.supabase.co",
            _ => "postgresql://user:password@localhost:5432/mydb"
        };
    }
}

public class DatabaseSchemaResult
{
    public bool HasDatabase { get; set; }
    public string? Provider { get; set; }
    public List<TableInfo> Tables { get; set; } = new();
    public List<RelationshipInfo> Relationships { get; set; } = new();
    public int MigrationCount { get; set; }
    public string Summary { get; set; } = "";
    public string? ConnectionStringTemplate { get; set; }
}

public class TableInfo
{
    public string Name { get; set; } = "";
    public List<ColumnInfo> Columns { get; set; } = new();
}

public class ColumnInfo
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public bool IsPrimaryKey { get; set; }
    public bool IsNullable { get; set; } = true;
    public bool IsUnique { get; set; }
    public string? ForeignKey { get; set; }
}

public class RelationshipInfo
{
    public string FromTable { get; set; } = "";
    public string FromColumn { get; set; } = "";
    public string ToTable { get; set; } = "";
    public string Type { get; set; } = "";
}
