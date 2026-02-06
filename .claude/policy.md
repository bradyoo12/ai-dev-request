# AI Dev Request Development Policy

*Quick reference guide - read in 5 minutes*

## Project Settings

| Setting | Value |
|---------|-------|
| Project URL | https://github.com/users/bradyoo12/projects/26 |
| Project ID | 26 |
| Project Name | AI Dev Request |
| Owner | bradyoo12 |
| Repository | bradyoo12/ai-dev-request |
| Default Branch | main |

## Project Field IDs (for gh CLI)

| Field | ID | Options |
|-------|----|---------|
| Status | PVTSSF_lAHNf9fOATn4hM4PS3yh | Backlog: f75ad846, Ready: 61e4505c, In progress: 47fc9ee4, In review: df73e18b, Done: 98236657 |
| Priority | PVTSSF_lAHNf9fOATn4hM4PS3z6 | P0: 79628723, P1: 0a877460, P2: da944a9c |
| Size | PVTSSF_lAHNf9fOATn4hM4PS3z7 | XS: 6c6483d2, S: f784b110, M: 7515a9f1, L: 817d0097, XL: db339eb2 |
| Project Node ID | PVT_kwHNf9fOATn4hA | - |

## Ticket Management

### Labels
- **`on hold`** - Ticket requires human attention. Do NOT auto-process tickets with this label.

### Status Flow
```
Backlog → Ready → In Progress → In Review → Done
```

### Rules
1. Only tickets with explicit "Ready" status can be picked up for work
2. Items with no status (null) or "Backlog" must be ignored by the pipeline
3. One ticket at a time per workflow cycle

## Blocking Scenarios

### Hard Block → add `on hold` label (requires human action)
- Security concerns requiring human review
- Changes affect production-critical systems
- Tests fail repeatedly and cannot be auto-fixed
- Unclear requirements that need human clarification

### Soft Block → skip without labeling (retry next cycle)
- Prerequisite PRs not yet merged
- Dependent tickets not yet completed
- Missing dependencies that are being worked on in another ticket
- Implementation blocked by an in-progress ticket

Soft-blocked tickets are left unlabeled so the pipeline can automatically pick them up once prerequisites are met.

## Branch & PR Conventions

- **Branch naming**: `<ticket_number>-<slug-of-title>`
- **Commits**: Reference issue with "Refs #" (not "Fixes" or "Closes")
- **PRs**: Created from feature branch to main
- **Merge**: Only after human review removes `on hold` label

## Code Quality

- Follow existing project patterns and conventions
- Write clean, well-documented code
- Run tests before committing
- No untested code in PRs

## Human Review Required

These situations always require `on hold` label for human review:
- Database schema changes
- Authentication/authorization changes
- External API integration changes
- Configuration or environment changes
- Any breaking changes
- Payment/billing related changes

## No Human Review Required

These items can be decided autonomously without adding `on hold`:
- Database migration strategy for new tables (not schema changes to existing tables)
- Which template to use for generated projects
- UI/UX improvements within existing design patterns

## Automated Testing

- Use Playwright for E2E testing
- AI-assisted testing should simulate human behavior
- If tests cannot be run automatically, add `on hold` for manual testing

## Project Structure Reference

```
ai-dev-request/
├── platform/           # SaaS platform code
│   ├── backend/        # .NET 9 API server
│   ├── frontend/       # React + Vite web app
│   └── ai-engine/      # Claude API integration
├── projects/           # Generated customer projects
├── templates/          # Project generation templates
└── .claude/            # Claude Code configuration
```
