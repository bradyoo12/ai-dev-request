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
| OnboardingProgress | User onboarding wizard progress tracking with step completion milestones |
| ProjectVersion | Versioned snapshot of a generated project with file-level diff capabilities |
| ComponentPreview | Visual component preview with conversational iteration for design refinement |
| GenerationVariant | A/B variant of generated code with approach, metrics, rating, and selection status |
| PerformanceProfile | Multi-dimensional performance profiling result with scores, suggestions, and optimization history |
| DataSchema | NL-designed database schema with entities, relationships, validation, and multi-target code generation |

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
