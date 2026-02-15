using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations;

public partial class AddProjectTemplatesTable : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Idempotent: only create if not exists (handles legacy EnsureCreatedAsync databases)
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS project_templates (
                "Id" uuid NOT NULL,
                "Name" character varying(100) NOT NULL,
                "Description" character varying(255) NOT NULL DEFAULT '',
                "Category" character varying(50) NOT NULL DEFAULT 'general',
                "Framework" character varying(50) NOT NULL DEFAULT 'react',
                "Tags" character varying(500) NOT NULL DEFAULT '',
                "PromptTemplate" text NOT NULL DEFAULT '',
                "CreatedBy" character varying(100) NOT NULL DEFAULT 'system',
                "UsageCount" integer NOT NULL DEFAULT 0,
                "IsPublished" boolean NOT NULL DEFAULT true,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now(),
                CONSTRAINT "PK_project_templates" PRIMARY KEY ("Id")
            );

            CREATE INDEX IF NOT EXISTS "IX_project_templates_Category" ON project_templates ("Category");
            CREATE INDEX IF NOT EXISTS "IX_project_templates_Framework" ON project_templates ("Framework");
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS project_templates;
            """);
    }
}
