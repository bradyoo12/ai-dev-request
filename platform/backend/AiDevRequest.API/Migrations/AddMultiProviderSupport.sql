-- Manual Migration Script for Multi-Provider AI Model Support (Ticket #384)
-- This migration adds support for multiple AI providers (Claude + Gemini)
--
-- REASON FOR MANUAL MIGRATION:
-- EF Core migration generation is blocked by a pre-existing schema issue:
-- DevelopmentSpec table has foreign key type mismatch (int -> Guid)
-- This issue is unrelated to ticket #384 and should be fixed separately.
--
-- APPLY THIS SCRIPT MANUALLY when the DbContext schema issue is resolved.

BEGIN TRANSACTION;

-- 1. Add PreferredProvider column to AiModelConfigs table
ALTER TABLE "AiModelConfigs"
ADD COLUMN "PreferredProvider" VARCHAR(50) NULL;

COMMENT ON COLUMN "AiModelConfigs"."PreferredProvider" IS 'Preferred AI provider: "claude" | "gemini" | null (auto-select)';

-- 2. Increase SelectedModel column max length to support "provider:model" format
ALTER TABLE "AiModelConfigs"
ALTER COLUMN "SelectedModel" TYPE VARCHAR(100);

COMMENT ON COLUMN "AiModelConfigs"."SelectedModel" IS 'Selected AI model in "provider:model" format (e.g., "claude:sonnet-4-5", "gemini:1.5-pro"). Legacy format without provider prefix is also supported.';

-- 3. Migrate existing data to new "provider:model" format
-- This assumes all existing models are Claude models (legacy format)
UPDATE "AiModelConfigs"
SET "SelectedModel" = 'claude:' || "SelectedModel"
WHERE "SelectedModel" NOT LIKE '%:%';

-- 4. Update default value for new rows (handled by entity configuration)
-- Default: "claude:claude-sonnet-4-5-20250929"

COMMIT TRANSACTION;

-- VERIFICATION QUERIES:
-- Run these after applying the migration to verify success

-- Check column exists and has correct type
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'AiModelConfigs'
AND column_name IN ('SelectedModel', 'PreferredProvider');

-- Verify data migration
SELECT "Id", "SelectedModel", "PreferredProvider"
FROM "AiModelConfigs"
LIMIT 10;

-- Check for any records that still have old format (should be 0)
SELECT COUNT(*) as "OldFormatCount"
FROM "AiModelConfigs"
WHERE "SelectedModel" NOT LIKE '%:%';
