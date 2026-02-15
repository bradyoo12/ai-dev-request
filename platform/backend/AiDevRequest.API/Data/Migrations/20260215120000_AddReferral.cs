using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReferral : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS referrals (
                    "Id" uuid NOT NULL,
                    "ReferrerId" character varying(100) NOT NULL,
                    "ReferredUserId" character varying(100),
                    "ReferralCode" character varying(50) NOT NULL,
                    "Status" character varying(20) NOT NULL,
                    "SignupCreditAmount" integer NOT NULL DEFAULT 50,
                    "PaymentBonusPercent" numeric(5,2) NOT NULL DEFAULT 10.00,
                    "TotalCreditsEarned" integer NOT NULL DEFAULT 0,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "SignedUpAt" timestamp with time zone,
                    "ConvertedAt" timestamp with time zone,
                    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_referrals" PRIMARY KEY ("Id")
                );

                CREATE UNIQUE INDEX IF NOT EXISTS "IX_referrals_ReferralCode" ON referrals ("ReferralCode");
                CREATE INDEX IF NOT EXISTS "IX_referrals_ReferrerId" ON referrals ("ReferrerId");
                CREATE INDEX IF NOT EXISTS "IX_referrals_ReferredUserId" ON referrals ("ReferredUserId");
                CREATE INDEX IF NOT EXISTS "IX_referrals_Status" ON referrals ("Status");
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS referrals;");
        }
    }
}
