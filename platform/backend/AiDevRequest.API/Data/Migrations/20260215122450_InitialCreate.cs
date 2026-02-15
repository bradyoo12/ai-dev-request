using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "a2a_agent_cards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgentKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    OwnerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    InputSchemaJson = table.Column<string>(type: "jsonb", nullable: true),
                    OutputSchemaJson = table.Column<string>(type: "jsonb", nullable: true),
                    Scopes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ClientId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ClientSecretHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_a2a_agent_cards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "a2a_audit_logs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaskId = table.Column<int>(type: "integer", nullable: true),
                    FromAgentId = table.Column<int>(type: "integer", nullable: true),
                    ToAgentId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DetailJson = table.Column<string>(type: "jsonb", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_a2a_audit_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdaptiveThinkingConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    ModelName = table.Column<string>(type: "text", nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdaptiveThinkingConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgentAutomationConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    TriggerLabelsJson = table.Column<string>(type: "text", nullable: false),
                    MaxConcurrent = table.Column<int>(type: "integer", nullable: false),
                    AutoMerge = table.Column<bool>(type: "boolean", nullable: false),
                    WebhookSecret = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentAutomationConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "agentic_plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PlanName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UserPrompt = table.Column<string>(type: "text", nullable: false),
                    StepsJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalSteps = table.Column<int>(type: "integer", nullable: false),
                    CompletedSteps = table.Column<int>(type: "integer", nullable: false),
                    FailedSteps = table.Column<int>(type: "integer", nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    TotalTokensUsed = table.Column<int>(type: "integer", nullable: false),
                    TotalTimeMs = table.Column<int>(type: "integer", nullable: false),
                    RequiresApproval = table.Column<bool>(type: "boolean", nullable: false),
                    IsApproved = table.Column<bool>(type: "boolean", nullable: false),
                    ExecutionLogJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agentic_plans", x => x.Id);
                });

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
                name: "AgentTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IssueNumber = table.Column<int>(type: "integer", nullable: false),
                    IssueTitle = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PrNumber = table.Column<int>(type: "integer", nullable: true),
                    PrUrl = table.Column<string>(type: "text", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Error = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentTasks", x => x.Id);
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
                name: "ai_elements_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StreamingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ReasoningPanelEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LivePreviewEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ResponseActionsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ThemeMode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ActiveModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TotalStreams = table.Column<int>(type: "integer", nullable: false),
                    TotalTokensStreamed = table.Column<long>(type: "bigint", nullable: false),
                    TotalComponentPreviews = table.Column<int>(type: "integer", nullable: false),
                    PreviewHistoryJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_elements_configs", x => x.Id);
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
                name: "AiModelConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SelectedModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PreferredProvider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ExtendedThinkingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ThinkingBudgetTokens = table.Column<int>(type: "integer", nullable: false),
                    StreamThinkingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AutoModelSelection = table.Column<bool>(type: "boolean", nullable: false),
                    TotalRequestsOpus = table.Column<int>(type: "integer", nullable: false),
                    TotalRequestsSonnet = table.Column<int>(type: "integer", nullable: false),
                    TotalThinkingTokens = table.Column<long>(type: "bigint", nullable: false),
                    TotalOutputTokens = table.Column<long>(type: "bigint", nullable: false),
                    EstimatedCost = table.Column<decimal>(type: "numeric", nullable: false),
                    ModelHistoryJson = table.Column<string>(type: "text", nullable: true),
                    EffortLevelConfigJson = table.Column<string>(type: "text", nullable: true),
                    StructuredOutputsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiModelConfigs", x => x.Id);
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
                name: "analytics_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    EventType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EventData = table.Column<string>(type: "jsonb", nullable: true),
                    SessionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Page = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Referrer = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_analytics_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "api_doc_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProjectName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EndpointsJson = table.Column<string>(type: "text", nullable: false),
                    OpenApiSpecJson = table.Column<string>(type: "text", nullable: true),
                    SdkLanguages = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_api_doc_configs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "api_keys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    KeyHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    KeyPrefix = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RequestCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_api_keys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "app_recommendations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PromptTemplate = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    MatchPercent = table.Column<int>(type: "integer", nullable: false),
                    InterestCategory = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsDismissed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_recommendations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "arena_comparisons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PromptText = table.Column<string>(type: "text", nullable: false),
                    TaskCategory = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ModelOutputsJson = table.Column<string>(type: "text", nullable: false),
                    SelectedModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SelectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ModelCount = table.Column<int>(type: "integer", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    TotalLatencyMs = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_arena_comparisons", x => x.Id);
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
                name: "background_agents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TaskDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BranchName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AgentType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TotalSteps = table.Column<int>(type: "integer", nullable: false),
                    CompletedSteps = table.Column<int>(type: "integer", nullable: false),
                    ProgressPercent = table.Column<double>(type: "double precision", nullable: false),
                    FilesCreated = table.Column<int>(type: "integer", nullable: false),
                    FilesModified = table.Column<int>(type: "integer", nullable: false),
                    TestsPassed = table.Column<int>(type: "integer", nullable: false),
                    TestsFailed = table.Column<int>(type: "integer", nullable: false),
                    ErrorCount = table.Column<int>(type: "integer", nullable: false),
                    SelfHealAttempts = table.Column<int>(type: "integer", nullable: false),
                    CpuUsagePercent = table.Column<double>(type: "double precision", nullable: false),
                    MemoryUsageMb = table.Column<double>(type: "double precision", nullable: false),
                    TokensUsed = table.Column<double>(type: "double precision", nullable: false),
                    EstimatedCost = table.Column<double>(type: "double precision", nullable: false),
                    ElapsedSeconds = table.Column<int>(type: "integer", nullable: false),
                    EstimatedRemainingSeconds = table.Column<int>(type: "integer", nullable: false),
                    PullRequestUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PullRequestStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    LogEntriesJson = table.Column<string>(type: "text", nullable: true),
                    StepsJson = table.Column<string>(type: "text", nullable: true),
                    InstalledPackagesJson = table.Column<string>(type: "text", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_background_agents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BidirectionalGitSyncs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: false),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    RepoOwner = table.Column<string>(type: "text", nullable: false),
                    RepoName = table.Column<string>(type: "text", nullable: false),
                    DefaultBranch = table.Column<string>(type: "text", nullable: false),
                    AiBranch = table.Column<string>(type: "text", nullable: false),
                    SyncEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AutoPushEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AutoPullEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    WebhookEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    LastPushAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPullAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalPushes = table.Column<int>(type: "integer", nullable: false),
                    TotalPulls = table.Column<int>(type: "integer", nullable: false),
                    TotalConflicts = table.Column<int>(type: "integer", nullable: false),
                    ConflictsResolved = table.Column<int>(type: "integer", nullable: false),
                    AheadCount = table.Column<int>(type: "integer", nullable: false),
                    BehindCount = table.Column<int>(type: "integer", nullable: false),
                    ChangedFilesCount = table.Column<int>(type: "integer", nullable: false),
                    SyncHistoryJson = table.Column<string>(type: "text", nullable: false),
                    ConflictFilesJson = table.Column<string>(type: "text", nullable: false),
                    WebhookSecret = table.Column<string>(type: "text", nullable: true),
                    WebhookUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BidirectionalGitSyncs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "billing_accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Plan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StripeCustomerId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RequestsThisPeriod = table.Column<int>(type: "integer", nullable: false),
                    RequestsLimit = table.Column<int>(type: "integer", nullable: false),
                    TokensUsedThisPeriod = table.Column<int>(type: "integer", nullable: false),
                    OverageCharges = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    MonthlyRate = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    PerRequestOverageRate = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    InvoiceHistory = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_billing_accounts", x => x.Id);
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
                name: "code_quality_reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ArchitectureScore = table.Column<int>(type: "integer", nullable: false),
                    SecurityScore = table.Column<int>(type: "integer", nullable: false),
                    PerformanceScore = table.Column<int>(type: "integer", nullable: false),
                    AccessibilityScore = table.Column<int>(type: "integer", nullable: false),
                    MaintainabilityScore = table.Column<int>(type: "integer", nullable: false),
                    OverallScore = table.Column<double>(type: "double precision", nullable: false),
                    Findings = table.Column<string>(type: "jsonb", nullable: true),
                    CriticalCount = table.Column<int>(type: "integer", nullable: false),
                    WarningCount = table.Column<int>(type: "integer", nullable: false),
                    InfoCount = table.Column<int>(type: "integer", nullable: false),
                    AppliedFixes = table.Column<string>(type: "jsonb", nullable: true),
                    FixesApplied = table.Column<int>(type: "integer", nullable: false),
                    ReviewVersion = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_code_quality_reviews", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "code_snapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    BaselineContent = table.Column<string>(type: "text", nullable: false),
                    UserContent = table.Column<string>(type: "text", nullable: true),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_code_snapshots", x => x.Id);
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
                name: "collaborative_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SessionName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ParticipantsJson = table.Column<string>(type: "jsonb", nullable: false),
                    ParticipantCount = table.Column<int>(type: "integer", nullable: false),
                    DocumentContent = table.Column<string>(type: "text", nullable: true),
                    DocumentVersion = table.Column<int>(type: "integer", nullable: false),
                    ActivityFeedJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastActivityAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_collaborative_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "component_previews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ComponentName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    ChatHistoryJson = table.Column<string>(type: "jsonb", nullable: false),
                    IterationCount = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DesignTokensJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_component_previews", x => x.Id);
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
                name: "container_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    Vcpu = table.Column<string>(type: "text", nullable: true),
                    MemoryGb = table.Column<string>(type: "text", nullable: true),
                    DetectedStack = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Dockerfile = table.Column<string>(type: "text", nullable: false),
                    ComposeFile = table.Column<string>(type: "text", nullable: true),
                    K8sManifest = table.Column<string>(type: "text", nullable: true),
                    RegistryUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ImageName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ImageTag = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BuildStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BuildLogs = table.Column<string>(type: "jsonb", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    BuildDurationMs = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BuiltAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeployedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_container_configs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "data_schemas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Prompt = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    EntitiesJson = table.Column<string>(type: "jsonb", nullable: false),
                    RelationshipsJson = table.Column<string>(type: "jsonb", nullable: false),
                    EntityCount = table.Column<int>(type: "integer", nullable: false),
                    RelationshipCount = table.Column<int>(type: "integer", nullable: false),
                    ValidationJson = table.Column<string>(type: "jsonb", nullable: false),
                    GeneratedSql = table.Column<string>(type: "text", nullable: false),
                    GeneratedEntities = table.Column<string>(type: "text", nullable: false),
                    GeneratedControllers = table.Column<string>(type: "text", nullable: false),
                    GeneratedFrontend = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_schemas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DatabaseBranches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchName = table.Column<string>(type: "text", nullable: false),
                    SourceBranch = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    SchemaVersion = table.Column<string>(type: "text", nullable: false),
                    TablesJson = table.Column<string>(type: "text", nullable: true),
                    MigrationsJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MergedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DiscardedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DatabaseBranches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "deployment_healths",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeploymentUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MonitoringEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CheckIntervalSeconds = table.Column<int>(type: "integer", nullable: false),
                    ErrorRateThreshold = table.Column<double>(type: "double precision", nullable: false),
                    LatencyThresholdMs = table.Column<int>(type: "integer", nullable: false),
                    TotalChecks = table.Column<int>(type: "integer", nullable: false),
                    SuccessfulChecks = table.Column<int>(type: "integer", nullable: false),
                    FailedChecks = table.Column<int>(type: "integer", nullable: false),
                    CurrentErrorRate = table.Column<double>(type: "double precision", nullable: false),
                    AvgResponseTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    P95ResponseTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    P99ResponseTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    UptimePercentage = table.Column<double>(type: "double precision", nullable: false),
                    RollbackCount = table.Column<int>(type: "integer", nullable: false),
                    AutoRollbackEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LastGoodVersionId = table.Column<Guid>(type: "uuid", nullable: true),
                    HealthEventsJson = table.Column<string>(type: "text", nullable: true),
                    IncidentsJson = table.Column<string>(type: "text", nullable: true),
                    LastCheckAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deployment_healths", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "dev_pipelines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    StepsJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsTemplate = table.Column<bool>(type: "boolean", nullable: false),
                    TemplateCategory = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ExecutionCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dev_pipelines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "dev_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    ContactEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ScreenshotBase64 = table.Column<string>(type: "text", nullable: true),
                    ScreenshotMediaType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Framework = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PowerLevel = table.Column<int>(type: "integer", nullable: false),
                    PreferredModel = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Complexity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AnalysisResultJson = table.Column<string>(type: "jsonb", nullable: true),
                    ProposalJson = table.Column<string>(type: "jsonb", nullable: true),
                    ProjectId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ProjectPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PreviewUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    GitHubRepoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GitHubRepoFullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ValidationIterations = table.Column<int>(type: "integer", nullable: false),
                    FixHistory = table.Column<string>(type: "jsonb", nullable: true),
                    ValidationPassed = table.Column<bool>(type: "boolean", nullable: false),
                    ModelTierUsage = table.Column<string>(type: "text", nullable: true),
                    EstimatedCostSavings = table.Column<decimal>(type: "numeric", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AnalyzedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProposedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dev_requests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "development_specs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: false),
                    Phase = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UserStories = table.Column<string>(type: "jsonb", nullable: true),
                    AcceptanceCriteria = table.Column<string>(type: "jsonb", nullable: true),
                    EdgeCases = table.Column<string>(type: "jsonb", nullable: true),
                    ArchitectureDecisions = table.Column<string>(type: "jsonb", nullable: true),
                    ApiContracts = table.Column<string>(type: "jsonb", nullable: true),
                    DataModels = table.Column<string>(type: "jsonb", nullable: true),
                    ComponentBreakdown = table.Column<string>(type: "jsonb", nullable: true),
                    TaskList = table.Column<string>(type: "jsonb", nullable: true),
                    DependencyOrder = table.Column<string>(type: "jsonb", nullable: true),
                    EstimatedFiles = table.Column<string>(type: "jsonb", nullable: true),
                    TraceabilityLinks = table.Column<string>(type: "jsonb", nullable: true),
                    RejectionFeedback = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_development_specs", x => x.Id);
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
                name: "exchange_rates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    RateToUsd = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    FetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exchange_rates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "figma_imports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FigmaFileKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FigmaNodeId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SourceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SourceUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    DesignName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DesignTokensJson = table.Column<string>(type: "text", nullable: false),
                    ComponentTreeJson = table.Column<string>(type: "text", nullable: false),
                    GeneratedCodeJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Framework = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StylingLib = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ComponentCount = table.Column<int>(type: "integer", nullable: false),
                    TokenCount = table.Column<int>(type: "integer", nullable: false),
                    ProcessingTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_figma_imports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "framework_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SelectedFramework = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SelectedBackend = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SelectedDatabase = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SelectedStyling = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProjectsGenerated = table.Column<int>(type: "integer", nullable: false),
                    LastGeneratedProjectId = table.Column<string>(type: "text", nullable: false),
                    FavoriteFrameworks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CustomTemplateJson = table.Column<string>(type: "text", nullable: false),
                    FrameworkHistoryJson = table.Column<string>(type: "text", nullable: false),
                    AutoDetectStack = table.Column<bool>(type: "boolean", nullable: false),
                    IncludeDocker = table.Column<bool>(type: "boolean", nullable: false),
                    IncludeCI = table.Column<bool>(type: "boolean", nullable: false),
                    IncludeTests = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_framework_configs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "generation_streams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CurrentFile = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TotalFiles = table.Column<int>(type: "integer", nullable: false),
                    CompletedFiles = table.Column<int>(type: "integer", nullable: false),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    StreamedTokens = table.Column<int>(type: "integer", nullable: false),
                    ProgressPercent = table.Column<double>(type: "double precision", nullable: false),
                    GeneratedFiles = table.Column<string>(type: "jsonb", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_generation_streams", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "generation_variants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    VariantNumber = table.Column<int>(type: "integer", nullable: false),
                    Approach = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FilesJson = table.Column<string>(type: "jsonb", nullable: false),
                    FileCount = table.Column<int>(type: "integer", nullable: false),
                    LinesOfCode = table.Column<int>(type: "integer", nullable: false),
                    DependencyCount = table.Column<int>(type: "integer", nullable: false),
                    EstimatedBundleSizeKb = table.Column<int>(type: "integer", nullable: false),
                    ModelTier = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    IsSelected = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_generation_variants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "generative_ui_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TotalMessages = table.Column<int>(type: "integer", nullable: false),
                    AiMessages = table.Column<int>(type: "integer", nullable: false),
                    UserMessages = table.Column<int>(type: "integer", nullable: false),
                    GeneratedComponents = table.Column<int>(type: "integer", nullable: false),
                    ToolCallCount = table.Column<int>(type: "integer", nullable: false),
                    StreamingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    GenerativeUiEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ActiveModel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalTokensUsed = table.Column<double>(type: "double precision", nullable: false),
                    EstimatedCost = table.Column<double>(type: "double precision", nullable: false),
                    MessagesJson = table.Column<string>(type: "text", nullable: true),
                    ToolDefinitionsJson = table.Column<string>(type: "text", nullable: true),
                    GeneratedComponentsJson = table.Column<string>(type: "text", nullable: true),
                    ReasoningStepsJson = table.Column<string>(type: "text", nullable: true),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_generative_ui_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "github_syncs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    GitHubRepoOwner = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    GitHubRepoName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    GitHubRepoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Branch = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LastSyncCommitSha = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ConflictDetails = table.Column<string>(type: "jsonb", nullable: true),
                    WebhookId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    WebhookSecret = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPushAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPullAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_github_syncs", x => x.Id);
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
                name: "hosting_plans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MonthlyCostUsd = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Vcpu = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MemoryGb = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StorageGb = table.Column<int>(type: "integer", nullable: false),
                    BandwidthGb = table.Column<int>(type: "integer", nullable: false),
                    SupportsCustomDomain = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsAutoscale = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsSla = table.Column<bool>(type: "boolean", nullable: false),
                    MaxInstances = table.Column<int>(type: "integer", nullable: false),
                    AzureSku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BestFor = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hosting_plans", x => x.Id);
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
                name: "languages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NativeName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_languages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LocalModelConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ModelName = table.Column<string>(type: "text", nullable: false),
                    Endpoint = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: true),
                    ModelLocation = table.Column<string>(type: "text", nullable: false),
                    GpuType = table.Column<string>(type: "text", nullable: true),
                    GpuCount = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CostPerSecond = table.Column<decimal>(type: "numeric", nullable: false),
                    MaxTokens = table.Column<int>(type: "integer", nullable: false),
                    CapabilitiesJson = table.Column<string>(type: "text", nullable: true),
                    HealthCheckUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocalModelConfigs", x => x.Id);
                });

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

            migrationBuilder.CreateTable(
                name: "marketplace_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TechStack = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Tags = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TemplateData = table.Column<string>(type: "jsonb", nullable: false),
                    PreviewImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Rating = table.Column<double>(type: "double precision", nullable: false),
                    RatingCount = table.Column<int>(type: "integer", nullable: false),
                    DownloadCount = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsOfficial = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_marketplace_templates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "mcp_connections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ServerUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Transport = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AuthType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AuthToken = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    AvailableTools = table.Column<string>(type: "jsonb", nullable: true),
                    AvailableResources = table.Column<string>(type: "jsonb", nullable: true),
                    ToolCallCount = table.Column<int>(type: "integer", nullable: false),
                    LastConnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mcp_connections", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "mcp_gateway_servers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ServerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ServerUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    TransportType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ToolsJson = table.Column<string>(type: "text", nullable: false),
                    ResourcesJson = table.Column<string>(type: "text", nullable: false),
                    ToolCount = table.Column<int>(type: "integer", nullable: false),
                    ResourceCount = table.Column<int>(type: "integer", nullable: false),
                    TotalExecutions = table.Column<int>(type: "integer", nullable: false),
                    SuccessfulExecutions = table.Column<int>(type: "integer", nullable: false),
                    FailedExecutions = table.Column<int>(type: "integer", nullable: false),
                    AvgLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    LastHealthCheck = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HealthMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mcp_gateway_servers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "McpToolIntegrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    McpEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AutoAttachTools = table.Column<bool>(type: "boolean", nullable: false),
                    ContextDepthLevel = table.Column<string>(type: "text", nullable: false),
                    FileReadEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    FileWriteEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SearchDocsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ResolveDepsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    QueryDbEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    RunTestsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LintCodeEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    BrowseWebEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TotalExecutions = table.Column<int>(type: "integer", nullable: false),
                    SuccessfulExecutions = table.Column<int>(type: "integer", nullable: false),
                    FailedExecutions = table.Column<int>(type: "integer", nullable: false),
                    AvgLatencyMs = table.Column<double>(type: "double precision", nullable: false),
                    TokensSaved = table.Column<long>(type: "bigint", nullable: false),
                    ExecutionHistoryJson = table.Column<string>(type: "text", nullable: false),
                    CustomServersJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_McpToolIntegrations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "mobile_app_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    AppName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BundleId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Platform = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Framework = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AppDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AppVersion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BuildNumber = table.Column<int>(type: "integer", nullable: false),
                    IconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SplashScreenUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ExpoEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ExpoQrCodeUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PreviewUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IosEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AndroidEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    IosBuildStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AndroidBuildStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IosPublishStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    AndroidPublishStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TotalScreens = table.Column<int>(type: "integer", nullable: false),
                    TotalComponents = table.Column<int>(type: "integer", nullable: false),
                    NavigationStructureJson = table.Column<string>(type: "text", nullable: true),
                    ScreenListJson = table.Column<string>(type: "text", nullable: true),
                    BuildHistoryJson = table.Column<string>(type: "text", nullable: true),
                    PublishHistoryJson = table.Column<string>(type: "text", nullable: true),
                    LastBuildAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPublishAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mobile_app_configs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "model_routing_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    DefaultTier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TaskRoutingJson = table.Column<string>(type: "text", nullable: true),
                    MonthlyBudget = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    CurrentMonthCost = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    FastTierTokens = table.Column<long>(type: "bigint", nullable: false),
                    StandardTierTokens = table.Column<long>(type: "bigint", nullable: false),
                    PremiumTierTokens = table.Column<long>(type: "bigint", nullable: false),
                    TotalRoutingDecisions = table.Column<int>(type: "integer", nullable: false),
                    EstimatedSavings = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_model_routing_configs", x => x.Id);
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
                name: "nl_schemas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SchemaName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NaturalLanguageInput = table.Column<string>(type: "text", nullable: false),
                    GeneratedSql = table.Column<string>(type: "text", nullable: false),
                    TablesJson = table.Column<string>(type: "text", nullable: false),
                    RelationshipsJson = table.Column<string>(type: "text", nullable: false),
                    IndexesJson = table.Column<string>(type: "text", nullable: false),
                    RlsPoliciesJson = table.Column<string>(type: "text", nullable: false),
                    SeedDataJson = table.Column<string>(type: "text", nullable: false),
                    ConversationJson = table.Column<string>(type: "text", nullable: false),
                    ExportFormat = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DatabaseType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TableCount = table.Column<int>(type: "integer", nullable: false),
                    ColumnCount = table.Column<int>(type: "integer", nullable: false),
                    RelationshipCount = table.Column<int>(type: "integer", nullable: false),
                    RefinementCount = table.Column<int>(type: "integer", nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: false),
                    EstimatedCost = table.Column<decimal>(type: "numeric(10,6)", nullable: false),
                    GenerationTimeMs = table.Column<int>(type: "integer", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    ForkCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nl_schemas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OAuthConnectors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Scopes = table.Column<string>(type: "text", nullable: false),
                    AccessTokenHash = table.Column<string>(type: "text", nullable: false),
                    RefreshTokenHash = table.Column<string>(type: "text", nullable: false),
                    TokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalApiCalls = table.Column<int>(type: "integer", nullable: false),
                    FailedApiCalls = table.Column<int>(type: "integer", nullable: false),
                    IconUrl = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OAuthConnectors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "onboarding_progresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CurrentStep = table.Column<int>(type: "integer", nullable: false),
                    CompletedStepsJson = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_onboarding_progresses", x => x.Id);
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
                name: "parallel_orchestrations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalTasks = table.Column<int>(type: "integer", nullable: false),
                    CompletedTasks = table.Column<int>(type: "integer", nullable: false),
                    FailedTasks = table.Column<int>(type: "integer", nullable: false),
                    DependencyGraphJson = table.Column<string>(type: "text", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalDurationMs = table.Column<int>(type: "integer", nullable: false),
                    MergeConflictsJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parallel_orchestrations", x => x.Id);
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
                name: "performance_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BundleScore = table.Column<int>(type: "integer", nullable: false),
                    RenderingScore = table.Column<int>(type: "integer", nullable: false),
                    DataLoadingScore = table.Column<int>(type: "integer", nullable: false),
                    AccessibilityScore = table.Column<int>(type: "integer", nullable: false),
                    SeoScore = table.Column<int>(type: "integer", nullable: false),
                    OverallScore = table.Column<int>(type: "integer", nullable: false),
                    EstimatedBundleSizeKb = table.Column<int>(type: "integer", nullable: false),
                    SuggestionCount = table.Column<int>(type: "integer", nullable: false),
                    OptimizationsApplied = table.Column<int>(type: "integer", nullable: false),
                    SuggestionsJson = table.Column<string>(type: "jsonb", nullable: false),
                    MetricsJson = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OptimizedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_performance_profiles", x => x.Id);
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
                name: "PlanningSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    SessionName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Mode = table.Column<string>(type: "text", nullable: false),
                    MessagesJson = table.Column<string>(type: "text", nullable: false),
                    PlanOutputJson = table.Column<string>(type: "text", nullable: false),
                    TotalMessages = table.Column<int>(type: "integer", nullable: false),
                    UserMessages = table.Column<int>(type: "integer", nullable: false),
                    AiMessages = table.Column<int>(type: "integer", nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: false),
                    EstimatedSavings = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningSessions", x => x.Id);
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
                name: "platform_upgrades",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CurrentDotNetVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CurrentEfCoreVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CurrentCSharpVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    VectorSearchEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    NativeJsonColumnsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LeftJoinLinqEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PerformanceProfilingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AvgQueryTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    P95QueryTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    P99QueryTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    TotalQueriesExecuted = table.Column<long>(type: "bigint", nullable: false),
                    CacheHitRate = table.Column<double>(type: "double precision", nullable: false),
                    MemoryUsageMb = table.Column<double>(type: "double precision", nullable: false),
                    CpuUsagePercent = table.Column<double>(type: "double precision", nullable: false),
                    ThroughputRequestsPerSec = table.Column<double>(type: "double precision", nullable: false),
                    VectorIndexCount = table.Column<int>(type: "integer", nullable: false),
                    VectorDimensions = table.Column<int>(type: "integer", nullable: false),
                    VectorSearchAvgMs = table.Column<double>(type: "double precision", nullable: false),
                    UpgradeStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FeatureFlagsJson = table.Column<string>(type: "text", nullable: true),
                    PerformanceHistoryJson = table.Column<string>(type: "text", nullable: true),
                    MigrationLogJson = table.Column<string>(type: "text", nullable: true),
                    LastProfiledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_platform_upgrades", x => x.Id);
                });

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
                name: "project_indexes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    Language = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EmbeddingJson = table.Column<string>(type: "text", nullable: true),
                    DependenciesJson = table.Column<string>(type: "text", nullable: true),
                    DependentsJson = table.Column<string>(type: "text", nullable: true),
                    Summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ExportedSymbols = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RelevanceScore = table.Column<double>(type: "double precision", nullable: false),
                    IsUserModified = table.Column<bool>(type: "boolean", nullable: false),
                    NeedsReindex = table.Column<bool>(type: "boolean", nullable: false),
                    IndexedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_indexes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "project_memories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProjectName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    MemoryType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Summary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SourceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SourceRef = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    Reinforcements = table.Column<int>(type: "integer", nullable: false),
                    Contradictions = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    TagsJson = table.Column<string>(type: "text", nullable: false),
                    EmbeddingJson = table.Column<string>(type: "text", nullable: false),
                    LastAppliedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_memories", x => x.Id);
                });

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
                });

            migrationBuilder.CreateTable(
                name: "project_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Framework = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PromptTemplate = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_templates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectDocumentations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProjectName = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ArchitectureOverview = table.Column<string>(type: "text", nullable: false),
                    ComponentDocs = table.Column<string>(type: "text", nullable: false),
                    ApiReference = table.Column<string>(type: "text", nullable: false),
                    SetupGuide = table.Column<string>(type: "text", nullable: false),
                    QaHistoryJson = table.Column<string>(type: "text", nullable: false),
                    SourceFilesCount = table.Column<int>(type: "integer", nullable: false),
                    TotalLinesAnalyzed = table.Column<int>(type: "integer", nullable: false),
                    GenerationTimeMs = table.Column<int>(type: "integer", nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: false),
                    EstimatedCost = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectDocumentations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "query_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StaleTimeMs = table.Column<int>(type: "integer", nullable: false),
                    CacheTimeMs = table.Column<int>(type: "integer", nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    RetryDelayMs = table.Column<int>(type: "integer", nullable: false),
                    RefetchOnWindowFocus = table.Column<bool>(type: "boolean", nullable: false),
                    RefetchOnReconnect = table.Column<bool>(type: "boolean", nullable: false),
                    RefetchOnMount = table.Column<bool>(type: "boolean", nullable: false),
                    EnableDevtools = table.Column<bool>(type: "boolean", nullable: false),
                    EnableGarbageCollection = table.Column<bool>(type: "boolean", nullable: false),
                    EnableOptimisticUpdates = table.Column<bool>(type: "boolean", nullable: false),
                    TotalQueries = table.Column<int>(type: "integer", nullable: false),
                    TotalMutations = table.Column<int>(type: "integer", nullable: false),
                    CacheHits = table.Column<int>(type: "integer", nullable: false),
                    CacheMisses = table.Column<int>(type: "integer", nullable: false),
                    QueryPatternsJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_query_configs", x => x.Id);
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
                name: "ReviewPipelineConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AutoReviewEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SecurityCheckEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PerformanceCheckEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessibilityCheckEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ArchitectureCheckEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MaintainabilityCheckEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AutoFixEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TestGenerationEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    QualityThreshold = table.Column<int>(type: "integer", nullable: false),
                    TotalReviews = table.Column<int>(type: "integer", nullable: false),
                    TotalAutoFixes = table.Column<int>(type: "integer", nullable: false),
                    TotalTestsGenerated = table.Column<int>(type: "integer", nullable: false),
                    AvgQualityScore = table.Column<decimal>(type: "numeric", nullable: false),
                    ReviewHistoryJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewPipelineConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SandboxExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExecutionType = table.Column<string>(type: "text", nullable: false),
                    IsolationLevel = table.Column<string>(type: "text", nullable: false),
                    Command = table.Column<string>(type: "text", nullable: false),
                    OutputLog = table.Column<string>(type: "text", nullable: false),
                    ErrorLog = table.Column<string>(type: "text", nullable: false),
                    ExitCode = table.Column<int>(type: "integer", nullable: true),
                    ResourceUsage = table.Column<string>(type: "text", nullable: true),
                    SecurityViolationsJson = table.Column<string>(type: "text", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SandboxExecutions", x => x.Id);
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
                name: "SelfHealingTestResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TotalTests = table.Column<int>(type: "integer", nullable: false),
                    FailedTests = table.Column<int>(type: "integer", nullable: false),
                    HealedTests = table.Column<int>(type: "integer", nullable: false),
                    SkippedTests = table.Column<int>(type: "integer", nullable: false),
                    ConfidenceScore = table.Column<decimal>(type: "numeric", nullable: false),
                    HealedTestsJson = table.Column<string>(type: "text", nullable: true),
                    FailedTestDetailsJson = table.Column<string>(type: "text", nullable: true),
                    AnalysisVersion = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SelfHealingTestResults", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "semantic_indexes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SourceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SourceId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    ContentHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EmbeddingJson = table.Column<string>(type: "text", nullable: false),
                    Dimensions = table.Column<int>(type: "integer", nullable: false),
                    IndexedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_semantic_indexes", x => x.Id);
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
                name: "streaming_code_gen_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<int>(type: "integer", nullable: true),
                    Prompt = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CurrentFile = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TotalFiles = table.Column<int>(type: "integer", nullable: false),
                    CompletedFiles = table.Column<int>(type: "integer", nullable: false),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    StreamedTokens = table.Column<int>(type: "integer", nullable: false),
                    ProgressPercent = table.Column<double>(type: "double precision", nullable: false),
                    GeneratedFilesJson = table.Column<string>(type: "jsonb", nullable: true),
                    BuildProgressJson = table.Column<string>(type: "jsonb", nullable: true),
                    PreviewUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_streaming_code_gen_sessions", x => x.Id);
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

            migrationBuilder.CreateTable(
                name: "subtasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentSubtaskId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    EstimatedHours = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DependsOnSubtaskIdsJson = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subtasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "support_posts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FeedbackType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RewardCredit = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    RewardedByUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RewardMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RewardedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_support_posts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "team_workspaces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    OwnerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_workspaces", x => x.Id);
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
                name: "test_generation_records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TestFilesGenerated = table.Column<int>(type: "integer", nullable: false),
                    TotalTestCount = table.Column<int>(type: "integer", nullable: false),
                    CoverageEstimate = table.Column<int>(type: "integer", nullable: false),
                    TestFramework = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Summary = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    TestFilesJson = table.Column<string>(type: "jsonb", nullable: true),
                    GenerationVersion = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_test_generation_records", x => x.Id);
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
                name: "token_balances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Balance = table.Column<int>(type: "integer", nullable: false),
                    TotalEarned = table.Column<int>(type: "integer", nullable: false),
                    TotalSpent = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_token_balances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "token_packages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TokenAmount = table.Column<int>(type: "integer", nullable: false),
                    PriceUsd = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    DiscountPercent = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_token_packages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "token_pricing",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ActionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TokenCost = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_token_pricing", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "token_transactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReferenceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BalanceAfter = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_token_transactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "translations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LanguageCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Namespace = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Key = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_translations", x => x.Id);
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

            migrationBuilder.CreateTable(
                name: "UsageMeters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    MeterType = table.Column<string>(type: "text", nullable: false),
                    Units = table.Column<decimal>(type: "numeric", nullable: false),
                    UnitCost = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Outcome = table.Column<string>(type: "text", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BilledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageMeters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "user_interests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    Source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_interests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "user_memories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Scope = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SessionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_memories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "user_preference_summaries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SummaryText = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_preference_summaries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "user_preferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    Source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_preferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ProfileImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AnonymousUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    GoogleId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AppleId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LineId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    KakaoId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CountryCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    IsAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
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
                name: "view_transition_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TransitionPreset = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TransitionDurationMs = table.Column<int>(type: "integer", nullable: false),
                    EasingFunction = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EnableViewTransitions = table.Column<bool>(type: "boolean", nullable: false),
                    EnableFramerMotion = table.Column<bool>(type: "boolean", nullable: false),
                    EnablePageTransitions = table.Column<bool>(type: "boolean", nullable: false),
                    EnableComponentAnimations = table.Column<bool>(type: "boolean", nullable: false),
                    EnableLoadingAnimations = table.Column<bool>(type: "boolean", nullable: false),
                    CustomCssJson = table.Column<string>(type: "text", nullable: false),
                    PresetHistoryJson = table.Column<string>(type: "text", nullable: false),
                    ProjectsWithTransitions = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_view_transition_configs", x => x.Id);
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
                name: "visual_overlay_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProjectName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SelectedElementPath = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ModificationsJson = table.Column<string>(type: "text", nullable: false),
                    ComponentTreeJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalEdits = table.Column<int>(type: "integer", nullable: false),
                    UndoCount = table.Column<int>(type: "integer", nullable: false),
                    RedoCount = table.Column<int>(type: "integer", nullable: false),
                    ViewportWidth = table.Column<int>(type: "integer", nullable: false),
                    ViewportHeight = table.Column<int>(type: "integer", nullable: false),
                    PreviewUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_visual_overlay_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "visual_prompt_uis",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ComponentName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PromptText = table.Column<string>(type: "text", nullable: false),
                    GeneratedCode = table.Column<string>(type: "text", nullable: false),
                    GeneratedHtml = table.Column<string>(type: "text", nullable: false),
                    Framework = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StylingLibrary = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IterationCount = table.Column<int>(type: "integer", nullable: false),
                    ParentComponentId = table.Column<string>(type: "text", nullable: true),
                    ConversationJson = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    ForkCount = table.Column<int>(type: "integer", nullable: false),
                    LikeCount = table.Column<int>(type: "integer", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "text", nullable: true),
                    ExportedToProjectId = table.Column<string>(type: "text", nullable: true),
                    ExportedFilePath = table.Column<string>(type: "text", nullable: true),
                    ThemeTokensJson = table.Column<string>(type: "text", nullable: false),
                    GenerationTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: false),
                    EstimatedCost = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_visual_prompt_uis", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "visual_regression_results",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProjectName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ViewportSize = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BaselineImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ComparisonImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DiffImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MismatchPercentage = table.Column<double>(type: "double precision", nullable: false),
                    Threshold = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Passed = table.Column<bool>(type: "boolean", nullable: false),
                    PixelsDifferent = table.Column<int>(type: "integer", nullable: false),
                    TotalPixels = table.Column<int>(type: "integer", nullable: false),
                    IgnoreRegionsJson = table.Column<string>(type: "text", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: false),
                    CaptureTimeMs = table.Column<int>(type: "integer", nullable: false),
                    CompareTimeMs = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_visual_regression_results", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "voice_configs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Language = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ContinuousMode = table.Column<bool>(type: "boolean", nullable: false),
                    AutoPunctuate = table.Column<bool>(type: "boolean", nullable: false),
                    TtsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TtsVoice = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    TtsRate = table.Column<double>(type: "double precision", nullable: false),
                    TranscriptionHistoryJson = table.Column<string>(type: "text", nullable: true),
                    SessionCount = table.Column<int>(type: "integer", nullable: false),
                    TotalDurationSeconds = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_voice_configs", x => x.Id);
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
                name: "whitelabel_tenants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomDomain = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SecondaryColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FaviconUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CustomCss = table.Column<string>(type: "text", nullable: true),
                    AiPromptGuidelines = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    WelcomeMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_whitelabel_tenants", x => x.Id);
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

            migrationBuilder.CreateTable(
                name: "a2a_consents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FromAgentId = table.Column<int>(type: "integer", nullable: false),
                    ToAgentId = table.Column<int>(type: "integer", nullable: false),
                    Scopes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsGranted = table.Column<bool>(type: "boolean", nullable: false),
                    GrantedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_a2a_consents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_a2a_consents_a2a_agent_cards_FromAgentId",
                        column: x => x.FromAgentId,
                        principalTable: "a2a_agent_cards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_a2a_consents_a2a_agent_cards_ToAgentId",
                        column: x => x.ToAgentId,
                        principalTable: "a2a_agent_cards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "a2a_tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaskUid = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FromAgentId = table.Column<int>(type: "integer", nullable: false),
                    ToAgentId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ConsentId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_a2a_tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_a2a_tasks_a2a_agent_cards_FromAgentId",
                        column: x => x.FromAgentId,
                        principalTable: "a2a_agent_cards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_a2a_tasks_a2a_agent_cards_ToAgentId",
                        column: x => x.ToAgentId,
                        principalTable: "a2a_agent_cards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "build_verifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Iteration = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IssuesFound = table.Column<int>(type: "integer", nullable: false),
                    FixesApplied = table.Column<int>(type: "integer", nullable: false),
                    QualityScore = table.Column<int>(type: "integer", nullable: false),
                    ResultJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_build_verifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_build_verifications_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    SpanId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ParentSpanId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OperationName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    InputTokens = table.Column<int>(type: "integer", nullable: false),
                    OutputTokens = table.Column<int>(type: "integer", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric(18,8)", nullable: false),
                    EstimatedCost = table.Column<decimal>(type: "numeric(18,8)", nullable: false),
                    LatencyMs = table.Column<long>(type: "bigint", nullable: false),
                    DurationMs = table.Column<int>(type: "integer", nullable: false),
                    Model = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ModelTier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    AttributesJson = table.Column<string>(type: "jsonb", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    ContainerGroupName = table.Column<string>(type: "text", nullable: true),
                    ContainerName = table.Column<string>(type: "text", nullable: true),
                    Region = table.Column<string>(type: "text", nullable: true),
                    ResourceGroupName = table.Column<string>(type: "text", nullable: true),
                    Port = table.Column<int>(type: "integer", nullable: false),
                    ImageUri = table.Column<string>(type: "text", nullable: true),
                    Fqdn = table.Column<string>(type: "text", nullable: true),
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
                });

            migrationBuilder.CreateTable(
                name: "project_versions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    Label = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FileCount = table.Column<int>(type: "integer", nullable: false),
                    SnapshotPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ChangedFilesJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_versions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_project_versions_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                name: "refinement_messages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    FileChangesJson = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refinement_messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_refinement_messages_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                name: "service_blueprints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ServicesJson = table.Column<string>(type: "jsonb", nullable: false),
                    DependenciesJson = table.Column<string>(type: "jsonb", nullable: false),
                    GatewayConfigJson = table.Column<string>(type: "jsonb", nullable: true),
                    DockerComposeYaml = table.Column<string>(type: "text", nullable: true),
                    K8sManifestYaml = table.Column<string>(type: "text", nullable: true),
                    ServiceCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_blueprints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_service_blueprints_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "suggestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UpvoteCount = table.Column<int>(type: "integer", nullable: false),
                    CommentCount = table.Column<int>(type: "integer", nullable: false),
                    TokenReward = table.Column<int>(type: "integer", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suggestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_suggestions_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "workflow_executions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StepsJson = table.Column<string>(type: "jsonb", nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workflow_executions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workflow_executions_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "deployments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SiteName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ResourceGroupName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PreviewUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ContainerAppName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContainerImageTag = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Region = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProjectType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HostingPlanId = table.Column<int>(type: "integer", nullable: true),
                    DeploymentLogJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeployedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deployments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_deployments_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_deployments_hosting_plans_HostingPlanId",
                        column: x => x.HostingPlanId,
                        principalTable: "hosting_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "subagent_tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentOrchestrationId = table.Column<int>(type: "integer", nullable: true),
                    TaskType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    ContextJson = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OutputJson = table.Column<string>(type: "text", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DurationMs = table.Column<int>(type: "integer", nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subagent_tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_subagent_tasks_parallel_orchestrations_ParentOrchestrationId",
                        column: x => x.ParentOrchestrationId,
                        principalTable: "parallel_orchestrations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "team_activities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TargetUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Detail = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_team_activities_team_workspaces_TeamId",
                        column: x => x.TeamId,
                        principalTable: "team_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "team_members",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_team_members_team_workspaces_TeamId",
                        column: x => x.TeamId,
                        principalTable: "team_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "team_projects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<int>(type: "integer", nullable: false),
                    DevRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    SharedByUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SharedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_projects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_team_projects_dev_requests_DevRequestId",
                        column: x => x.DevRequestId,
                        principalTable: "dev_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_team_projects_team_workspaces_TeamId",
                        column: x => x.TeamId,
                        principalTable: "team_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "auto_topup_configs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    Threshold = table.Column<int>(type: "integer", nullable: false),
                    TokenPackageId = table.Column<int>(type: "integer", nullable: false),
                    MonthlyLimitUsd = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    MonthlySpentUsd = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    LastTriggeredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastFailedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auto_topup_configs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_auto_topup_configs_token_packages_TokenPackageId",
                        column: x => x.TokenPackageId,
                        principalTable: "token_packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "credit_package_prices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TokenPackageId = table.Column<int>(type: "integer", nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_credit_package_prices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_credit_package_prices_token_packages_TokenPackageId",
                        column: x => x.TokenPackageId,
                        principalTable: "token_packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StripeCheckoutSessionId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CryptoChargeId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CryptoTransactionHash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CryptoCurrency = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CryptoAmount = table.Column<decimal>(type: "numeric(18,8)", nullable: true),
                    ExchangeRateUsd = table.Column<decimal>(type: "numeric(18,8)", nullable: true),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AmountUsd = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TokenPackageId = table.Column<int>(type: "integer", nullable: true),
                    TokensAwarded = table.Column<int>(type: "integer", nullable: true),
                    MetadataJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_payments_token_packages_TokenPackageId",
                        column: x => x.TokenPackageId,
                        principalTable: "token_packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "reseller_partners",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    CompanyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContactEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    MarginPercent = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    CommissionRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reseller_partners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_reseller_partners_whitelabel_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "whitelabel_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tenant_usages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenant_usages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tenant_usages_whitelabel_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "whitelabel_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "a2a_artifacts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaskId = table.Column<int>(type: "integer", nullable: false),
                    ArtifactType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SchemaVersion = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DataJson = table.Column<string>(type: "jsonb", nullable: false),
                    Direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_a2a_artifacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_a2a_artifacts_a2a_tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "a2a_tasks",
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
                    ParentSpanId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Model = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InputTokens = table.Column<int>(type: "integer", nullable: false),
                    OutputTokens = table.Column<int>(type: "integer", nullable: false),
                    TotalTokens = table.Column<int>(type: "integer", nullable: false),
                    Cost = table.Column<decimal>(type: "numeric(18,8)", nullable: false),
                    LatencyMs = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    AttributesJson = table.Column<string>(type: "jsonb", nullable: true),
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

            migrationBuilder.CreateTable(
                name: "suggestion_comments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SuggestionId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Content = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    IsAdminReply = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suggestion_comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_suggestion_comments_suggestions_SuggestionId",
                        column: x => x.SuggestionId,
                        principalTable: "suggestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "suggestion_status_history",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SuggestionId = table.Column<int>(type: "integer", nullable: false),
                    FromStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ToStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ChangedByUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suggestion_status_history", x => x.Id);
                    table.ForeignKey(
                        name: "FK_suggestion_status_history_suggestions_SuggestionId",
                        column: x => x.SuggestionId,
                        principalTable: "suggestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "suggestion_votes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SuggestionId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsUpvote = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suggestion_votes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_suggestion_votes_suggestions_SuggestionId",
                        column: x => x.SuggestionId,
                        principalTable: "suggestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "domains",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DeploymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DomainName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Tld = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Registrar = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RegistrarDomainId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AutoRenew = table.Column<bool>(type: "boolean", nullable: false),
                    AnnualCostUsd = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    SslStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DnsStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_domains", x => x.Id);
                    table.ForeignKey(
                        name: "FK_domains_deployments_DeploymentId",
                        column: x => x.DeploymentId,
                        principalTable: "deployments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "domain_transactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DomainId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AmountUsd = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TokenAmount = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_domain_transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_domain_transactions_domains_DomainId",
                        column: x => x.DomainId,
                        principalTable: "domains",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "exchange_rates",
                columns: new[] { "Id", "CreatedAt", "CurrencyCode", "FetchedAt", "RateToUsd" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "KRW", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 1400m },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "JPY", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 155m },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "EUR", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0.92m }
                });

            migrationBuilder.InsertData(
                table: "hosting_plans",
                columns: new[] { "Id", "AzureSku", "BandwidthGb", "BestFor", "Description", "DisplayName", "IsActive", "MaxInstances", "MemoryGb", "MonthlyCostUsd", "Name", "SortOrder", "StorageGb", "SupportsAutoscale", "SupportsCustomDomain", "SupportsSla", "Vcpu" },
                values: new object[,]
                {
                    { 1, "Consumption-Free", 5, "Testing, previews, prototypes", "Perfect for testing and preview. 7-day expiry.", "Free", true, 1, "0.25", 0m, "free", 1, 1, false, false, false, "Shared" },
                    { 2, "Consumption-Basic", 50, "Personal projects, small business sites", "Always-on hosting with custom domain support.", "Basic", true, 1, "0.5", 5.00m, "basic", 2, 1, false, true, false, "1" },
                    { 3, "Dedicated-D4", 200, "Business apps, medium-traffic sites", "Auto-scaling with SLA guarantee.", "Standard", true, 3, "2", 25.00m, "standard", 3, 5, true, true, true, "2" },
                    { 4, "Dedicated-D8", 500, "Enterprise apps, high-traffic platforms", "High-performance with 99.9% SLA.", "Premium", true, 10, "4", 70.00m, "premium", 4, 20, true, true, true, "4" }
                });

            migrationBuilder.InsertData(
                table: "languages",
                columns: new[] { "Id", "Code", "CreatedAt", "IsActive", "IsDefault", "Name", "NativeName", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "ko", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Korean", "한국어", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "en", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, false, "English", "English", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "token_packages",
                columns: new[] { "Id", "DiscountPercent", "IsActive", "Name", "PriceUsd", "SortOrder", "TokenAmount" },
                values: new object[,]
                {
                    { 1, 0, true, "500 Tokens", 5.00m, 1, 500 },
                    { 2, 0, true, "1,000 Tokens", 10.00m, 2, 1000 },
                    { 3, 17, true, "3,000 Tokens", 25.00m, 3, 3000 },
                    { 4, 30, true, "10,000 Tokens", 70.00m, 4, 10000 }
                });

            migrationBuilder.InsertData(
                table: "token_pricing",
                columns: new[] { "Id", "ActionType", "Description", "IsActive", "TokenCost" },
                values: new object[,]
                {
                    { 1, "analysis", "AI Analysis", true, 50 },
                    { 2, "proposal", "Proposal Generation", true, 100 },
                    { 3, "build", "Project Build", true, 300 },
                    { 4, "staging", "Staging Deploy", true, 50 },
                    { 5, "refinement", "Chat Refinement", true, 10 }
                });

            migrationBuilder.InsertData(
                table: "credit_package_prices",
                columns: new[] { "Id", "CurrencyCode", "IsActive", "Price", "TokenPackageId" },
                values: new object[,]
                {
                    { 1, "USD", true, 5.00m, 1 },
                    { 2, "USD", true, 10.00m, 2 },
                    { 3, "USD", true, 25.00m, 3 },
                    { 4, "USD", true, 70.00m, 4 },
                    { 5, "KRW", true, 6900m, 1 },
                    { 6, "KRW", true, 13900m, 2 },
                    { 7, "KRW", true, 34900m, 3 },
                    { 8, "KRW", true, 97900m, 4 },
                    { 9, "JPY", true, 780m, 1 },
                    { 10, "JPY", true, 1550m, 2 },
                    { 11, "JPY", true, 3900m, 3 },
                    { 12, "JPY", true, 10900m, 4 },
                    { 13, "EUR", true, 4.59m, 1 },
                    { 14, "EUR", true, 9.19m, 2 },
                    { 15, "EUR", true, 22.99m, 3 },
                    { 16, "EUR", true, 64.49m, 4 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_a2a_agent_cards_AgentKey",
                table: "a2a_agent_cards",
                column: "AgentKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_a2a_agent_cards_OwnerId",
                table: "a2a_agent_cards",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_artifacts_TaskId",
                table: "a2a_artifacts",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_audit_logs_CreatedAt",
                table: "a2a_audit_logs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_audit_logs_TaskId",
                table: "a2a_audit_logs",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_consents_FromAgentId",
                table: "a2a_consents",
                column: "FromAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_consents_ToAgentId",
                table: "a2a_consents",
                column: "ToAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_consents_UserId",
                table: "a2a_consents",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_consents_UserId_FromAgentId_ToAgentId",
                table: "a2a_consents",
                columns: new[] { "UserId", "FromAgentId", "ToAgentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_a2a_tasks_CreatedAt",
                table: "a2a_tasks",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_tasks_FromAgentId",
                table: "a2a_tasks",
                column: "FromAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_tasks_Status",
                table: "a2a_tasks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_tasks_TaskUid",
                table: "a2a_tasks",
                column: "TaskUid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_a2a_tasks_ToAgentId",
                table: "a2a_tasks",
                column: "ToAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_a2a_tasks_UserId",
                table: "a2a_tasks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_agentic_plans_UserId",
                table: "agentic_plans",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ai_elements_configs_UserId",
                table: "ai_elements_configs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_analytics_events_CreatedAt",
                table: "analytics_events",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_analytics_events_EventType",
                table: "analytics_events",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_analytics_events_SessionId",
                table: "analytics_events",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_analytics_events_UserId",
                table: "analytics_events",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_api_doc_configs_DevRequestId",
                table: "api_doc_configs",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_api_doc_configs_UserId",
                table: "api_doc_configs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_api_keys_KeyHash",
                table: "api_keys",
                column: "KeyHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_api_keys_UserId",
                table: "api_keys",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_app_recommendations_InterestCategory",
                table: "app_recommendations",
                column: "InterestCategory");

            migrationBuilder.CreateIndex(
                name: "IX_app_recommendations_UserId",
                table: "app_recommendations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_arena_comparisons_UserId",
                table: "arena_comparisons",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_auto_topup_configs_TokenPackageId",
                table: "auto_topup_configs",
                column: "TokenPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_auto_topup_configs_UserId",
                table: "auto_topup_configs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_background_agents_UserId_Status",
                table: "background_agents",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_billing_accounts_Plan",
                table: "billing_accounts",
                column: "Plan");

            migrationBuilder.CreateIndex(
                name: "IX_billing_accounts_Status",
                table: "billing_accounts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_billing_accounts_UserId",
                table: "billing_accounts",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_build_verifications_DevRequestId",
                table: "build_verifications",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_churn_metric_snapshots_PeriodStart",
                table: "churn_metric_snapshots",
                column: "PeriodStart");

            migrationBuilder.CreateIndex(
                name: "IX_code_quality_reviews_CreatedAt",
                table: "code_quality_reviews",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_code_quality_reviews_ProjectId",
                table: "code_quality_reviews",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_code_quality_reviews_Status",
                table: "code_quality_reviews",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_code_snapshots_DevRequestId",
                table: "code_snapshots",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_code_snapshots_UserId",
                table: "code_snapshots",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_code_snapshots_UserId_DevRequestId_FilePath",
                table: "code_snapshots",
                columns: new[] { "UserId", "DevRequestId", "FilePath" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_collaborative_sessions_CreatedAt",
                table: "collaborative_sessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_collaborative_sessions_ProjectId",
                table: "collaborative_sessions",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_collaborative_sessions_Status",
                table: "collaborative_sessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_compilation_results_CompiledAt",
                table: "compilation_results",
                column: "CompiledAt");

            migrationBuilder.CreateIndex(
                name: "IX_compilation_results_DevRequestId",
                table: "compilation_results",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_component_previews_CreatedAt",
                table: "component_previews",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_component_previews_Status",
                table: "component_previews",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_component_previews_UserId",
                table: "component_previews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_container_configs_BuildStatus",
                table: "container_configs",
                column: "BuildStatus");

            migrationBuilder.CreateIndex(
                name: "IX_container_configs_CreatedAt",
                table: "container_configs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_container_configs_ProjectId",
                table: "container_configs",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_credit_package_prices_TokenPackageId_CurrencyCode",
                table: "credit_package_prices",
                columns: new[] { "TokenPackageId", "CurrencyCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_data_schemas_DevRequestId",
                table: "data_schemas",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_data_schemas_Status",
                table: "data_schemas",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_data_schemas_UserId",
                table: "data_schemas",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_deployment_healths_UserId_DevRequestId",
                table: "deployment_healths",
                columns: new[] { "UserId", "DevRequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_deployments_DevRequestId",
                table: "deployments",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_deployments_HostingPlanId",
                table: "deployments",
                column: "HostingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_deployments_Status",
                table: "deployments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_deployments_UserId",
                table: "deployments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_dev_pipelines_IsTemplate",
                table: "dev_pipelines",
                column: "IsTemplate");

            migrationBuilder.CreateIndex(
                name: "IX_dev_pipelines_UserId",
                table: "dev_pipelines",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_dev_requests_CreatedAt",
                table: "dev_requests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_dev_requests_Status",
                table: "dev_requests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_dev_requests_UserId",
                table: "dev_requests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_development_specs_CreatedAt",
                table: "development_specs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_development_specs_DevRequestId",
                table: "development_specs",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_development_specs_Phase",
                table: "development_specs",
                column: "Phase");

            migrationBuilder.CreateIndex(
                name: "IX_development_specs_Status",
                table: "development_specs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_domain_transactions_DomainId",
                table: "domain_transactions",
                column: "DomainId");

            migrationBuilder.CreateIndex(
                name: "IX_domain_transactions_UserId",
                table: "domain_transactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_domains_DeploymentId",
                table: "domains",
                column: "DeploymentId");

            migrationBuilder.CreateIndex(
                name: "IX_domains_DomainName",
                table: "domains",
                column: "DomainName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_domains_UserId",
                table: "domains",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_exchange_rates_CurrencyCode",
                table: "exchange_rates",
                column: "CurrencyCode");

            migrationBuilder.CreateIndex(
                name: "IX_exchange_rates_FetchedAt",
                table: "exchange_rates",
                column: "FetchedAt");

            migrationBuilder.CreateIndex(
                name: "IX_figma_imports_UserId",
                table: "figma_imports",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_framework_configs_UserId",
                table: "framework_configs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_generation_manifests_DevRequestId",
                table: "generation_manifests",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_generation_manifests_ValidationStatus",
                table: "generation_manifests",
                column: "ValidationStatus");

            migrationBuilder.CreateIndex(
                name: "IX_generation_streams_CreatedAt",
                table: "generation_streams",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_generation_streams_DevRequestId",
                table: "generation_streams",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_generation_streams_Status",
                table: "generation_streams",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_generation_variants_DevRequestId",
                table: "generation_variants",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_generation_variants_Status",
                table: "generation_variants",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_generation_variants_UserId",
                table: "generation_variants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_generative_ui_sessions_UserId_DevRequestId",
                table: "generative_ui_sessions",
                columns: new[] { "UserId", "DevRequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_github_syncs_CreatedAt",
                table: "github_syncs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_github_syncs_ProjectId",
                table: "github_syncs",
                column: "ProjectId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_github_syncs_Status",
                table: "github_syncs",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_growth_snapshots_SnapshotDate_Period",
                table: "growth_snapshots",
                columns: new[] { "SnapshotDate", "Period" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_hosting_plans_Name",
                table: "hosting_plans",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_infrastructure_configs_DevRequestId",
                table: "infrastructure_configs",
                column: "DevRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_languages_Code",
                table: "languages",
                column: "Code",
                unique: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_marketplace_templates_AuthorId",
                table: "marketplace_templates",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_marketplace_templates_Category",
                table: "marketplace_templates",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_marketplace_templates_CreatedAt",
                table: "marketplace_templates",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_marketplace_templates_DownloadCount",
                table: "marketplace_templates",
                column: "DownloadCount");

            migrationBuilder.CreateIndex(
                name: "IX_marketplace_templates_Status",
                table: "marketplace_templates",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_mcp_connections_CreatedAt",
                table: "mcp_connections",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_mcp_connections_ProjectId",
                table: "mcp_connections",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_mcp_connections_Status",
                table: "mcp_connections",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_mcp_gateway_servers_UserId",
                table: "mcp_gateway_servers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_mobile_app_configs_UserId_DevRequestId",
                table: "mobile_app_configs",
                columns: new[] { "UserId", "DevRequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_model_routing_configs_UserId",
                table: "model_routing_configs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_nl_schemas_UserId",
                table: "nl_schemas",
                column: "UserId");

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
                name: "IX_observability_traces_OperationName",
                table: "observability_traces",
                column: "OperationName");

            migrationBuilder.CreateIndex(
                name: "IX_observability_traces_StartedAt",
                table: "observability_traces",
                column: "StartedAt");

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
                name: "IX_onboarding_progresses_Status",
                table: "onboarding_progresses",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_progresses_UserId",
                table: "onboarding_progresses",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_parallel_orchestrations_DevRequestId",
                table: "parallel_orchestrations",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_parallel_orchestrations_Status",
                table: "parallel_orchestrations",
                column: "Status");

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

            migrationBuilder.CreateIndex(
                name: "IX_payments_Status",
                table: "payments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_payments_StripeCheckoutSessionId",
                table: "payments",
                column: "StripeCheckoutSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_StripePaymentIntentId",
                table: "payments",
                column: "StripePaymentIntentId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_TokenPackageId",
                table: "payments",
                column: "TokenPackageId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_UserId",
                table: "payments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_performance_profiles_ProjectId",
                table: "performance_profiles",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_performance_profiles_Status",
                table: "performance_profiles",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_performance_profiles_UserId",
                table: "performance_profiles",
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
                name: "IX_platform_upgrades_UserId",
                table: "platform_upgrades",
                column: "UserId",
                unique: true);

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
                name: "IX_project_indexes_DevRequestId",
                table: "project_indexes",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_project_indexes_UserId_DevRequestId_FilePath",
                table: "project_indexes",
                columns: new[] { "UserId", "DevRequestId", "FilePath" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_project_memories_UserId",
                table: "project_memories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_project_memories_UserId_Category",
                table: "project_memories",
                columns: new[] { "UserId", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_project_reviews_DevRequestId",
                table: "project_reviews",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_project_reviews_UserId",
                table: "project_reviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_project_templates_Category",
                table: "project_templates",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_project_templates_Framework",
                table: "project_templates",
                column: "Framework");

            migrationBuilder.CreateIndex(
                name: "IX_project_versions_DevRequestId",
                table: "project_versions",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_project_versions_DevRequestId_VersionNumber",
                table: "project_versions",
                columns: new[] { "DevRequestId", "VersionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectLogs_ProjectId",
                table: "ProjectLogs",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_DevRequestId",
                table: "Projects",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_query_configs_UserId",
                table: "query_configs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refinement_messages_CreatedAt",
                table: "refinement_messages",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_refinement_messages_DevRequestId",
                table: "refinement_messages",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_reseller_partners_TenantId",
                table: "reseller_partners",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_reseller_partners_UserId",
                table: "reseller_partners",
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
                name: "IX_semantic_indexes_SourceType",
                table: "semantic_indexes",
                column: "SourceType");

            migrationBuilder.CreateIndex(
                name: "IX_semantic_indexes_UserId",
                table: "semantic_indexes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_semantic_indexes_UserId_ContentHash",
                table: "semantic_indexes",
                columns: new[] { "UserId", "ContentHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_service_blueprints_DevRequestId",
                table: "service_blueprints",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_service_blueprints_UserId",
                table: "service_blueprints",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_streaming_code_gen_sessions_CreatedAt",
                table: "streaming_code_gen_sessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_streaming_code_gen_sessions_Status",
                table: "streaming_code_gen_sessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_streaming_code_gen_sessions_UserId",
                table: "streaming_code_gen_sessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_subagent_tasks_DevRequestId",
                table: "subagent_tasks",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_subagent_tasks_ParentOrchestrationId",
                table: "subagent_tasks",
                column: "ParentOrchestrationId");

            migrationBuilder.CreateIndex(
                name: "IX_subagent_tasks_Status",
                table: "subagent_tasks",
                column: "Status");

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

            migrationBuilder.CreateIndex(
                name: "IX_subtasks_DevRequestId",
                table: "subtasks",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_subtasks_ParentSubtaskId",
                table: "subtasks",
                column: "ParentSubtaskId");

            migrationBuilder.CreateIndex(
                name: "IX_subtasks_UserId",
                table: "subtasks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_suggestion_comments_CreatedAt",
                table: "suggestion_comments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_suggestion_comments_SuggestionId",
                table: "suggestion_comments",
                column: "SuggestionId");

            migrationBuilder.CreateIndex(
                name: "IX_suggestion_status_history_CreatedAt",
                table: "suggestion_status_history",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_suggestion_status_history_SuggestionId",
                table: "suggestion_status_history",
                column: "SuggestionId");

            migrationBuilder.CreateIndex(
                name: "IX_suggestion_votes_SuggestionId",
                table: "suggestion_votes",
                column: "SuggestionId");

            migrationBuilder.CreateIndex(
                name: "IX_suggestion_votes_SuggestionId_UserId",
                table: "suggestion_votes",
                columns: new[] { "SuggestionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_suggestions_CreatedAt",
                table: "suggestions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_suggestions_DevRequestId",
                table: "suggestions",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_suggestions_Status",
                table: "suggestions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_suggestions_UserId",
                table: "suggestions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_support_posts_Category",
                table: "support_posts",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_support_posts_CreatedAt",
                table: "support_posts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_support_posts_Status",
                table: "support_posts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_support_posts_UserId",
                table: "support_posts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_team_activities_CreatedAt",
                table: "team_activities",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_team_activities_TeamId",
                table: "team_activities",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_team_members_TeamId",
                table: "team_members",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_team_members_TeamId_UserId",
                table: "team_members",
                columns: new[] { "TeamId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_team_members_UserId",
                table: "team_members",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_team_projects_DevRequestId",
                table: "team_projects",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_team_projects_TeamId",
                table: "team_projects",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_team_projects_TeamId_DevRequestId",
                table: "team_projects",
                columns: new[] { "TeamId", "DevRequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_team_workspaces_OwnerId",
                table: "team_workspaces",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_usages_RecordedAt",
                table: "tenant_usages",
                column: "RecordedAt");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_usages_TenantId",
                table: "tenant_usages",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_test_generation_records_CreatedAt",
                table: "test_generation_records",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_test_generation_records_ProjectId",
                table: "test_generation_records",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_test_generation_records_Status",
                table: "test_generation_records",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_test_healing_records_CreatedAt",
                table: "test_healing_records",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_test_healing_records_TestConfigId",
                table: "test_healing_records",
                column: "TestConfigId");

            migrationBuilder.CreateIndex(
                name: "IX_token_balances_UserId",
                table: "token_balances",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_token_pricing_ActionType",
                table: "token_pricing",
                column: "ActionType",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_token_transactions_CreatedAt",
                table: "token_transactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_token_transactions_UserId",
                table: "token_transactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_translations_LanguageCode_Namespace_Key",
                table: "translations",
                columns: new[] { "LanguageCode", "Namespace", "Key" },
                unique: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_user_interests_UserId",
                table: "user_interests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_interests_UserId_Category",
                table: "user_interests",
                columns: new[] { "UserId", "Category" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_memories_Category",
                table: "user_memories",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_user_memories_Scope",
                table: "user_memories",
                column: "Scope");

            migrationBuilder.CreateIndex(
                name: "IX_user_memories_UserId",
                table: "user_memories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_memories_UserId_SessionId",
                table: "user_memories",
                columns: new[] { "UserId", "SessionId" });

            migrationBuilder.CreateIndex(
                name: "IX_user_preference_summaries_UserId",
                table: "user_preference_summaries",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_preferences_Category",
                table: "user_preferences",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_user_preferences_UserId",
                table: "user_preferences",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_preferences_UserId_Category_Key",
                table: "user_preferences",
                columns: new[] { "UserId", "Category", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_AnonymousUserId",
                table: "users",
                column: "AnonymousUserId");

            migrationBuilder.CreateIndex(
                name: "IX_users_AppleId",
                table: "users",
                column: "AppleId");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_GoogleId",
                table: "users",
                column: "GoogleId");

            migrationBuilder.CreateIndex(
                name: "IX_users_KakaoId",
                table: "users",
                column: "KakaoId");

            migrationBuilder.CreateIndex(
                name: "IX_users_LineId",
                table: "users",
                column: "LineId");

            migrationBuilder.CreateIndex(
                name: "IX_view_transition_configs_UserId",
                table: "view_transition_configs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_visual_overlay_sessions_UserId",
                table: "visual_overlay_sessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_visual_prompt_uis_UserId_Category",
                table: "visual_prompt_uis",
                columns: new[] { "UserId", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_visual_regression_results_UserId",
                table: "visual_regression_results",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_voice_configs_UserId",
                table: "voice_configs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vulnerability_results_SbomReportId",
                table: "vulnerability_results",
                column: "SbomReportId");

            migrationBuilder.CreateIndex(
                name: "IX_vulnerability_results_Severity",
                table: "vulnerability_results",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_whitelabel_tenants_Slug",
                table: "whitelabel_tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_whitelabel_tenants_UserId",
                table: "whitelabel_tenants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_workflow_executions_CreatedAt",
                table: "workflow_executions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_workflow_executions_DevRequestId",
                table: "workflow_executions",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_workflow_executions_Status",
                table: "workflow_executions",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "a2a_artifacts");

            migrationBuilder.DropTable(
                name: "a2a_audit_logs");

            migrationBuilder.DropTable(
                name: "a2a_consents");

            migrationBuilder.DropTable(
                name: "AdaptiveThinkingConfigs");

            migrationBuilder.DropTable(
                name: "AgentAutomationConfigs");

            migrationBuilder.DropTable(
                name: "agentic_plans");

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
                name: "AgentTasks");

            migrationBuilder.DropTable(
                name: "AgentTerminalSessions");

            migrationBuilder.DropTable(
                name: "AgentTestExecutions");

            migrationBuilder.DropTable(
                name: "AgentTraces");

            migrationBuilder.DropTable(
                name: "ai_elements_configs");

            migrationBuilder.DropTable(
                name: "AiAgentRules");

            migrationBuilder.DropTable(
                name: "AiModelConfigs");

            migrationBuilder.DropTable(
                name: "AiModelIntegrations");

            migrationBuilder.DropTable(
                name: "analytics_events");

            migrationBuilder.DropTable(
                name: "api_doc_configs");

            migrationBuilder.DropTable(
                name: "api_keys");

            migrationBuilder.DropTable(
                name: "app_recommendations");

            migrationBuilder.DropTable(
                name: "arena_comparisons");

            migrationBuilder.DropTable(
                name: "auto_topup_configs");

            migrationBuilder.DropTable(
                name: "AutonomousTestExecutions");

            migrationBuilder.DropTable(
                name: "background_agents");

            migrationBuilder.DropTable(
                name: "BidirectionalGitSyncs");

            migrationBuilder.DropTable(
                name: "billing_accounts");

            migrationBuilder.DropTable(
                name: "BiomeLintResults");

            migrationBuilder.DropTable(
                name: "BrowserIdeSessions");

            migrationBuilder.DropTable(
                name: "build_verifications");

            migrationBuilder.DropTable(
                name: "BuildToolchainResults");

            migrationBuilder.DropTable(
                name: "churn_metric_snapshots");

            migrationBuilder.DropTable(
                name: "code_quality_reviews");

            migrationBuilder.DropTable(
                name: "code_snapshots");

            migrationBuilder.DropTable(
                name: "CodebaseGraphs");

            migrationBuilder.DropTable(
                name: "CodeLintResults");

            migrationBuilder.DropTable(
                name: "CodeReviewAgents");

            migrationBuilder.DropTable(
                name: "collaborative_sessions");

            migrationBuilder.DropTable(
                name: "compilation_results");

            migrationBuilder.DropTable(
                name: "component_previews");

            migrationBuilder.DropTable(
                name: "ComposerPlans");

            migrationBuilder.DropTable(
                name: "ConcurrencyIssues");

            migrationBuilder.DropTable(
                name: "ConfidenceScores");

            migrationBuilder.DropTable(
                name: "container_configs");

            migrationBuilder.DropTable(
                name: "credit_package_prices");

            migrationBuilder.DropTable(
                name: "data_schemas");

            migrationBuilder.DropTable(
                name: "DatabaseBranches");

            migrationBuilder.DropTable(
                name: "deployment_healths");

            migrationBuilder.DropTable(
                name: "dev_pipelines");

            migrationBuilder.DropTable(
                name: "development_specs");

            migrationBuilder.DropTable(
                name: "DevRequestBranches");

            migrationBuilder.DropTable(
                name: "domain_transactions");

            migrationBuilder.DropTable(
                name: "DotnetUpgradeResults");

            migrationBuilder.DropTable(
                name: "EditPredictions");

            migrationBuilder.DropTable(
                name: "exchange_rates");

            migrationBuilder.DropTable(
                name: "figma_imports");

            migrationBuilder.DropTable(
                name: "framework_configs");

            migrationBuilder.DropTable(
                name: "generation_manifests");

            migrationBuilder.DropTable(
                name: "generation_streams");

            migrationBuilder.DropTable(
                name: "generation_variants");

            migrationBuilder.DropTable(
                name: "generative_ui_sessions");

            migrationBuilder.DropTable(
                name: "github_syncs");

            migrationBuilder.DropTable(
                name: "GovernanceActions");

            migrationBuilder.DropTable(
                name: "growth_snapshots");

            migrationBuilder.DropTable(
                name: "HybridCacheEntries");

            migrationBuilder.DropTable(
                name: "HybridValidations");

            migrationBuilder.DropTable(
                name: "InferenceCostRecords");

            migrationBuilder.DropTable(
                name: "infrastructure_configs");

            migrationBuilder.DropTable(
                name: "LangGraphWorkflows");

            migrationBuilder.DropTable(
                name: "LanguageExpansions");

            migrationBuilder.DropTable(
                name: "languages");

            migrationBuilder.DropTable(
                name: "LocalModelConfigs");

            migrationBuilder.DropTable(
                name: "managed_backends");

            migrationBuilder.DropTable(
                name: "marketplace_templates");

            migrationBuilder.DropTable(
                name: "mcp_connections");

            migrationBuilder.DropTable(
                name: "mcp_gateway_servers");

            migrationBuilder.DropTable(
                name: "McpToolIntegrations");

            migrationBuilder.DropTable(
                name: "mobile_app_configs");

            migrationBuilder.DropTable(
                name: "model_routing_configs");

            migrationBuilder.DropTable(
                name: "ModelRoutingRules");

            migrationBuilder.DropTable(
                name: "MultiAgentReviews");

            migrationBuilder.DropTable(
                name: "MultiAgentTestSessions");

            migrationBuilder.DropTable(
                name: "nl_schemas");

            migrationBuilder.DropTable(
                name: "oauth_compliance_reports");

            migrationBuilder.DropTable(
                name: "OAuthConnectors");

            migrationBuilder.DropTable(
                name: "observability_spans");

            migrationBuilder.DropTable(
                name: "onboarding_progresses");

            migrationBuilder.DropTable(
                name: "OrganizationalMemories");

            migrationBuilder.DropTable(
                name: "OrgMemories");

            migrationBuilder.DropTable(
                name: "ParallelAgentRuns");

            migrationBuilder.DropTable(
                name: "patent_innovations");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "performance_profiles");

            migrationBuilder.DropTable(
                name: "PerformanceOptimizations");

            migrationBuilder.DropTable(
                name: "PlanningSessions");

            migrationBuilder.DropTable(
                name: "platform_events");

            migrationBuilder.DropTable(
                name: "platform_upgrades");

            migrationBuilder.DropTable(
                name: "playwright_mcp_test_configs");

            migrationBuilder.DropTable(
                name: "PlaywrightHealingResults");

            migrationBuilder.DropTable(
                name: "PlaywrightMcpConfigs");

            migrationBuilder.DropTable(
                name: "preview_deployments");

            migrationBuilder.DropTable(
                name: "ProductionSandboxes");

            migrationBuilder.DropTable(
                name: "project_indexes");

            migrationBuilder.DropTable(
                name: "project_memories");

            migrationBuilder.DropTable(
                name: "project_reviews");

            migrationBuilder.DropTable(
                name: "project_templates");

            migrationBuilder.DropTable(
                name: "project_versions");

            migrationBuilder.DropTable(
                name: "ProjectDocumentations");

            migrationBuilder.DropTable(
                name: "ProjectLogs");

            migrationBuilder.DropTable(
                name: "query_configs");

            migrationBuilder.DropTable(
                name: "ReactUseHookDemos");

            migrationBuilder.DropTable(
                name: "refinement_messages");

            migrationBuilder.DropTable(
                name: "ReplTestSessions");

            migrationBuilder.DropTable(
                name: "reseller_partners");

            migrationBuilder.DropTable(
                name: "ReviewPipelineConfigs");

            migrationBuilder.DropTable(
                name: "SandboxExecutions");

            migrationBuilder.DropTable(
                name: "secret_scan_results");

            migrationBuilder.DropTable(
                name: "SelfHealingRuns");

            migrationBuilder.DropTable(
                name: "SelfHealingTestResults");

            migrationBuilder.DropTable(
                name: "semantic_indexes");

            migrationBuilder.DropTable(
                name: "ServerComponentConfigs");

            migrationBuilder.DropTable(
                name: "service_blueprints");

            migrationBuilder.DropTable(
                name: "streaming_code_gen_sessions");

            migrationBuilder.DropTable(
                name: "subagent_tasks");

            migrationBuilder.DropTable(
                name: "subscription_events");

            migrationBuilder.DropTable(
                name: "subscription_records");

            migrationBuilder.DropTable(
                name: "subtasks");

            migrationBuilder.DropTable(
                name: "suggestion_comments");

            migrationBuilder.DropTable(
                name: "suggestion_status_history");

            migrationBuilder.DropTable(
                name: "suggestion_votes");

            migrationBuilder.DropTable(
                name: "support_posts");

            migrationBuilder.DropTable(
                name: "team_activities");

            migrationBuilder.DropTable(
                name: "team_members");

            migrationBuilder.DropTable(
                name: "team_projects");

            migrationBuilder.DropTable(
                name: "tenant_usages");

            migrationBuilder.DropTable(
                name: "TerminalExecutions");

            migrationBuilder.DropTable(
                name: "test_generation_records");

            migrationBuilder.DropTable(
                name: "test_healing_records");

            migrationBuilder.DropTable(
                name: "TestPersonas");

            migrationBuilder.DropTable(
                name: "token_balances");

            migrationBuilder.DropTable(
                name: "token_pricing");

            migrationBuilder.DropTable(
                name: "token_transactions");

            migrationBuilder.DropTable(
                name: "translations");

            migrationBuilder.DropTable(
                name: "trend_reports");

            migrationBuilder.DropTable(
                name: "TursoDatabases");

            migrationBuilder.DropTable(
                name: "update_recommendations");

            migrationBuilder.DropTable(
                name: "UsageMeters");

            migrationBuilder.DropTable(
                name: "user_interests");

            migrationBuilder.DropTable(
                name: "user_memories");

            migrationBuilder.DropTable(
                name: "user_preference_summaries");

            migrationBuilder.DropTable(
                name: "user_preferences");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "VectorSearchConfigs");

            migrationBuilder.DropTable(
                name: "view_transition_configs");

            migrationBuilder.DropTable(
                name: "VisionToCodeResults");

            migrationBuilder.DropTable(
                name: "visual_overlay_sessions");

            migrationBuilder.DropTable(
                name: "visual_prompt_uis");

            migrationBuilder.DropTable(
                name: "visual_regression_results");

            migrationBuilder.DropTable(
                name: "voice_configs");

            migrationBuilder.DropTable(
                name: "vulnerability_results");

            migrationBuilder.DropTable(
                name: "WebMcpSessions");

            migrationBuilder.DropTable(
                name: "WorkersAiDeployments");

            migrationBuilder.DropTable(
                name: "workflow_executions");

            migrationBuilder.DropTable(
                name: "WorkflowAutomationRuns");

            migrationBuilder.DropTable(
                name: "WorkflowAutomations");

            migrationBuilder.DropTable(
                name: "a2a_tasks");

            migrationBuilder.DropTable(
                name: "domains");

            migrationBuilder.DropTable(
                name: "observability_traces");

            migrationBuilder.DropTable(
                name: "token_packages");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "parallel_orchestrations");

            migrationBuilder.DropTable(
                name: "suggestions");

            migrationBuilder.DropTable(
                name: "team_workspaces");

            migrationBuilder.DropTable(
                name: "whitelabel_tenants");

            migrationBuilder.DropTable(
                name: "sbom_reports");

            migrationBuilder.DropTable(
                name: "a2a_agent_cards");

            migrationBuilder.DropTable(
                name: "deployments");

            migrationBuilder.DropTable(
                name: "dev_requests");

            migrationBuilder.DropTable(
                name: "hosting_plans");
        }
    }
}
