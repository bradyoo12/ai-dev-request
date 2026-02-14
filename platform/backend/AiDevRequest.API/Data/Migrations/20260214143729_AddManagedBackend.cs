using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddManagedBackend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "managed_backends",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DatabaseType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DatabaseConnectionString = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    AuthProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AuthConfigJson = table.Column<string>(type: "jsonb", nullable: true),
                    StorageProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StorageBucket = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    StorageConnectionString = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    HostingProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ContainerAppId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContainerAppUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PreviewUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CustomDomain = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Region = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Tier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CpuCores = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    MemoryGb = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    StorageLimitGb = table.Column<int>(type: "integer", nullable: false),
                    MonthlyBudget = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CurrentMonthCost = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    ProvisionedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastHealthCheck = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_managed_backends", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_managed_backends_ProjectId",
                table: "managed_backends",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_managed_backends_Status",
                table: "managed_backends",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_managed_backends_UserId",
                table: "managed_backends",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "managed_backends");
        }
    }
}
