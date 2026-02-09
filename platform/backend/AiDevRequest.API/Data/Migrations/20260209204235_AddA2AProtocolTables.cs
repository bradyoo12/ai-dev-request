using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddA2AProtocolTables : Migration
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
                    table.ForeignKey(
                        name: "FK_a2a_agent_cards_users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
                    table.ForeignKey(
                        name: "FK_a2a_consents_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
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
                    table.ForeignKey(
                        name: "FK_a2a_tasks_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
                name: "a2a_tasks");

            migrationBuilder.DropTable(
                name: "a2a_agent_cards");
        }
    }
}
