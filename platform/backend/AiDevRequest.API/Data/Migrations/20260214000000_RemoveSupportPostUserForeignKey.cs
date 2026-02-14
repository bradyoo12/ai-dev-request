using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSupportPostUserForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the foreign key constraint on support_posts.user_id (if it exists)
            migrationBuilder.Sql("""
                DO $$ BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'fk_support_posts_users_user_id'
                          AND table_name = 'support_posts'
                    ) THEN
                        ALTER TABLE support_posts DROP CONSTRAINT fk_support_posts_users_user_id;
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Re-add the foreign key constraint
            migrationBuilder.AddForeignKey(
                name: "fk_support_posts_users_user_id",
                table: "support_posts",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
