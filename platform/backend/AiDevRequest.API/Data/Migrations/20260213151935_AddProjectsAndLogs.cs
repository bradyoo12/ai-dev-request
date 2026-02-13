using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectsAndLogs : Migration
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
                name: "OrganizationalMemories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    EmbeddingVectorJson = table.Column<string>(type: "text", nullable: true),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationalMemories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ProductionUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PreviewUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastDeployedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Projects_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id");
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

            migrationBuilder.CreateTable(
                name: "ProjectLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    Source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectLogs_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectLogs_ProjectId",
                table: "ProjectLogs",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_DevRequestId",
                table: "Projects",
                column: "DevRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgentTestExecutions");

            migrationBuilder.DropTable(
                name: "AutonomousTestExecutions");

            migrationBuilder.DropTable(
                name: "ConcurrencyIssues");

            migrationBuilder.DropTable(
                name: "MultiAgentTestSessions");

            migrationBuilder.DropTable(
                name: "OrganizationalMemories");

            migrationBuilder.DropTable(
                name: "ProjectLogs");

            migrationBuilder.DropTable(
                name: "TestPersonas");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropColumn(
                name: "FileChangesJson",
                table: "refinement_messages");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "refinement_messages");
        }
    }
}
