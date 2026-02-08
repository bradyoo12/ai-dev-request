using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDomainManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                });

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "domain_transactions");

            migrationBuilder.DropTable(
                name: "domains");
        }
    }
}
