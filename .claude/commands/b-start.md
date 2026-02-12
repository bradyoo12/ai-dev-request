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

**IMPORTANT:** Follow the **GitHub API Rate Limit Strategy** in `policy.md`. Use REST (`gh api`) for all issue/PR operations. Only use GraphQL (`gh project`) for project board operations which have no REST alternative. Never call `gh project field-list` or `gh project view` — use hardcoded IDs from policy.md.

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
│  3. b-ready team → plan, implement, unit tests, E2E test, PR      │
│  4. b-progress → merge PR to main, move to In Review             │
│  4b. GitHub Actions health check → find & fix CI failures        │
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
| b-ready | `ready-<ticket#>` | planner + frontend-dev + backend-dev + unit-test-analyst + tester | Frontend & backend can be implemented simultaneously; unit tests created before E2E |
| b-progress | No team | Single operation | Simple merge, no parallelism needed |
| Actions check | No team | Single operation | Diagnose & fix CI failures sequentially |
| b-review | `review-<ticket#>` | test-runner + ai-verifier | E2E tests and AI verification run independently |
| b-modernize | `modernize` | tech-scout + competitor-scout | Independent web searches |
| site-audit | `site-audit` | error-checker + ux-reviewer | Error checking and UX review run independently |

**Rule: ONE ticket at a time.** Teams work collaboratively on the SAME ticket. Never process multiple tickets simultaneously.

## Step 0: Worktree Setup (Multi-Instance Safe)

Each b-start instance MUST operate in its own dedicated git worktree so that multiple instances can run in parallel without conflicting on the same working directory.

**Why**: Two instances sharing the same checkout will corrupt each other's state when switching branches, pulling, or running builds.

### Setup Procedure

1. **Prune stale worktrees** from crashed previous instances:
   ```bash
   git worktree prune
   ```

2. **List existing worktrees** to find the next available worker number:
   ```bash
   git worktree list
   ```
   Look for entries matching `ai-dev-request-worker-N`. Pick the next available N (starting from 1).

3. **Create a new worktree** in detached HEAD state (avoids branch conflicts between worktrees):
   ```bash
   git fetch origin
   git worktree add --detach ../ai-dev-request-worker-<N>
   ```

4. **Record the worktree path** as `WORKTREE_DIR` (absolute path). **All subsequent file operations, git commands, and builds must run inside `WORKTREE_DIR`.**

5. **Install frontend dependencies** in the worktree:
   ```bash
   cd <WORKTREE_DIR>/platform/frontend && npm install
   ```

6. **Stale worktree cleanup on exit**: When the instance stops (Ctrl+C, error, or graceful shutdown), remove the worktree:
   ```bash
   git -C <MAIN_REPO_DIR> worktree remove <WORKTREE_DIR> --force
   ```
   If you forget, `git worktree prune` at the start of the next run will clean it up.

### Git Pattern for Worktrees

Since multiple worktrees cannot check out the same branch, **never check out the `main` branch**. Instead, use `origin/main` as a detached reference:

| Old Pattern | New Pattern (Worktree-Safe) |
|---|---|
| `git checkout main && git pull` | `git fetch origin && git checkout --detach origin/main` |
| `git checkout -b <branch>` | `git checkout -b <branch> origin/main` |

This pattern works in both regular repos and worktrees, so all agents and commands can use it unconditionally.

### Passing Worktree to Agents

**When spawning any agent** (via Task tool), always include in the prompt:

> Work in directory: `<WORKTREE_DIR>`. This is a git worktree. All file operations and git commands must happen in this directory. Never check out the `main` branch directly — use `git fetch origin && git checkout --detach origin/main` instead.

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
   - Add `on hold` label (REST):
     ```bash
     gh api --method POST "repos/bradyoo12/ai-dev-request/issues/<issue_number>/labels" -f "labels[]=on hold"
     ```
   - Add a comment explaining the concern

   **Soft Block** (prerequisites not yet met) → skip WITHOUT labeling:
   - Prerequisite PRs not yet merged, dependent tickets incomplete, blocked by in-progress work
   - Do NOT add `on hold` label — just skip the ticket this cycle
   - Log: "Skipping #<number>: <reason> — will retry next cycle"

4. Log summary of audit results

### Step 3: b-ready — Implement with Agent Team

Implement and locally test ONE Ready ticket using an Agent Team.

#### Step 3a: Claim the Ticket (RACE-CONDITION SAFE)

**CRITICAL: Multiple b-start instances may run on different machines. The status change MUST happen BEFORE any other work on the ticket to prevent duplicate processing.**

1. Fetch the project board:
   ```bash
   gh project item-list 26 --owner bradyoo12 --format json --limit 200
   ```
2. Filter for issues with "Ready" status and no `on hold` label
3. If no ticket found, skip to Step 4. **If Steps 3–5 all find no tickets to process** (no Ready, no In Progress with PRs, no In Review), **jump directly to Step 6 (b-modernize)** to use idle time productively researching technologies and competitors.
4. **IMMEDIATELY move the ticket to "In Progress"** — this is the FIRST action, before reading the ticket, classifying it, or doing anything else:
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 47fc9ee4
   ```
5. **Verify the claim succeeded** — re-fetch the project item and confirm it is now "In Progress":
   ```bash
   gh project item-list 26 --owner bradyoo12 --format json --limit 200
   ```
   - If the ticket is already "In Progress" (claimed by another instance between your fetch and your edit), **skip this ticket** and go back to step 1 to find the next Ready ticket.
6. Log: "Claimed ticket #<number> — moved to In Progress"

**Do NOT read the ticket details, classify scope, or create teams until the claim is confirmed.**

#### Step 3b: Read and Classify the Ticket

1. Fetch the issue details (REST):
   ```bash
   gh api "repos/bradyoo12/ai-dev-request/issues/<issue_number>"
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
   - Task: "Analyze new code for unit test gaps and create missing unit tests"
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

6. After frontend-dev and backend-dev complete, spawn **unit-test-analyst** agent (general-purpose, team_name: ready-<ticket_number>):
   - Identifies all files added or modified by the current ticket (diff against main)
   - For each modified/new file, checks if corresponding unit test files exist:
     - Frontend: `*.test.ts` / `*.test.tsx` alongside or in `__tests__/` directories
     - Backend: `*Tests.cs` in the test project
   - Analyzes the new code for logic that should be covered by unit tests rather than E2E tests:
     - Utility functions, helpers, and pure logic
     - State management (Zustand stores, reducers)
     - Data transformations and formatting
     - Validation logic
     - API response parsing / error handling
     - Custom hooks with testable behavior
     - Backend service methods, validators, and business logic
   - Creates missing unit tests following existing test patterns in the codebase
   - Runs unit tests to verify they pass:
     - Frontend: `npx vitest run` (or `npm test -- --watchAll=false`)
     - Backend: `dotnet test`
   - If new tests fail, fixes them (up to 3 attempts)
   - Reports results to planner: how many tests added, coverage summary

7. After unit-test-analyst completes, spawn **tester** agent (general-purpose, team_name: ready-<ticket_number>):
   - Runs `npm run build` in platform/frontend
   - Runs full Playwright E2E suite: `npm test` in platform/frontend
   - Reports results to planner
   - If tests fail: attempt fixes (up to 3 attempts), then report

8. Planner handles final steps:
   - Commits all changes (including new unit tests) with "Refs #<ticket_number>"
   - Pushes branch and creates PR
   - Reports success/failure

9. Shut down all agents and delete the team:
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
5. Return to latest main: `git fetch origin && git checkout --detach origin/main`, delete the branch
6. Proceed to Step 4

### Step 4: b-progress — Merge PR (No Team)

Merge PRs to main. This is a simple operation — no team needed.

1. Log "Starting b-progress..."
2. Find "In Progress" tickets with open PRs (no `on hold` label):
   ```bash
   gh project item-list 26 --owner bradyoo12 --format json --limit 200
   gh api "repos/bradyoo12/ai-dev-request/pulls?state=open&per_page=100" --jq '[.[] | {number, headRefName: .head.ref, url: .html_url}]'
   ```
3. Verify PR is mergeable (REST):
   ```bash
   gh api "repos/bradyoo12/ai-dev-request/pulls/<pr_number>" --jq '{mergeable, mergeable_state}'
   ```
4. Merge (REST):
   ```bash
   gh api --method PUT "repos/bradyoo12/ai-dev-request/pulls/<pr_number>/merge" -f merge_method=merge
   gh api --method DELETE "repos/bradyoo12/ai-dev-request/git/refs/heads/<branch_name>"
   ```
5. Move ticket to "In Review":
   ```bash
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id <item_id> --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id df73e18b
   ```
6. **Add a detailed "How to Test" comment** with staging URL and step-by-step instructions
7. Cleanup (worktree-safe — never checks out `main` branch):
   ```bash
   git fetch origin && git checkout --detach origin/main
   ```
8. **Delete stale branches** (local and remote) that have been fully merged:
   ```bash
   # Delete merged local branches (never delete main/master)
   git branch --merged origin/main | grep -vE '^\*|main|master' | xargs -r git branch -d
   # Delete merged remote branches (never delete main/master)
   git branch -r --merged origin/main | grep -vE 'main|master' | sed 's/origin\///' | xargs -r -I {} git push origin --delete {}
   ```

### Step 4b: GitHub Actions Health Check

After merging PRs, check GitHub Actions for failed workflow runs on `main` and fix any errors found.

#### Step 4b-1: Check Recent Workflow Runs

1. Fetch recent workflow runs on the `main` branch:
   ```bash
   gh run list --repo bradyoo12/ai-dev-request --branch main --limit 10 --json databaseId,status,conclusion,name,headBranch,event,createdAt
   ```

2. Also check for failed runs on any branch (catches PR check failures):
   ```bash
   gh run list --repo bradyoo12/ai-dev-request --status failure --limit 5 --json databaseId,status,conclusion,name,headBranch,event,createdAt
   ```

3. If no failures found, log "GitHub Actions: all green" and skip to Step 5.

#### Step 4b-2: Diagnose Each Failure

For each failed run:

1. Get the failure details and logs:
   ```bash
   gh run view <run_id> --repo bradyoo12/ai-dev-request --log-failed
   ```

2. If logs are too large, get job-level details first:
   ```bash
   gh run view <run_id> --repo bradyoo12/ai-dev-request --json jobs --jq '.jobs[] | select(.conclusion=="failure") | {name, conclusion, steps: [.steps[] | select(.conclusion=="failure") | {name, conclusion}]}'
   ```

3. Classify the failure:

   **Transient failure** (network timeout, rate limit, flaky test, GitHub infrastructure issue):
   - Re-run the failed jobs:
     ```bash
     gh run rerun <run_id> --repo bradyoo12/ai-dev-request --failed
     ```
   - Log: "Re-ran transient failure in run #<run_id>"
   - Move to the next failed run

   **Code/config failure** (build error, test failure, lint error, deployment config issue):
   - Proceed to Step 4b-3

#### Step 4b-3: Fix Code/Config Failures

1. Create a fix branch (worktree-safe):
   ```bash
   git fetch origin
   git checkout -b fix/ci-<run_id> origin/main
   ```

2. Analyze the error logs and identify the root cause:
   - Build failures: missing dependencies, type errors, compilation errors
   - Test failures: broken tests, missing test fixtures, environment issues
   - Lint/format failures: code style violations
   - Deployment failures: misconfigured workflows, wrong secrets references

3. Fix the issue in the worktree

4. Run the relevant checks locally to verify the fix:
   - Build: `cd platform/frontend && npm run build`
   - Tests: `cd platform/frontend && npm test`
   - Backend: `cd platform/backend/AiDevRequest.API && dotnet build`

5. Commit and push:
   ```bash
   git add -A
   git commit -m "fix: resolve CI failure from Actions run #<run_id>"
   git push origin fix/ci-<run_id>
   ```

6. Create a PR:
   ```bash
   gh pr create --repo bradyoo12/ai-dev-request --title "[CI Fix] <short description of failure>" --body "Fixes CI failure from GitHub Actions run #<run_id>.\n\n**Root cause:** <description>\n**Fix:** <what was changed>"
   ```

7. Create a tracking ticket (REST):
   ```bash
   gh api --method POST "repos/bradyoo12/ai-dev-request/issues" \
     -f title="[CI Fix] <short description>" \
     -f body="GitHub Actions run #<run_id> failed on \`main\` branch.\n\n**Error:** <error summary>\n**Root cause:** <description>\n**Fix PR:** #<pr_number>" \
     -f "labels[]=bug"
   ```

8. Add the ticket to the project and set to **In Progress**:
   ```bash
   ITEM_ID=$(gh project item-add 26 --owner bradyoo12 --url <issue_url> --format json --jq '.id')
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 47fc9ee4
   ```

9. Process this fix through b-progress (Step 4) to merge immediately — CI fixes are high priority.

10. After the fix PR is merged, verify the Actions run passes:
    ```bash
    # Wait briefly for the new run to start
    sleep 30
    gh run list --repo bradyoo12/ai-dev-request --branch main --limit 3 --json databaseId,status,conclusion,name
    ```
    - If still failing, retry the fix (up to 3 attempts total)
    - If still failing after 3 attempts, add `on hold` label to the ticket and proceed to Step 5

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

2. Pull latest and install deps (worktree-safe):
   ```bash
   git fetch origin && git checkout --detach origin/main
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
- Close the issue (REST):
  ```bash
  gh api --method PATCH "repos/bradyoo12/ai-dev-request/issues/<issue_number>" -f state=closed -f state_reason=completed
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

1. **Read the completed ticket** (REST):
   ```bash
   gh api "repos/bradyoo12/ai-dev-request/issues/<issue_number>"
   ```

2. **Read the merged PR** (REST — uses search rate limit, not GraphQL):
   ```bash
   gh api "search/issues?q=repo:bradyoo12/ai-dev-request+is:pr+is:merged+<issue_number>&per_page=5" --jq '.items[] | {number, title, body}'
   # For changed files per PR:
   gh api "repos/bradyoo12/ai-dev-request/pulls/<pr_number>/files" --jq '[.[] | .filename]'
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

6. **Commit and push the documentation updates** (worktree-safe — push to main without checking it out):
   ```bash
   git add .claude/policy.md .claude/design.md
   git commit -m "docs: update policy and design docs after completing #<issue_number>"
   git push origin HEAD:main
   ```

7. If neither file needs updating (e.g., the ticket was a minor bug fix with no architectural impact), skip this step and log: "No doc updates needed for #<issue_number>"

### Step 6: b-modernize — Research with Agent Team

Search for recent technologies and create suggestion tickets using parallel researchers.

**This step also runs as an idle fallback:** If Steps 3–5 all found no tickets to process (no Ready tickets, no In Progress PRs to merge, no In Review tickets to verify), b-modernize runs automatically so the pipeline stays productive instead of looping empty cycles.

#### Step 6a: Playwright UI Smoke Test (Idle Pre-check)

Before researching new technologies, use Playwright to test all links and buttons on the live UI to catch any errors or unexpected results.

1. Pull latest and install deps (worktree-safe):
   ```bash
   git fetch origin && git checkout --detach origin/main
   cd platform/frontend && npm install
   npx playwright install chromium
   ```

2. Run a Playwright smoke test that:
   - Navigates to every discoverable page/route on the staging site
   - Clicks all links and verifies they navigate correctly (no 404s, no broken routes)
   - Clicks all buttons and checks for JavaScript errors, uncaught exceptions, or unexpected UI states
   - Checks the browser console for any error-level messages
   - Verifies no network requests return 4xx/5xx responses

3. For each issue found:
   - Create a ticket with a clear title and reproduction steps (REST):
     ```bash
     gh api --method POST "repos/bradyoo12/ai-dev-request/issues" -f title="[UI Bug] {description}" -f body="{detailed reproduction steps and error details}" -f "labels[]=bug"
     ```
   - Add the ticket to the project and set status to **Ready** (use hardcoded IDs — see policy.md):
     ```bash
     ITEM_ID=$(gh project item-add 26 --owner bradyoo12 --url {issue_url} --format json --jq '.id')
     gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 61e4505c
     ```

4. If new Ready tickets were created from UI issues, **loop back to Step 3** to process them instead of continuing to b-modernize research.

#### Step 6b: Pre-check

1. Check existing open suggestion tickets (REST):
   ```bash
   gh api "repos/bradyoo12/ai-dev-request/issues?state=open&labels=suggestion&per_page=50" --jq '[.[] | {number, title}]'
   ```
2. If 4+ suggestion tickets exist in Backlog, skip b-modernize entirely

#### Step 6c: Create Research Team

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

#### Step 6d: Create Tickets

After collecting findings from both scouts:
1. Filter for qualifying technologies (relevance >= 3, impact >= 3, effort <= 4)
2. Deduplicate against existing tickets
3. Create max 3 suggestion tickets (REST):
   ```bash
   gh api --method POST "repos/bradyoo12/ai-dev-request/issues" -f title="{title}" -f body="{body}" -f "labels[]=suggestion"
   ```
4. Add each ticket to the project and set status to **Ready** (use hardcoded IDs — see policy.md):
   ```bash
   ITEM_ID=$(gh project item-add 26 --owner bradyoo12 --url {issue_url} --format json --jq '.id')
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 61e4505c
   ```

#### Step 6e: Cleanup

Shut down all agents, delete the team.

### Step 7: Site Audit — Find Errors and Improvements

After modernization research, audit the live site to catch errors, bugs, and UX improvements.

#### Step 7a: Pre-check

1. Check existing open bug/improvement tickets to avoid duplicates (REST):
   ```bash
   gh api "repos/bradyoo12/ai-dev-request/issues?state=open&per_page=100" --paginate --jq '[.[] | {number, title, labels: [.labels[].name]}]'
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
3. Create max 5 tickets per cycle (REST):
   ```bash
   gh api --method POST "repos/bradyoo12/ai-dev-request/issues" -f title="{title}" -f body="{body}" -f "labels[]=bug"
   ```
   - Use label `bug` for errors found by error-checker
   - Use label `enhancement` for improvements found by ux-reviewer
4. Add tickets to the project and set status to **Ready** (use hardcoded IDs — see policy.md):
   ```bash
   ITEM_ID=$(gh project item-add 26 --owner bradyoo12 --url {issue_url} --format json --jq '.id')
   gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 61e4505c
   ```

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
              unit tests,         staging)
              E2E test, PR)
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
- **NEVER ask the user for permission to continue** - always proceed to the next cycle automatically. Do NOT say "Would you like me to continue?" or any variation. The loop is autonomous.
- **ONLY processes tickets in Project 26 (AI Dev Request)** - ignores tickets in other projects
- **ONE ticket at a time** - teams parallelize WITHIN a ticket, not across tickets
- **Multi-instance safe** - Multiple b-start instances can run on the same machine (via git worktrees — see Step 0) or on different machines. The "claim" step (moving to "In Progress") MUST happen before any other work to prevent two instances from picking up the same ticket. Always verify the claim succeeded before proceeding.
- **Worktree required** - Every b-start instance MUST run Step 0 to acquire a dedicated worktree. Never run directly in the main repository checkout. Never check out the `main` branch — always use `git fetch origin && git checkout --detach origin/main`.
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
