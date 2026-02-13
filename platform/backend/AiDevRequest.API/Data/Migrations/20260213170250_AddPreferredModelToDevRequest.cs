using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPreferredModelToDevRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_support_posts_users_UserId",
                table: "support_posts");

            migrationBuilder.AddColumn<DateTime>(
                name: "RecordedAt",
                table: "UsageMeters",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "PreferredModel",
                table: "dev_requests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DevRequestId",
                table: "container_configs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MemoryGb",
                table: "container_configs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Vcpu",
                table: "container_configs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecordedAt",
                table: "UsageMeters");

            migrationBuilder.DropColumn(
                name: "PreferredModel",
                table: "dev_requests");

            migrationBuilder.DropColumn(
                name: "DevRequestId",
                table: "container_configs");

            migrationBuilder.DropColumn(
                name: "MemoryGb",
                table: "container_configs");

            migrationBuilder.DropColumn(
                name: "Vcpu",
                table: "container_configs");

            migrationBuilder.AddForeignKey(
                name: "FK_support_posts_users_UserId",
                table: "support_posts",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
