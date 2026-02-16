using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentTeams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "AgentTeams" (
                    "Id" uuid NOT NULL,
                    "UserId" character varying(100) NOT NULL,
                    "Name" character varying(200) NOT NULL,
                    "Description" text,
                    "Strategy" character varying(50) NOT NULL DEFAULT 'parallel',
                    "MembersJson" text NOT NULL DEFAULT '[]',
                    "Template" character varying(100),
                    "Status" character varying(50) NOT NULL DEFAULT 'idle',
                    "LastExecutionJson" text,
                    "IsPublic" boolean NOT NULL DEFAULT false,
                    "ExecutionCount" integer NOT NULL DEFAULT 0,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_AgentTeams" PRIMARY KEY ("Id")
                );

                CREATE INDEX IF NOT EXISTS "IX_AgentTeams_UserId" ON "AgentTeams" ("UserId");
                CREATE INDEX IF NOT EXISTS "IX_AgentTeams_Status" ON "AgentTeams" ("Status");
                CREATE INDEX IF NOT EXISTS "IX_AgentTeams_Template" ON "AgentTeams" ("Template");

                ALTER TABLE "AgentSkills" ADD COLUMN IF NOT EXISTS "SkillType" character varying(50);
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS "AgentTeams";
                ALTER TABLE "AgentSkills" DROP COLUMN IF EXISTS "SkillType";
            """);
        }
    }
}
