# AI Dev Request Architecture

## Overview

AI Dev Request is a SaaS platform that automates the software development lifecycle:
1. **Request** - Users submit development requests in natural language
2. **Analysis** - AI analyzes requests and derives technical requirements
3. **Proposal** - AI proposes implementation plan, tech stack, and cost/time estimates
4. **Build** - Upon approval, AI generates code and deploys automatically

## System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│           React + Vite + shadcn/ui + Zustand             │
│    Request Form → Analysis View → Proposal → Dashboard    │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│                 Backend (.NET 9)                          │
│              AiDevRequest.API + BradYoo.Core              │
│    Auth │ Request CRUD │ Project Mgmt │ Billing           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   AI Engine                               │
│              Claude API Integration                       │
│    Requirement Analysis │ Code Generation │ Deployment    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Database                                │
│                   PostgreSQL                              │
│    Users │ Requests │ Projects │ Billing │ Conversations  │
└───────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + shadcn/ui + Zustand + Tailwind CSS |
| Backend | .NET 9 + BradYoo.Core (shared auth, AI, data) |
| AI Engine | Claude API (analysis, code generation, deployment automation) |
| Database | PostgreSQL |
| Infrastructure | Azure Container Apps |
| CI/CD | GitHub Actions |

## Data Flow

```
User Request (natural language)
        │
        ▼
  AI Analysis Engine
  (Claude API: requirement extraction)
        │
        ▼
  Technical Proposal
  (stack, timeline, cost estimate)
        │
        ▼ (user approval)
  Code Generation
  (Claude Code / Agentic workflow)
        │
        ▼
  Auto Deployment
  (templates → project scaffolding → deploy)
```

## Key Entities

| Entity | Description |
|--------|-------------|
| User | Platform user (OAuth via BradYoo.Core) |
| DevRequest | A development request from user (includes PreviewUrl for mobile projects) |
| Proposal | AI-generated implementation proposal |
| Project | Generated project (code + deployment) |
| Conversation | Chat history for request refinement |
| SbomReport | SBOM and vulnerability scan results for a generated project |
| InfrastructureConfig | IaC configuration and generated Bicep templates for a project |

## Security & Compliance (SBOM)

Post-generation security scanning for every AI-generated project:
- **Backend**: `SecurityService` generates CycloneDX SBOMs, scans via OSV.dev API, checks license compatibility
- **Endpoints**:
  - `POST /api/projects/{id}/security/scan` — trigger SBOM generation + vulnerability scan
  - `GET /api/projects/{id}/security/sbom` — get SBOM report
  - `GET /api/projects/{id}/security/vulnerabilities` — get vulnerability results
  - `GET /api/projects/{id}/security/licenses` — get license analysis
  - `GET /api/projects/{id}/security/sbom/export/{format}` — export SBOM (cyclonedx/spdx)
- **Frontend**: `CompliancePage` in Settings with SBOM viewer, vulnerability results, license table, and export
- **Flow**: Project generated → auto-scan dependencies → flag CVEs → suggest safer alternatives

## Mobile Preview (Expo)

Mobile projects support instant QR code preview via Expo Snack:
- **Backend**: `ExpoPreviewService` generates Expo Snack URLs from built mobile project code
- **Endpoints**: `POST /api/requests/{id}/preview/expo` (generate), `GET /api/requests/{id}/preview` (retrieve)
- **Frontend**: `MobilePreview` component renders QR code for scanning with Expo Go app
- **Flow**: Build completes → detect mobile platform → show QR preview → user scans with Expo Go

## Self-Testing & Self-Healing Code Generation

Automated validate-fix loop that runs after AI code generation:
- **Backend**: `CodeValidationService` validates code for syntax, imports, structure, and entry points (scores 0-100)
- **Backend**: `SelfHealingService` orchestrates a generate→validate→fix loop (up to 3 iterations) using Claude API to fix issues
- **Integration**: Runs automatically after `ProductionService` generates code (non-breaking, wrapped in try-catch)
- **Entity**: `DevRequest` tracks `ValidationIterations`, `FixHistory` (JSON), `ValidationPassed`
- **Frontend**: `ValidationProgress` shows real-time build validation phases; `FixHistoryDisplay` shows collapsible fix history
- **Flow**: Code generated → validate → if issues, ask AI to fix → re-validate → repeat until pass or max retries

## Infrastructure-as-Code Auto-Generation

Automated Bicep/IaC template generation for every AI-generated project:
- **Backend**: `InfrastructureService` analyzes project requirements, generates Bicep templates, estimates Azure costs
- **Endpoints**:
  - `POST /api/projects/{id}/infrastructure/analyze` — AI-driven infrastructure analysis
  - `GET /api/projects/{id}/infrastructure/config` — get infrastructure config
  - `PUT /api/projects/{id}/infrastructure/config` — update user selections
  - `POST /api/projects/{id}/infrastructure/generate` — generate Bicep templates
  - `GET /api/projects/{id}/infrastructure/cost` — get cost estimation
  - `GET /api/projects/{id}/infrastructure/templates` — download generated templates
- **Frontend**: `InfrastructurePage` in Settings with service selector, tier selection, cost estimation, Bicep preview, and export
- **Templates**: Azure Container Apps, PostgreSQL Flexible Server, Blob Storage, Application Insights, Static Web Apps
- **Flow**: Project generated → analyze requirements → suggest infrastructure → user configures → generate Bicep → deploy with `azd up`

## Heterogeneous Model Architecture (Cost Optimization)

Intelligent model routing to reduce AI costs by using the cheapest sufficient model tier per task:
- **Backend**: `ModelRouterService` routes tasks to Haiku (simple), Sonnet (moderate), or Opus (complex) based on `TaskCategory`
- **Backend**: `CostTrackingService` tracks per-request model tier usage and calculates savings vs all-Opus baseline
- **Integration**: `AnalysisService`, `ProposalService`, `ProductionService` all use `IModelRouterService` to select model tier
- **Endpoints**: `GET /api/requests/{id}/cost-report` — per-request cost breakdown with tier usage and estimated savings
- **Entity**: `DevRequest` tracks `ModelTierUsage` (JSON), `EstimatedCostSavings` (decimal)
- **Frontend**: `CostSavingsDisplay` component shows tier breakdown bar chart and estimated savings after build
- **Flow**: Task submitted → classify category → route to cheapest sufficient tier → track usage → report savings

## Directory Structure

```
platform/
├── backend/
│   └── AiDevRequest.API/    # .NET 9 API
├── frontend/
│   └── src/                 # React app
└── ai-engine/               # AI analysis & code generation

projects/                    # Generated customer projects
├── proj-001-name/
└── proj-002-name/

templates/                   # Project scaffolding templates
├── web-app/
├── api-server/
└── automation/
```

## Integration with BradYoo Core

This project uses bradyoo-core for shared infrastructure:
- **Auth**: Google/Kakao OAuth, JWT via BradYoo.Core.Auth
- **AI**: Claude API client via BradYoo.Core.AI
- **Data**: Base DbContext, shared entities via BradYoo.Core.Data
