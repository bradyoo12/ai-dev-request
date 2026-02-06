# AI Dev Request Platform

## Overview

AI-powered development request platform. Users submit natural language development requests, and the platform analyzes, proposes, and builds software automatically.

## Repository

- **Repo**: bradyoo12/ai-dev-request
- **Default Branch**: main
- **Project Board**: https://github.com/users/bradyoo12/projects/26

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + shadcn/ui + Zustand + Tailwind CSS |
| Backend | .NET 9 + BradYoo.Core |
| AI Engine | Claude API |
| Database | PostgreSQL |
| Infra | Azure Container Apps |

## Project Structure

```
ai-dev-request/
├── platform/
│   ├── backend/AiDevRequest.API/   # .NET 9 API
│   ├── frontend/src/               # React web app
│   └── ai-engine/                  # Claude API integration
├── projects/                       # Generated customer projects
├── templates/                      # Scaffolding templates
└── .claude/                        # Claude Code config
```

## Key Files Reference

| Purpose | Path |
|---------|------|
| API Server | platform/backend/AiDevRequest.API/ |
| React App | platform/frontend/src/ |
| AI Engine | platform/ai-engine/ |
| Templates | templates/ |
| Generated Projects | projects/ |

## Working with This Project

### Before Making Changes

1. Check `.claude/policy.md` for development rules
2. Check `.claude/design.md` for architecture decisions
3. Run tests before committing

### BradYoo.Core Dependency

This project depends on bradyoo-core for shared infrastructure:
```csharp
// In .csproj
<ProjectReference Include="..\..\bradyoo-core\packages\core-backend\src\BradYoo.Core\BradYoo.Core.csproj" />
```

Changes to bradyoo-core may affect this project. Test after core updates.

### Frontend Commands

```bash
cd platform/frontend
npm install        # Install dependencies
npm run dev        # Start dev server
npm run build      # Production build
npm test           # Run tests
npx playwright test  # E2E tests
```

### Backend Commands

```bash
cd platform/backend/AiDevRequest.API
dotnet restore     # Restore packages
dotnet build       # Build
dotnet test        # Run tests
dotnet run         # Start server
```
