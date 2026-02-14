using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaywrightMcp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sub_tasks");

            migrationBuilder.CreateTable(
                name: "playwright_mcp_test_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: true),
                    TestScenario = table.Column<string>(type: "text", nullable: false),
                    GeneratedTestCode = table.Column<string>(type: "text", nullable: true),
                    HealingHistoryJson = table.Column<string>(type: "jsonb", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SuccessRate = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_playwright_mcp_test_configs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "test_healing_records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TestConfigId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalLocator = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    UpdatedLocator = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    FailureReason = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    HealingStrategy = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_test_healing_records", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_playwright_mcp_test_configs_CreatedAt",
                table: "playwright_mcp_test_configs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_playwright_mcp_test_configs_Status",
                table: "playwright_mcp_test_configs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_playwright_mcp_test_configs_UserId",
                table: "playwright_mcp_test_configs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_test_healing_records_CreatedAt",
                table: "test_healing_records",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_test_healing_records_TestConfigId",
                table: "test_healing_records",
                column: "TestConfigId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "playwright_mcp_test_configs");

            migrationBuilder.DropTable(
                name: "test_healing_records");

            migrationBuilder.CreateTable(
                name: "sub_tasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DependsOnSubTaskId = table.Column<Guid>(type: "uuid", nullable: true),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    EstimatedCredits = table.Column<int>(type: "integer", nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sub_tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sub_tasks_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_sub_tasks_sub_tasks_DependsOnSubTaskId",
                        column: x => x.DependsOnSubTaskId,
                        principalTable: "sub_tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_sub_tasks_DependsOnSubTaskId",
                table: "sub_tasks",
                column: "DependsOnSubTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_sub_tasks_DevRequestId",
                table: "sub_tasks",
                column: "DevRequestId");
        }
    }
}
