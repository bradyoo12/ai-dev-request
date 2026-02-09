using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCryptoPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CryptoAmount",
                table: "payments",
                type: "numeric(18,8)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CryptoChargeId",
                table: "payments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CryptoCurrency",
                table: "payments",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CryptoTransactionHash",
                table: "payments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExchangeRateUsd",
                table: "payments",
                type: "numeric(18,8)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "payments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CryptoAmount",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "CryptoChargeId",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "CryptoCurrency",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "CryptoTransactionHash",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "ExchangeRateUsd",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "payments");
        }
    }
}
