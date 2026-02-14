using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentBuilder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "agent_deployments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AgentSkillId = table.Column<Guid>(type: "uuid", nullable: false),
                    Platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ConfigJson = table.Column<string>(type: "jsonb", nullable: true),
                    MetricsJson = table.Column<string>(type: "jsonb", nullable: true),
                    DeployedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastActiveAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_deployments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_agent_deployments_UserId",
                table: "agent_deployments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_agent_deployments_AgentSkillId",
                table: "agent_deployments",
                column: "AgentSkillId");

            migrationBuilder.CreateIndex(
                name: "IX_agent_deployments_Platform",
                table: "agent_deployments",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_agent_deployments_Status",
                table: "agent_deployments",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "agent_deployments");
        }
    }
}
