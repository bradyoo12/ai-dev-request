using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionTrackingAndChurnMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "churn_metric_snapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalSubscribers = table.Column<int>(type: "integer", nullable: false),
                    NewSubscribers = table.Column<int>(type: "integer", nullable: false),
                    ChurnedSubscribers = table.Column<int>(type: "integer", nullable: false),
                    ChurnRate = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
                    Mrr = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NetGrowth = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_churn_metric_snapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "subscription_events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UserEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    EventType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FromPlan = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ToPlan = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscription_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "subscription_records",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PlanType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CanceledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscription_records", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_churn_metric_snapshots_PeriodStart",
                table: "churn_metric_snapshots",
                column: "PeriodStart");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_events_CreatedAt",
                table: "subscription_events",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_events_EventType",
                table: "subscription_events",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_events_UserId",
                table: "subscription_events",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_records_StartedAt",
                table: "subscription_records",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_records_Status",
                table: "subscription_records",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_records_UserId",
                table: "subscription_records",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "churn_metric_snapshots");

            migrationBuilder.DropTable(
                name: "subscription_events");

            migrationBuilder.DropTable(
                name: "subscription_records");
        }
    }
}
