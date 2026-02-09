using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamCollaboration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    table.ForeignKey(
                        name: "FK_team_workspaces_users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
                    table.ForeignKey(
                        name: "FK_team_members_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "team_activities");

            migrationBuilder.DropTable(
                name: "team_members");

            migrationBuilder.DropTable(
                name: "team_projects");

            migrationBuilder.DropTable(
                name: "team_workspaces");
        }
    }
}
