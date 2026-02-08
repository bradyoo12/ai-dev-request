---
description: Master orchestrator that runs the full automated development pipeline continuously.
allowed-prompts:
  - tool: Bash
    prompt: run gh commands for GitHub operations
  - tool: Bash
    prompt: run git commands
  - tool: Bash
    prompt: run echo commands
---

Master orchestrator that runs the full automated development pipeline continuously.

## Usage
`/b-start`

## Project Configuration

Project settings are defined in `.claude/policy.md` under "Project Settings" section.

**IMPORTANT:** This orchestrator ONLY processes tickets from the GitHub Project defined in policy.md (Project 26 - AI Dev Request). Use `gh project item-list <PROJECT_ID> --owner <OWNER>` to fetch tickets.

## Prerequisites (MUST RUN FIRST)

**Before starting the pipeline, ensure the correct GitHub account is active:**

```bash
gh auth switch -u bradyoo12
```

## Overview

This command orchestrates the entire development workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                        b-start (Orchestrator)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Check policy.md & design.md                                  │
│  2. Audit all tickets for alignment                              │
│  3. Run b-ready → implements, local tests & creates PR           │
│  4. Run b-progress → merges PR to main, moves to In Review       │
│  5. Run b-review → tests on staging, moves to Done or on hold    │
│  6. Run b-modernize → web search for new tech, create suggestions │
│  7. Report status & loop back to step 1                          │
└─────────────────────────────────────────────────────────────────┘
```

## Main Loop

Execute this workflow in sequence, then loop:

### Step 1: Load Policy and Design Documents

Read and internalize the project guidelines:

1. **Read Policy** (`.claude/policy.md`):
   - Understand ticket management rules
   - Know when to add `on hold` label
   - Learn blocking scenarios
   - Understand code quality requirements

2. **Read Design** (`.claude/design.md`):
   - Understand overall architecture
   - Know system components
   - Understand data flow
   - Learn technology stack

### Step 2: Audit All Tickets for Alignment

Check all tickets in the project to ensure they align with policy and design:

1. Get all items from the project:
   ```bash
   gh project item-list 26 --owner bradyoo12 --format json --limit 200
   ```

2. For each ticket in the project (filter by `type: "Issue"`):
   - Analyze if the ticket aligns with `.claude/policy.md` rules
   - Analyze if the ticket aligns with `.claude/design.md` architecture
   - Check for conflicts or inconsistencies

3. **If a ticket is OUT OF ALIGNMENT, classify the block:**

   **Hard Block** (needs human action) → add `on hold` label:
   - Security concerns, production-critical changes, unclear requirements, repeated test failures
   - Add `on hold` label:
     ```bash
     gh issue edit <issue_number> --repo bradyoo12/ai-dev-request --add-label "on hold"
     ```
   - Add a comment explaining the concern

   **Soft Block** (prerequisites not yet met) → skip WITHOUT labeling:
   - Prerequisite PRs not yet merged, dependent tickets incomplete, blocked by in-progress work
   - Do NOT add `on hold` label — just skip the ticket this cycle
   - Log: "Skipping #<number>: <reason> — will retry next cycle"

4. Log summary of audit results

### Step 3: Run b-ready Agent

Implement and locally test Ready tickets:

1. Log "Starting b-ready agent..."

2. **Claim the ticket BEFORE delegating to b-ready (prevents race conditions):**
   - Find the top Ready ticket (no `on hold` label) from the project:
     ```bash
     gh project item-list 26 --owner bradyoo12 --format json --limit 200
     ```
   - Filter for issues with "Ready" status and no `on hold` label
   - If no ticket found, skip to Step 4
   - **Immediately move the ticket to "In Progress"** to prevent other Claude Code instances from picking it up:
     ```bash
     gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 47fc9ee4
     ```
   - Log: "Claimed ticket #<number> — moved to In Progress"

3. **Pass the claimed ticket number to b-ready** so it skips auto-discovery:
   - Execute the b-ready workflow with the specific ticket: `/b-ready <issue_number>`
   - b-ready will skip its own Step 1 (auto-discover) and Step 2 (move to In Progress) since both are already done
   - Create branch from main (branch name starts with ticket number)
   - Implement the ticket
   - Run local tests (unit tests + Playwright)
   - If problem: add `on hold` label, move to next ticket
   - If success: create PR (ticket stays "In Progress")

4. Process ONE ticket, then proceed to Step 4

### Step 4: Run b-progress Agent

Merge PRs to main and deploy to staging:

1. Log "Starting b-progress agent..."
2. Execute the b-progress workflow (refer to `.claude/agents/b-progress.md`):
   - Find "In Progress" tickets with open PRs (no `on hold` label)
   - Verify PR is mergeable
   - Merge PR to main, delete branch
   - Move ticket to "In Review" (now on staging)
   - **CRITICAL: Add a detailed "How to Test" comment**

3. Process ONE ticket, then proceed to Step 5

### Step 5: Run b-review Agent (Staging Verification)

Verify changes on staging:

1. Log "Starting b-review agent..."
2. Execute the b-review workflow (refer to `.claude/commands/b-review.md`):
   - Find tickets in "In Review" WITHOUT `on hold` label
   - Run Playwright tests and all available tools against staging
   - If tests PASS: set project status to "Done", close issue
   - If tests FAIL: add comment explaining failure + add `on hold` label

3. Process ONE ticket, then proceed to Step 6

### Step 6: Run b-modernize Agent (Technology Scout)

Search for recent technologies and create suggestion tickets:

1. Log "Starting b-modernize agent..."
2. Execute the b-modernize workflow (refer to `.claude/commands/b-modernize.md`):
   - Web search for recent technologies relevant to the platform
   - Evaluate relevance, impact, and effort scores
   - Create suggestion tickets for qualifying technologies (max 3 per cycle)
   - Add tickets to project board with NO status (human triage required)

3. Proceed to Step 7

### Step 7: Report Cycle Status

Log the current status of the project board:

1. Get counts for each status:
   ```bash
   gh project item-list 26 --owner bradyoo12 --format json --limit 200
   ```

2. Report:
   - Ready count (excluding `on hold`)
   - In Progress count (with and without open PRs)
   - In Review count (with and without `on hold`)
   - Done count
   - Tickets with `on hold` label
   - Backlog tickets awaiting triage

### Step 8: Loop
1. Log "Waiting 5 seconds before next cycle..."
2. Wait 5 seconds
3. Go back to Step 1

## Ticket Flow Summary

```
┌──────────┐   b-ready    ┌─────────────┐  b-progress   ┌───────────┐  b-review   ┌──────┐
│  Ready   │ ──────────→ │ In Progress │ ───────────→ │ In Review │ ─────────→ │ Done │
└──────────┘              └─────────────┘              └───────────┘             └──────┘
                          (implement,          (merge PR,          (test on staging,
                           local tests,         deploy to           close issue)
                           create PR)           staging)
     │                          │                            │
     └─── on hold ──────────────┴─── on hold (test fail) ────┘
           (needs human attention)
```

## Label Meanings

| Label | Meaning |
|-------|---------|
| `on hold` | Requires human attention - do not auto-process |

## Important Notes

- **This command runs in an infinite loop** - orchestrates all agents until Ctrl+C
- **ONLY processes tickets in Project 26 (AI Dev Request)** - ignores tickets in other projects
- Each agent processes ONE ticket per cycle to maintain balance
- 5-second delay between full cycles to avoid API rate limiting
- Always check policy.md and design.md at the start of each cycle
- Tickets out of alignment get `on hold` label automatically
- Human removes `on hold` label to signal approval/readiness

## Self-Update Protocol (MANDATORY)

**After EVERY run** of this command, update this file:

### When to Update
- After encountering an error that took multiple attempts to resolve
- After discovering a missing prerequisite or undocumented dependency
- After finding a workaround for an environment or tooling issue
- After a successful run if you noticed something that could be improved

### How to Update
1. Append a new entry to the `## Lessons Learned` section below
2. Use this format:
   ```
   ### [YYYY-MM-DD] <Short Title>
   - **Problem**: What went wrong or was time-consuming
   - **Solution**: What fixed it or the workaround used
   - **Prevention**: What to do differently next time
   ```

---

## Lessons Learned

### [2026-02-07] Azure App Service auto-disables after startup crashes
- **Problem**: After deploying a backend change that caused the .NET app to crash on startup (migration bootstrap logic tried to INSERT into nonexistent `__EFMigrationsHistory` table), Azure auto-disabled the App Service entirely. Subsequent deployments then fail with "Site Disabled (CODE: 403)" and cannot deploy the fix.
- **Solution**: The code fix (ensure `__EFMigrationsHistory` table exists before INSERT, and don't crash on migration failure) was merged to main. However, someone with Azure portal access must manually re-enable the App Service before the fix can be deployed.
- **Prevention**: Always ensure migration bootstrap logic handles missing tables gracefully. Never let migration failures crash the application startup — log and continue so the app remains accessible for diagnostics. Consider adding a health check endpoint that works even when migrations fail.

### [2026-02-07] EnsureCreatedAsync vs MigrateAsync for existing databases
- **Problem**: The original code used `EnsureCreatedAsync()` which only creates a new database from scratch and cannot apply incremental schema changes. When new entities were added, the staging database (which already existed) never got the new tables, causing 500 errors on all database-dependent endpoints.
- **Solution**: Replaced with `MigrateAsync()` plus EF Core migrations. Added bootstrap logic to detect legacy databases (created by `EnsureCreatedAsync`) and insert the initial migration record so `MigrateAsync()` doesn't try to re-create existing tables.
- **Prevention**: Always use EF Core migrations from the start. Never use `EnsureCreatedAsync()` in any environment beyond initial prototyping.

### [2026-02-07] Duplicate tickets (#41 and #43) addressing same issue
- **Problem**: Tickets #41 and #43 both described the same staging 500 error from different angles. Both were in Ready status.
- **Solution**: Treated #41 as the primary ticket (migration fix) and #43 as a follow-up (startup crash fix + error handling). Both ended up being processed sequentially.
- **Prevention**: During audit, identify duplicates early and close/merge them before entering the b-ready phase.

### [2026-02-07] Azure App Service Free tier (F1) quota exceeded blocks all deployments
- **Problem**: The Free F1 App Service Plan has a 60 CPU-minutes/day quota. Repeated startup crashes burned through the quota, causing "QuotaExceeded" state and 403 "Site Disabled" on all deployment attempts. Quota resets at midnight UTC (~19 hours away).
- **Solution**: Scaled the App Service Plan from F1 (Free) to B1 (Basic, ~$13/month) using `az appservice plan update --sku B1`. This immediately lifted the quota restriction.
- **Prevention**: Use at least B1 tier for staging environments. F1 is only suitable for static sites or minimal testing.

### [2026-02-07] No database configured for Azure deployment
- **Problem**: The backend had no database connection string configured in Azure App Settings. It fell back to `Host=localhost` which doesn't work on Azure. The error handling in controllers returned default/empty data, masking the real issue (no database).
- **Solution**: Created an `ai_dev_request` database on the existing `db-bradyoo-staging` PostgreSQL Flexible Server. Configured the connection string via Azure REST API (to avoid bash escaping issues with special characters in the password).
- **Prevention**: Always verify database infrastructure exists BEFORE deploying a new service. Add connection string configuration to the deployment workflow or IaC. Consider adding a startup check that logs a clear warning if the database is unreachable.

### [2026-02-07] Bash escaping mangles special characters in Azure CLI settings
- **Problem**: Setting ConnectionStrings__DefaultConnection via "az webapp config appsettings set" mangled the password — the "!" character was escaped to "\!" by bash history expansion, even with single quotes.
- **Solution**: Used `az rest --method PUT --body @file.json` with the connection string in a JSON file to bypass all shell escaping.
- **Prevention**: For Azure App Settings containing special characters, always use `az rest` with a JSON body file instead of `az webapp config appsettings set`.
