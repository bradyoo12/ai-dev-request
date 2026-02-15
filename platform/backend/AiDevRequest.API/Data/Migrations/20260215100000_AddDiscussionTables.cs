using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiDevRequest.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDiscussionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS discussions (
                    "Id" uuid NOT NULL,
                    "DevRequestId" uuid,
                    "UserId" character varying(100) NOT NULL,
                    "Title" character varying(200) NOT NULL DEFAULT '',
                    "Status" character varying(20) NOT NULL DEFAULT 'active',
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_discussions" PRIMARY KEY ("Id")
                );

                CREATE INDEX IF NOT EXISTS "IX_discussions_UserId" ON discussions ("UserId");
                CREATE INDEX IF NOT EXISTS "IX_discussions_DevRequestId" ON discussions ("DevRequestId");
                CREATE INDEX IF NOT EXISTS "IX_discussions_Status" ON discussions ("Status");

                CREATE TABLE IF NOT EXISTS discussion_messages (
                    "Id" uuid NOT NULL,
                    "DiscussionId" uuid NOT NULL,
                    "Role" character varying(20) NOT NULL DEFAULT 'user',
                    "Content" text NOT NULL DEFAULT '',
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_discussion_messages" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_discussion_messages_discussions" FOREIGN KEY ("DiscussionId") REFERENCES discussions ("Id") ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS "IX_discussion_messages_DiscussionId" ON discussion_messages ("DiscussionId");
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS discussion_messages;
                DROP TABLE IF EXISTS discussions;
            """);
        }
    }
}
