using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFrameworkToDevRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Framework",
                table: "dev_requests",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Framework",
                table: "dev_requests");
        }
    }
}
