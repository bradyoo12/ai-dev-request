---
description: Automated staging verification workflow that tests "In Review" tickets on staging using Playwright and all available tools. Supports team mode for parallel testing.
allowed-prompts:
  - tool: Bash
    prompt: run gh commands for GitHub operations
  - tool: Bash
    prompt: run git commands
  - tool: Bash
    prompt: run npm commands
  - tool: Bash
    prompt: run npx commands
---

Automated staging verification workflow that tests "In Review" tickets on staging using Playwright and all available tools.

## Usage
`/b-review`
`/b-review 123`

## Default Project
https://github.com/users/bradyoo12/projects/26/views/1

## Prerequisites (MUST RUN FIRST)

**Before any ticket processing, ensure the correct GitHub account is active:**

```bash
gh auth switch -u bradyoo12
```

## Pre-Flight Check

**Before processing any ticket, read:**
1. `.claude/policy.md` - Ensure workflow follows policy rules
2. `.claude/design.md` - Verify implementation aligns with architecture

## Operating Modes

### Standalone Mode (invoked directly via `/b-review`)
Runs the full workflow in an infinite loop.

### Team Mode (spawned by b-start as part of review team)
When spawned as part of an Agent Team by b-start:
- You are one of two agents: **test-runner** or **ai-verifier**
- The ticket number and your role are provided via the task prompt
- Do your assigned work and report results via SendMessage to the team lead
- Do NOT loop — process once and report

**How to detect team mode:** If you were spawned via Task tool with a `team_name` parameter, you are in team mode. Your specific role (test-runner or ai-verifier) will be specified in the task prompt.

### Team Roles

#### test-runner
- Runs the FULL Playwright E2E test suite against staging
- Reports pass/fail with detailed results

#### ai-verifier
- Reads the ticket requirements and "How to Test" comment
- Uses WebFetch to verify staging URL is accessible
- Performs AI-simulated human testing
- Checks for console errors, performance, visual correctness
- Reports verification results

## Loop Behavior (Standalone Mode Only)
This workflow runs in an infinite loop with 5-second intervals:
1. Execute the workflow (Steps 1-6)
2. After completing one ticket (success or failure), wait 5 seconds
3. Start again from Step 1 to pick up the next eligible ticket
4. Continue until manually stopped by the user (Ctrl+C)

## Workflow

Execute this workflow in sequence, then loop:

### Step 1: Find Tickets Ready for Staging Verification

**In team mode, skip this — the ticket is already provided.**

#### Step 1a: Get issues in "In Review" status

```bash
gh project item-list 26 --owner bradyoo12 --format json --limit 200
```

#### Step 1b: Filter to eligible tickets

From the response, filter issues that:
- Are in project 26 with "In Review" status
- Do NOT have the `on hold` label

If no eligible tickets found, log "No tickets ready for staging verification. Waiting 5 seconds..." and wait 5 seconds, then restart from Step 1.

### Step 2: Prepare for Staging Tests

Pull the latest main to ensure test files are up to date (worktree-safe — never checks out the `main` branch):

```bash
cd platform/frontend
git fetch origin && git checkout --detach origin/main
npm install
```

The staging site is deployed automatically via GitHub Actions on push to main:
- **Staging URL**: `https://icy-desert-07c08ba00.2.azurestaticapps.net`

No local build or preview server is needed — tests run directly against the live staging site.

### Step 3: Run Tests (Full Regression Suite)

Run ALL available tests against the staging site.

**In team mode:** Only run your assigned role's tests (test-runner OR ai-verifier), not both.

#### Step 3a: Run FULL Playwright E2E Test Suite Against Staging
```bash
cd platform/frontend
npx playwright install chromium
npm run test:staging
```

This runs all Playwright tests against the live staging site (`https://icy-desert-07c08ba00.2.azurestaticapps.net`). The Playwright config skips the local web server when `PLAYWRIGHT_BASE_URL` is set.

**CRITICAL: Run the ENTIRE test suite.** If ANY test fails, the ticket fails verification.

#### Step 3b: AI-Assisted Verification
Perform AI-simulated human testing:
1. Analyze the ticket requirements
2. Identify key user flows affected by changes
3. Use Playwright to navigate and verify UI changes
4. Verify business logic works as expected

#### Step 3c: Additional Checks
- No console errors on key pages
- Performance is acceptable
- Build output size is reasonable

### Step 4: Handle Test Results

**In team mode:** Report results via SendMessage to the team lead. Do NOT directly modify ticket status — the team lead handles that.

**In standalone mode:**

**If all tests PASS:**

1. Move ticket to "Done" status (GraphQL — no REST alternative for projects):
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 98236657
   ```

2. Close the issue (REST):
   ```bash
   gh api --method PATCH "repos/bradyoo12/ai-dev-request/issues/<issue_number>" -f state=closed -f state_reason=completed
   ```

3. Add a completion comment

**If tests FAIL:**

1. Add failure comment with details
2. Add "on hold" label (REST):
   ```bash
   gh api --method POST "repos/bradyoo12/ai-dev-request/issues/<issue_number>/labels" -f "labels[]=on hold"
   ```

### Step 5: Cleanup
1. Clean up any test artifacts or temporary files

### Step 6: Loop (Standalone Mode Only)
1. Log "Cycle complete. Waiting 5 seconds before next iteration..."
2. Wait 5 seconds
3. Pull latest changes before starting the next iteration (worktree-safe):
   ```bash
   git fetch origin && git checkout --detach origin/main
   ```
4. Go back to Step 1

In team mode, stop here and wait for shutdown.

## Important Notes
- **Standalone mode runs in an infinite loop** - keep processing until Ctrl+C
- Only process tickets in "In Review" WITHOUT `on hold` label
- Tests run against the staging site: `https://icy-desert-07c08ba00.2.azurestaticapps.net`
- If tests pass: move to "Done" and close the issue (standalone) or report success (team mode)
- If tests fail: add comment + `on hold` label (standalone) or report failure (team mode)
- If staging is unavailable: do NOT add `on hold` — just skip and retry next cycle
- **ALL tests must pass for a ticket to pass review**
- In team mode, report results via SendMessage — do NOT modify ticket status directly
