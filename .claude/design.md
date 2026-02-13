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
| Frontend | React 18 + Vite + TypeScript + shadcn/ui + Zustand + Tailwind CSS + Framer Motion |
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
| OnboardingProgress | User onboarding wizard progress tracking with step completion milestones |
| ProjectVersion | Versioned snapshot of a generated project with file-level diff capabilities |
| ComponentPreview | Visual component preview with conversational iteration for design refinement |
| GenerationVariant | A/B variant of generated code with approach, metrics, rating, and selection status |
| PerformanceProfile | Multi-dimensional performance profiling result with scores, suggestions, and optimization history |
| DataSchema | NL-designed database schema with entities, relationships, validation, and multi-target code generation |
| SupportPost | Customer support post with public read, auth write, admin reward credits |
| SelfHealingTestResult | Self-healing test automation result with healed/failed test details and confidence scores |
| DatabaseBranch | Git-like database branch for preview environments with schema versioning and merge/discard |
| SandboxExecution | Sandboxed code execution record with isolation level, resource usage, and security violation tracking |

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

## Real-Time Collaborative Editing

CRDT-based collaborative editing for dev requests with presence tracking and activity feeds:
- **Backend**: `CollaborativeEditingService` manages session lifecycle (create, join, update, end), participant tracking with color-coded avatars, document versioning, and activity feed persistence
- **Endpoints**:
  - `POST /api/projects/{id}/collab/session` — create collaborative session
  - `GET /api/projects/{id}/collab/session` — get active session
  - `POST /api/projects/{id}/collab/join` — join existing session
  - `PUT /api/projects/{id}/collab/document` — update shared document
  - `POST /api/projects/{id}/collab/end` — end session
  - `GET /api/projects/{id}/collab/history` — session history
- **Entity**: `CollaborativeSession` with participants JSON (userId, displayName, color), activity feed JSON, document content, version tracking
- **Frontend**: `CollaborativeEditingPage` in Settings with create/join session panels, collaborative text editor with save, activity feed with action icons (created/joined/edited/ended), participant avatar circles with color coding, stats grid (participants/version/activities/last activity), session history
- **Flow**: Create session → share with team → participants join → edit document collaboratively → activity tracked → end session → view history

## Project Version History with Visual Diff

Browse, compare, and rollback project versions with file-level visual diffs:
- **Backend**: `ProjectVersionController` provides dedicated REST endpoints for version management; `ProjectVersionService` extended with `GetVersionAsync`, `GetLatestVersionAsync`, `GetDiffAsync` methods and `VersionDiff` class for computing file-level diffs
- **Endpoints**:
  - `GET /api/projects/{id}/versions` — list all versions
  - `GET /api/projects/{id}/versions/{versionId}` — get version details
  - `GET /api/projects/{id}/versions/latest` — get latest version
  - `GET /api/projects/{id}/versions/{fromId}/diff/{toId}` — diff between two versions
  - `POST /api/projects/{id}/versions/{versionId}/rollback` — rollback to version
- **Entity**: `ProjectVersion` with Id (Guid), DevRequestId, VersionNumber, Label, Source (build/rebuild/rollback), FileCount, SnapshotPath, ChangedFilesJson, CreatedAt
- **Diff**: `VersionDiff` computes added, removed, and modified files between two version snapshots by comparing deserialized file lists
- **Frontend**: `ProjectVersionPage` in Settings with project ID input, version timeline with color-coded source badges (blue=build, purple=rebuild, yellow=rollback), latest indicator, rollback buttons, interactive diff viewer with from/to version selectors, summary stats (added/removed/modified counts), and color-coded file lists
- **Flow**: Enter project ID → load versions → browse timeline → select two versions → compare diffs → view file changes → rollback if needed

## Interactive Onboarding Wizard

Guided first-request flow for new users with step-by-step milestone tracking:
- **Backend**: `OnboardingService` manages user onboarding progress, step completion, skip, and reset operations
- **Endpoints**:
  - `GET /api/onboarding/progress` — get user's onboarding progress
  - `POST /api/onboarding/step/{step}` — mark step completed
  - `POST /api/onboarding/skip` — skip onboarding
  - `POST /api/onboarding/reset` — restart onboarding
- **Entity**: `OnboardingProgress` with userId (unique), currentStep, completedStepsJson (JSON array), status (active/completed/skipped), timestamps
- **Milestones**: account_created → first_request → analysis_viewed → proposal_reviewed → build_completed → preview_deployed
- **Frontend**: `OnboardingPage` in Settings with progress bar (color-coded), step-by-step checklist with icons and mark-complete buttons, skip/reset actions, stats grid (current step/completed/remaining/progress percentage)
- **Flow**: User signs up → onboarding auto-created → complete steps sequentially → progress tracked → skip or complete → reset anytime

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
- **Frontend**: `CodeReviewPage` in Settings with dimension score bars, overall score badge, findings list with severity filtering, confidence badge per finding, side-by-side diff viewer (original vs suggested fix), "Accept" button, bulk fix actions, review history
- **Intelligent Auto-Fix**: All findings with file references get auto-fix suggestions (not just critical). Claude API returns JSON with `fix` and `confidence` (0-100%). Original code context (±3 lines) extracted for diff comparison. Frontend displays confidence percentage with color coding (green ≥80%, yellow ≥50%, red <50%) and a toggleable diff viewer showing original code vs suggested fix side-by-side
- **Dimensions**: Architecture (separation of concerns), Security (XSS, auth), Performance (rendering, bundle), Accessibility (ARIA, keyboard), Maintainability (naming, types)
- **File Resolution**: `ResolveProjectPathAsync` looks up project path from DevRequest records or scans `Projects:BasePath` directory; `ReadSourceFiles` collects source files (excluding `node_modules`, `dist`, `build`, etc.) up to 50KB each
- **Flow**: Code generated → trigger review → service reads project source files → Claude API analyzes across 5 dimensions → structured findings with severity → auto-fix generates suggested fixes with confidence scores → user views diff and accepts/rejects fixes → re-review shows improvement

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

## Platform Growth Metrics Dashboard

Admin-only growth analytics tracking visitor, trial, and paid user metrics:
- **Backend**: `AdminGrowthController` with `GrowthService` for event recording, trend analysis, conversion funnels, and CSV export
- **Endpoints**:
  - `GET /api/admin/growth/overview` — KPI summary (visitors, registered, trial, paid, growth rate, conversion, churn)
  - `GET /api/admin/growth/trends?months=N` — monthly growth trends
  - `GET /api/admin/growth/funnel` — conversion funnel (visitor → registered → trial → paid)
  - `POST /api/admin/growth/events` — record platform events
  - `GET /api/admin/growth/export` — CSV export
- **Entities**: `PlatformEvent` (event tracking), `GrowthSnapshot` (pre-computed aggregations)
- **Frontend**: `GrowthDashboardPage` at `/admin/growth` with KPI cards, stacked bar chart trends, conversion funnel visualization, CSV export
- **Flow**: Events recorded → daily/monthly snapshots aggregated → admin views dashboard → exports CSV

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

## Visual Component Preview

v0.dev-style visual component preview with conversational iteration for design refinement:
- **Backend**: `ComponentPreviewService` manages preview lifecycle including creation (generates React/Tailwind component code from prompt), conversational iteration (applies style transformations via chat), export, and deletion
- **Endpoints**:
  - `GET /api/component-preview` — list user's component previews
  - `GET /api/component-preview/{id}` — get specific preview
  - `POST /api/component-preview` — create new component from name + prompt
  - `POST /api/component-preview/{id}/iterate` — iterate on component via chat message
  - `POST /api/component-preview/{id}/export` — export component for use in project
  - `DELETE /api/component-preview/{id}` — delete preview
- **Entity**: `ComponentPreview` with Id (Guid), UserId, ComponentName, Code (text), ChatHistoryJson (jsonb), IterationCount, Status (draft/generating/ready/exported), DesignTokensJson (jsonb), timestamps
- **Frontend**: `ComponentPreviewPage` in Settings with create form (name + prompt), split layout — component list (left) with status badges and active preview (right) with code preview, live iframe sandbox with Tailwind CDN, and chat interface for conversational iteration
- **Live Preview**: Sandboxed iframe rendering with `generatePreviewHtml()` (injects Tailwind CDN) and `extractJsx()` (extracts return JSX, converts className to class)
- **Flow**: Enter component name + prompt → AI generates React component → live preview in iframe → iterate via chat → export when satisfied

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

## A/B Variant Generation & Comparison

Prompt branching to generate multiple implementation variants from the same request:
- **Backend**: `VariantGenerationService` generates 3 variants per request (minimal, balanced, feature-rich) with different code complexity, dependency counts, and model tiers. Stores results as `GenerationVariant` entities with JSON file storage.
- **Endpoints**:
  - `POST /api/requests/{id}/variants/generate` — generate 3 variants from a description
  - `GET /api/requests/{id}/variants` — list all variants for a request
  - `GET /api/requests/{id}/variants/{variantId}` — get specific variant details
  - `POST /api/requests/{id}/variants/{variantId}/select` — select winning variant
  - `POST /api/requests/{id}/variants/{variantId}/rate` — rate variant (1-5 stars)
  - `DELETE /api/requests/{id}/variants` — delete all variants
- **Frontend**: `VariantComparisonPage` in Settings with side-by-side 3-column variant cards showing approach badges, metrics (files, LOC, dependencies, bundle size), model tier, star ratings, file preview, and selection workflow
- **Approaches**: Minimal (lean, few deps), Balanced (standard best practices), Feature-Rich (comprehensive with search, filter, stats, localStorage)

## AI Performance Profiling & Auto-Optimization

Automated performance analysis and AI-driven optimization for generated projects:
- **Backend**: `PerformanceProfileService` analyzes bundle size, rendering patterns, data loading, accessibility, and SEO — generating scores (0-100) and 11 categorized optimization suggestions with impact/effort ratings. `OptimizeAsync` applies fixes and recalculates scores.
- **Endpoints**:
  - `POST /api/projects/{id}/performance/profile` — run performance profiling
  - `GET /api/projects/{id}/performance/results` — get latest profile results
  - `GET /api/projects/{id}/performance/history` — optimization history
  - `POST /api/projects/{id}/performance/optimize` — auto-apply selected optimizations
- **Frontend**: `PerformanceProfilePage` in Settings with color-coded score cards (green ≥80, yellow ≥60, red <60), categorized suggestion cards with impact/effort indicators, individual and bulk "Fix All" optimization, profile history timeline
- **Dimensions**: Bundle (tree-shaking, code-splitting, image optimization), Rendering (memoization, virtualization), Data Loading (caching, pagination), Accessibility (ARIA, keyboard nav), SEO (meta tags, semantic HTML)

## Natural Language Database Schema Designer

Describe data models in natural language, AI generates entities, relationships, SQL DDL, and full-stack code:
- **Backend**: `SchemaDesignerService` parses NL prompts to extract entity keywords (user, post, comment, tag, product, order, etc.), generates typed columns per entity, infers relationships, validates schema consistency, and generates multi-target code (SQL DDL, EF Core entities, REST controllers, TypeScript/React hooks)
- **Endpoints**:
  - `POST /api/requests/{id}/schema/design` — design schema from NL prompt
  - `GET /api/requests/{id}/schema` — get current schema
  - `PUT /api/requests/{id}/schema/{schemaId}` — update entities/relationships manually
  - `POST /api/requests/{id}/schema/{schemaId}/validate` — validate schema consistency
  - `POST /api/requests/{id}/schema/{schemaId}/generate` — generate SQL + code artifacts
- **Entity**: `DataSchema` with Prompt, EntitiesJson (jsonb), RelationshipsJson (jsonb), ValidationJson (jsonb), EntityCount, RelationshipCount, GeneratedSql (text), GeneratedEntities (text), GeneratedControllers (text), GeneratedFrontend (text), Status (designing/validated/generated)
- **Frontend**: `SchemaDesignerPage` in Settings with NL prompt input, entity cards with column details, relationship visualization, validation issue display (color-coded by severity), tabbed code viewer (SQL DDL / EF Core / REST Controllers / TypeScript React)
- **Flow**: Enter request ID + NL description → AI parses entities & relationships → visualize schema → validate → generate SQL + EF Core + REST + TypeScript code

## Centralized Auth Error Handling

Unified 401 response handling across all authenticated frontend API calls:
- **`authFetch` wrapper** (`auth.ts`): Wraps `fetch` to attach JWT Bearer headers and intercept 401 responses. On 401, clears localStorage auth data and dispatches `auth-expired` CustomEvent
- **`AuthContext`**: Listens for `auth-expired` event to trigger logout (clear user state + token balance) and show login modal
- **`settings.ts`**: Uses `authFetch` instead of raw `fetch` + `getAuthHeaders()`, ensuring all settings/tokens API calls (getTokenOverview, getTokenHistory, purchaseTokens, etc.) automatically handle expired/invalid tokens
- **Flow**: Authenticated API call → 401 response → `authFetch` clears auth + dispatches event → `AuthContext` shows login modal → user re-authenticates
- **Guard**: `loadTokenBalance` skips API call when `isAuthenticated()` returns false, preventing unnecessary 401s on unauthenticated pages

## API Key Management for CLI/SDK Access

Secure API key management enabling programmatic access to the platform:
- **Backend**: `ApiKey` entity with SHA-256 key hashing, `ApiKeysController` with generate/list/revoke endpoints
- **Endpoints**:
  - `GET /api/apikeys` — list all API keys for current user
  - `POST /api/apikeys` — generate new key (returns raw key once, stores hash)
  - `DELETE /api/apikeys/{id}` — revoke an API key
- **Entity**: `ApiKey` with Id (Guid), UserId, Name, KeyHash (SHA-256), KeyPrefix (`aidev_...xxxx`), Status (Active/Revoked), RequestCount, CreatedAt, LastUsedAt, RevokedAt
- **Security**: Max 5 active keys per user, raw key shown only at creation, SHA-256 hashing for storage, unique index on KeyHash, cascade delete with User
- **Frontend**: `ApiCliPage` in Settings with "API & CLI" tab — key list with status badges, generate form with name input, copy-to-clipboard on creation, revoke per key, cURL quick start guide
- **Flow**: User opens Settings → API & CLI tab → enters key name → Generate Key → copy raw key (shown once) → use in API calls with `Authorization: Bearer` header

## Visual Drag-and-Drop Pipeline Builder

Custom dev request pipeline builder with drag-and-drop step reordering:
- **Backend**: `DevPipeline` entity with JSON steps storage, `PipelinesController` with full CRUD (list/get/create/update/delete)
- **Endpoints**:
  - `GET /api/pipelines` — list user pipelines + public templates
  - `GET /api/pipelines/{id}` — get single pipeline
  - `POST /api/pipelines` — create pipeline (max 20 per user)
  - `PUT /api/pipelines/{id}` — update pipeline name/description/steps
  - `DELETE /api/pipelines/{id}` — delete pipeline
- **Entity**: `DevPipeline` with Id (Guid), UserId, Name, Description, StepsJson (JSON array), Status (Draft/Active/Archived), IsTemplate, TemplateCategory, ExecutionCount, CreatedAt, UpdatedAt
- **Step Types**: analyze, design, generate, test, review, deploy, custom — each with color-coded border and icon
- **Templates**: Web App (6 steps), API Service (5 steps), Mobile App (5 steps)
- **Frontend**: `PipelineBuilderPage` in Settings with "Pipelines" tab — pipeline list with status badges, template picker grid, drag-and-drop step editor with inline name editing, enable/disable toggles, add/remove steps, color-coded step types
- **Flow**: User opens Settings → Pipelines tab → create from template or blank → drag steps to reorder → edit step names → toggle enable/disable → save pipeline

### Auto-Generated OpenAPI Docs and Client SDK Management (#260)

OpenAPI 3.1 specification generation and multi-language client SDK management for generated backend projects:
- **Backend**: `ApiDocConfig` entity with endpoints JSON storage, `ApiDocsController` with CRUD + spec generation endpoint
- **Endpoints**:
  - `GET /api/apidocs` — list user API doc configs
  - `GET /api/apidocs/{id}` — get single config
  - `POST /api/apidocs` — create config (max 50 per user)
  - `PUT /api/apidocs/{id}` — update config
  - `DELETE /api/apidocs/{id}` — delete config
  - `POST /api/apidocs/{id}/generate` — generate OpenAPI 3.1 spec from stored endpoints
  - `GET /api/apidocs/sdk-languages` — list available SDK languages
- **Entity**: `ApiDocConfig` with Id (Guid), UserId, ProjectName, Description, EndpointsJson (JSON array), OpenApiSpecJson, SdkLanguages (comma-separated), Status (Draft/Generated/Published), DevRequestId, CreatedAt, UpdatedAt
- **SDK Languages**: TypeScript, Python, C#, Go, Java, Kotlin — each with package manager info
- **Spec Generation**: Builds OpenAPI 3.1 JSON from endpoint metadata (path, method, summary, tag, requestBody, responseType)
- **Frontend**: `ApiDocsPage` in Settings with "API Docs" tab — doc list with status badges, endpoint editor with HTTP method selector, SDK language toggle buttons, spec preview with JSON copy, color-coded HTTP methods (GET=green, POST=blue, PUT=yellow, PATCH=orange, DELETE=red)
- **Flow**: User opens Settings → API Docs tab → create new → define endpoints → select SDK languages → save → generate OpenAPI spec → view/copy spec JSON

### Incremental Code Regeneration with Smart Merge (#259)

Code snapshot tracking and smart merge system that preserves user modifications when AI regenerates code:
- **Backend**: `CodeSnapshot` entity tracking baseline vs user content, `CodeMergeController` with full CRUD + conflict resolution
- **Endpoints**:
  - `GET /api/codemerge/snapshots` — list snapshots (optional devRequestId filter)
  - `GET /api/codemerge/snapshots/{id}` — get single snapshot
  - `PUT /api/codemerge/snapshots/{id}/user-content` — save user modifications
  - `PUT /api/codemerge/snapshots/{id}/lock` — toggle file lock to prevent overwrites
  - `POST /api/codemerge/snapshots/{id}/resolve` — resolve conflict (keep-user, keep-ai, or custom merge)
  - `GET /api/codemerge/stats` — merge statistics (total, synced, modified, conflicted, merged, locked)
  - `POST /api/codemerge/snapshots` — create snapshot (auto-detects conflicts with existing user content)
- **Entity**: `CodeSnapshot` with Id (Guid), UserId, DevRequestId, FilePath, BaselineContent, UserContent, IsLocked, Version, Status (Synced/UserModified/Conflicted/Merged), CreatedAt, UpdatedAt
- **Conflict Detection**: When creating a snapshot for an existing file, if user has modifications (UserContent differs from BaselineContent), status is set to Conflicted instead of overwriting
- **Frontend**: `CodeMergePage` in Settings with "Code Merge" tab — 6 stats cards (Total/Synced/Modified/Conflicts/Merged/Locked) with color coding, filter tabs (All/Modified/Conflicts/Locked), file list with status badges and version numbers, side-by-side diff viewer (AI baseline vs user version), conflict resolution buttons ("Keep My Changes" / "Keep AI Version")
- **Flow**: AI generates code → snapshots created tracking baseline → user edits files → status changes to UserModified → AI regenerates → conflict detected → user resolves via side-by-side diff viewer

### Voice-Driven Development Input with Real-Time Speech-to-Text (#261)

Browser-native voice input using the Web Speech API for hands-free development request creation:
- **Backend**: `VoiceConfig` entity for user voice preferences, `VoiceController` with config management, transcription logging, and stats
- **Endpoints**:
  - `GET /api/voice/config` — get or create user voice configuration
  - `PUT /api/voice/config` — update voice settings (language, continuous mode, auto-punctuate, TTS)
  - `POST /api/voice/transcription` — log a voice transcription session (text, duration, language)
  - `GET /api/voice/stats` — voice usage statistics (session count, total/avg duration)
  - `GET /api/voice/languages` — list supported voice languages
- **Entity**: `VoiceConfig` with Id (Guid), UserId, Language, ContinuousMode, AutoPunctuate, TtsEnabled, TtsVoice, TtsRate, TranscriptionHistoryJson, SessionCount, TotalDurationSeconds, CreatedAt, UpdatedAt
- **Supported Languages**: English (US/UK), Korean, Japanese, Chinese, German, French, Spanish
- **Speech Recognition**: Web Speech API (SpeechRecognition) — zero backend cost, browser-native, supports continuous dictation and interim results
- **Frontend**: `VoicePage` in Settings with "Voice" tab — microphone button with pulse animation, real-time transcript display with interim text, copy/clear transcript controls, 3 stats cards (Sessions/Total Duration/Avg Duration), settings panel with language selector, toggle switches for continuous mode/auto-punctuate/TTS, TTS rate slider
- **Flow**: User opens Settings → Voice tab → configure language → click microphone button → speak → see real-time transcript → copy text to use in dev requests

### Multi-Model Intelligent Routing for AI Cost Optimization (#265)

Automatically routes AI tasks to optimal model tiers (Fast/Standard/Premium) based on task complexity to reduce costs:
- **Backend**: `ModelRoutingConfig` entity for per-user routing preferences, `ModelRoutingController` with config management, stats, tier info, and task types
- **Endpoints**:
  - `GET /api/model-routing/config` — get or create user routing configuration
  - `PUT /api/model-routing/config` — update routing settings (enabled, default tier, task routing JSON, budget)
  - `GET /api/model-routing/stats` — routing usage statistics (tokens per tier, decisions, cost, savings)
  - `GET /api/model-routing/tiers` — available model tiers (Fast=Haiku/$0.00025, Standard=Sonnet/$0.003, Premium=Opus/$0.015)
  - `GET /api/model-routing/task-types` — 15 supported task types with default tier assignments
- **Entity**: `ModelRoutingConfig` with Id (Guid), UserId, Enabled, DefaultTier, TaskRoutingJson, MonthlyBudget, CurrentMonthCost, FastTierTokens, StandardTierTokens, PremiumTierTokens, TotalRoutingDecisions, EstimatedSavings, CreatedAt, UpdatedAt
- **Model Tiers**: Fast (Claude Haiku, 500ms, $0.00025/1K), Standard (Claude Sonnet, 2000ms, $0.003/1K), Premium (Claude Opus, 5000ms, $0.015/1K)
- **Task Types**: 15 types across 3 tiers — Fast (formatting, naming, boilerplate, comments, simple-refactor), Standard (code-generation, bug-fixing, testing, documentation, api-design), Premium (architecture, security-review, complex-refactor, system-design, optimization)
- **Frontend**: `ModelRoutingPage` in Settings with "AI Models" tab — enable/disable toggle, 4 stats cards (Routing Decisions/Savings/Month Cost/Budget), token distribution by tier with color dots, 3 model tier cards with cost and latency info, task routing matrix with clickable tier selectors, budget settings with default tier dropdown and monthly budget input
- **Flow**: User opens Settings → AI Models tab → enable routing → configure per-task tier assignments → set monthly budget → system routes tasks automatically and tracks savings

### Codebase Context Indexing with Vector Embeddings (#266)

Indexes project files for intelligent context retrieval using embeddings, dependency graphs, and semantic search:
- **Backend**: `ProjectIndex` entity for file-level indexing, `ProjectIndexController` with 6 endpoints for CRUD, retrieval, and dependency management
- **Endpoints**:
  - `GET /api/project-index/summary/{projectId}` — index summary (total files, indexed, stale, modified, size, languages)
  - `GET /api/project-index/files/{projectId}` — all indexed files with metadata
  - `POST /api/project-index/index` — index or re-index a single file (upsert by userId+projectId+filePath)
  - `POST /api/project-index/retrieve` — retrieve top-K most relevant files for a query (simulated RAG, prioritizes user-modified files)
  - `GET /api/project-index/dependencies/{projectId}` — dependency graph as edge list (from → to)
  - `POST /api/project-index/mark-stale` — mark files as needing re-index after user modifications
- **Entity**: `ProjectIndex` with Id (Guid), UserId, DevRequestId, FilePath, ContentHash (SHA-256), FileSize, Language, EmbeddingJson (vector), DependenciesJson, DependentsJson, Summary, ExportedSymbols, RelevanceScore, IsUserModified, NeedsReindex, IndexedAt, CreatedAt, UpdatedAt
- **Frontend**: `ContextIndexPage` in Settings with "Context Index" tab — project ID input, 4 stats cards (Total Files/Indexed/Stale/Total Size), language tags with color coding, context retrieval search bar, 3 tabs (Files with filter all/indexed/stale/modified, Dependencies edge list, Retrieved ranked results), file list with status dots and metadata
- **Flow**: User enters project ID → loads index summary → browses files by filter → views dependency graph → searches for relevant context via semantic query → results ranked by relevance

### AI-Powered Deployment Health Monitoring with Auto-Rollback (#267)

Monitors deployed projects for uptime, errors, and performance degradation, with automatic rollback when problems are detected:
- **Backend**: `DeploymentHealth` entity for per-project monitoring, `DeploymentHealthController` with 6 endpoints for config, stats, health checks, events, and incidents
- **Endpoints**:
  - `GET /api/deployment-health/config/{projectId}` — get or create health monitoring config
  - `PUT /api/deployment-health/config/{projectId}` — update monitoring settings (URL, interval, thresholds, auto-rollback)
  - `GET /api/deployment-health/stats/{projectId}` — health statistics (uptime, error rate, latencies, rollback count)
  - `POST /api/deployment-health/check` — record a health check result (success/fail, response time, error)
  - `GET /api/deployment-health/events/{projectId}` — recent health events timeline (last 100)
  - `GET /api/deployment-health/incidents/{projectId}` — incident history (auto-rollbacks, outages)
- **Entity**: `DeploymentHealth` with Id (Guid), UserId, DevRequestId, DeploymentUrl, Status (up/degraded/down/unknown), MonitoringEnabled, CheckIntervalSeconds, ErrorRateThreshold, LatencyThresholdMs, TotalChecks, SuccessfulChecks, FailedChecks, CurrentErrorRate, AvgResponseTimeMs, P95ResponseTimeMs, P99ResponseTimeMs, UptimePercentage, RollbackCount, AutoRollbackEnabled, LastGoodVersionId, HealthEventsJson, IncidentsJson
- **Auto-Rollback Logic**: When error rate exceeds threshold (default 10%) after 5+ checks with auto-rollback enabled, triggers rollback and records incident
- **Frontend**: `DeploymentHealthPage` in Settings with "Health" tab — status banner with animated pulse dot, 4 stats cards (Uptime/Avg Response/Error Rate/Total Checks), latency breakdown (P50/P95/P99), 4 tabs (Overview with config summary, Events timeline, Incidents history, Settings with toggles and threshold inputs)
- **Flow**: User enters project ID → sees status banner (Healthy/Degraded/Down) → views stats and latency breakdown → browses health events → reviews incident history → configures monitoring settings and auto-rollback thresholds

### #271 — Streaming Generative UI Chat Interface (PR #274)
- **Endpoints**:
  - `GET /api/generative-ui/session/{projectId}` — get or create chat session
  - `PUT /api/generative-ui/session/{projectId}` — update session settings (streaming, generative UI, model)
  - `POST /api/generative-ui/message` — send message and get AI response with optional component generation and tool calls
  - `GET /api/generative-ui/messages/{projectId}` — chat history (last N messages)
  - `GET /api/generative-ui/components/{projectId}` — list generated UI components
  - `GET /api/generative-ui/tools/{projectId}` — available tool definitions
- **Entity**: `GenerativeUiSession` with Id (Guid), UserId, DevRequestId, SessionName, Status, TotalMessages, AiMessages, UserMessages, GeneratedComponents, ToolCallCount, StreamingEnabled, GenerativeUiEnabled, ActiveModel, TotalTokensUsed, EstimatedCost, MessagesJson, ToolDefinitionsJson, GeneratedComponentsJson, ReasoningStepsJson
- **Frontend**: `GenerativeUiPage` in Settings with "Gen UI" tab — chat interface with message bubbles, component rendering, tool call display, typing indicator, 4 tabs (Chat/Components/Tools/Settings), model selector, streaming and generative UI toggles, session statistics
- **Flow**: User enters project ID → starts chat session → sends messages → AI responds with text, generated components, and tool calls → user views generated components gallery → configures chat settings (model, streaming, generative UI toggle)

### #272 — Mobile App Generation with React Native and App Store Publishing (PR #275)
- **Endpoints**:
  - `GET /api/mobile-app/config/{projectId}` — get or create mobile app configuration
  - `PUT /api/mobile-app/config/{projectId}` — update app settings (name, bundle ID, version, platform toggles)
  - `POST /api/mobile-app/build` — trigger build for iOS, Android, or both (simulates build + generates Expo QR URL)
  - `POST /api/mobile-app/publish` — publish to App Store and/or Google Play
  - `GET /api/mobile-app/screens/{projectId}` — list app screens
  - `GET /api/mobile-app/builds/{projectId}` — build history
- **Entity**: `MobileAppConfig` with Id (Guid), UserId, DevRequestId, AppName, BundleId, Platform (ios/android/both), Framework (react-native), Status, AppVersion, BuildNumber, IconUrl, SplashScreenUrl, ExpoEnabled, ExpoQrCodeUrl, PreviewUrl, IosEnabled, AndroidEnabled, IosBuildStatus, AndroidBuildStatus, IosPublishStatus, AndroidPublishStatus, TotalScreens, TotalComponents, NavigationStructureJson, ScreenListJson, BuildHistoryJson, PublishHistoryJson
- **Frontend**: `MobileAppPage` in Settings with "Mobile" tab — app header with icon/name/bundle/version, platform status badges (iOS/Android), 5 tabs (Overview with stats + QR preview + quick build actions, Screens list, Builds history, Publish to App Store + Google Play, Settings with app config inputs and platform toggles)
- **Flow**: User enters project ID → sees app config with platform badges → overview shows stats and QR preview → trigger builds for iOS/Android → view build history → publish to App Store/Google Play → configure app name, bundle ID, version, and platform toggles

### #273 — Background Agent Workers for Parallel Autonomous Development (PR #276)
- **Endpoints**:
  - `GET /api/background-agents` — list agents (optional status filter)
  - `GET /api/background-agents/{agentId}` — agent detail with steps, logs, resource usage
  - `POST /api/background-agents/spawn` — spawn new agent (max 5 concurrent, auto-creates branch)
  - `POST /api/background-agents/{agentId}/stop` — stop running agent
  - `GET /api/background-agents/stats` — aggregate stats (total, active, completed, failed, tokens, cost, PRs, avg time)
  - `GET /api/background-agents/types` — 5 agent types (general, frontend, backend, testing, refactor)
- **Entity**: `BackgroundAgent` with Id (Guid), UserId, DevRequestId, AgentName, TaskDescription, Status (idle/starting/running/completed/failed/stopped), BranchName, AgentType, Priority, TotalSteps, CompletedSteps, ProgressPercent, FilesCreated, FilesModified, TestsPassed, TestsFailed, ErrorCount, SelfHealAttempts, CpuUsagePercent, MemoryUsageMb, TokensUsed, EstimatedCost, ElapsedSeconds, EstimatedRemainingSeconds, PullRequestUrl, PullRequestStatus, LogEntriesJson, StepsJson, InstalledPackagesJson
- **7-Step Pipeline**: Initialize environment → Analyze requirements → Create branch & scaffold → Implement changes → Run tests → Self-review & fix → Open pull request
- **Frontend**: `BackgroundAgentPage` in Settings with "Agents" tab — 4 sub-tabs (Dashboard with 8 stats cards + agent type grid, Agents list with status filter + progress bars + detail panel, Spawn form with type/priority selectors, Logs with terminal-style viewer)
- **Flow**: User opens Dashboard → views active/completed/failed agent counts → switches to Spawn tab → selects agent type and priority → enters task description → spawns agent → monitors progress in Agents tab → views execution steps and resource usage → agent auto-creates PR on completion → views logs in terminal

### #277 — .NET 10 + EF Core 10 Platform Upgrade Dashboard
- **Ticket**: #277 — `.NET 10 + EF Core 10 with vector search and 25-50% performance boost`
- **PR**: #280 (747 insertions, squash-merged)
- **Backend**: `PlatformUpgradeController` with 6 endpoints:
  - `GET /api/platform-upgrade/status` — get or create upgrade status (auto-creates on first visit)
  - `PUT /api/platform-upgrade/settings` — update feature flags (vector search, native JSON, LeftJoin LINQ, profiling)
  - `GET /api/platform-upgrade/performance` — performance metrics (avg/P95/P99 query time, throughput, cache hit rate, CPU, memory)
  - `GET /api/platform-upgrade/vector-search` — vector search stats (index count, dimensions, avg search time)
  - `GET /api/platform-upgrade/features` — 10 .NET 10/EF Core 10 features with categories and status
  - `POST /api/platform-upgrade/run-benchmark` — benchmark .NET 9 vs 10 (query, serialization, startup, memory, vector search)
- **Entity**: `PlatformUpgrade` with Id (Guid), UserId, CurrentDotNetVersion ("net10.0"), CurrentEfCoreVersion ("10.0"), CurrentCSharpVersion ("14.0"), VectorSearchEnabled, NativeJsonColumnsEnabled, LeftJoinLinqEnabled, PerformanceProfilingEnabled, AvgQueryTimeMs, P95QueryTimeMs, P99QueryTimeMs, TotalQueriesExecuted, CacheHitRate, MemoryUsageMb, CpuUsagePercent, ThroughputRequestsPerSec, VectorIndexCount, VectorDimensions, VectorSearchAvgMs, UpgradeStatus, FeatureFlagsJson, PerformanceHistoryJson, MigrationLogJson
- **Frontend**: `PlatformUpgradePage` in Settings with "Platform Upgrade" tab — version badges (.NET 10 / EF Core 10 / C# 14), 5 sub-tabs (Overview with feature toggles, Performance with 8 metric cards, Vector Search with stats and status indicator, Features listing 10 .NET 10 features with category/status badges, Benchmark with .NET 9 vs 10 side-by-side comparison table)
- **Flow**: User opens Overview → sees version badges → toggles features (vector search, JSON columns, LeftJoin LINQ, profiling) → switches to Performance tab → views real-time metrics → checks Vector Search stats → browses Features catalog → runs Benchmark to compare .NET 9 vs 10 improvements

### #278 — Visual Prompt-to-UI Design Mode
- **Ticket**: #278 — `Visual prompt-to-UI design mode with live component preview`
- **PR**: #281 (1011 insertions, squash-merged)
- **Backend**: `VisualPromptUiController` with 7 endpoints:
  - `GET /api/visual-prompt/components` — list user's components (optional category filter)
  - `GET /api/visual-prompt/components/{id}` — component detail with code, HTML, conversation history
  - `POST /api/visual-prompt/generate` — generate component from text prompt (returns React + Tailwind code with live preview HTML)
  - `POST /api/visual-prompt/components/{id}/refine` — iterative refinement via chat-style follow-up prompts
  - `GET /api/visual-prompt/gallery` — browse generated components sorted by popularity
  - `POST /api/visual-prompt/components/{id}/export` — export component to an existing project
  - `GET /api/visual-prompt/stats` — aggregate stats (total components, iterations, tokens, cost, categories, exports)
  - `GET /api/visual-prompt/categories` — 9 component categories (landing, dashboard, form, card, navigation, pricing, hero, modal, custom)
- **Entity**: `VisualPromptUi` with Id (Guid), UserId, ComponentName, PromptText, GeneratedCode, GeneratedHtml, Framework, StylingLibrary, Status, IterationCount, ParentComponentId, ConversationJson, Category, Tags, ViewCount, ForkCount, LikeCount, IsPublic, ThumbnailUrl, ExportedToProjectId, ExportedFilePath, ThemeTokensJson, GenerationTimeMs, TokensUsed, EstimatedCost
- **Frontend**: `VisualPromptPage` in Settings with "Visual UI" tab — 4 sub-tabs (Generate with prompt input + component name + category + live HTML preview + code viewer + copy button + iterative refinement chat, Gallery with category filter chips + component cards, Components list with status/category badges, Stats with 8 metric cards)
- **Flow**: User enters prompt describing UI → clicks Generate → sees live preview + code → refines via follow-up chat messages → copies code or exports to project → browses gallery of past generations → views stats dashboard

### #279 — Multi-Framework Project Generation
- **Ticket**: #279 — `Multi-framework project generation with tech stack selection`
- **PR**: #282 (800 insertions, squash-merged)
- **Backend**: `FrameworkConfigController` with 7 endpoints:
  - `GET /api/framework/config` — get or create user's framework config (defaults: react-vite, no backend, no database)
  - `PUT /api/framework/config` — update framework preferences (selected framework, backend, database, toggles)
  - `GET /api/framework/frameworks` — 9 frameworks across 3 tiers (Tier 1: React+Vite, Next.js, Express; Tier 2: FastAPI, Django, Flutter; Tier 3: Vue+Nuxt, Go+Gin, ASP.NET)
  - `GET /api/framework/backends` — 6 backend options (Express, FastAPI, Django, ASP.NET, Go Gin, Spring Boot)
  - `GET /api/framework/databases` — 6 database options (PostgreSQL, MySQL, MongoDB, SQLite, Redis, Supabase)
  - `POST /api/framework/generate-preview` — preview project structure for selected stack (returns file tree, estimated files/tokens/cost/time, features list)
  - `GET /api/framework/stats` — generation stats with recent project history
- **Entity**: `FrameworkConfig` with Id (Guid), UserId, SelectedFramework, SelectedBackend, SelectedDatabase, SelectedStyling, ProjectsGenerated, LastGeneratedProjectId, FavoriteFrameworks, CustomTemplateJson, FrameworkHistoryJson, AutoDetectStack, IncludeDocker, IncludeCI, IncludeTests
- **Frontend**: `MultiFrameworkPage` in Settings with "Multi-Framework" tab — 4 sub-tabs (Frameworks with 9 framework cards showing tier/category/language badges + selection highlight + tier filter buttons, Configure with backend/database selector grids + 4 project option toggles, Preview with current stack display + generate preview button + project structure tree + 4 estimate cards + features list, Stats with 3 metric cards + recent projects list)
- **Flow**: User opens Frameworks tab → browses 9 frameworks with tier filters → selects preferred framework → switches to Configure → picks backend + database → toggles Docker/CI/Tests/Auto-Detect options → goes to Preview → clicks Generate Preview → sees project structure tree + cost/time estimates → checks Stats for generation history

### #284 — React View Transitions & Animation Presets
- **Ticket**: #284 — `Add React View Transitions and animation presets to generated projects`
- **PR**: #286 (685 insertions, squash-merged)
- **Backend**: `ViewTransitionController` with 6 endpoints:
  - `GET /api/view-transitions/config` — get or create user's transition config
  - `PUT /api/view-transitions/config` — update transition preferences (preset, duration, easing, toggles)
  - `GET /api/view-transitions/presets` — 11 transition presets across 4 categories (Basic: fade/slide-left/slide-up/scale, Combined: fade-slide, Advanced: morph/crossfade/zoom, Framer Motion: spring/stagger/layout)
  - `GET /api/view-transitions/easing-functions` — 6 easing functions with CSS curves
  - `POST /api/view-transitions/generate-css` — generate keyframe CSS + View Transition API CSS for selected preset
  - `GET /api/view-transitions/demo` — 5 demo pages for live preview
  - `GET /api/view-transitions/stats` — current config stats and browser support info
- **Entity**: `ViewTransitionConfig` with Id (Guid), UserId, TransitionPreset, TransitionDurationMs, EasingFunction, EnableViewTransitions, EnableFramerMotion, EnablePageTransitions, EnableComponentAnimations, EnableLoadingAnimations, CustomCssJson, PresetHistoryJson, ProjectsWithTransitions
- **Frontend**: `ViewTransitionPage` in Settings with "Transitions" tab — 4 sub-tabs (Presets with 11 presets grouped by category with selection highlight, Configure with duration slider + easing selector + 5 animation toggles, Preview with live demo navigation + generated CSS output viewer, Stats with preset/duration/browser support cards)
- **Flow**: User opens Presets tab → browses 11 transition presets by category → selects preferred preset → Configure tab → adjusts duration via slider → picks easing function → toggles View Transitions API/Framer Motion/page/component/loading animations → Preview tab → clicks through demo pages with live animation → generates CSS code → copies for use in projects

### #285 — AI Natural Language Database Schema Designer
- **Ticket**: #285 — `AI natural language database schema designer with visual ERD preview`
- **PR**: #287 (811 insertions, squash-merged)
- **Backend**: `NlSchemaController` with 7 endpoints:
  - `GET /api/nl-schema/schemas` — list user's schemas (optional dbType filter)
  - `GET /api/nl-schema/schemas/{id}` — get schema detail
  - `POST /api/nl-schema/generate` — generate schema from natural language description (simulated AI: detects keywords user/post/comment/tag/follow to generate tables, relationships, indexes, RLS policies, SQL DDL)
  - `POST /api/nl-schema/schemas/{id}/refine` — iterative refinement via conversational chat
  - `GET /api/nl-schema/export-formats` — 5 export formats (SQL, Prisma, Drizzle, Supabase, TypeORM)
  - `GET /api/nl-schema/gallery` — public schema gallery sorted by popularity
  - `GET /api/nl-schema/stats` — aggregate user stats (schemas, tables, relationships, refinements, tokens, favorite DB)
- **Entity**: `NlSchema` with Id (Guid), UserId, SchemaName, NaturalLanguageInput, GeneratedSql, TablesJson, RelationshipsJson, IndexesJson, RlsPoliciesJson, SeedDataJson, ConversationJson, ExportFormat, DatabaseType, TableCount, ColumnCount, RelationshipCount, RefinementCount, TokensUsed, EstimatedCost, GenerationTimeMs, IsPublic, ViewCount, ForkCount
- **Frontend**: `NlSchemaDesignerPage` in Settings with "Schema AI" tab — 4 sub-tabs (Generate with NL textarea + schema name + DB type selector [PostgreSQL/MySQL/Supabase/SQLite] + ERD-style table preview with columns/types/PKs + relationship arrows + SQL viewer + export buttons + refinement chat, Schemas with list showing table/column/relation counts, Gallery with public schemas showing views/forks, Stats with 6 metric cards + recent schemas list)
- **Flow**: User opens Generate tab → describes data model in plain language → selects database type → clicks Generate Schema → views ERD-style table preview with columns and relationships → reviews generated SQL DDL → exports in preferred format (SQL/Prisma/Drizzle/Supabase/TypeORM) → optionally refines via chat input → browses saved schemas in Schemas tab → explores community schemas in Gallery → views usage stats

### #283 — TanStack Query Configuration & Server State Management
- **Ticket**: #283 — `Migrate frontend data fetching to TanStack Query for server state management`
- **PR**: #288 (638 insertions, squash-merged)
- **Backend**: `QueryConfigController` with 5 endpoints:
  - `GET /api/query-config/config` — get or create user's query config
  - `PUT /api/query-config/config` — update caching, retry, and behavior preferences
  - `GET /api/query-config/presets` — 4 caching presets (Aggressive, Balanced, Fresh, Offline First)
  - `GET /api/query-config/query-patterns` — 6 code pattern examples (basic query, dependent, paginated, mutation, optimistic update, prefetch)
  - `GET /api/query-config/stats` — cache hit rate, total queries/mutations, active preset
- **Entity**: `QueryConfig` with Id (Guid), UserId, StaleTimeMs, CacheTimeMs, RetryCount, RetryDelayMs, RefetchOnWindowFocus, RefetchOnReconnect, RefetchOnMount, EnableDevtools, EnableGarbageCollection, EnableOptimisticUpdates, TotalQueries, TotalMutations, CacheHits, CacheMisses, QueryPatternsJson
- **Frontend**: `QueryConfigPage` in Settings with "Query" tab — 4 sub-tabs (Configure with timing sliders [stale time/cache time/retry count/retry delay] + 6 behavior toggles [window focus/reconnect/mount/devtools/GC/optimistic], Presets with 4 caching strategy cards and one-click apply, Patterns with 6 categorized code examples [Fetching/Mutations/Advanced], Stats with 6 metric cards + current config summary)
- **Flow**: User opens Configure tab → adjusts stale time via slider → adjusts cache time → sets retry count/delay → toggles behavior flags → applies a preset from Presets tab → browses code patterns in Patterns tab → monitors cache performance in Stats tab

### #289 — Autonomous Agentic Planning System
- **Ticket**: #289 — `Autonomous agentic planning system for multi-step code generation`
- **PR**: #292 (630 insertions, squash-merged)
- **Backend**: `AgenticPlanController` with 5 endpoints:
  - `GET /api/agentic-plan/plans` — list user's plans (most recent 50)
  - `POST /api/agentic-plan/generate` — generate plan from natural language prompt (simulated AI: keyword detection for api/backend/server, ui/frontend/page, auth/login, test, deploy to create relevant steps)
  - `POST /api/agentic-plan/plans/{id}/approve` — approve plan for execution (sets IsApproved + status to approved)
  - `POST /api/agentic-plan/plans/{id}/execute` — execute all steps (simulated: marks all steps completed with timing/token metrics)
  - `GET /api/agentic-plan/stats` — aggregate stats (total plans, completed, success rate, steps executed, avg steps/plan, tokens used, recent plans)
- **Entity**: `AgenticPlan` with Id (Guid), UserId, PlanName, UserPrompt, StepsJson, Status (draft/approved/running/completed/failed), TotalSteps, CompletedSteps, FailedSteps, RetryCount, TotalTokensUsed, TotalTimeMs, RequiresApproval, IsApproved, ExecutionLogJson
- **Frontend**: `AgenticPlannerPage` in Settings with "Planner" tab — 3 sub-tabs (Create with prompt textarea + plan name input + generate button + step-by-step visualization with numbered circles and status colors + approve/execute buttons + progress bar + 4 metric cards [steps/completed/tokens/time], Plans with list showing status badges and step counts, Stats with 6 metric cards + recent plans list)
- **Flow**: User opens Create tab → describes what to build in textarea → enters plan name → clicks Generate Plan → reviews step-by-step breakdown → clicks Approve Plan → clicks Execute Plan → watches progress bar fill → views completed steps with checkmarks and timing → browses saved plans in Plans tab → monitors success rate and token usage in Stats tab

### #290 — AI-Powered Visual Regression Testing
- **Ticket**: #290 — `AI-powered visual regression testing for screenshot comparison`
- **PR**: #293 (647 insertions, squash-merged)
- **Backend**: `VisualRegressionController` with 5 endpoints:
  - `GET /api/visual-regression/results` — list user's results (most recent 50)
  - `POST /api/visual-regression/capture` — capture baseline screenshot (simulated with random capture time 200-800ms)
  - `POST /api/visual-regression/compare` — run comparison against baseline (simulated with random mismatch 0-5%, pixel diff calculation, pass/fail based on threshold)
  - `GET /api/visual-regression/viewports` — 5 viewport presets (Desktop 1920x1080, Laptop 1366x768, Tablet 768x1024, Mobile 375x812, Widescreen 2560x1440)
  - `GET /api/visual-regression/stats` — aggregate stats (total tests, passed, failed, pass rate, avg mismatch, pixels analyzed, recent results)
- **Entity**: `VisualRegressionResult` with Id (Guid), UserId, ProjectName, PageUrl, ViewportSize, BaselineImageUrl, ComparisonImageUrl, DiffImageUrl, MismatchPercentage, Threshold, Status (pending/baseline_captured/completed), Passed, PixelsDifferent, TotalPixels, IgnoreRegionsJson, MetadataJson, CaptureTimeMs, CompareTimeMs
- **Frontend**: `VisualRegressionPage` in Settings with "Visual QA" tab — 3 sub-tabs (Capture with project name + page URL inputs + viewport selector dropdown + threshold slider 0-10% + Capture Baseline/Run Compare buttons + result card showing mismatch percentage with color-coded progress bar + pixel count + 4 metric cards [capture time/compare time/threshold/viewport], Results with list showing project names, URLs, viewports, mismatch percentages and status badges, Stats with 6 metric cards [total/passed/failed/pass rate/avg mismatch/pixels analyzed] + recent results list)
- **Flow**: User opens Capture tab → enters project name → enters page URL → selects viewport from dropdown → adjusts threshold slider → clicks Capture Baseline → sees baseline_captured status → clicks Run Compare → sees mismatch percentage with pass/fail badge → reviews pixel diff metrics and timing → browses test history in Results tab → monitors pass rate and avg mismatch in Stats tab

### #291 — MCP Gateway for Multi-Agent Tool Orchestration
- **Ticket**: #291 — `MCP gateway for multi-agent tool orchestration during generation`
- **PR**: #294 (736 insertions, squash-merged)
- **Backend**: `McpGatewayController` with 5 endpoints:
  - `GET /api/mcp-gateway/servers` — list user's configured MCP servers (most recent 50)
  - `POST /api/mcp-gateway/servers` — add new MCP server (simulated connection with random tool count 3-12, resource count 1-8)
  - `POST /api/mcp-gateway/servers/{id}/health-check` — run health check (simulated 85% healthy, random latency 20-220ms)
  - `POST /api/mcp-gateway/servers/{id}/execute` — execute a tool on a server (simulated 90% success, random latency 50-550ms, execution metrics tracking)
  - `GET /api/mcp-gateway/catalog` — 8 community MCP server presets (GitHub, Supabase, Figma, PostgreSQL, Slack, Brave Search, Filesystem, Puppeteer)
  - `GET /api/mcp-gateway/stats` — aggregate stats (total/connected servers, tools, resources, executions, success rate, avg latency, recent servers)
- **Entity**: `McpGatewayServer` with Id (Guid), UserId, ServerName, ServerUrl, TransportType (stdio/sse/http), Description, Category (custom/database/api/design/devops/ai), IconUrl, Status (connected/disconnected/error), IsEnabled, ToolsJson, ResourcesJson, ToolCount, ResourceCount, TotalExecutions, SuccessfulExecutions, FailedExecutions, AvgLatencyMs, LastHealthCheck, HealthMessage, ConfigJson
- **Frontend**: `McpGatewayPage` in Settings with "MCP Gateway" tab — 3 sub-tabs (Servers with add form [name/URL/transport/category/description] + server cards showing status/category badges + 4 metric cards [tools/executions/latency/success] + tool execution buttons + execution result display, Catalog with 8 community servers in grid cards with category badges and one-click Install, Stats with 6 metric cards [servers/connected/tools/executions/success rate/avg latency] + recent servers list)
- **Flow**: User opens Servers tab → fills server name and URL → selects transport and category → clicks Add Server → sees server card with connected status → clicks tool buttons to execute → views execution results → browses Catalog tab → clicks Install on GitHub/Supabase/Figma → server auto-added to Servers tab → monitors health and execution metrics in Stats tab

### #295 — Persistent Codebase Memory (PR #298)
- **PR**: #298 (699 insertions, squash-merged)
- **Backend**: `ProjectMemoryController` with 7 endpoints:
  - `GET /api/project-memory/memories` — list memories with optional project/category filters (top 100 by confidence)
  - `POST /api/project-memory/memories` — add new memory with type/category/content/summary
  - `PUT /api/project-memory/memories/{id}` — update memory content/summary/category/active status
  - `DELETE /api/project-memory/memories/{id}` — delete a memory
  - `POST /api/project-memory/memories/{id}/reinforce` — reinforce memory (+5% confidence, increment reinforcement count)
  - `POST /api/project-memory/memories/{id}/contradict` — contradict memory (-10% confidence, auto-deactivate below 20%)
  - `GET /api/project-memory/stats` — aggregate stats (total/active memories, avg confidence, reinforcements/contradictions, by-category breakdown, recent memories)
  - `GET /api/project-memory/projects` — list projects with memory counts
- **Entity**: `ProjectMemory` with Id (Guid), UserId, ProjectName, MemoryType (convention/pattern/preference/feedback), Category (general/naming/architecture/style/review/testing/deployment), Content, Summary, SourceType (explicit/accepted_suggestion/rejected_suggestion/review_feedback/code_pattern), SourceRef, Confidence (0.0-1.0), Reinforcements, Contradictions, IsActive, TagsJson, EmbeddingJson, LastAppliedAt
- **Frontend**: `CodebaseMemoryPage` in Settings with "Memory AI" tab — 3 sub-tabs (Memories with category filter + memory cards showing type/category/confidence badges + reinforce/contradict/delete buttons + source info, Add Memory with type/category/summary/content form, Stats with 5 metric cards [total/active/avg confidence/reinforcements/contradictions] + category breakdown + recent memories list)
- **Flow**: User opens Memories tab → filters by category → sees existing patterns → clicks + to reinforce or - to contradict → switches to Add tab → fills in convention/pattern content with summary → clicks Add Memory → memory appears in list with 70% initial confidence → over time, reinforced memories gain confidence, contradicted memories lose confidence and auto-deactivate below 20%

### #296 — Figma-to-Code Import (PR #299)
- **PR**: #299 (641 insertions, squash-merged)
- **Backend**: `FigmaImportController` with 7 endpoints:
  - `GET /api/figma-import/imports` — list user's imports (most recent 50)
  - `POST /api/figma-import/import-url` — import from Figma URL (extracts file key, generates design tokens/component tree/code)
  - `POST /api/figma-import/import-screenshot` — import from screenshot (simulated extraction)
  - `GET /api/figma-import/imports/{id}/tokens` — get extracted design tokens and component tree
  - `GET /api/figma-import/imports/{id}/code` — get generated code with framework/styling info
  - `DELETE /api/figma-import/imports/{id}` — delete an import
  - `GET /api/figma-import/stats` — aggregate stats (total/completed imports, total components/tokens, avg processing time, recent imports)
- **Entity**: `FigmaImport` with Id (Guid), UserId, FigmaFileKey, FigmaNodeId, SourceType (url/screenshot/upload), SourceUrl, DesignName, DesignTokensJson, ComponentTreeJson, GeneratedCodeJson, Status (pending/extracting/generating/completed/failed), Framework (react/nextjs/vue), StylingLib (tailwind/css-modules/styled-components), ComponentCount, TokenCount, ProcessingTimeMs, ErrorMessage
- **Frontend**: `FigmaImportPage` in Settings with "Figma" tab — 3 sub-tabs (Import with URL input + design name + framework/styling dropdowns + import/screenshot buttons + result preview showing component count/token count/processing time + extracted tokens JSON + generated code JSON, History with import list showing source type/framework/components/status + view/delete buttons, Stats with 5 metric cards + recent imports list)
- **Flow**: User opens Figma tab → pastes Figma URL → optionally sets name/framework/styling → clicks Import from URL → sees processing result with design tokens and generated code → switches to History to review past imports → switches to Stats for aggregate metrics

### #297 — Multi-Model Arena Mode with Side-by-Side AI Comparison
- **Ticket**: #297 — `Multi-model arena mode with side-by-side AI comparison and preference learning`
- **Backend**: `ArenaController` with 6 endpoints:
  - `GET /api/arena/comparisons` — list user's comparisons (most recent 50)
  - `POST /api/arena/compare` — create comparison with simulated outputs from 3 models (Claude Sonnet, GPT-4o, Gemini Pro)
  - `POST /api/arena/comparisons/{id}/select-winner` — select winning model with optional reason
  - `GET /api/arena/stats` — aggregate stats (total comparisons, winners selected, avg cost, total tokens, model win rates, recent comparisons)
  - `GET /api/arena/models` — available models with metadata (name, provider, cost per 1K tokens, avg latency, description, strengths)
  - `GET /api/arena/leaderboard` — model leaderboard by task category with win rates
- **Entity**: `ArenaComparison` with Id (Guid), UserId, PromptText, TaskCategory (code-generation/bug-fixing/architecture/refactoring/testing/documentation), ModelOutputsJson (JSON array of model/provider/output/latencyMs/tokenCount/cost), SelectedModel, SelectionReason, ModelCount, TotalCost, TotalTokens, TotalLatencyMs, Status (pending/completed/winner_selected), CreatedAt, CompletedAt
- **Simulated Models**: Claude Sonnet ($0.003/1K, 200-2000ms), GPT-4o ($0.005/1K, 200-2000ms), Gemini Pro ($0.002/1K, 200-2000ms) — each generates distinct code style per task category
- **Frontend**: `ArenaPage` in Settings with "Arena" tab — 4 sub-tabs (Compare with prompt input + task category selector + Run Arena button + 3-column side-by-side model output cards with color-coded headers and metadata [latency/tokens/cost] + Pick Winner button + winner badge, History with comparison list showing prompt/category/status/winner/cost/date, Leaderboard with category-grouped model rankings showing win rate progress bars, Stats with 6 metric cards [total comparisons/winners/avg cost/total tokens/fastest model/most selected] + win rate bars + recent comparisons list)
- **Flow**: User opens Arena tab → selects task category → enters prompt → clicks Run Arena → sees 3 model outputs side-by-side → picks winner → leaderboard and stats update with preference data

### #300 — Premium UI Redesign (PR #304)
- **Design System**: Custom warm color palette with CSS custom properties (HSL-based), semantic tokens for backgrounds, foregrounds, borders, accents
- **Typography**: Inter for UI text, JetBrains Mono for code elements
- **Motion**: Framer Motion integration with `FadeIn` and `StaggerChildren` reusable wrapper components in `src/components/motion/`
- **Glassmorphism**: Backdrop-blur panels with semi-transparent backgrounds on hero, cards, and feature sections
- **Hero Redesign**: Large conversational prompt input as centerpiece with template quick-start chips (SaaS, E-commerce, Blog, Mobile)
- **Component Refactoring**: HomePage broken into HeroSection, FeaturesSection, PricingSection, StatsSection sub-components
- **Utility**: `src/lib/utils.ts` with `cn()` helper for conditional classname merging (clsx + tailwind-merge pattern)

### #303 — Visual Overlay Editor (PR #307)
- **Backend**: `VisualOverlayController` with 8 endpoints for session management, element selection, property modification, undo, and stats
- **Endpoints**:
  - `GET /api/visual-overlay/sessions` — list sessions
  - `POST /api/visual-overlay/sessions` — create session (projectName + previewUrl)
  - `PUT /api/visual-overlay/sessions/{id}/select` — select element
  - `PUT /api/visual-overlay/sessions/{id}/modify` — apply property modification
  - `POST /api/visual-overlay/sessions/{id}/undo` — undo last modification
  - `GET /api/visual-overlay/stats` — aggregate stats
  - `GET /api/visual-overlay/properties` — available editable properties
- **Entity**: `VisualOverlaySession` with Id (Guid), UserId, DevRequestId, ProjectName, SelectedElementPath, ModificationsJson, ComponentTreeJson, Status (active/paused/completed), TotalEdits, UndoCount, RedoCount, ViewportWidth, ViewportHeight, PreviewUrl
- **Frontend**: `VisualOverlayPage` in Settings with "Visual Editor" tab — 3 sub-tabs (Editor with split layout: component tree + preview area + property panel + modification history with undo, Sessions with list showing project/edits/status, Stats with 6 metric cards)
- **Flow**: Create session → browse component tree → select element → edit properties (text, color, spacing, fontSize, etc.) → changes tracked → undo if needed → view session history and stats

### #312 — pgvector Semantic Search for Template Matching (PR #318)
- **Backend**: `SemanticSearchController` with 5 endpoints for indexing, querying, and stats
- **Endpoints**:
  - `GET /api/semantic-search/index/{sourceType}` — list indexed items by source type
  - `POST /api/semantic-search/index` — index a new item (generate embedding from text)
  - `POST /api/semantic-search/query` — semantic search (find top-K similar items by cosine similarity)
  - `DELETE /api/semantic-search/index/{id}` — remove an indexed item
  - `GET /api/semantic-search/stats` — index statistics (total indexed, by source type, dimensions)
- **Entity**: `SemanticIndex` with Id (Guid), UserId, SourceType (template/project/request), SourceId, Title, Content, ContentHash (SHA-256), EmbeddingJson (simulated float array), Dimensions (1536), IndexedAt, CreatedAt, UpdatedAt
- **Frontend**: `SemanticSearchPage` in Settings with "Semantic Search" tab — 3 sub-tabs (Index with source type filter + indexed items list + index form, Search with query input + top-K slider + results with similarity scores and color-coded relevance bars, Stats with metric cards)
- **Flow**: Select source type → index items with title + content → search with natural language query → see top-K results ranked by cosine similarity → monitor index stats

### #313 — Discussion/Planning Mode (PR #327)
- **Backend**: `PlanningSessionController` with 8 endpoints for session management, chat messaging, and stats
- **Endpoints**:
  - `GET /api/planning/sessions` — list sessions (most recent 50)
  - `GET /api/planning/sessions/{id}` — session detail
  - `POST /api/planning/sessions` — create session (name + mode + optional devRequestId)
  - `POST /api/planning/sessions/{id}/message` — send message with simulated AI response
  - `POST /api/planning/sessions/{id}/complete` — complete session with summary plan
  - `DELETE /api/planning/sessions/{id}` — delete session
  - `GET /api/planning/stats` — aggregate stats (total sessions, messages, tokens, savings)
  - `GET /api/planning/modes` — 4 modes: brainstorm, architecture, debug, requirements
- **Entity**: `PlanningSession` with Id (Guid), UserId, DevRequestId, SessionName, Status (active/completed/archived), Mode, MessagesJson, PlanOutputJson, TotalMessages, UserMessages, AiMessages, TokensUsed, EstimatedSavings
- **Frontend**: `PlanningModePage` in Settings with "Planning Mode" tab — 3 sub-tabs (Chat with session creation + message bubbles + mode selector, Sessions with past session list, Stats with metric cards)
- **Flow**: Create session with mode → send planning messages → AI responds with mode-specific analysis → complete session → review plan output → monitor savings vs code generation

### #314 — Auto-Generated Project Documentation with Interactive Q&A (PR #328)
- **Backend**: `ProjectDocumentationController` with 6 endpoints for documentation generation, Q&A, and stats
- **Endpoints**:
  - `GET /api/project-docs` — list documentation (most recent 50)
  - `GET /api/project-docs/{id}` — documentation detail
  - `POST /api/project-docs/generate` — generate documentation from project name + description
  - `POST /api/project-docs/{id}/ask` — Q&A: ask question about the project
  - `DELETE /api/project-docs/{id}` — delete documentation
  - `GET /api/project-docs/stats` — aggregate stats
- **Entity**: `ProjectDocumentation` with Id (Guid), UserId, DevRequestId, ProjectName, Status, ArchitectureOverview, ComponentDocs, ApiReference, SetupGuide, QaHistoryJson, SourceFilesCount, TotalLinesAnalyzed, GenerationTimeMs, TokensUsed, EstimatedCost
- **Frontend**: `ProjectDocsPage` in Settings with "Project Docs" tab — 4 sub-tabs (Generate with project input + expandable markdown sections, Q&A with question/answer history, Library with doc list, Stats with metric cards)
- **Flow**: Enter project name + description → generate documentation → review architecture/components/API/setup sections → ask questions via Q&A → browse library of past docs

### #315 — Vercel AI Elements + Generative UI Streaming Preview (PR #335)
- **Backend**: `AiElementsController` with 6 endpoints for config, component catalog, streaming sessions, and stats
- **Endpoints**:
  - `GET /api/ai-elements/config` — get or create user AI Elements config
  - `PUT /api/ai-elements/config` — update config (streaming, reasoning panel, live preview, response actions toggles)
  - `GET /api/ai-elements/components` — list 5 available AI Element components (message-thread, reasoning-panel, code-block, response-actions, streaming-input)
  - `POST /api/ai-elements/stream/start` — start simulated streaming session (returns stream ID + metadata)
  - `GET /api/ai-elements/stream/{streamId}/status` — get stream status
  - `GET /api/ai-elements/stats` — aggregate stats (total streams, tokens streamed, component previews, avg stream time)
- **Entity**: `AiElementsConfig` with Id (Guid), UserId, StreamingEnabled, ReasoningPanelEnabled, LivePreviewEnabled, ResponseActionsEnabled, ThemeMode, ActiveModel, TotalStreams, TotalTokensStreamed, TotalComponentPreviews, PreviewHistoryJson, CreatedAt, UpdatedAt
- **Frontend**: `AiElementsPage` in Settings with "AI Elements" tab — 3 sub-tabs (Stream with simulated token-by-token code output and syntax highlighting, Components with 5 AI element cards, Stats with metric cards)
- **Flow**: Open AI Elements tab → configure streaming/reasoning/preview toggles → start streaming demo → watch token-by-token code generation → browse component catalog → view usage stats

### #316 — Automated AI Code Review Pipeline (PR #337)
- **Backend**: `ReviewPipelineController` with 6 endpoints for config, review execution, dimensions catalog, and stats
- **Endpoints**:
  - `GET /api/review-pipeline/config` — get or create user review pipeline config
  - `PUT /api/review-pipeline/config` — update settings (per-dimension toggles, auto-fix, test generation, quality threshold)
  - `POST /api/review-pipeline/review` — trigger code review on a project (simulated multi-dimensional scoring)
  - `GET /api/review-pipeline/results/{reviewId}` — get review results with dimension scores and findings
  - `GET /api/review-pipeline/dimensions` — list 5 review dimensions (security, performance, accessibility, architecture, maintainability)
  - `GET /api/review-pipeline/stats` — aggregate stats (total reviews, auto-fixes, tests generated, avg quality score)
- **Entity**: `ReviewPipelineConfig` with Id (Guid), UserId, AutoReviewEnabled, SecurityCheckEnabled, PerformanceCheckEnabled, AccessibilityCheckEnabled, ArchitectureCheckEnabled, MaintainabilityCheckEnabled, AutoFixEnabled, TestGenerationEnabled, QualityThreshold, TotalReviews, TotalAutoFixes, TotalTestsGenerated, AvgQualityScore, ReviewHistoryJson, CreatedAt, UpdatedAt
- **Frontend**: `ReviewPipelinePage` in Settings with "Review Pipeline" tab — 3 sub-tabs (Review with project input + dimension score bars + findings list, Configure with dimension toggles + threshold slider, Stats with metric cards)
- **Flow**: Open Review Pipeline tab → enter project name → run review → see dimension scores with color coding → review findings with severity → configure per-dimension toggles and quality threshold → view aggregate stats

### #317 — Managed OAuth Connectors (PR #339)
- **Backend**: `OAuthConnectorController` with 6 endpoints for connector management, provider catalog, and stats
- **Endpoints**:
  - `GET /api/oauth-connectors` — list user's connected OAuth providers
  - `POST /api/oauth-connectors/connect` — connect a provider (simulated OAuth flow)
  - `DELETE /api/oauth-connectors/{id}` — disconnect a provider
  - `GET /api/oauth-connectors/providers` — list 6 available providers (Stripe, Google, Notion, Slack, GitHub, Supabase) with metadata
  - `POST /api/oauth-connectors/{id}/refresh` — refresh token (simulated)
  - `GET /api/oauth-connectors/stats` — aggregate stats (connected, by category, API calls)
- **Entity**: `OAuthConnector` with Id (Guid), UserId, Provider, DisplayName, Status (connected/disconnected/expired), Scopes, AccessTokenHash, RefreshTokenHash, TokenExpiresAt, ConnectedAt, LastUsedAt, TotalApiCalls, FailedApiCalls, IconUrl, Category (payments/productivity/communication/development/database), CreatedAt, UpdatedAt
- **Frontend**: `OAuthConnectorsPage` in Settings with "OAuth Connectors" tab — 3 sub-tabs (Connectors with 6 provider cards + connect/disconnect, Connected with active connections list, Stats with metric cards)
- **Flow**: Open OAuth Connectors tab → browse 6 providers by category → click Connect → provider added to Connected tab → manage connections → view usage stats

### #332 — MCP Tool Integration for Code Generation (PR #340)
- **Backend**: `McpToolIntegrationController` with 6 endpoints for config, tool catalog, execution, history, and stats
- **Endpoints**:
  - `GET /api/mcp-tools/config` — get or create user MCP tool config
  - `PUT /api/mcp-tools/config` — update config (enabled tools, auto-attach, context depth)
  - `GET /api/mcp-tools/tools` — list 8 built-in MCP tools (file_read, file_write, search_docs, resolve_deps, query_db, run_tests, lint_code, browse_web)
  - `POST /api/mcp-tools/execute` — execute a tool (simulated results)
  - `GET /api/mcp-tools/history` — tool execution history
  - `GET /api/mcp-tools/stats` — aggregate stats (executions, success rate, latency, tokens saved)
- **Entity**: `McpToolIntegration` with Id (Guid), UserId, McpEnabled, AutoAttachTools, ContextDepthLevel, per-tool enable flags, TotalExecutions, SuccessfulExecutions, FailedExecutions, AvgLatencyMs, TokensSaved, ExecutionHistoryJson, CustomServersJson, CreatedAt, UpdatedAt
- **Frontend**: `McpToolIntegrationPage` in Settings with "MCP Tools" tab — 3 sub-tabs (Tools with 8 tool cards + toggles + execute, History with execution log, Stats with metric cards)
- **Flow**: Open MCP Tools tab → enable/disable individual tools → set context depth → execute tools → view results → browse history → monitor stats

### #333 — AI Model Configuration with Claude Opus 4.6 (PR #341)
- **Backend**: `AiModelController` with endpoints for model config, available models, and stats
- **Endpoints**:
  - `GET /api/ai-model/config` — get or create user AI model config
  - `PUT /api/ai-model/config` — update config (selected model, extended thinking, thinking budget)
  - `GET /api/ai-model/models` — list available models (Claude Opus 4.6, Sonnet 4.5, Haiku 4.5)
  - `GET /api/ai-model/stats` — usage stats per model (requests, tokens, avg latency)
- **Entity**: `AiModelConfig` with Id (Guid), UserId, SelectedModel, ExtendedThinkingEnabled, ThinkingBudgetTokens, MaxOutputTokens, Temperature, StreamingEnabled, TotalRequests, TotalInputTokens, TotalOutputTokens, TotalThinkingTokens, AvgLatencyMs, ModelUsageJson, CreatedAt, UpdatedAt
- **Frontend**: `AiModelPage` in Settings with "AI Model" tab — 3 sub-tabs (Models with model selector cards showing capabilities/pricing, Configure with extended thinking toggle + budget slider + streaming toggle, Stats with usage metrics)
- **Flow**: Open AI Model tab → select model (Opus 4.6 for complex tasks, Sonnet 4.5 for speed) → enable extended thinking with budget → configure streaming → view per-model usage stats

### #357 — Purchasable Credit System with Multi-Currency Support (PR #369)
- **Backend**: `ExchangeRateService` manages exchange rate caching (IMemoryCache, 24h TTL) and dynamic credit calculation; `CreditController` provides credit-specific API
- **Endpoints**:
  - `GET /api/credits/packages?currency=KRW` — packages with fixed local prices + dynamically calculated credit amounts
  - `GET /api/credits/balance` — user credit balance (reads from TokenBalance)
  - `GET /api/credits/history` — credit transaction history (reads from TokenTransaction)
  - `GET /api/credits/rates` — all exchange rates
  - `POST /api/credits/checkout` — Stripe checkout in local currency
- **Entities**: `ExchangeRate` (CurrencyCode, RateToUsd, FetchedAt), `CreditPackagePrice` (TokenPackageId FK, CurrencyCode, Price, IsActive)
- **Credit Formula**: `credits = floor(localPrice ÷ exchangeRate × 100)` — $1 USD = 100 credits base rate
- **Currencies**: USD, KRW (₩2,900-₩49,000), JPY (¥300-¥7,800), EUR (€1.99-€49.99)
- **Frontend**: `BuyCreditsPage` at `/buy-credits` — auto-detects currency from `navigator.language`, package card grid with dynamic credit amounts, `Intl.NumberFormat` for locale-aware formatting, balance display, i18n (en/ko)
- **Flow**: User visits /buy-credits → currency auto-detected → packages shown with fixed local prices + dynamic credits → purchase via Stripe → credits awarded based on rate at purchase time

### #173 — Platform Growth Metrics Dashboard (PR #180)
- **Backend**: `GrowthService` manages growth metrics tracking, funnel analysis, and snapshot generation; `AdminGrowthController` with admin-only endpoints
- **Endpoints**:
  - `GET /api/admin/growth/overview` — KPI summary (TotalVisitors, TotalRegistered, TotalTrialUsers, TotalPaidUsers, MonthlyGrowthRate, ConversionRate, ChurnRate)
  - `GET /api/admin/growth/trends?months=12` — monthly growth trends with 12-month history
  - `GET /api/admin/growth/funnel` — conversion funnel stages (Visitors → Registered → Trial Users → Paid Users)
  - `POST /api/admin/growth/events` — record platform events (visit, register, trial_start, paid_conversion, churn)
  - `GET /api/admin/growth/export` — CSV export of growth metrics
- **Entities**: `PlatformEvent` (EventType, UserId, SessionId, Metadata), `GrowthSnapshot` (SnapshotDate, Period, TotalVisitors, TotalRegistered, TotalTrialUsers, TotalPaidUsers, NewRegistrations, ConversionRate, ChurnRate)
- **Frontend**: `AdminGrowthPage` with KPI cards (Visitors, Trial Users, Paid Members, Growth Rate), monthly growth trend line chart, conversion funnel visualization, CSV export
- **Flow**: Platform events recorded → daily/monthly snapshots generated → admin views KPI dashboard → analyzes funnel conversion rates → exports data as CSV

### #174 — Unit Test Infrastructure (PR #360)
- **Backend Tests**: xUnit + Moq + FluentAssertions + EF Core InMemory — 468 tests across 57 test files (25 controller tests + 30 service tests + 2 helpers) in `platform/backend/AiDevRequest.Tests/`
- **Frontend Tests**: Vitest + React Testing Library + jsdom — 875 tests across 106 test files (38 API tests + 16 component tests + 31+ page tests) in `platform/frontend/src/`
- **Test Infrastructure**: `TestDbContextFactory` with `TestAiDevRequestDbContext` subclass using `RemoveEntityType` pattern for EF Core InMemory FK type mismatch workarounds (int FK → Guid PK entities excluded)
- **Config**: Separate `vitest.config.ts` for frontend tests (keeps `vite.config.ts` clean for production builds)

### #334 — Bidirectional GitHub Sync for Generated Projects (PR #343)
- **Backend**: `BidirectionalGitSyncController` with 7 endpoints for sync config, push/pull operations, status, history, and stats
- **Endpoints**:
  - `GET /api/bidir-sync/config/{projectId}` — get or create sync config
  - `PUT /api/bidir-sync/config/{projectId}` — update sync settings
  - `POST /api/bidir-sync/push` — push project to GitHub (simulated)
  - `POST /api/bidir-sync/pull` — pull changes from GitHub (simulated)
  - `GET /api/bidir-sync/status/{projectId}` — sync status (synced/ahead/behind/diverged)
  - `GET /api/bidir-sync/history/{projectId}` — sync operation history
  - `GET /api/bidir-sync/stats` — aggregate stats
- **Entity**: `BidirectionalGitSync` with Id (Guid), UserId, DevRequestId, ProjectName, RepoOwner, RepoName, DefaultBranch, AiBranch, SyncEnabled, AutoPushEnabled, AutoPullEnabled, WebhookEnabled, Status, TotalPushes, TotalPulls, TotalConflicts, ConflictsResolved, SyncHistoryJson, ConflictFilesJson, CreatedAt, UpdatedAt
- **Frontend**: `BidirectionalGitSyncPage` in Settings with "Bidir Sync" tab — 3 sub-tabs (Sync with repo connection + push/pull + status, History with operation log, Stats with metric cards)
- **Flow**: Connect repo → push generated code → pull user changes → resolve conflicts → monitor sync status and history

### #358 — Support Board: Public Read + Auth Write + Admin Credits (PR #373)
- **Backend**: `SupportController` with 5 endpoints for CRUD and admin reward/status management
- **Endpoints**:
  - `GET /api/support` — paginated list (public, supports category filter and sort)
  - `GET /api/support/{id}` — single post detail (public)
  - `POST /api/support` — create post (authenticated)
  - `PATCH /api/support/{id}/reward` — set/modify reward credit (admin only)
  - `PATCH /api/support/{id}/status` — update post status (admin only)
- **Entity**: `SupportPost` with Id, UserId, Title, Content, Category (complaint/request/inquiry/other), Status (open/in_review/resolved/closed), RewardCredit, RewardedByUserId, RewardedAt, CreatedAt, UpdatedAt
- **Frontend**: `SupportBoardPage` at `/support` — list with category filter, pagination, detail view with admin credit controls, write form for authenticated users
- **Navigation**: Support link added to both public and authenticated nav in Layout header

### #362 — Structured Output Helper for AI Responses (PR #371)
- **Backend**: `StructuredOutputHelper` utility class centralizing JSON extraction and deserialization across 10 AI service files
- **Methods**: `DeserializeResponse<T>`, `DeserializeListResponse<T>`, `ExtractJson` (handles markdown code fences, raw JSON, whitespace)
- **Services updated**: AnalysisService, ProposalService, ProductionService, TestGenerationService, SelfHealingService, CompilerValidationService, CodeQualityReviewService, CodeReviewService, AccessibilityService, BuildVerificationService
- **Impact**: Removed ~123 lines of duplicated JSON parsing code, replaced with one-liner helper calls

### #349 — Cache Headers for Content-Hashed Static Assets
- **Config**: `staticwebapp.config.json` updated with route rule for `/assets/*` setting `Cache-Control: public, max-age=31536000, immutable`
- **Impact**: Vite content-hashed bundles (JS, CSS) get 1-year cache with immutable flag; index.html retains default short cache

### #350 — Conversational Tone in Refinement Chat
- **Backend**: `RefinementService.cs` system prompt extended with `## Conversational Style` section
- **Behavior**: LLM now expresses genuine agreement and compliments when warranted, matches user language (en/ko), avoids over-complimenting

### #363 — OpenTelemetry Observability Instrumentation (PR #375)
- **Backend Entity**: `ObservabilityTrace` extended with SpanId, ParentSpanId, OperationName, InputTokens, OutputTokens, EstimatedCost, DurationMs, ModelTier, ErrorMessage, AttributesJson
- **Backend Service**: `ObservabilityService` extended with StartSpanAsync, CompleteSpanAsync, GetStatsAsync, GetOperationsAsync, GetCostAnalyticsAsync, GetPerformanceMetricsAsync, GetUsageAnalyticsAsync
- **Backend Controller**: `ObservabilityController` extended with stats, operations, cost-analytics, performance-metrics, usage-analytics endpoints
- **Frontend**: Enhanced `ObservabilityPage` with stats cards (Total Traces, Tokens, Cost, Avg Duration), operation filters, Cost/Performance/Usage analytics tabs
- **Route**: `/settings/observability` path mapping added in SettingsLayout
- **i18n**: 80+ new keys in en.json and ko.json under `observability.*` namespace

### #374 — ErrorBoundary for White Screen Crash Prevention (PR #376)
- **Component**: `ErrorBoundary` class component wrapping the entire `<App>` — catches rendering errors and displays a recovery UI
- **Features**: "Try Again" button (resets error state), "Go Home" button (navigates to `/`), dev-only error message display
- **i18n**: `errorBoundary.title`, `errorBoundary.description`, `errorBoundary.retry`, `errorBoundary.goHome` in en/ko

### #364 — Automated AI Code Review Agent with Auto-Fix (PR #378)
- **Backend**: Enhanced `RequestsController` generation pipeline to auto-apply critical fixes after code quality review, then re-run review for updated scores
- **New Endpoint**: `GET /api/projects/{projectId}/review/summary` — concise review status with overall score, pass/fail, finding counts by severity, fixes applied
- **Auto-Fix Flow**: After `TriggerReviewAsync`, if critical findings exist → `ApplyAllFixesAsync("critical")` → re-trigger review → update `QualityConfidenceScore` with post-fix score

### #393 — Effort-Based Pricing with Usage Metering and Outcome Billing (PR #397)
- **Backend Entity**: `UsageMeter` with Id, UserId, DevRequestId, EffortTier (base/standard/complex/enterprise), Outcome (success/partial/failed), BasePrice, EffortMultiplier, OutcomeMultiplier, FinalPrice, TokensUsed, DurationMs, CreatedAt
- **Backend Service**: `UsageMeteringService` with RecordUsage, GetReport, GetBillingEstimate, GetPricingTiers — implements effort-based pricing multipliers (base: 1.0x, standard: 2.0x, complex: 3.5x, enterprise: 5.0x) and outcome-based billing (success: 1.0x, partial: 0.5x, failed: 0x)
- **Backend Controller**: `UsageMeteringController` with 4 endpoints: `POST /api/usage-metering/record`, `GET /api/usage-metering/report`, `GET /api/usage-metering/billing-estimate`, `GET /api/usage-metering/pricing-tiers`
- **Frontend**: `UsageDashboardPage` at `/settings/usage-dashboard` with usage stats, billing breakdown, and pricing tier reference
- **i18n**: `usageMeeting.*` keys in en.json and ko.json

### #394 — Agent-Triggered Automation from GitHub Issue Assignment (PR #398)
- **Backend Entity**: `AgentAutomation` with Id, IssueNumber, IssueTitle, IssueBody, AssignedTo, Status (Pending/Analyzing/Implementing/Testing/PrCreated/Completed/Failed), BranchName, PrNumber, PrUrl, StartedAt, CompletedAt, ErrorMessage, ContextSummary, CreatedAt, UpdatedAt
- **Backend Controller**: `AgentAutomationController` with webhook endpoint, config, task management, stats, and cancel APIs
- **Endpoints**: `POST /api/agent-automation/webhook`, `GET /api/agent-automation/config`, `GET /api/agent-automation/triggers`, `GET /api/agent-automation/triggers/{id}`, `POST /api/agent-automation/triggers/{id}/retry`, `POST /api/agent-automation/triggers/{id}/cancel`, `GET /api/agent-automation/stats`
- **Frontend**: `AgentTriggerPage` at `/settings/agent-triggers` with trigger list, status tracking, and automation stats
- **i18n**: `agentTrigger.*` keys in en.json and ko.json

### #381 — Currency Localization Based on User Preference and Geolocation (PR #402)
- **Frontend Utility**: `currency.ts` with currency detection, conversion, and formatting functions
- **Currency Detection Logic**: localStorage preference → navigator.language region subtag → i18n language fallback (en → USD, ko → KRW)
- **Supported Currencies**: USD, KRW, JPY, EUR with static exchange rates for conversion
- **Base Prices**: All prices stored in KRW and converted on-demand to user's detected currency
- **Updated Components**: `PricingSection` and `HomePage` now display prices in user's detected currency
- **Test Coverage**: 26 unit tests for currency detection, conversion, and formatting (included in 946 total tests)

### #404 — Fix E2E Test Networkidle Timeout (PR #407)
- **Problem**: Two E2E tests (`homepage.spec.ts` console errors test, `i18n.spec.ts` raw keys test) failed with 30s timeout waiting for `networkidle` state that never arrived due to failed API requests
- **Root Cause**: Without backend running in E2E tests, `getPricingPlans()` and `getTemplates()` API calls fail/timeout, keeping network busy indefinitely
- **Solution**: Replaced `page.waitForLoadState('networkidle')` with `page.locator('#root').toBeVisible()` wait strategy that confirms React app render without depending on network activity
- **Impact**: All 21 E2E tests now pass in ~7s (previously 2 tests timed out at 30s)

### #408 — Add Playwright E2E Test Creation to Automated Workflows (PR #410)
- **Workflow Enhancement**: Added `e2e-test-analyst` agent to b-start/b-ready workflows
- **Agent Sequence**: planner → frontend-dev + backend-dev → unit-test-analyst → **e2e-test-analyst** → tester
- **E2E Test Coverage**: Agent automatically creates Playwright tests for new pages, forms, user workflows, API integrations, accessibility features, and i18n
- **Test Patterns**: E2E tests follow existing patterns in `platform/frontend/e2e/` (accessibility.spec.ts, homepage.spec.ts, i18n.spec.ts, navigation.spec.ts, form.spec.ts)
- **Documentation**: Updated `.claude/commands/b-start.md` and `.claude/agents/b-ready.md` with E2E test creation guidance

## LangGraph Multi-Agent Orchestration

DAG-based multi-agent workflow orchestration for code generation pipelines:
- **Backend**: `LangGraphWorkflow` entity tracks workflow state (nodes, edges, execution state, cache hits, stampede protection). `LangGraphController` provides 8 endpoints for CRUD, execution, templates, and stats
- **Endpoints**:
  - `GET /api/langgraph/workflows` — list user workflows
  - `POST /api/langgraph/workflows` — create workflow with selected node types
  - `GET /api/langgraph/workflows/{id}` — get workflow details
  - `POST /api/langgraph/workflows/{id}/execute` — execute workflow (simulated)
  - `POST /api/langgraph/workflows/{id}/pause` — toggle pause/resume
  - `GET /api/langgraph/node-types` — list available agent node types (anonymous)
  - `GET /api/langgraph/templates` — list workflow templates (anonymous)
  - `GET /api/langgraph/stats` — workflow statistics
- **Frontend**: `LangGraphPage` in Settings with 4 sub-tabs (Create, Workflows, Templates, Stats). Create tab has node type selector with pipeline visualization. Workflows tab shows status, execution controls, and node progress. Templates tab offers pre-built pipelines. Stats tab shows aggregated metrics
- **Node Types**: Analyzer, Code Generator, Code Reviewer, Test Generator, Deployer, Custom Agent
- **Templates**: Code Review Pipeline, Full-Stack Generator, Test Automation
- **Entity**: `LangGraphWorkflow` with NodesJson, EdgesJson, ExecutionStateJson, TotalNodes, CompletedNodes, FailedNodes, StampedeProtectionEnabled, CacheHitsCount, TotalExecutions, AvgExecutionTimeMs
- **Ticket**: #420 — `LangGraph multi-agent orchestration for code generation workflow`

## HybridCache Multi-Tenant Performance Optimization

.NET 9 HybridCache with L1/L2 caching and cache stampede protection:
- **Backend**: `HybridCacheEntry` entity tracking cache keys, layers, hit/miss counts, stampede protection, cost savings. `HybridCacheController` with CRUD, invalidation, stats, and categories endpoints
- **Endpoints**:
  - `GET /api/hybrid-cache/entries` — list cache entries (filterable by category)
  - `POST /api/hybrid-cache/entries` — create cache entry
  - `GET /api/hybrid-cache/entries/{id}` — get entry details
  - `POST /api/hybrid-cache/entries/{id}/invalidate` — invalidate single entry
  - `POST /api/hybrid-cache/invalidate-all` — bulk invalidate (filterable by category)
  - `GET /api/hybrid-cache/stats` — cache performance stats (hit rate, latency, cost saved, by category/layer)
  - `GET /api/hybrid-cache/categories` — list cache categories (anonymous)
- **Frontend**: `HybridCachePage` in Settings with 3 sub-tabs (Overview, Entries, Stats). Overview shows hit rate, cost savings, stampede blocked, category breakdown, and L1/L2 layer stats. Entries tab has category filter and bulk invalidation. Stats tab shows detailed metrics
- **Cache Layers**: L1 (In-Memory), L2 (Distributed)
- **Categories**: AI Analysis, Templates, Scaffolds, Project Data, Model Responses, General
- **Entity**: `HybridCacheEntry` with CacheKey, CacheLayer, Category, SizeBytes, HitCount, MissCount, StampedeProtected, StampedeBlockedCount, AvgLatencyMs, CostSavedUsd, TtlSeconds, ExpiresAt
- **Ticket**: #421 — `.NET 9 HybridCache for multi-tenant performance optimization`

## Self-Healing Playwright Tests

AI-powered self-healing test selector repair with MCP integration:
- **Backend**: `PlaywrightHealingResult` entity tracking healing results with original/healed selectors, strategies, confidence, and timing. `PlaywrightHealingController` with heal, approve, reject, stats, and strategies endpoints
- **Endpoints**:
  - `GET /api/playwright-healing/results` — list healing results (filterable by status)
  - `GET /api/playwright-healing/results/{id}` — get result details
  - `POST /api/playwright-healing/heal` — heal a broken test selector (AI-powered)
  - `POST /api/playwright-healing/results/{id}/approve` — approve manual-review healing
  - `POST /api/playwright-healing/results/{id}/reject` — reject manual-review healing
  - `GET /api/playwright-healing/stats` — healing statistics (heal rate, confidence, by strategy)
  - `GET /api/playwright-healing/strategies` — list healing strategies (anonymous)
- **Frontend**: `PlaywrightHealingPage` in Settings with 3 sub-tabs (Heal, Results, Stats). Heal tab has form for test file/name/selector with real-time healing result display. Results tab shows history with approve/reject for manual-review items. Stats tab shows metrics and by-strategy breakdown
- **Healing Strategies**: Closest Match (DOM similarity), AI Suggest (AI-generated alternatives), Fallback Chain (cascading selectors)
- **Entity**: `PlaywrightHealingResult` with TestFile, TestName, OriginalSelector, HealedSelector, HealingStrategy, Confidence, Status, HealingAttempts, HealingTimeMs
- **Ticket**: #422 — `Self-healing Playwright tests with AI using Playwright MCP`

## Self-Healing Code with Autonomous Testing Loop

Autonomous testing loop that tests generated code in live browsers, detects failures, and auto-regenerates fixes:
- **Backend**: `SelfHealingRun` entity tracking healing runs with project name, test command, browser type, error/fix JSON, and test pass/fail counts. `SelfHealingController` with endpoints for starting runs, retrying, stats, and browsers
- **Endpoints**:
  - `GET /api/self-healing/runs` — list healing runs (filterable by status)
  - `GET /api/self-healing/runs/{id}` — get run details
  - `POST /api/self-healing/runs` — start a new healing run (simulated)
  - `POST /api/self-healing/runs/{id}/retry` — retry a failed run
  - `GET /api/self-healing/stats` — healing statistics (pass rate, heal rate, by browser/result)
  - `GET /api/self-healing/browsers` — list supported browsers (anonymous)
- **Frontend**: `SelfHealingPage` in Settings with 3 sub-tabs (Start, Runs, Stats). Start tab has form for project name, test command, browser selector, max attempts. Shows errors detected and fixes applied inline. Runs tab has retry functionality. Stats tab shows by-browser and by-result breakdowns
- **Browsers**: Chromium, Firefox, WebKit
- **Entity**: `SelfHealingRun` with ProjectName, TestCommand, BrowserType, Status, CurrentAttempt, MaxAttempts, ErrorsJson, FixesJson, TestDurationMs, HealingDurationMs, TestsPassed, TestsFailed, FinalResult
- **Ticket**: #423 — `Self-healing code with autonomous testing loop in live browser`

## Production-Connected Sandboxes

v0.dev-style sandboxes with auto-imported environment variables from cloud providers:
- **Backend**: `ProductionSandbox` entity tracking sandboxes with provider, env vars, services, region, and OAuth status. `ProductionSandboxController` with CRUD, stop, delete, stats, and providers endpoints
- **Endpoints**:
  - `GET /api/production-sandboxes` — list sandboxes (filterable by provider)
  - `GET /api/production-sandboxes/{id}` — get sandbox details
  - `POST /api/production-sandboxes` — create sandbox with auto-imported env vars
  - `POST /api/production-sandboxes/{id}/stop` — stop a running sandbox
  - `DELETE /api/production-sandboxes/{id}` — delete sandbox
  - `GET /api/production-sandboxes/stats` — sandbox statistics (by provider/status)
  - `GET /api/production-sandboxes/providers` — list cloud providers (anonymous)
- **Frontend**: `ProductionSandboxPage` in Settings with 3 sub-tabs (Create, Sandboxes, Stats). Create tab has form with provider selector and shows imported env vars/services. Sandboxes tab has stop/delete actions. Stats tab shows by-provider and by-status breakdowns
- **Providers**: Azure (App Service, SQL, Storage, Key Vault), AWS (RDS, S3, Lambda, CloudWatch), Vercel (Postgres, Blob, Edge Functions, KV)
- **Entity**: `ProductionSandbox` with SandboxName, Provider, Status, EnvVarsJson, EnvVarCount, ServicesJson, ServiceCount, Region, OAuthConnected, UptimeMinutes, CostUsd
- **Ticket**: #424 — `Production-connected sandboxes with environment variable import`

### Org Memory (Persistent Organizational Memory)

Factory.ai-style persistent organizational memory with vector DB for cross-session knowledge retention:
- **Backend**: `OrgMemory` entity with scope (user/org), 5 categories (preference, decision, pattern, standard, runbook), embedding status, and usage tracking. `OrgMemoryController` with CRUD, search, stats, and categories endpoints
- **Endpoints**:
  - `GET /api/org-memories` — list memories (filterable by scope/category)
  - `GET /api/org-memories/{id}` — get memory details
  - `POST /api/org-memories` — create memory (500 limit per user)
  - `DELETE /api/org-memories/{id}` — delete memory
  - `POST /api/org-memories/search` — search memories with usage tracking
  - `GET /api/org-memories/stats` — memory statistics (by scope, embedding status, category)
  - `GET /api/org-memories/categories` — list categories with descriptions and colors (anonymous)
- **Frontend**: `OrgMemoryPage` in Settings with 4 sub-tabs (Create, Browse, Search, Stats). Create tab has form with title, content, scope, category, source project fields and shows available categories. Browse tab lists all memories with scope badges and delete action. Search tab has query input with scope filter. Stats tab shows aggregate metrics and by-category breakdown
- **Entity**: `OrgMemory` with Scope, Category, Title, Content, SourceProject, Relevance, UsageCount, TagsJson, EmbeddingStatus (pending/indexed/failed)
- **Ticket**: #425 — `Persistent organizational memory across sessions with vector DB`

### Background Agents (Async Testing & Monitoring)

Cursor-style background agents that run tasks asynchronously without blocking the main generation workflow:
- **Backend**: `BackgroundAgent` entity with agent type (general/frontend/backend/testing/refactor), status tracking, progress steps, resource metrics (CPU/memory/tokens/cost), and simulated execution. `BackgroundAgentController` with list, get, spawn, stop, stats, types endpoints
- **Endpoints**:
  - `GET /api/background-agents` — list agents (filterable by status)
  - `GET /api/background-agents/{id}` — get agent details with logs, steps, packages
  - `POST /api/background-agents/spawn` — spawn agent (5 concurrent limit)
  - `POST /api/background-agents/{id}/stop` — stop running agent
  - `GET /api/background-agents/stats` — agent statistics (total, active, completed, failed, tokens, cost, PRs, avg time)
  - `GET /api/background-agents/types` — list agent types with descriptions
- **Frontend**: `BackgroundAgentPage` in Settings with 4 sub-tabs (Dashboard, Agents, Spawn, Logs). Dashboard shows stats cards and agent types. Agents tab has status filter, progress bars, and detail panel. Spawn tab has form with project ID, agent name, task, type, priority. Logs tab shows timestamped entries
- **Entity**: `BackgroundAgent` with AgentName, TaskDescription, Status, BranchName, AgentType, Priority, TotalSteps/CompletedSteps/ProgressPercent, Files/Tests metrics, CPU/Memory/Tokens/Cost, PullRequest tracking, LogEntries/Steps/InstalledPackages JSON
- **Ticket**: #434 — `Background agents for async testing and monitoring`

### Agent Rules (AI Agent Configuration System)

.cursorrules-style AI agent configuration with project/user/org scoping and 6 rule categories:
- **Backend**: `AiAgentRule` entity with scope, category, priority-based ordering, and toggle/applied tracking. `AiAgentRuleController` with CRUD, toggle, stats, and categories endpoints
- **Endpoints**:
  - `GET /api/agent-rules` — list rules (filterable by scope/category), max 100 per query
  - `GET /api/agent-rules/{id}` — get single rule
  - `POST /api/agent-rules` — create rule (200 per user limit)
  - `PATCH /api/agent-rules/{id}/toggle` — toggle active/inactive
  - `DELETE /api/agent-rules/{id}` — delete rule
  - `GET /api/agent-rules/stats` — rule statistics (by scope, by category, total applied)
  - `GET /api/agent-rules/categories` — list 6 categories with descriptions and colors (anonymous)
- **Categories**: architecture (#3B82F6), coding-standards (#10B981), tech-stack (#8B5CF6), security (#EF4444), testing (#F59E0B), deployment (#6366F1)
- **Frontend**: `AgentRulesPage` in Settings with 3 sub-tabs (Create, Rules, Stats). Create tab has form with title, content, scope selector, category dropdown, project name, priority slider (0-100). Rules tab shows filterable list with scope badges, toggle/delete actions. Stats tab shows total/active/applied metrics and breakdowns by scope and category
- **Entity**: `AiAgentRule` with Scope (project/user/org), Category, Title, Content, ProjectName, IsActive, Priority (0-100), TimesApplied
- **Ticket**: #435 — `.cursorrules-style AI agent configuration system`

### React Server Components (RSC Configuration)

React 19 Server Components configuration for generated projects with framework selection and performance analysis:
- **Backend**: `ServerComponentConfig` entity with framework, render strategy, streaming/metadata/DB access options, and performance metrics. `ServerComponentController` with CRUD, analyze, stats, frameworks, and patterns endpoints
- **Endpoints**:
  - `GET /api/server-components` — list configs (filterable by framework)
  - `GET /api/server-components/{id}` — get config
  - `POST /api/server-components` — create config (50 per user limit)
  - `POST /api/server-components/{id}/analyze` — run simulated performance analysis
  - `DELETE /api/server-components/{id}` — delete config
  - `GET /api/server-components/stats` — project statistics (by framework, by strategy)
  - `GET /api/server-components/frameworks` — list frameworks (Next.js, Remix, Vite+RSC) with descriptions (anonymous)
  - `GET /api/server-components/patterns` — list RSC code patterns (data fetching, streaming, metadata, client boundary) (anonymous)
- **Frontend**: `ServerComponentsPage` in Settings with 4 sub-tabs (Configure, Projects, Patterns, Stats). Configure tab has project name, framework selector, render strategy, data fetching pattern, and checkboxes for streaming/metadata/DB. Projects tab shows configured projects with analysis metrics. Patterns tab displays RSC code examples. Stats tab shows aggregate metrics and breakdowns
- **Entity**: `ServerComponentConfig` with Framework (nextjs/remix/vite-rsc), RenderStrategy (hybrid/ssr/ssc/client-only), StreamingEnabled, MetadataHoisting, DirectDbAccess, DataFetchingPattern, ServerComponentCount, ClientComponentCount, BundleSizeReductionPercent, InitialLoadMs, Status
- **Ticket**: #436 — `React 19 Server Components for generated projects`

### Code Linting (AI-Powered Analysis with Autofix)

SonarQube-style AI-powered code analysis with multi-language support and automatic fix generation:
- **Backend**: `CodeLintResult` entity with severity, category, language, code snippet, autofix status, and PR tracking. `CodeLintController` with list, analyze, autofix, dismiss, delete, stats, and rules endpoints
- **Endpoints**:
  - `GET /api/code-lint` — list results (filterable by severity/category/language)
  - `GET /api/code-lint/{id}` — get single result
  - `POST /api/code-lint/analyze` — run AI analysis (returns issues with snippets)
  - `POST /api/code-lint/{id}/autofix` — apply AI-generated fix
  - `POST /api/code-lint/{id}/dismiss` — dismiss issue
  - `DELETE /api/code-lint/{id}` — delete result
  - `GET /api/code-lint/stats` — analysis statistics (by severity, category, language)
  - `GET /api/code-lint/rules` — list 6 issue categories with colors (anonymous)
- **Categories**: bug (#EF4444), vulnerability (#F97316), code-smell (#EAB308), security (#DC2626), performance (#3B82F6), maintainability (#8B5CF6)
- **Frontend**: `CodeLintPage` in Settings with 4 sub-tabs (Analyze, Issues, Rules, Stats). Analyze tab runs analysis on projects with language selection. Issues tab shows filterable list with autofix/dismiss/delete. Rules tab shows category reference. Stats tab shows total/resolved/autofixed/critical metrics and breakdowns
- **Entity**: `CodeLintResult` with Language (typescript/csharp/python/go/rust), Severity (info/warning/error/critical), Category, RuleId, Message, FilePath, LineNumber, Snippet, SuggestedFix, AutofixStatus (pending/applied/dismissed/pr-created)
- **Ticket**: #437 — `AI-powered code linting with SonarQube-style autofix`

### Hybrid Vector Search (Multi-Modal Search for Organizational Memory)

Hybrid search combining vector similarity, keyword matching, and fusion algorithms for enhanced organizational memory retrieval:
- **Backend**: `VectorSearchConfig` entity with provider, search mode, fusion algorithm, weight tuning, and query stats. `VectorSearchController` with CRUD, query simulation, stats, and provider endpoints
- **Endpoints**:
  - `GET /api/vector-search` — list configs (50 limit)
  - `GET /api/vector-search/{id}` — get config
  - `POST /api/vector-search` — create config (20 per user limit)
  - `POST /api/vector-search/query` — run simulated hybrid search with fused/vector/keyword scores
  - `DELETE /api/vector-search/{id}` — delete config
  - `GET /api/vector-search/stats` — search statistics (by provider, by mode)
  - `GET /api/vector-search/providers` — list 4 providers: Qdrant, Pinecone, Weaviate, pgvector (anonymous)
- **Providers**: Qdrant (#DC382C), Pinecone (#000000), Weaviate (#00A98E), pgvector (#336791)
- **Frontend**: `VectorSearchPage` in Settings with 4 sub-tabs (Search, Indexes, Configure, Stats). Search tab runs queries with mode selector showing fused/vector/keyword scores. Indexes tab lists configs with mode badges. Configure tab has index name, provider, search mode (hybrid/vector/keyword), fusion algorithm (RRF/linear/weighted), vector/keyword weight sliders, top-K, checkboxes. Stats tab shows aggregate metrics and breakdowns
- **Entity**: `VectorSearchConfig` with Provider (qdrant/pinecone/weaviate/pgvector), SearchMode (hybrid/vector-only/keyword-only), FusionAlgorithm (rrf/linear/weighted), VectorWeight, KeywordWeight, TopK, SimilarityThreshold, QueryExpansion, MetadataFiltering, VectorDimension, TotalVectors, AvgQueryLatencyMs, TotalQueries, Status
- **Ticket**: #438 — `Hybrid vector search for organizational memory (enhance #425)`

### REPL-Based Testing (Fast Verification with Potemkin Detection)

REPL-based test execution that's 3x faster and 10x cheaper than browser automation, with Potemkin interface detection and DB state verification:
- **Backend**: `ReplTestSession` entity with test mode, runtime, pass/fail counts, Potemkin detections, DB state checks, log captures, speedup factor, and cost reduction metrics. `ReplTestController` with run tests, list sessions, delete, stats, and runtimes endpoints
- **Endpoints**:
  - `GET /api/repl-test` — list sessions (50 limit)
  - `GET /api/repl-test/{id}` — get session
  - `POST /api/repl-test/run` — run tests with simulated results including Potemkin detection and DB verification
  - `DELETE /api/repl-test/{id}` — delete session
  - `GET /api/repl-test/stats` — testing statistics (by mode, by runtime)
  - `GET /api/repl-test/runtimes` — list 4 runtimes: Node.js, Deno, Bun, Python (anonymous)
- **Runtimes**: Node.js (#339933), Deno (#000000), Bun (#FBF0DF), Python (#3776AB)
- **Frontend**: `ReplTestPage` in Settings with 4 sub-tabs (Run, Sessions, Compare, Stats). Run tab executes tests with mode/runtime selection showing results with Potemkin/DB Verified tags. Sessions tab shows past test runs. Compare tab shows REPL vs Browser performance comparison table. Stats tab shows sessions/tests/pass rate/speedup/cost reduction metrics
- **Entity**: `ReplTestSession` with TestMode (repl/browser/hybrid), Runtime (node/deno/bun/python), TotalTests, PassedTests, FailedTests, PotemkinDetections, DbStateChecks, LogsCaptured, AvgLatencyMs, SpeedupFactor, CostReduction, Status, ResultSummary
- **Ticket**: #440 — `REPL-based testing for 3x faster verification (enhance #423)`

### Agent Terminal & Browser Access (Cursor Agent Mode)

Terminal and browser access for AI agents with sandboxed execution, security controls, and subagent delegation:
- **Backend**: `AgentTerminalSession` entity with access mode, sandbox type, command/browser/subagent counts, resource limits, and session metrics. `AgentTerminalController` with execute, list sessions, delete, stats, and sandbox types endpoints
- **Endpoints**:
  - `GET /api/agent-terminal` — list sessions (50 limit)
  - `GET /api/agent-terminal/{id}` — get session
  - `POST /api/agent-terminal/execute` — execute agent task with command results and browser action results
  - `DELETE /api/agent-terminal/{id}` — delete session
  - `GET /api/agent-terminal/stats` — session statistics (by mode, by sandbox)
  - `GET /api/agent-terminal/sandboxes` — list 4 sandbox types: Docker, Firecracker, gVisor, Deno (anonymous)
- **Sandboxes**: Docker (#2496ED), Firecracker (#FF9900), gVisor (#4285F4), Deno (#000000)
- **Frontend**: `AgentTerminalPage` in Settings with 4 sub-tabs (Execute, Sessions, Sandboxes, Stats). Execute tab runs agent tasks with mode/sandbox selection showing command log and browser action results. Sessions tab lists past sessions. Sandboxes tab shows environments and security controls (CPU/memory/timeout/network/filesystem). Stats tab shows aggregate metrics
- **Entity**: `AgentTerminalSession` with AccessMode (terminal/browser/both), SandboxType (docker/firecracker/gvisor/deno), CommandsExecuted, BrowserActions, SubagentsDelegated, FilesModified, CpuLimitPercent, MemoryLimitMb, TimeoutMinutes, NetworkEgressAllowed, SessionDurationMs, Status, OutputLog
- **Ticket**: #441 — `Agent terminal and browser access (Cursor Agent Mode pattern)`

### Multi-File Composer with Plan Mode (Cursor Composer Pattern)

Multi-file editing with plan-first workflow, model tier selection, and diff preview:
- **Backend**: `ComposerPlan` entity with plan mode, model tier, step tracking, and approval workflow. `ComposerController` with plan creation, approval, list, delete, stats, and modes endpoints
- **Endpoints**:
  - `GET /api/composer` — list plans (50 limit)
  - `POST /api/composer/plan` — create plan with simulated steps (max 20 per user)
  - `POST /api/composer/{id}/approve` — approve or reject plan
  - `DELETE /api/composer/{id}` — delete plan
  - `GET /api/composer/stats` — plan statistics (by mode, by model, approval rate)
  - `GET /api/composer/modes` — list 3 composer modes (anonymous)
- **Modes**: Plan First (#3B82F6), Direct Edit (#10B981), Interactive (#8B5CF6)
- **Models**: Haiku (fast/2x), Sonnet (balanced/1x), Opus (most capable/0.5x)
- **Frontend**: `ComposerPage` in Settings with 4 sub-tabs (Compose, Plans, Modes, Stats). Compose tab creates plans with mode/model selection, shows plan overview with step/file/line counts and approve/reject buttons, plus diff preview. Plans tab lists all plans with status badges. Modes tab shows composer modes and model tiers. Stats tab shows aggregate metrics and breakdowns
- **Entity**: `ComposerPlan` with PlanMode (plan-first/direct/interactive), ModelTier (haiku/sonnet/opus), TotalSteps, CompletedSteps, FilesChanged, LinesAdded, LinesRemoved, EstimatedTokens, ActualTokens, DiffPreviewShown, PlanApproved, Status, PlanSummary
- **Ticket**: #442 — `Multi-file Composer with Plan Mode (Cursor pattern)`

### .NET 9 Performance Optimization Benchmarks

Backend performance benchmarking and optimization with .NET 9 features (JSON, HTTP/3, Startup, AOT, GC):
- **Backend**: `PerformanceOptimization` entity with benchmark metrics, latency comparison, memory savings, throughput. `PerformanceOptController` with benchmark execution, list, delete, stats, and categories endpoints
- **Endpoints**:
  - `GET /api/performance-opt` — list optimizations (50 limit)
  - `POST /api/performance-opt/benchmark` — run benchmark with simulated metrics (max 50 per user)
  - `DELETE /api/performance-opt/{id}` — delete optimization
  - `GET /api/performance-opt/stats` — optimization statistics (by category, by status)
  - `GET /api/performance-opt/categories` — list 5 categories: JSON, HTTP/2&3, Startup, AOT, GC (anonymous)
- **Categories**: JSON Serialization (#3B82F6, 35%), HTTP/2 & HTTP/3 (#10B981, 20%), Startup Time (#F59E0B, 15%), Native AOT (#8B5CF6, 35%), Garbage Collection (#EF4444, 10%)
- **Frontend**: `DotnetPerfPage` in Settings with 4 sub-tabs (Benchmark, History, Categories, Stats). Benchmark tab runs performance tests showing improvement %, memory saved %, throughput, latency comparison, and detailed breakdown. History tab lists past benchmarks. Categories tab shows optimization categories and key features. Stats tab shows aggregate metrics
- **Entity**: `PerformanceOptimization` with Category (json/http/startup/aot/gc), BaselineLatencyMs, OptimizedLatencyMs, ImprovementPercent, MemoryBeforeMb, MemoryAfterMb, MemorySavedPercent, BenchmarkRuns, ThroughputRps, Status
- **Ticket**: #444 — `Leverage .NET 9 performance optimizations (AOT, JSON, HTTP/3)`

### Multi-Model AI Routing (Dual Model Strategy)

Intelligent routing between AI models (Claude Opus, Claude Sonnet, GPT-Codex, GPT-4o) for optimal cost, speed, and quality:
- **Backend**: `ModelRoutingRule` entity with task-based routing, primary/fallback models, strategy selection, and performance metrics. `MultiModelRoutingController` with simulate, create, list, delete, stats, and models endpoints
- **Endpoints**:
  - `GET /api/multi-model-routing` — list routing rules (50 limit)
  - `POST /api/multi-model-routing` — create routing rule (max 20 per user)
  - `POST /api/multi-model-routing/simulate` — simulate routing decision with model comparison
  - `DELETE /api/multi-model-routing/{id}` — delete routing rule
  - `GET /api/multi-model-routing/stats` — routing statistics (by task, by model, by strategy)
  - `GET /api/multi-model-routing/models` — list 4 models with specs (anonymous)
- **Models**: Claude Opus (quality-first, 3200ms, $0.075), Claude Sonnet (balanced, 1800ms, $0.015), GPT-Codex (code-optimized, 2100ms, $0.030), GPT-4o (speed-first, 1200ms, $0.025)
- **Strategies**: Quality First, Speed First, Cost Optimized, Balanced
- **Frontend**: `MultiModelRoutingPage` in Settings with 4 sub-tabs (Simulate, Rules, Models, Stats). Simulate tab routes tasks to best model showing comparison cards. Rules tab creates and manages routing rules. Models tab shows AI model specs and routing strategies. Stats tab shows aggregate metrics
- **Entity**: `ModelRoutingRule` with TaskType (code-generation/reasoning/refactoring/testing/review), PrimaryModel, FallbackModel, RoutingStrategy, CostThreshold, LatencyThresholdMs, TotalRequests, PrimaryHits, FallbackHits, AvgPrimaryLatencyMs, AvgFallbackLatencyMs, AccuracyScore, Status
- **Ticket**: #454 — `Multi-model AI routing with GPT-5.3-Codex + Claude Opus 4.6`
