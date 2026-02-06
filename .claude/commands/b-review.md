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

## Loop Behavior
This workflow runs in an infinite loop with 5-second intervals:
1. Execute the workflow (Steps 1-6)
2. After completing one ticket (success or failure), wait 5 seconds
3. Start again from Step 1 to pick up the next eligible ticket
4. Continue until manually stopped by the user (Ctrl+C)

## Workflow

Execute this workflow in sequence, then loop:

### Step 1: Find Tickets Ready for Staging Verification

#### Step 1a: Get issues in "In Review" status

```bash
gh project item-list 26 --owner bradyoo12 --format json --limit 200
```

#### Step 1b: Filter to eligible tickets

From the response, filter issues that:
- Are in project 26 with "In Review" status
- Do NOT have the `on hold` label

If no eligible tickets found, log "No tickets ready for staging verification. Waiting 5 seconds..." and wait 5 seconds, then restart from Step 1.

### Step 2: Verify Staging Deployment

Ensure the main branch (with the merged changes) is deployed to staging:

1. Check that the staging environment is running with the latest main branch
2. Verify the staging site is accessible and responding

**If staging is NOT available** (down, not yet provisioned, temporarily unreachable):
- Do NOT add `on hold` label — this is a temporary issue
- Log "Staging unavailable — skipping ticket #<number>, will retry next cycle"
- Skip this ticket and move to the next one (or loop back to Step 1)

### Step 3: Run Staging Tests (Full Regression Suite)

Run ALL available tests against the staging environment.

#### Step 3a: Run FULL Playwright E2E Test Suite Against Staging
```bash
cd platform/frontend
npm install
npx playwright install --with-deps

# Run ALL Playwright tests against the staging URL
PLAYWRIGHT_BASE_URL=<staging-url> npx playwright test
```

**CRITICAL: Run the ENTIRE test suite.** If ANY test fails, the ticket fails verification.

#### Step 3b: AI-Assisted Verification
Perform AI-simulated human testing on staging:
1. Analyze the ticket requirements
2. Identify key user flows affected by changes
3. Verify UI changes are correct on staging
4. Verify business logic works as expected

#### Step 3c: Additional Checks
- API endpoints respond correctly
- No console errors on key pages
- Performance is acceptable

### Step 4: Handle Test Results

**If all tests PASS:**

1. Move ticket to "Done" status:
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 98236657
   ```

2. Close the issue:
   ```bash
   gh issue close <issue_number> --repo bradyoo12/ai-dev-request --reason completed
   ```

3. Add a completion comment

**If tests FAIL:**

1. Add failure comment with details
2. Add "on hold" label:
   ```bash
   gh issue edit <issue_number> --repo bradyoo12/ai-dev-request --add-label "on hold"
   ```

### Step 5: Cleanup
1. Clean up any test artifacts or temporary files

### Step 6: Loop
1. Log "Cycle complete. Waiting 5 seconds before next iteration..."
2. Wait 5 seconds
3. Go back to Step 1

## Important Notes
- **This command runs in an infinite loop** - keep processing until Ctrl+C
- Only process tickets in "In Review" WITHOUT `on hold` label
- Tests run against **staging** (not locally)
- If tests pass: move to "Done" and close the issue
- If tests fail: add comment + `on hold` label
- If staging is unavailable: do NOT add `on hold` — just skip and retry next cycle
- **ALL tests must pass for a ticket to pass review**
