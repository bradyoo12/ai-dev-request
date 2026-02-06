---
description: Web search for recent technologies and competitor features, then create suggestion tickets in the AI Dev Request project.
allowed-prompts:
  - tool: Bash
    prompt: run gh commands for GitHub operations
  - tool: Bash
    prompt: run echo commands
---

## Mission

Search the web for:
1. **Recent technologies** and frameworks that could benefit the AI Dev Request platform
2. **Competitor features** from AI app builders and development automation platforms

Then create suggestion tickets for promising discoveries.

## Context

AI Dev Request is a SaaS platform for AI-powered development automation:
- **Backend**: .NET 9, BradYoo.Core, PostgreSQL
- **Frontend**: React + Vite + shadcn/ui + Zustand + Tailwind CSS
- **AI**: Claude API (requirement analysis + code generation)
- **Core**: Automated dev request → analysis → proposal → build pipeline

## Step 1: Load Existing Tickets

Before searching, check what suggestion tickets already exist to avoid duplicates:

```bash
gh issue list --repo bradyoo12/ai-dev-request --state open --json number,title,labels --limit 200
```

Note all existing titles to avoid creating duplicate suggestions.

## Step 2: Web Search for Recent Technologies

Search the web for recent technologies relevant to the platform. Focus on:

### Search Queries (run all)
1. **AI Code Generation**: Recent AI coding tools, Claude Code alternatives, agentic coding frameworks
2. **AI Agent Frameworks**: Agent orchestration tools, function-calling improvements, tool-use patterns
3. **Backend/.NET Innovations**: Recent .NET 9 libraries, performance tools, new EF Core features
4. **Frontend/React**: Recent React ecosystem tools, UI components, state management
5. **DevOps & Infrastructure**: Deployment, monitoring, CI/CD innovations for small teams

## Step 2B: Competitor Feature Research

### AI App Builder Competitors
Research features from AI-powered app/service builders:
- **Replit** - AI coding, deployment, collaboration features
- **Base44** - AI app generation features
- **Bolt.new** - AI full-stack app builder
- **v0.dev** - AI UI component generation
- **Cursor** - AI code editor features
- Search for: "AI app builder platforms 2026", "no-code AI tools", "AI development automation"

### AI Dev Request Competitors
- "AI development request platform"
- "automated software development SaaS"
- "AI project generation tools"

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

## Step 4: Create Suggestion Tickets

For each qualifying technology, create a GitHub issue:

```bash
gh issue create --repo bradyoo12/ai-dev-request --title "{title}" --body-file {draft-file} --label "suggestion"
```

### Add to project with NO status

```bash
gh project item-add 26 --owner bradyoo12 --url {issue-url}
```

Do NOT set any status field — leave it for human triage.

## Step 5: Report Summary

Log a summary of findings and tickets created.

## Important Notes

- **Do NOT create duplicate tickets** — always check existing issues first
- **Maximum 3 tickets per run** — focus on the most impactful suggestions
- **No status on project board** — suggestions need human triage
- **Label all tickets with `suggestion`**
- If 4+ suggestion tickets already exist in Backlog, skip b-modernize entirely
