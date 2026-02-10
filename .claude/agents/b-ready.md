Automated development workflow that picks up the top Ready ticket from the project board and implements it end-to-end. Supports both standalone mode and team mode (when spawned by b-start).

## Usage
`/b-ready`
`/b-ready 123 456`
`/b-ready https://github.com/bradyoo12/ai-dev-request/issues/123`

## Default Project
https://github.com/users/bradyoo12/projects/26/views/1

## Prerequisites (MUST RUN FIRST)

**Before any ticket processing, ensure the correct GitHub account is active:**

```bash
gh auth switch -u bradyoo12
```

## Pre-Flight Check

**Before processing any ticket, read and verify alignment with:**
1. `.claude/policy.md` - Ensure workflow follows policy rules
2. `.claude/design.md` - Ensure implementation aligns with architecture

## Operating Modes

### Standalone Mode (invoked directly via `/b-ready`)
Runs the full workflow end-to-end: discover ticket → implement → test → PR → loop.

### Team Mode (spawned by b-start orchestrator)
When spawned as part of an Agent Team by b-start:
- The orchestrator has already claimed the ticket and moved it to "In Progress"
- The ticket number is passed as an argument
- Skip auto-discovery (Step 1) and status change (Step 2)
- You may be one of several agents in a team (e.g., planner, frontend-dev, backend-dev, tester)
- Coordinate with teammates via SendMessage
- Report completion/failure back to the team lead via SendMessage

**How to detect team mode:** If you were spawned via Task tool with a `team_name` parameter, you are in team mode. Check for teammates by reading the team config at `~/.claude/teams/<team_name>/config.json`.

## Input Detection (MUST CHECK IN THIS ORDER)

### 1. Check for Ticket Number/URL Arguments

If ticket numbers or URLs are provided as arguments:

1. Parse the ticket numbers/URLs from arguments
2. **Build a queue** of tickets in the order provided
3. Skip the auto-discovery in Step 1 and proceed directly to Step 2
4. After completing each ticket, move to the next in the queue

### 2. No Input Provided → Auto-Discover Tickets

If NO ticket numbers or URLs are provided:

**Automatically discover tickets with "Ready" status from project 26.**

**IMPORTANT: Skip tickets that have the `on hold` label.**

## Loop Behavior (Standalone Mode Only)
This workflow runs in an infinite loop with 5-second intervals:
1. Execute the workflow (Steps 1-10)
2. After completing one ticket, wait 5 seconds
3. Start again from Step 1
4. Continue until manually stopped (Ctrl+C) or queue is exhausted

In team mode, process the assigned ticket and report back — do NOT loop.

## Workflow

### Step 1: Get Top Ready Ticket from Project Board

**Skip this step if ticket numbers were provided as arguments or in team mode.**

```bash
gh project item-list 26 --owner bradyoo12 --format json --limit 200
```

Filter to issues with "Ready" status and no `on hold` label. If none found, wait 5 seconds and retry.

### Step 2: Move Ticket to In Progress

**Skip this step if the ticket was passed from b-start** (already moved to "In Progress" by the orchestrator).

Only run this if b-ready auto-discovered the ticket in Step 1:

```bash
gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 47fc9ee4
```

### Step 3: Read Ticket and Create Plan
1. Fetch the issue details:
   ```bash
   gh issue view <issue_number> --repo bradyoo12/ai-dev-request
   ```
2. Analyze the issue requirements
3. Check alignment with `.claude/policy.md` and `.claude/design.md`
4. Create a detailed implementation plan
5. Add the plan as a comment to the issue

**In team mode:** If you are the planner agent, share the plan with teammates via SendMessage so they know what to implement.

### Step 4: Create Feature Branch
1. Ensure you're on main and up to date:
   ```bash
   git checkout main && git pull
   ```
2. Create branch: `<issue_number>-<issue_title_slug>`
   ```bash
   git checkout -b <branch_name>
   ```

**In team mode:** The planner should create the branch. Other agents should check out the same branch before starting work.

### Step 5: Implement the Plan
1. Make all necessary code changes
2. Follow existing project patterns
3. Write clean, well-documented code

**In team mode:** If you are a specialized agent (frontend-dev or backend-dev), only implement your assigned scope. Use SendMessage to report completion to the planner/team lead.

### Step 6: Run Local Tests (Full Regression Gate)

**ALL tests must pass — not just tests related to this ticket.**
**Tests run LOCALLY (against Vite preview server on localhost:4173), NOT against staging.**

#### Step 6a: Build the Frontend
```bash
cd platform/frontend
npm install
npm run build
```

If the build fails, fix the build errors before proceeding.

#### Step 6b: Run ALL Playwright E2E Tests (Local)
```bash
cd platform/frontend
npx playwright install chromium
npm test
```

This runs tests against the local Vite preview server (port 4173), auto-started by `playwright.config.ts`. Do NOT use `npm run test:staging` here — staging tests happen later in the `b-review` step after the code is merged and deployed.

**CRITICAL: Run the FULL test suite. If ANY test fails, it must be fixed before creating the PR.**

#### Step 6c: Handle Test Failures
- Attempt to fix ALL failures (up to 3 attempts per failure)
- **Do NOT dismiss failures as "pre-existing" or "unrelated"**
- **Do NOT skip, disable, or weaken existing tests**
- If unfixable, go to Step 9 (Failure)

**In team mode:** The tester agent runs this step. Report results to the planner via SendMessage.

### Step 7: Commit and Push
1. Stage all changes:
   ```bash
   git add -A
   ```
2. Create commit:
   ```bash
   git commit -m "feat: <description>

   Refs #<issue_number>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   ```
3. Push:
   ```bash
   git push -u origin <branch_name>
   ```

### Step 8: Create Pull Request
```bash
gh pr create --repo bradyoo12/ai-dev-request --base main --head <branch_name> --title "<issue_title>" --body "## Summary

<brief description>

## Related Issue
Refs #<issue_number>

## Changes
- <list of changes>

## Local Test Results
- Unit Tests: PASSED
- Playwright E2E: PASSED
- Build: PASSED

---
Generated by b-ready agent"
```

### Step 9: Update Ticket Status (Success or Failure)

**If SUCCESSFUL:**
- Add completion comment. Ticket stays "In Progress" with open PR.
- **In team mode:** Send success message to team lead.

**If FAILED or BLOCKED:**
1. Add `on hold` label:
   ```bash
   gh issue edit <issue_number> --repo bradyoo12/ai-dev-request --add-label "on hold"
   ```
2. Checkout main and delete the branch
3. Add a comment explaining the issue
4. **In team mode:** Send failure message to team lead with details.
5. **In standalone mode:** Move to the next Ready ticket

### Step 10: Loop (Standalone Mode Only)
1. Wait 5 seconds
2. Go back to Step 1

In team mode, do NOT loop. Report completion and wait for shutdown.

## Important Notes
- **Standalone mode runs in an infinite loop**
- Only process tickets with explicit "Ready" status
- **Skip tickets with `on hold` label**
- Branch naming: `<issue_number>-<slug-of-title>` (ticket number FIRST)
- Commits reference with "Refs #" (not "Fixes" or "Closes")
- 5-second delay between iterations (standalone mode only)
- In team mode, coordinate with teammates and report status via SendMessage
