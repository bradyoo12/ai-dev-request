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
                });

            migrationBuilder.CreateTable(
                name: "dev_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: false),
                    ContactEmail = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Complexity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AnalysisResultJson = table.Column<string>(type: "jsonb", nullable: true),
                    ProposalJson = table.Column<string>(type: "jsonb", nullable: true),
                    ProjectId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ProjectPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
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
                name: "payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StripeCheckoutSessionId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
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
                    TokensUsed = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refinement_messages", x => x.Id);
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
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AnonymousUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
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

            migrationBuilder.CreateIndex(
                name: "IX_auto_topup_configs_UserId",
                table: "auto_topup_configs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_build_verifications_DevRequestId",
                table: "build_verifications",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_deployments_DevRequestId",
                table: "deployments",
                column: "DevRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_deployments_Status",
                table: "deployments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_deployments_UserId",
                table: "deployments",
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
                name: "IX_hosting_plans_Name",
                table: "hosting_plans",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_languages_Code",
                table: "languages",
                column: "Code",
                unique: true);

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
                name: "IX_payments_UserId",
                table: "payments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_refinement_messages_CreatedAt",
                table: "refinement_messages",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_refinement_messages_DevRequestId",
                table: "refinement_messages",
                column: "DevRequestId");

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
                name: "IX_users_AnonymousUserId",
                table: "users",
                column: "AnonymousUserId");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auto_topup_configs");

            migrationBuilder.DropTable(
                name: "build_verifications");

            migrationBuilder.DropTable(
                name: "deployments");

            migrationBuilder.DropTable(
                name: "dev_requests");

            migrationBuilder.DropTable(
                name: "hosting_plans");

            migrationBuilder.DropTable(
                name: "languages");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "refinement_messages");

            migrationBuilder.DropTable(
                name: "token_balances");

            migrationBuilder.DropTable(
                name: "token_packages");

            migrationBuilder.DropTable(
                name: "token_pricing");

            migrationBuilder.DropTable(
                name: "token_transactions");

            migrationBuilder.DropTable(
                name: "translations");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
