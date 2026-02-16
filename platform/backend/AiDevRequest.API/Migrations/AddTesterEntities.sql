-- Migration: AddTesterEntities
-- Ticket: #822 - Beta tester recruitment page with contribution-based credit rewards
-- Creates TesterApplications, TesterProfiles, and TesterContributions tables

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "tester_applications" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "UserId" character varying(100) NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Email" character varying(255) NOT NULL,
    "Motivation" character varying(5000) NOT NULL,
    "ExperienceLevel" character varying(50) NOT NULL DEFAULT 'Beginner',
    "InterestedAreas" character varying(500) NULL,
    "Status" character varying(50) NOT NULL DEFAULT 'pending',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_tester_applications" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_tester_applications_UserId" ON "tester_applications" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_tester_applications_Status" ON "tester_applications" ("Status");

CREATE TABLE IF NOT EXISTS "tester_profiles" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "UserId" character varying(100) NOT NULL,
    "Tier" character varying(50) NOT NULL DEFAULT 'Bronze',
    "ContributionPoints" integer NOT NULL DEFAULT 0,
    "TotalCreditsEarned" integer NOT NULL DEFAULT 0,
    "BugsFound" integer NOT NULL DEFAULT 0,
    "ReviewsWritten" integer NOT NULL DEFAULT 0,
    "TestsCompleted" integer NOT NULL DEFAULT 0,
    "JoinedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_tester_profiles" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_tester_profiles_UserId" ON "tester_profiles" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_tester_profiles_ContributionPoints" ON "tester_profiles" ("ContributionPoints" DESC);

CREATE TABLE IF NOT EXISTS "tester_contributions" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "TesterProfileId" uuid NOT NULL,
    "Type" character varying(50) NOT NULL,
    "Description" character varying(2000) NOT NULL,
    "PointsAwarded" integer NOT NULL DEFAULT 0,
    "CreditsAwarded" integer NOT NULL DEFAULT 0,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_tester_contributions" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_tester_contributions_TesterProfileId" ON "tester_contributions" ("TesterProfileId");
CREATE INDEX IF NOT EXISTS "IX_tester_contributions_CreatedAt" ON "tester_contributions" ("CreatedAt" DESC);

COMMIT TRANSACTION;
