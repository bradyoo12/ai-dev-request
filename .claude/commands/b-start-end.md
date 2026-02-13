---
description: Gracefully finish the current b-start cycle — merge PRs, verify, close tickets, clean up branches, and stop.
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

Gracefully finishes whatever b-start is currently working on, then stops. Merges open PRs, verifies changes, closes tickets, cleans up branches, and returns the worktree to a clean state.

## Usage
`/b-start-end`

## Default Project
https://github.com/users/bradyoo12/projects/26/views/1

## Prerequisites (MUST RUN FIRST)

```bash
gh auth switch -u bradyoo12
```

## Pre-Flight Check

Read `.claude/policy.md` for hardcoded project field IDs and workflow rules.

## Overview

```
┌──────────────────────────────────────────────────┐
│                  b-start-end (Graceful Shutdown)         │
├──────────────────────────────────────────────────┤
│  1. Scan project board for active tickets          │
│  2. In Progress + open PR → merge, move In Review  │
│  3. In Review → verify, move Done, close issue     │
│  4. Update .claude/ docs if needed                 │
│  5. Clean up branches (local + remote)             │
│  6. Return worktree to detached origin/main        │
│  7. Stop (no loop)                                 │
└──────────────────────────────────────────────────┘
```

**This command runs ONCE and stops. It does NOT loop.**

## Workflow

### Step 1: Scan Project Board

Fetch all items from the project board:

```bash
gh project item-list 26 --owner bradyoo12 --format json --limit 200
```

Identify:
- **In Progress** tickets (with or without open PRs)
- **In Review** tickets (without `on hold` label)

Also fetch open PRs to cross-reference:

```bash
gh api "repos/bradyoo12/ai-dev-request/pulls?state=open&per_page=100" --jq '[.[] | {number, headRefName: .head.ref, url: .html_url, title: .title}]'
```

Match PRs to tickets by branch name (branch starts with ticket number, e.g. `506-some-slug`).

### Step 2: Finish "In Progress" Tickets

For each "In Progress" ticket (no `on hold` label):

#### Step 2a: If ticket has an open PR → Merge it

1. Verify PR is mergeable (REST):
   ```bash
   gh api "repos/bradyoo12/ai-dev-request/pulls/<pr_number>" --jq '{mergeable, mergeable_state}'
   ```
   - If `mergeable` is null, wait 5 seconds and retry (GitHub is still computing)
   - If not mergeable, add `on hold` label and skip this ticket

2. Merge the PR (REST):
   ```bash
   gh api --method PUT "repos/bradyoo12/ai-dev-request/pulls/<pr_number>/merge" -f merge_method=merge
   ```

3. Delete the remote branch:
   ```bash
   gh api --method DELETE "repos/bradyoo12/ai-dev-request/git/refs/heads/<branch_name>"
   ```

4. Move ticket to "In Review":
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id df73e18b
   gh api graphql -f query='mutation { updateProjectV2ItemPosition(input: { projectId: "PVT_kwHNf9fOATn4hA", itemId: "<item_id>" }) { clientMutationId } }'
   ```

5. Add a "How to Test" comment with staging URL and step-by-step instructions.

6. **Continue to Step 3** for this ticket (verify and move to Done).

#### Step 2b: If ticket has NO open PR → Put on hold

The ticket is In Progress but has no PR — implementation may be incomplete or stuck.

1. Add `on hold` label:
   ```bash
   gh api --method POST "repos/bradyoo12/ai-dev-request/issues/<issue_number>/labels" -f "labels[]=on hold"
   ```
2. Add a comment: "Marked on hold by b-start-end — ticket was In Progress with no open PR."
3. Skip to the next ticket.

### Step 3: Finish "In Review" Tickets

For each "In Review" ticket (including those just moved from Step 2), without `on hold` label:

#### Step 3a: Classify the ticket

Read the merged PR to understand the changes:

```bash
# Find the merged PR for this ticket
gh api "search/issues?q=repo:bradyoo12/ai-dev-request+is:pr+is:merged+<issue_number>&per_page=5" --jq '.items[] | {number, title}'
# Get changed files
gh api "repos/bradyoo12/ai-dev-request/pulls/<pr_number>/files" --jq '[.[] | .filename]'
```

Classify:
- **Docs-only** (all files under `.claude/`, `docs/`, `*.md`, no source code): Skip staging tests
- **Source changes** (any files under `platform/`): Run staging verification

#### Step 3b: Verify (source changes only)

For tickets with source changes, run a quick verification:

1. Pull latest and install deps (worktree-safe):
   ```bash
   git fetch origin && git checkout --detach origin/main
   cd platform/frontend && npm install
   ```

2. Run Playwright E2E tests against staging:
   ```bash
   cd platform/frontend
   npx playwright install chromium
   npm run test:staging
   ```

3. If tests FAIL:
   - Add failure comment with details
   - Add `on hold` label
   - Skip to the next ticket

#### Step 3c: Move to Done

1. Move ticket to "Done":
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 98236657
   gh api graphql -f query='mutation { updateProjectV2ItemPosition(input: { projectId: "PVT_kwHNf9fOATn4hA", itemId: "<item_id>" }) { clientMutationId } }'
   ```

2. Close the issue (REST):
   ```bash
   gh api --method PATCH "repos/bradyoo12/ai-dev-request/issues/<issue_number>" -f state=closed -f state_reason=completed
   ```

3. Add a completion comment.

### Step 4: Update .claude/ Documentation

For each ticket that was moved to Done, check if `.claude/` docs need updates:

1. Read the merged PR's changed files
2. **Update `design.md`** if the ticket introduced new entities, endpoints, components, or architecture changes
3. **Update `inventory.md`** if the ticket added new controllers, services, entities, pages, API modules, or components
4. **Update `conventions.md`** if the ticket established new coding patterns
5. **Update `infrastructure.md`** if the ticket changed deployment config, CI/CD, or env vars
6. **Update `policy.md`** if the ticket changed workflow rules or project settings

Only update files that actually need changes. Skip if the ticket had no architectural impact.

If any docs were updated:
```bash
git add .claude/
git commit -m "docs: update .claude/ docs after completing #<issue_number>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin HEAD:main
```

### Step 5: Clean Up Branches

Delete stale local and remote branches that have been fully merged:

```bash
# Delete merged local branches (never delete main/master)
git fetch origin --prune
git branch --merged origin/main | grep -vE '^\*|main|master' | xargs -r git branch -d

# Delete merged remote branches (never delete main/master)
git branch -r --merged origin/main | grep -vE 'main|master|HEAD' | sed 's/origin\///' | xargs -r -I {} git push origin --delete {}
```

### Step 6: Return Worktree to Clean State

```bash
git fetch origin && git checkout --detach origin/main
```

### Step 7: Report Summary

Log a final summary:
- How many tickets were processed (merged, verified, closed)
- How many tickets were put on hold (and why)
- How many branches were cleaned up
- How many .claude/ doc files were updated

**Stop here. Do NOT loop. b-start-end is a one-shot command.**

## Important Notes

- **b-start-end runs ONCE and stops** — it is the opposite of b-start's infinite loop
- Processes ALL active tickets (In Progress and In Review), not just one
- Follows the same merge/verify/close flow as b-start Steps 4-5
- Skips staging tests for docs-only tickets (no source code changes)
- Tickets without open PRs get `on hold` instead of being silently skipped
- Always cleans up branches (local + remote) before stopping
- Uses REST for all issue/PR operations per policy.md rate limit strategy
- Uses hardcoded project field IDs — never calls `gh project field-list` or `gh project view`
