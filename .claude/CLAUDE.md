# AI Dev Request Platform

AI-powered development request platform. Users submit natural language requests, and the platform analyzes, proposes, and builds software automatically.

## Repository

- **Repo**: bradyoo12/ai-dev-request | **Branch**: main
- **Project Board**: https://github.com/users/bradyoo12/projects/26

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7 + TypeScript 5.9 + shadcn/ui + Tailwind CSS 4 + Framer Motion |
| Backend | .NET 10 LTS + C# 14 + EF Core 10 + BradYoo.Core |
| AI Engine | Claude API (Anthropic SDK 5.9) |
| Database | PostgreSQL + pgvector (HNSW vector search) |
| Infra | Azure Container Apps + Static Web Apps |
| CI/CD | GitHub Actions |

## Quick Commands

```bash
# Frontend
cd platform/frontend && npm install && npm run dev      # Dev server
cd platform/frontend && npm run build                    # Build
cd platform/frontend && npm test                         # E2E (Playwright)
cd platform/frontend && npx vitest run                   # Unit tests

# Backend
cd platform/backend/AiDevRequest.API && dotnet build     # Build
cd platform/backend && dotnet test                       # Unit tests
```

## Reference Files

| File | Purpose |
|------|---------|
| `.claude/policy.md` | Development rules, ticket workflow, GitHub API strategy |
| `.claude/design.md` | Architecture, entities by domain, feature details |
| `.claude/inventory.md` | Complete file/feature map — find any controller, service, page |
| `.claude/conventions.md` | Coding patterns, file placement, naming rules |
| `.claude/infrastructure.md` | Deployment, CI/CD, Azure config, env vars |

**Before making changes**: Check `policy.md` for rules, `inventory.md` to find existing code, `conventions.md` for patterns.
