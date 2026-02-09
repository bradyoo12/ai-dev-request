using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTechTrendAnalysis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "project_reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: false),
                    ProjectName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HealthScore = table.Column<int>(type: "integer", nullable: false),
                    FindingsJson = table.Column<string>(type: "text", nullable: false),
                    CriticalCount = table.Column<int>(type: "integer", nullable: false),
                    HighCount = table.Column<int>(type: "integer", nullable: false),
                    MediumCount = table.Column<int>(type: "integer", nullable: false),
                    LowCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_project_reviews_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trend_reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AnalyzedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SummaryJson = table.Column<string>(type: "text", nullable: false),
                    TrendCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trend_reports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "update_recommendations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectReviewId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CurrentVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RecommendedVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EffortEstimate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_update_recommendations", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_project_reviews_DevRequestId",
                table: "project_reviews",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_project_reviews_UserId",
                table: "project_reviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_trend_reports_AnalyzedAt",
                table: "trend_reports",
                column: "AnalyzedAt");

            migrationBuilder.CreateIndex(
                name: "IX_trend_reports_Category",
                table: "trend_reports",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_update_recommendations_ProjectReviewId",
                table: "update_recommendations",
                column: "ProjectReviewId");

            migrationBuilder.CreateIndex(
                name: "IX_update_recommendations_UserId",
                table: "update_recommendations",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "project_reviews");

            migrationBuilder.DropTable(
                name: "trend_reports");

            migrationBuilder.DropTable(
                name: "update_recommendations");
        }
    }
}
