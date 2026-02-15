-- Migration: AddMessages
-- Ticket: #764 - In-app messaging between users
-- Creates the Messages table for user-to-user messaging

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "Messages" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "SenderId" character varying(100) NOT NULL,
    "ReceiverId" character varying(100) NOT NULL,
    "Content" character varying(5000) NOT NULL,
    "IsRead" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "ReadAt" timestamp with time zone NULL,
    CONSTRAINT "PK_Messages" PRIMARY KEY ("Id")
);

-- Indexes for efficient message queries
CREATE INDEX IF NOT EXISTS "IX_Messages_SenderId" ON "Messages" ("SenderId");
CREATE INDEX IF NOT EXISTS "IX_Messages_ReceiverId" ON "Messages" ("ReceiverId");
CREATE INDEX IF NOT EXISTS "IX_Messages_ReceiverId_IsRead" ON "Messages" ("ReceiverId", "IsRead") WHERE "IsRead" = false;
CREATE INDEX IF NOT EXISTS "IX_Messages_CreatedAt" ON "Messages" ("CreatedAt" DESC);

COMMIT TRANSACTION;
