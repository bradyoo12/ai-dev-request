using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAutonomousTestExecution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnalyzeEffort",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "EstimatedSavings",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "GenerateEffort",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "ReviewEffort",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "ScaffoldEffort",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "StructuredOutputsEnabled",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "TaskOverridesJson",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "TotalHighEffortRequests",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "TotalLowEffortRequests",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "TotalMediumEffortRequests",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "TotalThinkingTokens",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "AdaptiveThinkingConfigs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<string>(
                name: "ConfigJson",
                table: "AdaptiveThinkingConfigs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ModelName",
                table: "AdaptiveThinkingConfigs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AutonomousTestExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviewDeploymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    MaxIterations = table.Column<int>(type: "integer", nullable: false),
                    CurrentIteration = table.Column<int>(type: "integer", nullable: false),
                    TestsPassed = table.Column<bool>(type: "boolean", nullable: false),
                    FinalTestResult = table.Column<string>(type: "text", nullable: true),
                    TestExecutionIds = table.Column<string>(type: "text", nullable: true),
                    CodeRegenerationAttempts = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AutonomousTestExecutions", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AutonomousTestExecutions");

            migrationBuilder.DropColumn(
                name: "ConfigJson",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.DropColumn(
                name: "ModelName",
                table: "AdaptiveThinkingConfigs");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "AdaptiveThinkingConfigs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "AnalyzeEffort",
                table: "AdaptiveThinkingConfigs",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedSavings",
                table: "AdaptiveThinkingConfigs",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "GenerateEffort",
                table: "AdaptiveThinkingConfigs",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReviewEffort",
                table: "AdaptiveThinkingConfigs",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ScaffoldEffort",
                table: "AdaptiveThinkingConfigs",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "StructuredOutputsEnabled",
                table: "AdaptiveThinkingConfigs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TaskOverridesJson",
                table: "AdaptiveThinkingConfigs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalHighEffortRequests",
                table: "AdaptiveThinkingConfigs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalLowEffortRequests",
                table: "AdaptiveThinkingConfigs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalMediumEffortRequests",
                table: "AdaptiveThinkingConfigs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "TotalThinkingTokens",
                table: "AdaptiveThinkingConfigs",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }
    }
}
