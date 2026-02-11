Automated merge workflow that merges PRs from "In Progress" tickets to main and moves them to "In Review" (staging).

## Usage
`/b-progress`
`/b-progress 123`

## Default Project
https://github.com/users/bradyoo12/projects/26/views/1

## Prerequisites (MUST RUN FIRST)

**Before any ticket processing, ensure the correct GitHub account is active:**

```bash
gh auth switch -u bradyoo12
```

## Pre-Flight Check

**Before processing any ticket, read:**
1. `.claude/policy.md` - Ensure merging follows policy rules
2. `.claude/design.md` - Verify implementation aligns with architecture

## Operating Modes

### Standalone Mode (invoked directly via `/b-progress`)
Runs the full workflow in an infinite loop.

### Called by b-start
When called by the b-start orchestrator, b-progress runs as a single agent (no team needed — merging is a simple sequential operation). Process ONE ticket and return.

## Loop Behavior (Standalone Mode Only)
This workflow runs in an infinite loop with 5-second intervals:
1. Execute the workflow (Steps 1-6)
2. After completing one ticket, wait 5 seconds
3. Start again from Step 1
4. Continue until manually stopped (Ctrl+C)

When called by b-start, process ONE ticket and stop — do NOT loop.

## Workflow

### Step 1: Find Tickets Ready for Merge

#### Step 1a: Get issues from the project board

```bash
gh project item-list 26 --owner bradyoo12 --format json --limit 200
```

#### Step 1b: Filter to eligible tickets

Filter issues that:
- Are in project 26 with "In Progress" status
- Do NOT have the `on hold` label
- Have an open PR

To check for open PRs:
```bash
gh pr list --repo bradyoo12/ai-dev-request --state open --json number,headRefName,url
```

Cross-reference tickets with open PRs by matching branch names (branch starts with ticket number).

If no eligible tickets found, wait 5 seconds and restart (standalone) or return (called by b-start).

### Step 2: Verify PR Status
1. Check the PR:
   ```bash
   gh pr view <pr_number> --repo bradyoo12/ai-dev-request --json mergeable,mergeStateStatus,statusCheckRollup
   ```
2. Verify PR is mergeable, all checks pass, no conflicts

If not ready: add `on hold` label and move to next ticket.

### Step 3: Merge the Pull Request
```bash
gh pr merge <pr_number> --repo bradyoo12/ai-dev-request --merge --delete-branch
```

If merge fails: add `on hold` label and move to next ticket.

### Step 4: Move Ticket to In Review

1. Update status:
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id df73e18b
   ```

2. **Add a detailed "How to Test" comment** with:
   - Staging URL: `https://icy-desert-07c08ba00.2.azurestaticapps.net`
   - Step-by-step test instructions (beginner-friendly)
   - Expected results for each step
   - Visual verification checklist
   - Instructions for reporting failures

### Step 5: Cleanup
```bash
git fetch origin && git checkout --detach origin/main
git branch -D <branch_name> 2>/dev/null || true
```

### Step 6: Loop (Standalone Mode Only)
1. Wait 5 seconds
2. Go back to Step 1

When called by b-start, stop here and return results.

## Important Notes
- **Standalone mode runs in an infinite loop**
- Only process "In Progress" tickets with an open PR and no `on hold` label
- PR merge uses `--merge` strategy (not squash or rebase)
- Branch is deleted after successful merge
- **CRITICAL: "How to Test" comment is mandatory** for every ticket moving to In Review
