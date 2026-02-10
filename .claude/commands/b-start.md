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

Master orchestrator that runs the full automated development pipeline continuously using Claude Agent Teams.

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

This command orchestrates the entire development workflow using Agent Teams for parallelism within each ticket:

```
┌─────────────────────────────────────────────────────────────────┐
│                    b-start (Team Orchestrator)                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Check policy.md & design.md                                  │
│  2. Audit all tickets for alignment                              │
│  3. b-ready team → plan, implement, test, create PR              │
│  4. b-progress → merge PR to main, move to In Review             │
│  5. b-review team → parallel test + verify on staging            │
│  6. b-modernize team → parallel research + create suggestions    │
│  7. Site audit → visit live site, find errors, create tickets    │
│  8. Report status & loop back to step 1                          │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Team Strategy

Teams are used within a single ticket to parallelize independent work:

| Step | Team Name | Agents | Why Parallel |
|------|-----------|--------|-------------|
| b-ready | `ready-<ticket#>` | planner + frontend-dev + backend-dev + tester | Frontend & backend can be implemented simultaneously |
| b-progress | No team | Single operation | Simple merge, no parallelism needed |
| b-review | `review-<ticket#>` | test-runner + ai-verifier | E2E tests and AI verification run independently |
| b-modernize | `modernize` | tech-scout + competitor-scout | Independent web searches |
| site-audit | `site-audit` | error-checker + ux-reviewer | Error checking and UX review run independently |

**Rule: ONE ticket at a time.** Teams work collaboratively on the SAME ticket. Never process multiple tickets simultaneously.

## Main Loop

Execute this workflow in sequence, then loop:

### Step 1: Load Policy and Design Documents

Read and internalize the project guidelines. These are living documents that get updated after each completed ticket (see Step 5e).

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

### Step 3: b-ready — Implement with Agent Team

Implement and locally test ONE Ready ticket using an Agent Team.

#### Step 3a: Claim the Ticket

1. Find the top Ready ticket (no `on hold` label) from the project:
   ```bash
   gh project item-list 26 --owner bradyoo12 --format json --limit 200
   ```
2. Filter for issues with "Ready" status and no `on hold` label
3. If no ticket found, skip to Step 4. **If Steps 3–5 all find no tickets to process** (no Ready, no In Progress with PRs, no In Review), **jump directly to Step 6 (b-modernize)** to use idle time productively researching technologies and competitors.
4. **Immediately move the ticket to "In Progress"** to prevent other instances from picking it up:
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 47fc9ee4
   ```
5. Log: "Claimed ticket #<number> — moved to In Progress"

#### Step 3b: Read and Classify the Ticket

1. Fetch the issue details:
   ```bash
   gh issue view <issue_number> --repo bradyoo12/ai-dev-request
   ```
2. Classify the ticket scope:
   - **Full-stack**: Needs both frontend AND backend changes → use team
   - **Single-scope**: Only frontend OR only backend → use single agent
   - **Simple**: Config, docs, small fix → do directly (no team)

#### Step 3c: Create Team and Execute

**For full-stack tickets — create a team:**

1. Create the team:
   ```
   TeamCreate: ready-<ticket_number>
   ```

2. Create tasks in the team's task list using TaskCreate:
   - Task: "Analyze ticket and create implementation plan"
   - Task: "Create feature branch from main"
   - Task: "Implement frontend changes"
   - Task: "Implement backend changes"
   - Task: "Run full test suite"
   - Task: "Commit, push, and create PR"

3. Spawn the **planner** agent (general-purpose, team_name: ready-<ticket_number>):
   - Reads the ticket, policy.md, and design.md
   - Creates a detailed implementation plan
   - Posts the plan as a comment on the issue
   - Creates the feature branch: `<ticket_number>-<slug>`
   - Assigns frontend and backend tasks to the respective agents
   - Sends message to frontend-dev and backend-dev with their assignments

4. Spawn **frontend-dev** agent (general-purpose, team_name: ready-<ticket_number>):
   - Waits for assignment from planner
   - Implements frontend changes following the plan
   - Reports completion to planner

5. Spawn **backend-dev** agent (general-purpose, team_name: ready-<ticket_number>):
   - Waits for assignment from planner
   - Implements backend changes following the plan
   - Reports completion to planner

6. After frontend-dev and backend-dev complete, spawn **tester** agent (general-purpose, team_name: ready-<ticket_number>):
   - Runs `npm run build` in platform/frontend
   - Runs full Playwright E2E suite: `npm test` in platform/frontend
   - Reports results to planner
   - If tests fail: attempt fixes (up to 3 attempts), then report

7. Planner handles final steps:
   - Commits all changes with "Refs #<ticket_number>"
   - Pushes branch and creates PR
   - Reports success/failure

8. Shut down all agents and delete the team:
   ```
   SendMessage: shutdown_request to each agent
   TeamDelete
   ```

**For single-scope or simple tickets — use single Task agent:**

Spawn a single general-purpose agent via Task tool (no team needed):
- Read ticket, create plan, create branch
- Implement changes
- Run tests
- Commit, push, create PR
- This follows the same workflow as `.claude/agents/b-ready.md`

#### Step 3d: Handle Failures

If the team fails or gets stuck:
1. Shut down all agents in the team
2. Delete the team
3. Add `on hold` label to the ticket
4. Add a comment explaining the failure
5. Checkout main, delete the branch
6. Proceed to Step 4

### Step 4: b-progress — Merge PR (No Team)

Merge PRs to main. This is a simple operation — no team needed.

1. Log "Starting b-progress..."
2. Find "In Progress" tickets with open PRs (no `on hold` label):
   ```bash
   gh project item-list 26 --owner bradyoo12 --format json --limit 200
   gh pr list --repo bradyoo12/ai-dev-request --state open --json number,headRefName,url
   ```
3. Verify PR is mergeable:
   ```bash
   gh pr view <pr_number> --repo bradyoo12/ai-dev-request --json mergeable,mergeStateStatus
   ```
4. Merge:
   ```bash
   gh pr merge <pr_number> --repo bradyoo12/ai-dev-request --merge --delete-branch
   ```
5. Move ticket to "In Review":
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id df73e18b
   ```
6. **Add a detailed "How to Test" comment** with staging URL and step-by-step instructions
7. Cleanup: `git checkout main && git pull`

### Step 5: b-review — Verify with Agent Team

Verify changes on staging using parallel agents.

#### Step 5a: Find Eligible Ticket

1. Get "In Review" tickets without `on hold` label
2. If none found, skip to Step 6

#### Step 5b: Create Review Team

1. Create the team:
   ```
   TeamCreate: review-<ticket_number>
   ```

2. Pull latest and install deps:
   ```bash
   git checkout main && git pull
   cd platform/frontend && npm install
   ```

3. Spawn **test-runner** agent (general-purpose, team_name: review-<ticket_number>):
   - Installs Playwright: `npx playwright install chromium`
   - Runs FULL Playwright E2E suite against staging: `npm run test:staging`
   - Reports pass/fail results with details

4. Spawn **ai-verifier** agent (general-purpose, team_name: review-<ticket_number>) IN PARALLEL:
   - Reads the ticket requirements
   - Reads the "How to Test" comment
   - Uses WebFetch to verify staging URL is accessible
   - Performs AI-simulated human testing
   - Checks for console errors, performance, visual correctness
   - Reports verification results

5. Wait for both agents to complete and collect results

#### Step 5c: Handle Results

**If BOTH pass:**
- Move to "Done":
  ```bash
  gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 98236657
  ```
- Close the issue:
  ```bash
  gh issue close <issue_number> --repo bradyoo12/ai-dev-request --reason completed
  ```
- Add completion comment
- **Update policy.md and design.md** to reflect the completed changes (see Step 5e)

**If EITHER fails:**
- Add failure comment with details from both agents
- Add `on hold` label

#### Step 5d: Cleanup

Shut down all agents, delete the team.

#### Step 5e: Update Policy and Design Documents

**Only runs when a ticket was moved to Done in Step 5c.**

After a ticket is verified and completed, update the project documentation to reflect the changes:

1. **Read the completed ticket** to understand what was implemented:
   ```bash
   gh issue view <issue_number> --repo bradyoo12/ai-dev-request
   ```

2. **Read the merged PR** to understand the actual code changes:
   ```bash
   gh pr list --repo bradyoo12/ai-dev-request --state merged --search "<issue_number>" --json number,title,body,files --limit 5
   ```

3. **Update `.claude/design.md`** if the ticket introduced:
   - New components, pages, or routes
   - New API endpoints or backend services
   - New database tables or schema changes
   - Changes to the architecture or data flow
   - New integrations or third-party services
   - Updated tech stack or dependencies

4. **Update `.claude/policy.md`** if the ticket introduced:
   - New development rules or conventions
   - Changes to the build/test/deploy process
   - New environment variables or configuration requirements
   - Updated quality standards or review criteria
   - New labels, workflows, or ticket management changes

5. **How to update:**
   - Read the current file
   - Identify the relevant section(s) to update
   - Make minimal, targeted edits — only add/change what the completed ticket affects
   - Do NOT remove existing content unless it is now incorrect
   - Do NOT rewrite entire sections — surgical updates only

6. **Commit and push the documentation updates:**
   ```bash
   git add .claude/policy.md .claude/design.md
   git commit -m "docs: update policy and design docs after completing #<issue_number>"
   git push origin main
   ```

7. If neither file needs updating (e.g., the ticket was a minor bug fix with no architectural impact), skip this step and log: "No doc updates needed for #<issue_number>"

### Step 6: b-modernize — Research with Agent Team

Search for recent technologies and create suggestion tickets using parallel researchers.

**This step also runs as an idle fallback:** If Steps 3–5 all found no tickets to process (no Ready tickets, no In Progress PRs to merge, no In Review tickets to verify), b-modernize runs automatically so the pipeline stays productive instead of looping empty cycles.

#### Step 6a: Pre-check

1. Check existing open suggestion tickets:
   ```bash
   gh issue list --repo bradyoo12/ai-dev-request --state open --label suggestion --json number,title --limit 50
   ```
2. If 4+ suggestion tickets exist in Backlog, skip b-modernize entirely

#### Step 6b: Create Research Team

1. Create the team:
   ```
   TeamCreate: modernize
   ```

2. Spawn **tech-scout** agent (general-purpose, team_name: modernize):
   - Searches for recent technologies: AI code generation, agent frameworks, .NET innovations, React ecosystem, DevOps tools
   - Evaluates relevance, effort, and impact scores
   - Reports top findings with scores

3. Spawn **competitor-scout** agent (general-purpose, team_name: modernize) IN PARALLEL:
   - Researches competitor features: Replit, Base44, Bolt.new, v0.dev, Cursor
   - Evaluates differentiation, user value, feasibility
   - Reports top findings with scores

4. Wait for both scouts to complete

#### Step 6c: Create Tickets

After collecting findings from both scouts:
1. Filter for qualifying technologies (relevance >= 3, impact >= 3, effort <= 4)
2. Deduplicate against existing tickets
3. Create max 3 suggestion tickets:
   ```bash
   gh issue create --repo bradyoo12/ai-dev-request --title "{title}" --body "{body}" --label "suggestion"
   gh project item-add 26 --owner bradyoo12 --url {issue_url}
   ```
4. Do NOT set any status — leave for human triage

#### Step 6d: Cleanup

Shut down all agents, delete the team.

### Step 7: Site Audit — Find Errors and Improvements

After modernization research, audit the live site to catch errors, bugs, and UX improvements.

#### Step 7a: Pre-check

1. Check existing open bug/improvement tickets to avoid duplicates:
   ```bash
   gh issue list --repo bradyoo12/ai-dev-request --state open --json number,title,labels --limit 200
   ```
2. Note all existing titles for dedup

#### Step 7b: Create Audit Team

1. Create the team:
   ```
   TeamCreate: site-audit
   ```

2. Spawn **error-checker** agent (general-purpose, team_name: site-audit):
   - Use WebFetch to visit `https://icy-desert-07c08ba00.2.azurestaticapps.net/`
   - Check for:
     - HTTP errors (4xx, 5xx responses)
     - Broken links or missing assets
     - JavaScript console errors visible in the page
     - API endpoint failures (check network requests if visible)
     - Missing or broken images
     - Empty states that should have content
   - Navigate to all discoverable pages/routes from the main page
   - Report all errors found with severity (critical/major/minor)

3. Spawn **ux-reviewer** agent (general-purpose, team_name: site-audit) IN PARALLEL:
   - Use WebFetch to visit `https://icy-desert-07c08ba00.2.azurestaticapps.net/`
   - Read `.claude/design.md` to understand the intended UX
   - Evaluate:
     - **Visual polish**: Layout issues, spacing, alignment, color consistency
     - **Navigation**: Is it intuitive? Are there dead ends?
     - **Responsiveness**: Does the layout suggest mobile-friendliness?
     - **Accessibility**: Missing alt text, contrast issues, keyboard navigation hints
     - **Content**: Typos, placeholder text left in, unclear labels
     - **Performance**: Slow-loading elements, large unoptimized assets
     - **Missing features**: Compare against design.md — what's described but not implemented?
   - Report all findings with impact score (1-5) and suggested improvement

4. Wait for both agents to complete and collect results

#### Step 7c: Create Tickets

After collecting findings from both agents:

1. Filter findings:
   - **Errors** (from error-checker): Create tickets for all critical and major errors
   - **Improvements** (from ux-reviewer): Create tickets for findings with impact >= 3
2. Deduplicate against existing open tickets
3. Create max 5 tickets per cycle:
   ```bash
   gh issue create --repo bradyoo12/ai-dev-request --title "{title}" --body "{body}" --label "bug"
   ```
   - Use label `bug` for errors found by error-checker
   - Use label `enhancement` for improvements found by ux-reviewer
4. Add tickets to the project:
   ```bash
   gh project item-add 26 --owner bradyoo12 --url {issue_url}
   ```
5. Set status to **Backlog** — leave for human triage or next b-start cycle to pick up

#### Step 7d: Cleanup

Shut down all agents, delete the team.

### Step 8: Report Cycle Status

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

### Step 9: Loop
1. Log "Waiting 5 seconds before next cycle..."
2. Wait 5 seconds
3. Go back to Step 1

## Ticket Flow Summary

```
┌──────────┐  b-ready team  ┌─────────────┐  b-progress  ┌───────────┐  b-review team  ┌──────┐
│  Ready   │ ────────────→ │ In Progress │ ──────────→ │ In Review │ ──────────────→ │ Done │
└──────────┘                └─────────────┘              └───────────┘                └──────┘
             (team: plan,        (merge PR,          (team: test-runner
              implement,          deploy to           + ai-verifier)
              test, PR)           staging)
     │                │                          │
     └── on hold ─────┴── on hold (test fail) ───┘
          (needs human attention)
```

## Agent Team Lifecycle

```
1. TeamCreate("ready-123")           → Creates team + task list
2. Task(team_name: "ready-123")      → Spawns agents into the team
3. SendMessage(type: "message")      → Agents coordinate via messages
4. TaskUpdate(status: "completed")   → Agents mark tasks done
5. SendMessage(type: "shutdown_request") → Orchestrator shuts down agents
6. TeamDelete()                      → Cleans up team resources
```

**IMPORTANT:** Always shut down agents and delete teams before moving to the next step. Stale teams waste resources.

## Label Meanings

| Label | Meaning |
|-------|---------|
| `on hold` | Requires human attention - do not auto-process |

## Important Notes

- **This command runs in an infinite loop** - orchestrates all agents until Ctrl+C
- **ONLY processes tickets in Project 26 (AI Dev Request)** - ignores tickets in other projects
- **ONE ticket at a time** - teams parallelize WITHIN a ticket, not across tickets
- Teams are created and destroyed per-step — no long-lived teams
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
