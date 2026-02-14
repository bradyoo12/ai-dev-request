using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackRewardFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF NOT EXISTS to handle partial migration state
            migrationBuilder.Sql("""
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'support_posts' AND column_name = 'FeedbackType'
                    ) THEN
                        ALTER TABLE support_posts ADD COLUMN "FeedbackType" character varying(50) NULL;
                    END IF;
                END $$;
                """);

            migrationBuilder.Sql("""
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'support_posts' AND column_name = 'RewardMessage'
                    ) THEN
                        ALTER TABLE support_posts ADD COLUMN "RewardMessage" character varying(1000) NULL;
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FeedbackType",
                table: "support_posts");

            migrationBuilder.DropColumn(
                name: "RewardMessage",
                table: "support_posts");
        }
    }
}
