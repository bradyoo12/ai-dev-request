using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPatentInnovation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "patent_innovations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PatentAngle = table.Column<string>(type: "text", nullable: false),
                    Innovation = table.Column<string>(type: "text", nullable: false),
                    Uniqueness = table.Column<string>(type: "text", nullable: false),
                    PriorArt = table.Column<string>(type: "text", nullable: false),
                    RelatedFiles = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NoveltyScore = table.Column<int>(type: "integer", nullable: false),
                    NonObviousnessScore = table.Column<int>(type: "integer", nullable: false),
                    UtilityScore = table.Column<int>(type: "integer", nullable: false),
                    CommercialValueScore = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patent_innovations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlaywrightMcpConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    ServerUrl = table.Column<string>(type: "text", nullable: false),
                    Transport = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AuthType = table.Column<string>(type: "text", nullable: true),
                    AuthToken = table.Column<string>(type: "text", nullable: true),
                    AutoHealEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    HealingConfidenceThreshold = table.Column<int>(type: "integer", nullable: false),
                    CapabilitiesJson = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastConnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaywrightMcpConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowAutomationRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowAutomationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    NodesSnapshotJson = table.Column<string>(type: "text", nullable: false),
                    NodeResultsJson = table.Column<string>(type: "text", nullable: false),
                    CurrentNodeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Error = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowAutomationRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowAutomations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    NodesJson = table.Column<string>(type: "text", nullable: false),
                    EdgesJson = table.Column<string>(type: "text", nullable: false),
                    TriggerType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TriggerConfigJson = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    NaturalLanguagePrompt = table.Column<string>(type: "text", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowAutomations", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_patent_innovations_Category",
                table: "patent_innovations",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_patent_innovations_CreatedAt",
                table: "patent_innovations",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_patent_innovations_Status",
                table: "patent_innovations",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "patent_innovations");

            migrationBuilder.DropTable(
                name: "PlaywrightMcpConfigs");

            migrationBuilder.DropTable(
                name: "WorkflowAutomationRuns");

            migrationBuilder.DropTable(
                name: "WorkflowAutomations");
        }
    }
}
