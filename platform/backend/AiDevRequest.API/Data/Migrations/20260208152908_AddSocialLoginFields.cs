using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSocialLoginFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "AppleId",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CountryCode",
                table: "users",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KakaoId",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LineId",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfileImageUrl",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_AppleId",
                table: "users",
                column: "AppleId");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_AppleId",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_GoogleId",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_KakaoId",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_LineId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "AppleId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "CountryCode",
                table: "users");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "KakaoId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "LineId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ProfileImageUrl",
                table: "users");

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }
    }
}
