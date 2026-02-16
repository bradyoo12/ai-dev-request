using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMcpServersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "mcp_servers" (
                    "Id" uuid NOT NULL,
                    "UserId" character varying(100) NOT NULL,
                    "ProjectId" uuid NOT NULL,
                    "Name" character varying(200) NOT NULL,
                    "ServerType" character varying(50) NOT NULL DEFAULT 'project_context',
                    "Endpoint" character varying(500),
                    "Status" character varying(50) DEFAULT 'inactive',
                    "ToolsJson" text NOT NULL DEFAULT '[]',
                    "ResourcesJson" text NOT NULL DEFAULT '[]',
                    "CapabilitiesJson" text NOT NULL DEFAULT '{}',
                    "ConnectionCount" integer NOT NULL DEFAULT 0,
                    "LastActiveAt" timestamp with time zone,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_mcp_servers" PRIMARY KEY ("Id")
                );

                CREATE INDEX IF NOT EXISTS "IX_mcp_servers_UserId" ON "mcp_servers" ("UserId");
                CREATE INDEX IF NOT EXISTS "IX_mcp_servers_ProjectId" ON "mcp_servers" ("ProjectId");
                CREATE INDEX IF NOT EXISTS "IX_mcp_servers_ServerType" ON "mcp_servers" ("ServerType");
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS "mcp_servers";
            """);
        }
    }
}
