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
| CodeQualityReview | AI-powered multi-dimensional code quality review result for a generated project |
| GenerationStream | Real-time streaming code generation session with SSE event tracking |
| BillingAccount | Usage-based billing account with hybrid pricing (subscription + metered AI usage) |
| McpConnection | MCP server connection record for platform and project-level tool integration |
| AnalyticsEvent | Platform analytics event for user behavior and funnel tracking |
| MarketplaceTemplate | Community-driven project generation template in the marketplace |
| ContainerConfig | Docker containerization configuration for a generated project |

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

## AI-Powered Test Generation

Automated test generation pipeline using Claude API to produce unit, integration, and E2E tests for generated projects:
- **Backend**: `TestGenerationService` reads project source files, auto-detects project type (React, .NET, Python, Vue, Svelte), sends code to Claude API (`claude-sonnet-4-20250514`) for comprehensive test generation, parses structured JSON with test file contents
- **Endpoints**:
  - `POST /api/projects/{id}/tests/generate` — trigger AI test generation
  - `GET /api/projects/{id}/tests/results` — get latest test generation results
  - `GET /api/projects/{id}/tests/history` — generation version history
- **Entity**: `TestGenerationRecord` persists generation results including status, file count, test count, coverage estimate, framework, version, and full test files JSON
- **Frontend**: `TestGenerationPage` in Settings with project ID selector, Generate Tests button, summary card (status badge, version, stats grid), coverage progress bar (color-coded), test files list with unit/integration/E2E filter, code preview on click, generation history panel
- **Test Frameworks**: Auto-selected based on project type — Vitest + React Testing Library + Playwright (React), xUnit + FluentAssertions (.NET), pytest (Python), etc.
- **File Resolution**: Reuses `ResolveProjectPathAsync` pattern from DevRequest records or `Projects:BasePath` directory; `ReadSourceFiles` skips `node_modules`, `dist`, `build`, existing test files, etc.
- **Flow**: Select project → Generate Tests → service reads source files → detects project type → Claude generates comprehensive tests → results persisted with version → UI shows files/coverage/stats → browse generated test code

## AI-Powered Code Quality Review

Multi-dimensional AI code review scoring architecture, security, performance, accessibility, and maintainability:
- **Backend**: `CodeQualityReviewService` reads actual project source files (`.ts`, `.tsx`, `.js`, `.cs`, `.py`, etc.), sends them to Claude API (`claude-sonnet-4-20250514`) for real 5-dimension analysis, parses structured JSON findings, and supports per-finding and bulk fix application
- **Endpoints**:
  - `POST /api/projects/{id}/review` — trigger AI code review
  - `GET /api/projects/{id}/review/results` — get latest review results
  - `GET /api/projects/{id}/review/history` — review version history
  - `POST /api/projects/{id}/review/fix/{findingId}` — apply AI fix for specific finding
  - `POST /api/projects/{id}/review/fix-all` — apply all fixes by severity
- **Frontend**: `CodeReviewPage` in Settings with dimension score bars, overall score badge, findings list with severity filtering, per-finding "Apply Fix" button, bulk fix actions, review history
- **Dimensions**: Architecture (separation of concerns), Security (XSS, auth), Performance (rendering, bundle), Accessibility (ARIA, keyboard), Maintainability (naming, types)
- **File Resolution**: `ResolveProjectPathAsync` looks up project path from DevRequest records or scans `Projects:BasePath` directory; `ReadSourceFiles` collects source files (excluding `node_modules`, `dist`, `build`, etc.) up to 50KB each
- **Flow**: Code generated → trigger review → service reads project source files → Claude API analyzes across 5 dimensions → structured findings with severity → user applies fixes → re-review shows improvement

## Real-Time Streaming Code Generation

Token-by-token streaming output for AI code generation via Server-Sent Events:
- **Backend**: `StreamingGenerationService` manages generation streams with `IAsyncEnumerable<StreamEvent>`, supports start/cancel/status operations
- **Endpoints**:
  - `GET /api/requests/{id}/generate/stream` — SSE endpoint (text/event-stream)
  - `POST /api/requests/{id}/generate/start` — start generation stream
  - `POST /api/requests/{id}/generate/cancel` — cancel active stream
  - `GET /api/requests/{id}/generate/status` — stream status
  - `GET /api/requests/{id}/generate/history` — stream history
- **SSE Events**: `stream_start`, `file_start`, `code_chunk`, `file_complete`, `progress_update`, `stream_complete`, `error`
- **Frontend**: `StreamingGenerationPage` in Settings with live code display, blinking cursor, file tabs with completion indicators, progress bar, token counter, cancel button, stream history
- **Flow**: Start generation → SSE connection opened → tokens stream in real-time → file tabs update → progress bar fills → stream completes

## Usage-Based Billing

Hybrid pricing infrastructure with subscription + metered AI usage and Stripe integration:
- **Backend**: `UsageBillingService` manages subscriptions, usage metering, invoicing, and Stripe portal sessions
- **Endpoints**:
  - `GET /api/billing/account` — get billing account
  - `POST /api/billing/subscribe` — subscribe to plan
  - `POST /api/billing/cancel` — cancel subscription
  - `GET /api/billing/usage` — current period usage summary
  - `GET /api/billing/invoices` — invoice history
  - `GET /api/billing/plans` — available pricing plans
  - `POST /api/billing/portal` — create Stripe customer portal session
  - `POST /api/webhooks/stripe` — Stripe webhook receiver
- **Pricing Tiers**: Free (3 requests/mo), Pro ($29/mo + $0.50/overage), Team ($99/mo + $0.30/overage)
- **Frontend**: `BillingPage` in Settings with plan card, usage meters, plan comparison, invoice history, Stripe portal link
- **Flow**: User signs up (free tier) → uses platform → tracks tokens/requests → upgrades plan → overage billed → invoices generated

## MCP Extensibility Layer

Model Context Protocol integration for platform tool exposure and external server connections:
- **Backend**: `McpIntegrationService` exposes platform capabilities as MCP tools and manages external MCP server connections
- **Platform Tools**: `create_request`, `analyze_request`, `generate_code`, `review_code`, `deploy_preview`
- **Endpoints**:
  - `GET /api/mcp/tools` — list platform MCP tools
  - `POST /api/mcp/tools/call` — execute platform MCP tool
  - `POST /api/mcp/servers` — register external MCP server
  - `DELETE /api/mcp/servers/{id}` — unregister server
  - `GET /api/mcp/servers` — list servers (optional projectId filter)
  - `GET /api/mcp/servers/{id}/status` — health check
  - `POST /api/mcp/servers/{id}/discover` — discover available tools
  - `POST /api/mcp/servers/{id}/tools/call` — call external tool
- **Transports**: SSE, stdio, gRPC
- **Frontend**: `McpIntegrationPage` in Settings with platform tool catalog, external server management, tool discovery, connection health monitoring
- **Flow**: External AI agents → call platform MCP tools → platform executes operations; Generated projects → connect to user's MCP servers → access external databases/APIs/services

## Product Analytics Dashboard

User behavior tracking and pipeline funnel analytics:
- **Backend**: `AnalyticsDashboardService` records events, aggregates metrics, computes funnel conversions and time-series trends
- **Endpoints**:
  - `POST /api/analytics/events` — record analytics event
  - `GET /api/analytics/dashboard` — aggregated metrics (active users, requests, completion rate, avg build time)
  - `GET /api/analytics/funnel` — funnel conversion (request → analysis → proposal → build → deploy)
  - `GET /api/analytics/usage` — feature usage breakdown
  - `GET /api/analytics/trends` — time-series trends by metric
- **Frontend**: `AnalyticsDashboardPage` in Settings with metrics cards, funnel visualization, usage breakdown, period-filtered trends

## Template Marketplace

Community-driven project scaffolding templates:
- **Backend**: `TemplateMarketplaceService` manages template catalog with browsing, filtering, rating, and import
- **Endpoints**:
  - `GET /api/marketplace/templates` — browse with category/tech/search filters
  - `GET /api/marketplace/templates/{id}` — template details
  - `POST /api/marketplace/templates` — submit new template
  - `POST /api/marketplace/templates/{id}/import` — import to new dev request
  - `POST /api/marketplace/templates/{id}/rate` — rate template (1-5)
  - `GET /api/marketplace/categories` — categories with counts
  - `GET /api/marketplace/templates/popular` — most downloaded
- **Categories**: Web App, API, Mobile, Automation, Data Pipeline
- **Frontend**: `MarketplacePage` in Settings with search, category filters, template grid, detail view, star ratings, import button, submit form

## Docker Containerization

One-click Docker containerization for generated projects:
- **Backend**: `ContainerizationService` detects tech stack, generates multi-stage Dockerfiles, docker-compose, and K8s manifests
- **Endpoints**:
  - `POST /api/projects/{id}/containers/generate` — generate Dockerfile and compose
  - `GET /api/projects/{id}/containers/config` — get container config
  - `POST /api/projects/{id}/containers/build` — trigger container build
  - `GET /api/projects/{id}/containers/status` — build status
  - `GET /api/projects/{id}/containers/logs` — build logs
  - `POST /api/projects/{id}/containers/deploy` — deploy container
  - `POST /api/projects/{id}/containers/k8s` — generate K8s manifest
- **Supported Stacks**: Node.js, .NET, Python, Static Web Apps
- **Frontend**: `ContainerizationPage` in Settings with Dockerfile preview, compose preview, K8s generation, build logs terminal, registry config, deploy button
- **Flow**: Project generated → detect stack → generate Dockerfile/compose → build → push to registry → deploy

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
