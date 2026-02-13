using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiAgentTestSimulation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileChangesJson",
                table: "refinement_messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "refinement_messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AdaptiveThinkingConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    ScaffoldEffort = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    AnalyzeEffort = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ReviewEffort = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    GenerateEffort = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    StructuredOutputsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TotalLowEffortRequests = table.Column<int>(type: "integer", nullable: false),
                    TotalMediumEffortRequests = table.Column<int>(type: "integer", nullable: false),
                    TotalHighEffortRequests = table.Column<int>(type: "integer", nullable: false),
                    TotalThinkingTokens = table.Column<long>(type: "bigint", nullable: false),
                    EstimatedSavings = table.Column<decimal>(type: "numeric", nullable: false),
                    TaskOverridesJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdaptiveThinkingConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentTestExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActionsJson = table.Column<string>(type: "text", nullable: true),
                    IssuesJson = table.Column<string>(type: "text", nullable: true),
                    LogsJson = table.Column<string>(type: "text", nullable: true),
                    ActionsCount = table.Column<int>(type: "integer", nullable: false),
                    IssuesCount = table.Column<int>(type: "integer", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    StackTrace = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentTestExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConcurrencyIssues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    IssueType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AffectedPersonasJson = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    ResourcePath = table.Column<string>(type: "text", nullable: true),
                    ConflictingOperations = table.Column<string>(type: "text", nullable: true),
                    StackTrace = table.Column<string>(type: "text", nullable: true),
                    SuggestedFixJson = table.Column<string>(type: "text", nullable: true),
                    ConfidenceScore = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConcurrencyIssues", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MultiAgentTestSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PersonaCount = table.Column<int>(type: "integer", nullable: false),
                    ConcurrencyLevel = table.Column<int>(type: "integer", nullable: false),
                    ScenarioType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: true),
                    ResultsJson = table.Column<string>(type: "text", nullable: true),
                    TotalActions = table.Column<int>(type: "integer", nullable: false),
                    SuccessfulActions = table.Column<int>(type: "integer", nullable: false),
                    FailedActions = table.Column<int>(type: "integer", nullable: false),
                    IssuesDetected = table.Column<int>(type: "integer", nullable: false),
                    OverallScore = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MultiAgentTestSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TestPersonas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonaType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PersonaName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BehaviorJson = table.Column<string>(type: "text", nullable: true),
                    AgentId = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActionsPerformed = table.Column<int>(type: "integer", nullable: false),
                    ActionsSucceeded = table.Column<int>(type: "integer", nullable: false),
                    ActionsFailed = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestPersonas", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdaptiveThinkingConfigs");

            migrationBuilder.DropTable(
                name: "AgentTestExecutions");

            migrationBuilder.DropTable(
                name: "ConcurrencyIssues");

            migrationBuilder.DropTable(
                name: "MultiAgentTestSessions");

            migrationBuilder.DropTable(
                name: "TestPersonas");

            migrationBuilder.DropColumn(
                name: "FileChangesJson",
                table: "refinement_messages");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "refinement_messages");
        }
    }
}
