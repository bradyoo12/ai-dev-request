using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddObservabilityTracing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedCostSavings",
                table: "dev_requests",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FixHistory",
                table: "dev_requests",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModelTierUsage",
                table: "dev_requests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreviewUrl",
                table: "dev_requests",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ValidationIterations",
                table: "dev_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "ValidationPassed",
                table: "dev_requests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "compilation_results",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Language = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorsJson = table.Column<string>(type: "jsonb", nullable: false),
                    WarningsJson = table.Column<string>(type: "jsonb", nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    CompiledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_compilation_results", x => x.Id);
                    table.ForeignKey(
                        name: "FK_compilation_results_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "generation_manifests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    FilesJson = table.Column<string>(type: "jsonb", nullable: false),
                    CrossReferencesJson = table.Column<string>(type: "jsonb", nullable: false),
                    ValidationResultsJson = table.Column<string>(type: "jsonb", nullable: false),
                    ValidationStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FileCount = table.Column<int>(type: "integer", nullable: false),
                    CrossReferenceCount = table.Column<int>(type: "integer", nullable: false),
                    IssueCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_generation_manifests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_generation_manifests_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "growth_snapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SnapshotDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Period = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TotalVisitors = table.Column<int>(type: "integer", nullable: false),
                    TotalRegistered = table.Column<int>(type: "integer", nullable: false),
                    TotalTrialUsers = table.Column<int>(type: "integer", nullable: false),
                    TotalPaidUsers = table.Column<int>(type: "integer", nullable: false),
                    NewRegistrations = table.Column<int>(type: "integer", nullable: false),
                    NewTrialStarts = table.Column<int>(type: "integer", nullable: false),
                    NewPaidConversions = table.Column<int>(type: "integer", nullable: false),
                    ChurnedUsers = table.Column<int>(type: "integer", nullable: false),
                    ConversionRate = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
                    ChurnRate = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_growth_snapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "infrastructure_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    SelectedServicesJson = table.Column<string>(type: "jsonb", nullable: false),
                    Tier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EstimatedMonthlyCostUsd = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    GeneratedBicepMain = table.Column<string>(type: "text", nullable: true),
                    GeneratedBicepParameters = table.Column<string>(type: "text", nullable: true),
                    AnalysisSummary = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_infrastructure_configs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_infrastructure_configs_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "oauth_compliance_reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopesAnalyzedJson = table.Column<string>(type: "jsonb", nullable: false),
                    RecommendationsJson = table.Column<string>(type: "jsonb", nullable: false),
                    ComplianceDocsJson = table.Column<string>(type: "jsonb", nullable: true),
                    TotalScopesDetected = table.Column<int>(type: "integer", nullable: false),
                    OverPermissionedCount = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_oauth_compliance_reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_oauth_compliance_reports_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "observability_traces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    TraceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,8)", nullable: false),
                    LatencyMs = table.Column<long>(type: "bigint", nullable: false),
                    Model = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_observability_traces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_observability_traces_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_observability_traces_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "platform_events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SessionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Metadata = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_platform_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "preview_deployments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PreviewUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeployedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_preview_deployments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_preview_deployments_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_preview_deployments_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sbom_reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Format = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ComponentsJson = table.Column<string>(type: "jsonb", nullable: false),
                    DependencyCount = table.Column<int>(type: "integer", nullable: false),
                    LicensesSummaryJson = table.Column<string>(type: "jsonb", nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sbom_reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sbom_reports_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "secret_scan_results",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    FindingsJson = table.Column<string>(type: "jsonb", nullable: false),
                    FindingCount = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EnvTemplateContent = table.Column<string>(type: "text", nullable: true),
                    GitignoreContent = table.Column<string>(type: "text", nullable: true),
                    ConfigModuleContent = table.Column<string>(type: "text", nullable: true),
                    KeyVaultConfigContent = table.Column<string>(type: "text", nullable: true),
                    ScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_secret_scan_results", x => x.Id);
                    table.ForeignKey(
                        name: "FK_secret_scan_results_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "observability_spans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TraceId = table.Column<int>(type: "integer", nullable: false),
                    SpanName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Model = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InputTokens = table.Column<int>(type: "integer", nullable: false),
                    OutputTokens = table.Column<int>(type: "integer", nullable: false),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    Cost = table.Column<decimal>(type: "numeric(18,8)", nullable: false),
                    LatencyMs = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_observability_spans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_observability_spans_observability_traces_TraceId",
                        column: x => x.TraceId,
                        principalTable: "observability_traces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vulnerability_results",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SbomReportId = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PackageVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Ecosystem = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VulnerabilityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    FixedVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vulnerability_results", x => x.Id);
                    table.ForeignKey(
                        name: "FK_vulnerability_results_sbom_reports_SbomReportId",
                        column: x => x.SbomReportId,
                        principalTable: "sbom_reports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_compilation_results_CompiledAt",
                table: "compilation_results",
                column: "CompiledAt");

            migrationBuilder.CreateIndex(
                name: "IX_compilation_results_DevRequestId",
                table: "compilation_results",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_generation_manifests_DevRequestId",
                table: "generation_manifests",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_generation_manifests_ValidationStatus",
                table: "generation_manifests",
                column: "ValidationStatus");

            migrationBuilder.CreateIndex(
                name: "IX_growth_snapshots_SnapshotDate_Period",
                table: "growth_snapshots",
                columns: new[] { "SnapshotDate", "Period" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_infrastructure_configs_DevRequestId",
                table: "infrastructure_configs",
                column: "DevRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_oauth_compliance_reports_DevRequestId",
                table: "oauth_compliance_reports",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_oauth_compliance_reports_Status",
                table: "oauth_compliance_reports",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_observability_spans_StartedAt",
                table: "observability_spans",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_observability_spans_TraceId",
                table: "observability_spans",
                column: "TraceId");

            migrationBuilder.CreateIndex(
                name: "IX_observability_traces_CreatedAt",
                table: "observability_traces",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_observability_traces_DevRequestId",
                table: "observability_traces",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_observability_traces_Status",
                table: "observability_traces",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_observability_traces_TraceId",
                table: "observability_traces",
                column: "TraceId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_observability_traces_UserId",
                table: "observability_traces",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_platform_events_CreatedAt",
                table: "platform_events",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_platform_events_EventType",
                table: "platform_events",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_preview_deployments_DevRequestId",
                table: "preview_deployments",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_preview_deployments_Status",
                table: "preview_deployments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_preview_deployments_UserId",
                table: "preview_deployments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_sbom_reports_DevRequestId",
                table: "sbom_reports",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_sbom_reports_GeneratedAt",
                table: "sbom_reports",
                column: "GeneratedAt");

            migrationBuilder.CreateIndex(
                name: "IX_secret_scan_results_DevRequestId",
                table: "secret_scan_results",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_secret_scan_results_ScannedAt",
                table: "secret_scan_results",
                column: "ScannedAt");

            migrationBuilder.CreateIndex(
                name: "IX_vulnerability_results_SbomReportId",
                table: "vulnerability_results",
                column: "SbomReportId");

            migrationBuilder.CreateIndex(
                name: "IX_vulnerability_results_Severity",
                table: "vulnerability_results",
                column: "Severity");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "compilation_results");

            migrationBuilder.DropTable(
                name: "generation_manifests");

            migrationBuilder.DropTable(
                name: "growth_snapshots");

            migrationBuilder.DropTable(
                name: "infrastructure_configs");

            migrationBuilder.DropTable(
                name: "oauth_compliance_reports");

            migrationBuilder.DropTable(
                name: "observability_spans");

            migrationBuilder.DropTable(
                name: "platform_events");

            migrationBuilder.DropTable(
                name: "preview_deployments");

            migrationBuilder.DropTable(
                name: "secret_scan_results");

            migrationBuilder.DropTable(
                name: "vulnerability_results");

            migrationBuilder.DropTable(
                name: "observability_traces");

            migrationBuilder.DropTable(
                name: "sbom_reports");

            migrationBuilder.DropColumn(
                name: "EstimatedCostSavings",
                table: "dev_requests");

            migrationBuilder.DropColumn(
                name: "FixHistory",
                table: "dev_requests");

            migrationBuilder.DropColumn(
                name: "ModelTierUsage",
                table: "dev_requests");

            migrationBuilder.DropColumn(
                name: "PreviewUrl",
                table: "dev_requests");

            migrationBuilder.DropColumn(
                name: "ValidationIterations",
                table: "dev_requests");

            migrationBuilder.DropColumn(
                name: "ValidationPassed",
                table: "dev_requests");
        }
    }
}
