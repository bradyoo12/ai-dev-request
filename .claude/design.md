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
| SecretScanResult | Secret detection scan results for a generated project |
| PreviewDeployment | Edge preview deployment record for a generated project |
| GenerationManifest | Multi-file generation manifest with cross-file consistency validation |
| DevelopmentSpec | Structured specification (requirements/design/implementation) for a dev request |
| GitHubSync | Bidirectional GitHub repository sync record for a generated project |

## Spec-Driven Development Pipeline

Formal structured specifications before code generation (Kiro-style):
- **Backend**: `SpecificationService` generates three-phase specs: Requirements (user stories, acceptance criteria, edge cases) → Design (architecture, API contracts, data models, components) → Implementation (task list, dependency ordering, file estimates, traceability links)
- **Endpoints**:
  - `POST /api/requests/{id}/specs/generate` — trigger spec generation for a phase
  - `GET /api/requests/{id}/specs` — get current spec
  - `GET /api/requests/{id}/specs/history` — get spec version history
  - `POST /api/requests/{id}/specs/{specId}/approve` — approve a spec phase
  - `POST /api/requests/{id}/specs/{specId}/reject` — reject with feedback
  - `PUT /api/requests/{id}/specs/{specId}` — update spec (user edits)
- **Frontend**: `SpecificationPage` in Settings with three-phase stepper, approve/reject workflow, user edit mode, version history
- **Flow**: Dev request created → generate requirements spec → user reviews/approves → generate design spec → user reviews/approves → generate implementation spec → user approves → code generation begins

## GitHub Two-Way Sync

Bidirectional GitHub repository sync for generated projects (Lovable-style code ownership):
- **Backend**: `GitHubSyncService` manages repo connection, push/pull operations, webhook handling, conflict detection with HMAC-SHA256 signature verification
- **Endpoints**:
  - `POST /api/projects/{id}/github/connect` — link project to GitHub repo
  - `DELETE /api/projects/{id}/github/disconnect` — unlink from repo
  - `POST /api/projects/{id}/github/push` — push generated code to repo
  - `POST /api/projects/{id}/github/pull` — pull user changes from repo
  - `GET /api/projects/{id}/github/status` — sync status
  - `POST /api/projects/{id}/github/resolve` — resolve merge conflicts
  - `POST /api/webhooks/github` — webhook receiver for push events
  - `GET /api/projects/{id}/github/history` — sync operation history
- **Frontend**: `GitHubSyncPage` in Settings with connect form, status indicator, push/pull buttons, conflict resolution UI, sync history timeline
- **Flow**: Project generated → connect to GitHub repo → push code → webhook detects user changes → pull & merge → resolve conflicts if any

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

## Secret Detection & Secure Configuration

AI-powered secret detection and secure config management for generated projects:
- **Backend**: `SecretDetectionService` scans prompts and code for hardcoded secrets (regex + entropy analysis); `SecureConfigService` generates .env templates, gitignore, type-safe config modules, Key Vault configs
- **Endpoints**:
  - `POST /api/projects/{id}/secrets/scan` — trigger secret scan
  - `GET /api/projects/{id}/secrets/results` — get scan results
  - `GET /api/secrets/patterns` — list detection patterns
  - `POST /api/projects/{id}/secrets/config/generate` — generate secure config files
  - `GET /api/projects/{id}/secrets/config` — get generated config
- **Frontend**: `SecretDetectionPage` in Settings with scan results, pattern list, config preview, Key Vault status
- **Flow**: User prompt → sanitize secrets → generate code → post-scan for leaks → generate .env.example + gitignore + config module

## Edge-First Preview Deployments

Instant preview URLs for generated projects via edge deployment:
- **Backend**: `PreviewDeploymentService` deploys projects to edge (Azure Static Web Apps pattern), manages preview lifecycle
- **Endpoints**:
  - `POST /api/projects/{id}/preview/deploy` — trigger preview deployment
  - `GET /api/projects/{id}/preview/status` — deployment status
  - `GET /api/projects/{id}/preview/url` — get preview URL
  - `DELETE /api/projects/{id}/preview` — tear down preview
  - `GET /api/projects/{id}/previews` — list all previews
- **Frontend**: `PreviewDeploymentPage` in Settings with one-click deploy, URL display with copy, QR code for mobile, status indicator, preview history
- **Flow**: Project generated → one-click deploy → edge deployment → live URL in <5 seconds → QR code for mobile testing

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

## Structured Multi-File Generation Protocol

Cross-file consistency validation for AI-generated multi-file projects:
- **Backend**: `FileGenerationService` creates generation manifests, extracts imports/exports, builds cross-reference graphs, validates consistency (imports match exports, no cycles, no duplicate exports, API contract alignment)
- **Endpoints**:
  - `POST /api/projects/{id}/generation/manifest` — create generation manifest from file specs
  - `GET /api/projects/{id}/generation/manifest` — get manifest with validation status
  - `POST /api/projects/{id}/generation/validate` — trigger cross-file consistency validation
  - `POST /api/projects/{id}/generation/resolve` — AI-assisted conflict resolution
  - `GET /api/projects/{id}/generation/files` — list generated files with metadata
- **Frontend**: `GenerationManifestPage` in Settings with file tree, dependency graph, validation results, conflict resolution UI
- **Entity**: `GenerationManifest` tracks files (JSON), cross-references (JSON), validation results (JSON), status
- **Flow**: Files generated → create manifest → extract imports/exports → build cross-refs → validate consistency → resolve conflicts

## Compiler-in-the-Loop Validation

Compiler validation step ensuring generated code builds before delivery:
- **Backend**: `CompilerValidationService` runs real compilers (tsc, dotnet build, python compileall), parses errors/warnings, and auto-fixes via Claude API (up to 3 retries)
- **Endpoints**:
  - `POST /api/projects/{id}/compiler/validate` — trigger compilation validation
  - `GET /api/projects/{id}/compiler/result` — get latest compilation result
  - `POST /api/projects/{id}/compiler/fix` — auto-fix compilation errors with AI
  - `GET /api/compiler/languages` — list supported languages
- **Frontend**: `CompilerValidationPage` in Settings with status indicator, error/warning lists, auto-fix button, retry history, language selector
- **Entity**: `CompilationResult` tracks language, success, errors (JSON), warnings (JSON), retryCount, compiledAt
- **Flow**: Code generated → compile → if errors, feed to AI → regenerate → recompile → repeat until pass or max retries

## Durable AI Workflow Orchestration

Fault-tolerant generation pipeline with step-level retry and cancellation:
- **Backend**: `WorkflowOrchestrationService` manages durable workflows (analysis -> proposal -> generation -> validation -> deployment), supports per-step retry, cancellation, and metrics aggregation
- **Endpoints**:
  - `POST /api/workflows/start` — start a durable workflow for a dev request
  - `GET /api/workflows/{executionId}` — get workflow execution status
  - `POST /api/workflows/{executionId}/retry/{stepName}` — retry a failed step
  - `POST /api/workflows/{executionId}/cancel` — cancel a running workflow
  - `GET /api/workflows` — list all workflow executions
  - `GET /api/workflows/metrics` — aggregate success/failure rates, avg duration
- **Frontend**: `WorkflowPage` in Settings with execution list, pipeline visualization, step details, retry/cancel, and metrics dashboard
- **Entity**: `WorkflowExecution` tracks devRequestId, workflowType, status, steps (JSON), retryCount, timestamps
- **Flow**: Dev request created -> start workflow -> execute steps sequentially -> on failure, user can retry step or cancel -> metrics track success rates

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
