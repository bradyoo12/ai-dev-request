---
description: Search tech news sites (Medium, dev.to, Hacker News, TechCrunch) for latest trends, recent technologies, and competitor features, then create suggestion tickets. Supports team mode for parallel research.
allowed-prompts:
  - tool: Bash
    prompt: run gh commands for GitHub operations
  - tool: Bash
    prompt: run echo commands
---

## Mission

Search the web for:
1. **Latest trends** from tech news sites and developer blogs (Medium, dev.to, Hacker News, etc.)
2. **Recent technologies** and frameworks that could benefit the AI Dev Request platform
3. **Competitor features** from AI app builders and development automation platforms

Then create suggestion tickets for promising discoveries.

## Context

AI Dev Request is a SaaS platform for AI-powered development automation:
- **Backend**: .NET 9, BradYoo.Core, PostgreSQL
- **Frontend**: React + Vite + shadcn/ui + Zustand + Tailwind CSS
- **AI**: Claude API (requirement analysis + code generation)
- **Core**: Automated dev request → analysis → proposal → build pipeline

## Operating Modes

### Standalone Mode (invoked directly via `/b-modernize`)
Runs the full workflow: search, evaluate, create tickets.

### Team Mode (spawned by b-start as part of modernize team)
When spawned as part of an Agent Team by b-start:
- You are one of two agents: **tech-scout** or **competitor-scout**
- Your specific research scope is provided via the task prompt
- Do your assigned research and report findings via SendMessage to the team lead
- Do NOT create tickets directly — report findings so the team lead can deduplicate and create tickets
- Do NOT loop — research once and report

**How to detect team mode:** If you were spawned via Task tool with a `team_name` parameter, you are in team mode.

### Team Roles

#### tech-scout
Research scope:
1. **Tech News & Trends**: Search Medium, dev.to, Hacker News, and tech blogs for trending topics in AI/SaaS development
2. **AI Code Generation**: Recent AI coding tools, Claude Code alternatives, agentic coding frameworks
3. **AI Agent Frameworks**: Agent orchestration tools, function-calling improvements, tool-use patterns
4. **Backend/.NET Innovations**: Recent .NET 9 libraries, performance tools, new EF Core features
5. **Frontend/React**: Recent React ecosystem tools, UI components, state management
6. **DevOps & Infrastructure**: Deployment, monitoring, CI/CD innovations for small teams

Report each finding with: name, description, source URL, relevance score (1-5), effort score (1-5), impact score (1-5).

#### competitor-scout
Research scope:
1. **Industry News & Analysis**: Search Medium, dev.to, TechCrunch, and tech blogs for latest AI SaaS trends and competitor launches
2. **AI App Builder Competitors**: Replit, Base44, Bolt.new, v0.dev, Cursor features
3. **AI Dev Request Competitors**: "AI development request platform", "automated software development SaaS"
4. **Search queries**: "AI app builder platforms 2026", "no-code AI tools", "AI development automation"

Report each finding with: name, description, source URL, differentiation (Yes/No/Partial), user value (1-5), feasibility (1-5), competitive edge (1-5).

## Step 1: Load Existing Tickets

Before searching, check what suggestion tickets already exist to avoid duplicates:

```bash
# REST — avoids GraphQL rate limit
gh api "repos/bradyoo12/ai-dev-request/issues?state=open&per_page=100" --paginate --jq '[.[] | {number, title, labels: [.labels[].name]}]'
```

Note all existing titles to avoid creating duplicate suggestions.

**In team mode:** The team lead handles this check before spawning you. Your existing ticket list will be provided in the task prompt.

## Step 2: Web Search for Trends and Technologies

**In team mode, only search your assigned scope (tech-scout or competitor-scout).**

Use `WebSearch` for broad queries and `WebFetch` to read specific articles from news sites. Prioritize recent content (last 3 months).

### News & Blog Sites to Search

Target these sites for trending articles and insights:
- **medium.com** — Developer tutorials, trend analysis, architecture deep-dives
- **dev.to** — Community posts on new tools, libraries, and best practices
- **news.ycombinator.com** (Hacker News) — Trending launches, Show HN posts, discussions
- **techcrunch.com** — Startup launches, funding rounds, product announcements
- **thenewstack.io** — Cloud-native, DevOps, and platform engineering trends
- **blog.pragmaticengineer.com** — Engineering leadership and industry trends

### Search Queries — tech-scout (run all)
1. **Trending on News Sites**: `site:medium.com OR site:dev.to "AI development" OR "AI coding" 2026"`, `site:medium.com "React" OR ".NET" new framework 2026`
2. **AI Code Generation**: Recent AI coding tools, Claude Code alternatives, agentic coding frameworks
3. **AI Agent Frameworks**: Agent orchestration tools, function-calling improvements, tool-use patterns
4. **Backend/.NET Innovations**: Recent .NET 9 libraries, performance tools, new EF Core features
5. **Frontend/React**: Recent React ecosystem tools, UI components, state management
6. **DevOps & Infrastructure**: Deployment, monitoring, CI/CD innovations for small teams

When a search result links to a Medium, dev.to, or blog article, use `WebFetch` to read the full article and extract actionable insights.

### Search Queries — competitor-scout
1. **Trending Competitor News**: `site:medium.com OR site:techcrunch.com "AI app builder" OR "AI code generation" 2026`, `site:dev.to "bolt.new" OR "v0.dev" OR "replit" OR "cursor" 2026`
2. **AI App Builder Competitors**: Replit, Base44, Bolt.new, v0.dev, Cursor features
3. **AI Dev Request Competitors**: "AI development request platform", "automated software development SaaS"
4. **General**: "AI app builder platforms 2026", "no-code AI tools", "AI development automation"

When a search result links to a competitor announcement, feature launch, or analysis article, use `WebFetch` to read the full content and identify specific features worth adopting.

### Evaluate Competitor Features
For each discovered feature:
1. **Differentiation**: Does our platform already have this? (Yes/No/Partial)
2. **User Value**: How much would users want this? (1-5)
3. **Feasibility**: Can we build it with current stack? (1-5)
4. **Competitive Edge**: Would this help stand out? (1-5)

## Step 3: Evaluate Relevance

For each discovered technology, evaluate:

1. **Relevance Score** (1-5): How applicable to AI Dev Request?
2. **Effort Score** (1-5): How much work to integrate? (1 = drop-in, 5 = major rewrite)
3. **Impact Score** (1-5): How much value would it add?

**Only proceed with technologies scoring:**
- Relevance >= 3
- Impact >= 3
- Effort <= 4

**In team mode:** Report all qualifying findings via SendMessage. The team lead will handle deduplication and ticket creation.

## Step 4: Create Suggestion Tickets (Standalone Mode Only)

**In team mode, skip this step — the team lead creates tickets after collecting findings from all scouts.**

For each qualifying technology, create a GitHub issue:

```bash
# REST — avoids GraphQL rate limit. Read body from draft file:
BODY=$(cat {draft-file}) && gh api --method POST "repos/bradyoo12/ai-dev-request/issues" -f title="{title}" -f body="$BODY" -f "labels[]=suggestion"
```

### Add to project and set status to Ready

Use hardcoded Project Field IDs from `policy.md` — never call `gh project field-list` or `gh project view` (saves 3 GraphQL calls per ticket).

```bash
# Add issue to project (GraphQL — no REST alternative)
ITEM_ID=$(gh project item-add 26 --owner bradyoo12 --url {issue-url} --format json --jq '.id')

# Set status to Ready using hardcoded IDs
gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 61e4505c
```

## Step 5: Report Summary

Log a summary of findings and tickets created.

**In team mode:** Send summary via SendMessage to team lead, then wait for shutdown.

## Important Notes

- **Do NOT create duplicate tickets** — always check existing issues first
- **Maximum 3 tickets per run** — focus on the most impactful suggestions
- **Set status to Ready** on the project board when adding tickets
- **Label all tickets with `suggestion`**
- If 4+ suggestion tickets already exist in Backlog, skip b-modernize entirely
- In team mode, report findings — do NOT create tickets directly
