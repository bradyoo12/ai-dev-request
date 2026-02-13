using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdaptiveThinkingConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "SelectedModel",
                table: "AiModelConfigs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<string>(
                name: "EffortLevelConfigJson",
                table: "AiModelConfigs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredProvider",
                table: "AiModelConfigs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "StructuredOutputsEnabled",
                table: "AiModelConfigs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AgenticWorkflows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    WorkflowName = table.Column<string>(type: "text", nullable: false),
                    WorkflowVersion = table.Column<string>(type: "text", nullable: false),
                    DeploymentStrategy = table.Column<string>(type: "text", nullable: false),
                    RolloutPercent = table.Column<int>(type: "integer", nullable: false),
                    SuccessRate = table.Column<double>(type: "double precision", nullable: false),
                    AvgLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    CostPerRequest = table.Column<double>(type: "double precision", nullable: false),
                    TotalRequests = table.Column<int>(type: "integer", nullable: false),
                    FailedRequests = table.Column<int>(type: "integer", nullable: false),
                    RollbackTriggered = table.Column<bool>(type: "boolean", nullable: false),
                    RollbackReason = table.Column<string>(type: "text", nullable: false),
                    RollbackVersion = table.Column<string>(type: "text", nullable: false),
                    HealthStatus = table.Column<string>(type: "text", nullable: false),
                    MonitoringAlerts = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgenticWorkflows", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentInboxItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Content = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SubmitterEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SubmitterName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AiResponseJson = table.Column<string>(type: "text", nullable: true),
                    TriggeredDevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentInboxItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    MessageType = table.Column<string>(type: "text", nullable: false),
                    FromAgent = table.Column<string>(type: "text", nullable: false),
                    ToAgent = table.Column<string>(type: "text", nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    DeliveryStatus = table.Column<string>(type: "text", nullable: false),
                    LatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    RequiresAck = table.Column<bool>(type: "boolean", nullable: false),
                    Acknowledged = table.Column<bool>(type: "boolean", nullable: false),
                    CorrelationId = table.Column<string>(type: "text", nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentSdkSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    TaskDescription = table.Column<string>(type: "text", nullable: false),
                    ToolCallsTotal = table.Column<int>(type: "integer", nullable: false),
                    ToolCallsSucceeded = table.Column<int>(type: "integer", nullable: false),
                    SubagentsSpawned = table.Column<int>(type: "integer", nullable: false),
                    SkillsInvoked = table.Column<int>(type: "integer", nullable: false),
                    McpServersConnected = table.Column<int>(type: "integer", nullable: false),
                    ContextTokensUsed = table.Column<int>(type: "integer", nullable: false),
                    ContextCompressions = table.Column<int>(type: "integer", nullable: false),
                    RetryAttempts = table.Column<int>(type: "integer", nullable: false),
                    SuccessRate = table.Column<double>(type: "double precision", nullable: false),
                    DurationMs = table.Column<int>(type: "integer", nullable: false),
                    AgentModel = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentSdkSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentSkills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<string>(type: "text", nullable: true),
                    InstructionContent = table.Column<string>(type: "text", nullable: true),
                    ScriptsJson = table.Column<string>(type: "text", nullable: true),
                    ResourcesJson = table.Column<string>(type: "text", nullable: true),
                    TagsJson = table.Column<string>(type: "text", nullable: true),
                    IsBuiltIn = table.Column<bool>(type: "boolean", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    DownloadCount = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<string>(type: "text", nullable: true),
                    Author = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentSkills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentTerminalSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    AccessMode = table.Column<string>(type: "text", nullable: false),
                    SandboxType = table.Column<string>(type: "text", nullable: false),
                    CommandsExecuted = table.Column<int>(type: "integer", nullable: false),
                    BrowserActions = table.Column<int>(type: "integer", nullable: false),
                    SubagentsDelegated = table.Column<int>(type: "integer", nullable: false),
                    FilesModified = table.Column<int>(type: "integer", nullable: false),
                    CpuLimitPercent = table.Column<double>(type: "double precision", nullable: false),
                    MemoryLimitMb = table.Column<int>(type: "integer", nullable: false),
                    TimeoutMinutes = table.Column<int>(type: "integer", nullable: false),
                    NetworkEgressAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    SessionDurationMs = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    OutputLog = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentTerminalSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentTraces",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TotalFiles = table.Column<int>(type: "integer", nullable: false),
                    AiGeneratedFiles = table.Column<int>(type: "integer", nullable: false),
                    HumanEditedFiles = table.Column<int>(type: "integer", nullable: false),
                    MixedFiles = table.Column<int>(type: "integer", nullable: false),
                    AiContributionPercentage = table.Column<decimal>(type: "numeric", nullable: false),
                    TraceDataJson = table.Column<string>(type: "text", nullable: true),
                    ExportFormat = table.Column<string>(type: "text", nullable: true),
                    ExportedAt = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentTraces", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiAgentRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Scope = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    TimesApplied = table.Column<int>(type: "integer", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiAgentRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiModelIntegrations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    ProviderId = table.Column<string>(type: "text", nullable: false),
                    ModelId = table.Column<string>(type: "text", nullable: false),
                    Capability = table.Column<string>(type: "text", nullable: false),
                    IntegrationStatus = table.Column<string>(type: "text", nullable: false),
                    CredentialSecured = table.Column<bool>(type: "boolean", nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: false),
                    EstimatedCostPerRequest = table.Column<double>(type: "double precision", nullable: false),
                    TotalRequests = table.Column<int>(type: "integer", nullable: false),
                    GeneratedCodeSnippet = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiModelIntegrations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BiomeLintResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Toolchain = table.Column<string>(type: "text", nullable: false),
                    TotalFiles = table.Column<int>(type: "integer", nullable: false),
                    FilesLinted = table.Column<int>(type: "integer", nullable: false),
                    Errors = table.Column<int>(type: "integer", nullable: false),
                    Warnings = table.Column<int>(type: "integer", nullable: false),
                    AutoFixed = table.Column<int>(type: "integer", nullable: false),
                    LintDurationMs = table.Column<double>(type: "double precision", nullable: false),
                    FormatDurationMs = table.Column<double>(type: "double precision", nullable: false),
                    TotalDurationMs = table.Column<double>(type: "double precision", nullable: false),
                    SpeedupFactor = table.Column<double>(type: "double precision", nullable: false),
                    TypeAwareEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TypeAwareIssues = table.Column<int>(type: "integer", nullable: false),
                    ConfigPreset = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BiomeLintResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BrowserIdeSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Runtime = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    LinesOfCode = table.Column<int>(type: "integer", nullable: false),
                    PackagesInstalled = table.Column<int>(type: "integer", nullable: false),
                    ExecutionTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    HasErrors = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorCount = table.Column<int>(type: "integer", nullable: false),
                    ConsoleOutputLines = table.Column<int>(type: "integer", nullable: false),
                    LivePreviewEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SharedLink = table.Column<bool>(type: "boolean", nullable: false),
                    ShareId = table.Column<string>(type: "text", nullable: false),
                    ForkCount = table.Column<int>(type: "integer", nullable: false),
                    MemoryUsageMb = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BrowserIdeSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BuildToolchainResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Bundler = table.Column<string>(type: "text", nullable: false),
                    TotalModules = table.Column<int>(type: "integer", nullable: false),
                    DevStartupMs = table.Column<double>(type: "double precision", nullable: false),
                    HmrLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    BuildDurationMs = table.Column<double>(type: "double precision", nullable: false),
                    BundleSizeKb = table.Column<double>(type: "double precision", nullable: false),
                    ChunksGenerated = table.Column<int>(type: "integer", nullable: false),
                    TreeShakingPercent = table.Column<double>(type: "double precision", nullable: false),
                    CodeSplitSavingsPercent = table.Column<double>(type: "double precision", nullable: false),
                    SpeedupFactor = table.Column<double>(type: "double precision", nullable: false),
                    FullBundleMode = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuildToolchainResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CodebaseGraphs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    TotalNodes = table.Column<int>(type: "integer", nullable: false),
                    TotalEdges = table.Column<int>(type: "integer", nullable: false),
                    Components = table.Column<int>(type: "integer", nullable: false),
                    Pages = table.Column<int>(type: "integer", nullable: false),
                    Services = table.Column<int>(type: "integer", nullable: false),
                    Utilities = table.Column<int>(type: "integer", nullable: false),
                    MaxDepth = table.Column<int>(type: "integer", nullable: false),
                    AvgConnections = table.Column<double>(type: "double precision", nullable: false),
                    CircularDeps = table.Column<int>(type: "integer", nullable: false),
                    CouplingScore = table.Column<double>(type: "double precision", nullable: false),
                    CohesionScore = table.Column<double>(type: "double precision", nullable: false),
                    ComplexityScore = table.Column<double>(type: "double precision", nullable: false),
                    AnalysisMode = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodebaseGraphs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CodeLintResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Language = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    RuleId = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    LineNumber = table.Column<int>(type: "integer", nullable: false),
                    Snippet = table.Column<string>(type: "text", nullable: false),
                    SuggestedFix = table.Column<string>(type: "text", nullable: false),
                    AutofixStatus = table.Column<string>(type: "text", nullable: false),
                    PullRequestUrl = table.Column<string>(type: "text", nullable: false),
                    IsResolved = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodeLintResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CodeReviewAgents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewId = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentType = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Findings = table.Column<string>(type: "text", nullable: true),
                    RiskScore = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CodeReviewAgents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ComposerPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Prompt = table.Column<string>(type: "text", nullable: false),
                    PlanMode = table.Column<string>(type: "text", nullable: false),
                    TotalSteps = table.Column<int>(type: "integer", nullable: false),
                    CompletedSteps = table.Column<int>(type: "integer", nullable: false),
                    FilesChanged = table.Column<int>(type: "integer", nullable: false),
                    LinesAdded = table.Column<int>(type: "integer", nullable: false),
                    LinesRemoved = table.Column<int>(type: "integer", nullable: false),
                    ModelTier = table.Column<string>(type: "text", nullable: false),
                    EstimatedTokens = table.Column<double>(type: "double precision", nullable: false),
                    ActualTokens = table.Column<double>(type: "double precision", nullable: false),
                    DiffPreviewShown = table.Column<bool>(type: "boolean", nullable: false),
                    PlanApproved = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PlanSummary = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComposerPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConfidenceScores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RequestTitle = table.Column<string>(type: "text", nullable: false),
                    RequestDescription = table.Column<string>(type: "text", nullable: false),
                    ConfidenceLevel = table.Column<string>(type: "text", nullable: false),
                    Score = table.Column<double>(type: "double precision", nullable: false),
                    ComplexityRating = table.Column<string>(type: "text", nullable: false),
                    AmbiguityLevel = table.Column<string>(type: "text", nullable: false),
                    FeasibilityRating = table.Column<string>(type: "text", nullable: false),
                    Factors = table.Column<string>(type: "text", nullable: false),
                    Suggestions = table.Column<string>(type: "text", nullable: false),
                    EstimatedEffort = table.Column<string>(type: "text", nullable: false),
                    WasAccurate = table.Column<bool>(type: "boolean", nullable: false),
                    ActualOutcome = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfidenceScores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DevRequestBranches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchName = table.Column<string>(type: "text", nullable: false),
                    BaseBranch = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LastSyncedCommitSha = table.Column<string>(type: "text", nullable: true),
                    LastLocalCommitSha = table.Column<string>(type: "text", nullable: true),
                    TotalCommits = table.Column<int>(type: "integer", nullable: false),
                    TotalSyncs = table.Column<int>(type: "integer", nullable: false),
                    HasPullRequest = table.Column<bool>(type: "boolean", nullable: false),
                    PullRequestUrl = table.Column<string>(type: "text", nullable: true),
                    PullRequestNumber = table.Column<int>(type: "integer", nullable: true),
                    PreviewUrl = table.Column<string>(type: "text", nullable: true),
                    CommitHistoryJson = table.Column<string>(type: "text", nullable: false),
                    LastPushedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPulledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MergedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DevRequestBranches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DotnetUpgradeResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    CurrentVersion = table.Column<string>(type: "text", nullable: false),
                    TargetVersion = table.Column<string>(type: "text", nullable: false),
                    PackagesUpgraded = table.Column<int>(type: "integer", nullable: false),
                    BreakingChanges = table.Column<int>(type: "integer", nullable: false),
                    DeprecationWarnings = table.Column<int>(type: "integer", nullable: false),
                    CSharp14Adoptions = table.Column<int>(type: "integer", nullable: false),
                    StartupTimeReduction = table.Column<double>(type: "double precision", nullable: false),
                    MemoryReduction = table.Column<double>(type: "double precision", nullable: false),
                    ThroughputIncrease = table.Column<double>(type: "double precision", nullable: false),
                    VectorSearchEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    NativeAotEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    McpSupportEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AnalysisDurationMs = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DotnetUpgradeResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EditPredictions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    SourceFile = table.Column<string>(type: "text", nullable: false),
                    ChangeType = table.Column<string>(type: "text", nullable: false),
                    ChangeDescription = table.Column<string>(type: "text", nullable: false),
                    AffectedFiles = table.Column<int>(type: "integer", nullable: false),
                    PredictedEdits = table.Column<int>(type: "integer", nullable: false),
                    AcceptedEdits = table.Column<int>(type: "integer", nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    RippleDepth = table.Column<double>(type: "double precision", nullable: false),
                    DependencyNodes = table.Column<int>(type: "integer", nullable: false),
                    ImportReferences = table.Column<int>(type: "integer", nullable: false),
                    TypeReferences = table.Column<int>(type: "integer", nullable: false),
                    TestFilesAffected = table.Column<int>(type: "integer", nullable: false),
                    AnalysisTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EditPredictions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GovernanceActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    ActionType = table.Column<string>(type: "text", nullable: false),
                    ActionDescription = table.Column<string>(type: "text", nullable: false),
                    Classification = table.Column<string>(type: "text", nullable: false),
                    AgentId = table.Column<string>(type: "text", nullable: false),
                    RequiresApproval = table.Column<bool>(type: "boolean", nullable: false),
                    ApprovalStatus = table.Column<string>(type: "text", nullable: false),
                    ApprovedBy = table.Column<string>(type: "text", nullable: false),
                    Blocked = table.Column<bool>(type: "boolean", nullable: false),
                    BlockReason = table.Column<string>(type: "text", nullable: false),
                    Rolled = table.Column<bool>(type: "boolean", nullable: false),
                    RollbackAction = table.Column<string>(type: "text", nullable: false),
                    ExecutionTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    AffectedFiles = table.Column<int>(type: "integer", nullable: false),
                    AuditTrail = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GovernanceActions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HybridCacheEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CacheKey = table.Column<string>(type: "text", nullable: false),
                    CacheLayer = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    HitCount = table.Column<int>(type: "integer", nullable: false),
                    MissCount = table.Column<int>(type: "integer", nullable: false),
                    StampedeProtected = table.Column<bool>(type: "boolean", nullable: false),
                    StampedeBlockedCount = table.Column<int>(type: "integer", nullable: false),
                    AvgLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    CostSavedUsd = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TtlSeconds = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HybridCacheEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HybridValidations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    OperationType = table.Column<string>(type: "text", nullable: false),
                    AiOutput = table.Column<string>(type: "text", nullable: false),
                    ValidationResult = table.Column<string>(type: "text", nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    MaxRetries = table.Column<int>(type: "integer", nullable: false),
                    UsedFallback = table.Column<bool>(type: "boolean", nullable: false),
                    FallbackAction = table.Column<string>(type: "text", nullable: false),
                    FailureReason = table.Column<string>(type: "text", nullable: false),
                    RulesApplied = table.Column<string>(type: "text", nullable: false),
                    RulesPassedCount = table.Column<int>(type: "integer", nullable: false),
                    RulesFailedCount = table.Column<int>(type: "integer", nullable: false),
                    ConfidenceScore = table.Column<double>(type: "double precision", nullable: false),
                    ValidationTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HybridValidations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InferenceCostRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    RequestType = table.Column<string>(type: "text", nullable: false),
                    ModelUsed = table.Column<string>(type: "text", nullable: false),
                    ModelRouted = table.Column<string>(type: "text", nullable: false),
                    CostUsd = table.Column<double>(type: "double precision", nullable: false),
                    OriginalCostUsd = table.Column<double>(type: "double precision", nullable: false),
                    SavingsUsd = table.Column<double>(type: "double precision", nullable: false),
                    SavingsPercent = table.Column<double>(type: "double precision", nullable: false),
                    CacheHit = table.Column<bool>(type: "boolean", nullable: false),
                    Batched = table.Column<bool>(type: "boolean", nullable: false),
                    ResponseReused = table.Column<bool>(type: "boolean", nullable: false),
                    SimilarityScore = table.Column<double>(type: "double precision", nullable: false),
                    InputTokens = table.Column<int>(type: "integer", nullable: false),
                    OutputTokens = table.Column<int>(type: "integer", nullable: false),
                    LatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    OptimizationStrategy = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InferenceCostRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LangGraphWorkflows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    WorkflowName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    GraphDefinitionJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    NodesJson = table.Column<string>(type: "text", nullable: false),
                    EdgesJson = table.Column<string>(type: "text", nullable: false),
                    ExecutionStateJson = table.Column<string>(type: "text", nullable: false),
                    TotalNodes = table.Column<int>(type: "integer", nullable: false),
                    CompletedNodes = table.Column<int>(type: "integer", nullable: false),
                    FailedNodes = table.Column<int>(type: "integer", nullable: false),
                    StampedeProtectionEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CacheHitsCount = table.Column<int>(type: "integer", nullable: false),
                    TotalExecutions = table.Column<int>(type: "integer", nullable: false),
                    AvgExecutionTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LangGraphWorkflows", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LanguageExpansions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    SourceLanguage = table.Column<string>(type: "text", nullable: false),
                    TargetLanguage = table.Column<string>(type: "text", nullable: false),
                    KeysTranslated = table.Column<int>(type: "integer", nullable: false),
                    TotalKeys = table.Column<int>(type: "integer", nullable: false),
                    CoveragePercent = table.Column<double>(type: "double precision", nullable: false),
                    QualityScore = table.Column<double>(type: "double precision", nullable: false),
                    MachineTranslated = table.Column<bool>(type: "boolean", nullable: false),
                    HumanReviewed = table.Column<bool>(type: "boolean", nullable: false),
                    MissingKeys = table.Column<int>(type: "integer", nullable: false),
                    PluralizationRules = table.Column<int>(type: "integer", nullable: false),
                    RtlSupport = table.Column<bool>(type: "boolean", nullable: false),
                    TranslationTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LanguageExpansions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModelRoutingRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TaskType = table.Column<string>(type: "text", nullable: false),
                    PrimaryModel = table.Column<string>(type: "text", nullable: false),
                    FallbackModel = table.Column<string>(type: "text", nullable: false),
                    RoutingStrategy = table.Column<string>(type: "text", nullable: false),
                    CostThreshold = table.Column<double>(type: "double precision", nullable: false),
                    LatencyThresholdMs = table.Column<double>(type: "double precision", nullable: false),
                    TotalRequests = table.Column<int>(type: "integer", nullable: false),
                    PrimaryHits = table.Column<int>(type: "integer", nullable: false),
                    FallbackHits = table.Column<int>(type: "integer", nullable: false),
                    AvgPrimaryLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    AvgFallbackLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    AvgPrimaryCost = table.Column<double>(type: "double precision", nullable: false),
                    AvgFallbackCost = table.Column<double>(type: "double precision", nullable: false),
                    AccuracyScore = table.Column<double>(type: "double precision", nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModelRoutingRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MultiAgentReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CompositeRiskScore = table.Column<int>(type: "integer", nullable: false),
                    ComplexityRisk = table.Column<int>(type: "integer", nullable: false),
                    FilesChangedRisk = table.Column<int>(type: "integer", nullable: false),
                    TestCoverageRisk = table.Column<int>(type: "integer", nullable: false),
                    SecurityRisk = table.Column<int>(type: "integer", nullable: false),
                    TestSuggestions = table.Column<string>(type: "text", nullable: true),
                    AgentsSummary = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MultiAgentReviews", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrgMemories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Scope = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    SourceProject = table.Column<string>(type: "text", nullable: false),
                    Relevance = table.Column<double>(type: "double precision", nullable: false),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    TagsJson = table.Column<string>(type: "text", nullable: false),
                    EmbeddingStatus = table.Column<string>(type: "text", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrgMemories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ParallelAgentRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    TaskDescription = table.Column<string>(type: "text", nullable: false),
                    AgentCount = table.Column<int>(type: "integer", nullable: false),
                    SubtasksTotal = table.Column<int>(type: "integer", nullable: false),
                    SubtasksCompleted = table.Column<int>(type: "integer", nullable: false),
                    MergeConflicts = table.Column<int>(type: "integer", nullable: false),
                    AutoResolved = table.Column<int>(type: "integer", nullable: false),
                    FilesModified = table.Column<int>(type: "integer", nullable: false),
                    LinesChanged = table.Column<int>(type: "integer", nullable: false),
                    DurationMs = table.Column<int>(type: "integer", nullable: false),
                    SpeedupFactor = table.Column<double>(type: "double precision", nullable: false),
                    IsolationMode = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParallelAgentRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PerformanceOptimizations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    BaselineLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    OptimizedLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    ImprovementPercent = table.Column<double>(type: "double precision", nullable: false),
                    MemoryBeforeMb = table.Column<double>(type: "double precision", nullable: false),
                    MemoryAfterMb = table.Column<double>(type: "double precision", nullable: false),
                    MemorySavedPercent = table.Column<double>(type: "double precision", nullable: false),
                    BenchmarkRuns = table.Column<int>(type: "integer", nullable: false),
                    ThroughputRps = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerformanceOptimizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlaywrightHealingResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TestFile = table.Column<string>(type: "text", nullable: false),
                    TestName = table.Column<string>(type: "text", nullable: false),
                    OriginalSelector = table.Column<string>(type: "text", nullable: false),
                    HealedSelector = table.Column<string>(type: "text", nullable: false),
                    HealingStrategy = table.Column<string>(type: "text", nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    FailureReason = table.Column<string>(type: "text", nullable: false),
                    HealingAttempts = table.Column<int>(type: "integer", nullable: false),
                    HealingTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaywrightHealingResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProductionSandboxes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    SandboxName = table.Column<string>(type: "text", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    EnvVarsJson = table.Column<string>(type: "text", nullable: false),
                    EnvVarCount = table.Column<int>(type: "integer", nullable: false),
                    ServicesJson = table.Column<string>(type: "text", nullable: false),
                    ServiceCount = table.Column<int>(type: "integer", nullable: false),
                    Region = table.Column<string>(type: "text", nullable: false),
                    OAuthConnected = table.Column<bool>(type: "boolean", nullable: false),
                    UptimeMinutes = table.Column<double>(type: "double precision", nullable: false),
                    CostUsd = table.Column<double>(type: "double precision", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductionSandboxes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReactUseHookDemos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ComponentName = table.Column<string>(type: "text", nullable: false),
                    DataSource = table.Column<string>(type: "text", nullable: false),
                    Pattern = table.Column<string>(type: "text", nullable: false),
                    SuspenseEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorBoundaryEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    RequestDedup = table.Column<bool>(type: "boolean", nullable: false),
                    RenderTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    DataFetchMs = table.Column<double>(type: "double precision", nullable: false),
                    ReRenderCount = table.Column<int>(type: "integer", nullable: false),
                    BoilerplateLines = table.Column<int>(type: "integer", nullable: false),
                    PerformanceScore = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReactUseHookDemos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReplTestSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    TestMode = table.Column<string>(type: "text", nullable: false),
                    Runtime = table.Column<string>(type: "text", nullable: false),
                    TotalTests = table.Column<int>(type: "integer", nullable: false),
                    PassedTests = table.Column<int>(type: "integer", nullable: false),
                    FailedTests = table.Column<int>(type: "integer", nullable: false),
                    PotemkinDetections = table.Column<int>(type: "integer", nullable: false),
                    DbStateChecks = table.Column<int>(type: "integer", nullable: false),
                    LogsCaptured = table.Column<int>(type: "integer", nullable: false),
                    AvgLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    SpeedupFactor = table.Column<double>(type: "double precision", nullable: false),
                    CostReduction = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ResultSummary = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReplTestSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SelfHealingRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    TestCommand = table.Column<string>(type: "text", nullable: false),
                    BrowserType = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CurrentAttempt = table.Column<int>(type: "integer", nullable: false),
                    MaxAttempts = table.Column<int>(type: "integer", nullable: false),
                    ErrorsJson = table.Column<string>(type: "text", nullable: false),
                    FixesJson = table.Column<string>(type: "text", nullable: false),
                    TestDurationMs = table.Column<double>(type: "double precision", nullable: false),
                    HealingDurationMs = table.Column<double>(type: "double precision", nullable: false),
                    TotalDurationMs = table.Column<double>(type: "double precision", nullable: false),
                    TestsPassed = table.Column<int>(type: "integer", nullable: false),
                    TestsFailed = table.Column<int>(type: "integer", nullable: false),
                    TestsTotal = table.Column<int>(type: "integer", nullable: false),
                    FinalResult = table.Column<string>(type: "text", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SelfHealingRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ServerComponentConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Framework = table.Column<string>(type: "text", nullable: false),
                    RenderStrategy = table.Column<string>(type: "text", nullable: false),
                    StreamingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MetadataHoisting = table.Column<bool>(type: "boolean", nullable: false),
                    DirectDbAccess = table.Column<bool>(type: "boolean", nullable: false),
                    DataFetchingPattern = table.Column<string>(type: "text", nullable: false),
                    ServerComponentCount = table.Column<int>(type: "integer", nullable: false),
                    ClientComponentCount = table.Column<int>(type: "integer", nullable: false),
                    BundleSizeReductionPercent = table.Column<double>(type: "double precision", nullable: false),
                    InitialLoadMs = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    MigrationNotes = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServerComponentConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TerminalExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Command = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    AutoApproved = table.Column<bool>(type: "boolean", nullable: false),
                    Blocked = table.Column<bool>(type: "boolean", nullable: false),
                    BlockReason = table.Column<string>(type: "text", nullable: true),
                    ExitCode = table.Column<int>(type: "integer", nullable: false),
                    OutputLines = table.Column<int>(type: "integer", nullable: false),
                    DurationMs = table.Column<int>(type: "integer", nullable: false),
                    SecurityLevel = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TerminalExecutions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TursoDatabases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    DatabaseName = table.Column<string>(type: "text", nullable: false),
                    Region = table.Column<string>(type: "text", nullable: false),
                    ReplicaCount = table.Column<int>(type: "integer", nullable: false),
                    ReplicaRegions = table.Column<string[]>(type: "text[]", nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    TableCount = table.Column<int>(type: "integer", nullable: false),
                    VectorSearchEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    VectorDimensions = table.Column<int>(type: "integer", nullable: false),
                    SchemaBranchingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ActiveBranches = table.Column<int>(type: "integer", nullable: false),
                    EmbeddedReplicaEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ReadLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    WriteLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    TotalReads = table.Column<long>(type: "bigint", nullable: false),
                    TotalWrites = table.Column<long>(type: "bigint", nullable: false),
                    SyncMode = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TursoDatabases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VectorSearchConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    IndexName = table.Column<string>(type: "text", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    SearchMode = table.Column<string>(type: "text", nullable: false),
                    FusionAlgorithm = table.Column<string>(type: "text", nullable: false),
                    VectorWeight = table.Column<double>(type: "double precision", nullable: false),
                    KeywordWeight = table.Column<double>(type: "double precision", nullable: false),
                    TopK = table.Column<int>(type: "integer", nullable: false),
                    SimilarityThreshold = table.Column<double>(type: "double precision", nullable: false),
                    QueryExpansion = table.Column<bool>(type: "boolean", nullable: false),
                    MetadataFiltering = table.Column<bool>(type: "boolean", nullable: false),
                    VectorDimension = table.Column<int>(type: "integer", nullable: false),
                    TotalVectors = table.Column<long>(type: "bigint", nullable: false),
                    AvgQueryLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    TotalQueries = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VectorSearchConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VisionToCodeResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ImageName = table.Column<string>(type: "text", nullable: false),
                    ImageType = table.Column<string>(type: "text", nullable: false),
                    ComponentsGenerated = table.Column<int>(type: "integer", nullable: false),
                    LinesOfCode = table.Column<int>(type: "integer", nullable: false),
                    Framework = table.Column<string>(type: "text", nullable: false),
                    StylingEngine = table.Column<string>(type: "text", nullable: false),
                    StyleMatchScore = table.Column<double>(type: "double precision", nullable: false),
                    LayoutAccuracy = table.Column<double>(type: "double precision", nullable: false),
                    ColorAccuracy = table.Column<double>(type: "double precision", nullable: false),
                    TypographyAccuracy = table.Column<double>(type: "double precision", nullable: false),
                    ProcessingMs = table.Column<int>(type: "integer", nullable: false),
                    Refinements = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisionToCodeResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WebMcpSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TargetUrl = table.Column<string>(type: "text", nullable: false),
                    BrowserType = table.Column<string>(type: "text", nullable: false),
                    ElementsDiscovered = table.Column<int>(type: "integer", nullable: false),
                    ActionsPerformed = table.Column<int>(type: "integer", nullable: false),
                    EventsCaptured = table.Column<int>(type: "integer", nullable: false),
                    DomNodesAnalyzed = table.Column<int>(type: "integer", nullable: false),
                    SemanticAccuracy = table.Column<double>(type: "double precision", nullable: false),
                    ActionReliability = table.Column<double>(type: "double precision", nullable: false),
                    SessionDurationMs = table.Column<int>(type: "integer", nullable: false),
                    Protocol = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebMcpSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkersAiDeployments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    ModelId = table.Column<string>(type: "text", nullable: false),
                    ModelCategory = table.Column<string>(type: "text", nullable: false),
                    EdgeRegion = table.Column<string>(type: "text", nullable: false),
                    EdgeLocations = table.Column<int>(type: "integer", nullable: false),
                    InferenceLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    TotalInferences = table.Column<long>(type: "bigint", nullable: false),
                    TokensProcessed = table.Column<long>(type: "bigint", nullable: false),
                    CostUsd = table.Column<double>(type: "double precision", nullable: false),
                    CustomModel = table.Column<bool>(type: "boolean", nullable: false),
                    CustomModelSource = table.Column<string>(type: "text", nullable: false),
                    ZeroColdStart = table.Column<bool>(type: "boolean", nullable: false),
                    SuccessRate = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkersAiDeployments", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgenticWorkflows");

            migrationBuilder.DropTable(
                name: "AgentInboxItems");

            migrationBuilder.DropTable(
                name: "AgentMessages");

            migrationBuilder.DropTable(
                name: "AgentSdkSessions");

            migrationBuilder.DropTable(
                name: "AgentSkills");

            migrationBuilder.DropTable(
                name: "AgentTerminalSessions");

            migrationBuilder.DropTable(
                name: "AgentTraces");

            migrationBuilder.DropTable(
                name: "AiAgentRules");

            migrationBuilder.DropTable(
                name: "AiModelIntegrations");

            migrationBuilder.DropTable(
                name: "BiomeLintResults");

            migrationBuilder.DropTable(
                name: "BrowserIdeSessions");

            migrationBuilder.DropTable(
                name: "BuildToolchainResults");

            migrationBuilder.DropTable(
                name: "CodebaseGraphs");

            migrationBuilder.DropTable(
                name: "CodeLintResults");

            migrationBuilder.DropTable(
                name: "CodeReviewAgents");

            migrationBuilder.DropTable(
                name: "ComposerPlans");

            migrationBuilder.DropTable(
                name: "ConfidenceScores");

            migrationBuilder.DropTable(
                name: "DevRequestBranches");

            migrationBuilder.DropTable(
                name: "DotnetUpgradeResults");

            migrationBuilder.DropTable(
                name: "EditPredictions");

            migrationBuilder.DropTable(
                name: "GovernanceActions");

            migrationBuilder.DropTable(
                name: "HybridCacheEntries");

            migrationBuilder.DropTable(
                name: "HybridValidations");

            migrationBuilder.DropTable(
                name: "InferenceCostRecords");

            migrationBuilder.DropTable(
                name: "LangGraphWorkflows");

            migrationBuilder.DropTable(
                name: "LanguageExpansions");

            migrationBuilder.DropTable(
                name: "ModelRoutingRules");

            migrationBuilder.DropTable(
                name: "MultiAgentReviews");

            migrationBuilder.DropTable(
                name: "OrgMemories");

            migrationBuilder.DropTable(
                name: "ParallelAgentRuns");

            migrationBuilder.DropTable(
                name: "PerformanceOptimizations");

            migrationBuilder.DropTable(
                name: "PlaywrightHealingResults");

            migrationBuilder.DropTable(
                name: "ProductionSandboxes");

            migrationBuilder.DropTable(
                name: "ReactUseHookDemos");

            migrationBuilder.DropTable(
                name: "ReplTestSessions");

            migrationBuilder.DropTable(
                name: "SelfHealingRuns");

            migrationBuilder.DropTable(
                name: "ServerComponentConfigs");

            migrationBuilder.DropTable(
                name: "TerminalExecutions");

            migrationBuilder.DropTable(
                name: "TursoDatabases");

            migrationBuilder.DropTable(
                name: "VectorSearchConfigs");

            migrationBuilder.DropTable(
                name: "VisionToCodeResults");

            migrationBuilder.DropTable(
                name: "WebMcpSessions");

            migrationBuilder.DropTable(
                name: "WorkersAiDeployments");

            migrationBuilder.DropColumn(
                name: "EffortLevelConfigJson",
                table: "AiModelConfigs");

            migrationBuilder.DropColumn(
                name: "PreferredProvider",
                table: "AiModelConfigs");

            migrationBuilder.DropColumn(
                name: "StructuredOutputsEnabled",
                table: "AiModelConfigs");

            migrationBuilder.AlterColumn<string>(
                name: "SelectedModel",
                table: "AiModelConfigs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);
        }
    }
}
