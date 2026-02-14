# Project Inventory

Complete map of all existing code in the ai-dev-request platform. Use this to find existing code and avoid creating duplicates.

**Counts**: 102 Controllers | 89 Services | 113 Entities | 99 Pages | 92 API modules | 33 Components

---

## Backend Controllers

All under `platform/backend/AiDevRequest.API/Controllers/`. Route prefix: `/api/`.

### Core

| Controller | Route | Purpose |
|---|---|---|
| RequestsController | /api/requests | CRUD for dev requests, analysis, proposals, builds |
| AuthController | /api/auth | Authentication (login, register, social auth, JWT) |
| SettingsController | /api/settings | App settings, token management, pricing |
| ApiKeysController | /api/apikeys | API key generation and management |
| SitesController | /api/sites | User site management |
| TemplatesController | /api/templates | Project template CRUD |
| LanguagesController | /api/languages | Supported languages |
| TranslationsController | /api/translations | i18n translations |
| TranslationSeedController | /api/translations/seed | Seed translation data |
| PricingController | /api/pricing | Pricing tiers |
| HostingController | /api/hosting | Hosting plan management |
| DomainsController | /api/domains | Custom domain management |
| FileGenerationController | /api/files | File generation manifest |
| ExampleActionController | /api/example-action | Example/demo actions |

### AI & Generation

| Controller | Route | Purpose |
|---|---|---|
| StreamingGenerationController | /api/requests/{id}/generate | Real-time SSE code generation |
| CompilerController | /api/projects/{id}/compiler | Compiler-in-the-loop validation |
| SpecificationController | /api/requests/{id}/specs | Spec-driven development pipeline |
| GenerativeUiController | /api/generative-ui | Generative UI chat interface |
| VisualEditorController | /api/visual-editor | Visual drag-and-drop UI editor |
| VisualPromptUiController | /api/visual-prompt | Visual prompt-to-UI design |
| VisualOverlayController | /api/visual-overlay | Visual overlay editing sessions |
| ComponentPreviewController | /api/component-preview | v0.dev-style component preview |
| VariantController | /api/requests/{id}/variants | A/B variant generation |
| FrameworkConfigController | /api/framework | Multi-framework project generation |
| NlSchemaController | /api/nl-schema | Natural language schema designer |
| AiElementsController | /api/ai-elements | Vercel AI Elements streaming |
| AiModelController | /api/ai-model | AI model configuration (Opus 4.6, Sonnet 4.5) |
| ModelRoutingController | /api/model-routing | Multi-model intelligent routing |
| RefinementController | /api/refinement | Conversational refinement chat |
| SchemaDesignerController | /api/schema-designer | Visual schema design |

### Code Quality & Security

| Controller | Route | Purpose |
|---|---|---|
| CodeQualityReviewController | /api/projects/{id}/review | AI code quality review |
| ReviewPipelineController | /api/review-pipeline | Automated review pipeline |
| MultiAgentReviewController | /api/multi-agent-review | Parallel multi-agent review |
| SecurityController | /api/projects/{id}/security | SBOM & vulnerability scanning |
| ComplianceController | /api/compliance | OAuth compliance reporting |
| OAuthComplianceController | /api/oauth-compliance | OAuth security compliance |
| SecretDetectionController | /api/projects/{id}/secrets | Secret detection & config |

### Testing & Validation

| Controller | Route | Purpose |
|---|---|---|
| TestGenerationController | /api/projects/{id}/tests | AI test generation |
| AutonomousTestingController | /api/autonomous-testing | Self-healing test execution |
| VisualRegressionController | /api/visual-regression | Visual regression testing |
| SelfHealingTestController | /api/self-healing-test | Self-healing code generation |

### Infrastructure & Deployment

| Controller | Route | Purpose |
|---|---|---|
| InfrastructureController | /api/projects/{id}/infrastructure | IaC/Bicep generation |
| DeploymentHealthController | /api/deployment-health | Health monitoring & auto-rollback |
| ContainerizationController | /api/projects/{id}/containers | Docker containerization |
| PreviewController | /api/projects/{id}/preview | Edge preview deployments |
| PlatformUpgradeController | /api/platform-upgrade | .NET 10 upgrade dashboard |
| SandboxExecutionController | /api/sandbox | Sandboxed code execution |
| DatabaseBranchController | /api/database-branch | Git-like database branching |

### Billing & Payments

| Controller | Route | Purpose |
|---|---|---|
| BillingController | /api/billing | Usage-based billing, subscriptions |
| UsageBillingController | /api/usage-billing | Usage billing aggregation |
| PaymentsController | /api/payments | Stripe payment processing |
| CreditController | /api/credits | Credit packages, multi-currency |
| UsageMeteringController | /api/usage-metering | Usage metering and tracking |

### Agents & Orchestration

| Controller | Route | Purpose |
|---|---|---|
| BackgroundAgentController | /api/background-agents | Background agent workers |
| SubagentOrchestrationController | /api/subagent | Subagent task orchestration |
| AgentAutomationController | /api/agent-automation | Agent automation rules |
| AgentSkillController | /api/agent-skills | Agent skills CRUD and management |
| LangGraphWorkflowController | /api/langgraph | LangGraph workflow engine |
| AgenticPlanController | /api/agentic-plan | Autonomous planning system |
| WorkflowController | /api/workflows | Durable workflow orchestration |
| A2AController | /api/a2a | Agent-to-agent protocol |

### Integrations

| Controller | Route | Purpose |
|---|---|---|
| McpIntegrationController | /api/mcp | MCP tool exposure & server connections |
| McpGatewayController | /api/mcp-gateway | MCP gateway for multi-agent tool orchestration |
| McpToolIntegrationController | /api/mcp-tools | MCP tool integration for code gen |
| GitHubSyncController | /api/projects/{id}/github | Bidirectional GitHub sync |
| BidirectionalGitSyncController | /api/bidir-sync | Full bidirectional git sync |
| GitBranchController | /api/git-branch | Git branch per chat |
| OAuthConnectorController | /api/oauth-connectors | Managed OAuth connectors |
| FigmaImportController | /api/figma-import | Figma-to-code import |

### Marketplace & Templates

| Controller | Route | Purpose |
|---|---|---|
| TemplateMarketplaceController | /api/marketplace | Community template marketplace |
| ArenaController | /api/arena | Multi-model arena comparison |

### Analytics & Admin

| Controller | Route | Purpose |
|---|---|---|
| AnalyticsDashboardController | /api/analytics | Product analytics dashboard |
| AdminGrowthController | /api/admin/growth | Admin growth metrics |
| AdminChurnController | /api/admin/churn | Admin churn analysis |
| ObservabilityController | /api/observability | Observability tracing |

### Collaboration & Communication

| Controller | Route | Purpose |
|---|---|---|
| CollaborativeEditingController | /api/projects/{id}/collab | CRDT collaborative editing |
| TeamController | /api/teams | Team workspaces |
| SupportController | /api/support | Support posts, feedback presets, credit rewards |
| SuggestionsController | /api/suggestions | Feature suggestions |
| AgentInboxController | /api/agent-inbox | Agent inbox end-user feedback |

### Project Management

| Controller | Route | Purpose |
|---|---|---|
| ProjectsController | /api/projects | Project list, detail, cost estimation, real-time logs |
| ProjectVersionController | /api/projects/{id}/versions | Version history & diff |
| OnboardingController | /api/onboarding | User onboarding wizard |
| PipelinesController | /api/pipelines | Dev pipeline builder |
| ApiDocsController | /api/apidocs | OpenAPI doc generation |
| CodeMergeController | /api/codemerge | Incremental code regeneration |
| PlanningSessionController | /api/planning | Discussion/planning mode |
| ProjectDocumentationController | /api/project-docs | Auto-generated docs |
| ProjectMemoryController | /api/project-memory | Persistent codebase memory |
| ProjectIndexController | /api/project-index | Semantic project index |

### Configuration & Features

| Controller | Route | Purpose |
|---|---|---|
| VoiceController | /api/voice | Voice-driven development input |
| MobileAppController | /api/mobile-app | Mobile app generation |
| ViewTransitionController | /api/view-transitions | React view transitions |
| QueryConfigController | /api/query-config | TanStack Query configuration |
| SemanticSearchController | /api/semantic-search | pgvector semantic search |
| PerformanceController | /api/projects/{id}/performance | Performance profiling |
| OrganizationalMemoryController | /api/organizational-memory | Org memory with vectors |
| MicroserviceController | /api/microservices | Microservice architecture |
| WhiteLabelController | /api/whitelabel | White-label tenant config |
| MemoryController | /api/memories | User memories |
| PreferenceController | /api/preferences | User preferences |
| RecommendationController | /api/recommendations | App recommendations |
| TechTrendController | /api/trends | Tech trend tracking |

---

## Backend Services

All under `platform/backend/AiDevRequest.API/Services/`.

### Core Pipeline

| Service | Purpose |
|---|---|
| AnalysisService | Claude API requirement analysis |
| ProposalService | Claude API implementation proposals |
| ProductionService | Claude API code generation |
| ModelRouterService | Intelligent model tier routing (Haiku/Sonnet/Opus) |
| CostTrackingService | Per-request cost tracking |
| RefinementService | Conversational refinement flow |
| StreamingGenerationService | SSE streaming code generation |
| FileGenerationService | File output manifest generation |
| CompilerValidationService | Compiler-in-the-loop validation |
| SpecificationService | Spec-driven pipeline service |
| CodeValidationService | Generated code validation |
| StructuredOutputHelper | Structured output parsing helper |

### AI Model Providers

| Service | Purpose |
|---|---|
| IModelProviderService | Model provider interface |
| ClaudeProviderService | Claude API provider |
| GeminiProviderService | Gemini API provider |

### Data & Memory

| Service | Purpose |
|---|---|
| EmbeddingService | Text embedding generation |
| VectorDatabaseService | In-memory vector storage |
| EfCoreVectorSearchService | EF Core native vector search |
| MemoryExtractionService | Extract org knowledge from projects |
| MemoryRetrievalService | Semantic memory retrieval |
| MemoryService | User memory CRUD |

### Project Management

| Service | Purpose |
|---|---|
| ProjectAggregationService | Aggregate project data from multiple sources |
| ProjectCostEstimationService | Calculate daily/monthly cloud costs |
| LogStreamService | SSE streaming for real-time logs |

### Auth & User

| Service | Purpose |
|---|---|
| AuthService | JWT auth, login, register |
| SocialAuthService | Google/GitHub social auth |
| TokenService | Token balance management |
| PreferenceService | User preferences |
| OnboardingService | Onboarding flow |
| TeamService | Team workspace management |

### Billing & Payments

| Service | Purpose |
|---|---|
| PaymentService | Stripe payment processing |
| BillingService | Subscription billing |
| UsageBillingService | Usage-based billing |
| UsageMeteringService | Usage metering and tracking |
| ExchangeRateService | Multi-currency exchange rates |
| CryptoPaymentService | Cryptocurrency payment processing |

### Code Quality & Review

| Service | Purpose |
|---|---|
| CodeReviewService | AI code quality review |
| CodeQualityReviewService | Quality review orchestration |
| MultiAgentReviewService | Parallel multi-agent review |
| BuildVerificationService | Post-build verification |
| AccessibilityService | Accessibility compliance checking |
| SelfHealingService | Self-healing code fixes |
| SelfHealingTestService | Self-healing test execution |

### Testing

| Service | Purpose |
|---|---|
| TestGenerationService | AI test generation |
| AutonomousTestingService | Autonomous test execution |
| LiveBrowserTestRunner | Live browser test runner |

### Security

| Service | Purpose |
|---|---|
| SecurityService | SBOM & vulnerability scanning |
| SecretDetectionService | Secret scanning |
| SecureConfigService | Secure configuration management |
| OAuthComplianceService | OAuth compliance checking |

### Project Management

| Service | Purpose |
|---|---|
| ProjectAggregationService | Aggregate project data from deployments, requests, usage |
| ProjectCostEstimationService | Calculate daily project cloud costs |
| LogStreamService | SSE streaming for real-time project logs |

### Infrastructure & Deployment

| Service | Purpose |
|---|---|
| InfrastructureService | IaC/Bicep generation |
| DeploymentService | Azure deployment |
| ContainerizationService | Docker containerization |
| PreviewDeploymentService | Edge preview deployments |
| PromoteToProductionService | Promote preview to production |
| ExpoPreviewService | Expo mobile preview |
| SandboxExecutionService | Sandboxed code execution |
| DatabaseBranchService | Database branching |
| CiCdService | CI/CD pipeline generation |

### Integrations

| Service | Purpose |
|---|---|
| GitHubSyncService | GitHub bidirectional sync |
| GitBranchService | Git branch management |
| McpIntegrationService | MCP tool integration |
| DomainService | Custom domain management |

### Agents & Orchestration

| Service | Purpose |
|---|---|
| SubagentOrchestrationService | Subagent task orchestration |
| TaskDecompositionService | Task decomposition for agents |
| ResultAggregationService | Multi-agent result aggregation |
| AgentSkillService | Agent skills management and detection |
| WorkflowOrchestrationService | Durable workflow engine |
| LangGraphWorkflowService | LangGraph workflow execution |
| A2AService | Agent-to-agent protocol |

### Analytics & Marketplace

| Service | Purpose |
|---|---|
| AnalyticsDashboardService | Analytics aggregation |
| TemplateMarketplaceService | Marketplace operations |
| GrowthService | Growth metrics |
| ObservabilityService | Distributed tracing |

### Content & Features

| Service | Purpose |
|---|---|
| TemplateService | Project template engine |
| ExportService | Project export |
| SchemaDesignerService | Schema design |
| ComponentPreviewService | Component preview rendering |
| VariantGenerationService | A/B variant generation |
| PerformanceProfileService | Performance profiling |
| CollaborativeEditingService | CRDT collaborative editing |
| ProjectVersionService | Version history |
| VisualEditorService | Visual editor state management |
| CodeSyncService | Visual editor to code sync |
| DatabaseSchemaService | Database schema operations |
| RecommendationService | App recommendations |
| TechTrendService | Tech trend tracking |
| MicroserviceService | Microservice architecture |
| WhiteLabelService | White-label tenancy |
| AgentInboxService | Agent inbox feedback management |

---

## Backend Entities

All under `platform/backend/AiDevRequest.API/Entities/`. 111 entities total.

### Core Domain

| Entity | Purpose |
|---|---|
| DevRequest | Development request (main entity) |
| User | User account |
| Project | Deployed project with URL, cost, and logs |
| ProjectLog | Real-time project logs (debug, info, warning, error) |
| DevRequestBranch | Branch per dev request |
| ProjectTemplate | Reusable project template |
| ProjectVersion | Version snapshot of a project |
| RefinementMessage | Chat message in refinement flow |
| CodeSnapshot | Point-in-time code snapshot |
| CodeRegenerationAttempt | Incremental code regen attempt |

### Auth & User

| Entity | Purpose |
|---|---|
| TokenBalance | User token balance |
| UserPreference | User preference settings |
| UserMemory | User stored memories |
| OnboardingProgress | Onboarding completion tracking |
| ApiKey | API key for external access |

### Billing & Payments

| Entity | Purpose |
|---|---|
| Payment | Payment transaction |
| Subscription | Active subscription |
| SubscriptionTracking | Subscription lifecycle tracking |
| BillingAccount | Billing account details |
| AutoTopUpConfig | Auto top-up configuration |
| CreditPackagePrice | Multi-currency credit pricing |
| ExchangeRate | Currency exchange rate |
| UsageMeter | Usage metering record |

### Sites & Hosting

| Entity | Purpose |
|---|---|
| Deployment | Site deployment record |
| HostingPlan | Hosting plan tier |
| Domain | Custom domain |
| DomainTransaction | Domain purchase transaction |

### AI & Generation

| Entity | Purpose |
|---|---|
| GenerationStream | SSE generation stream |
| GenerationManifest | File generation manifest |
| GenerationVariant | A/B test variant |
| CompilationResult | Compiler validation result |
| DevelopmentSpec | Development specification |
| ComponentPreview | Component preview snapshot |
| AiModelConfig | AI model configuration |
| ModelRoutingConfig | Model routing rules |
| GenerativeUiSession | Generative UI chat session |
| VisualPromptUi | Visual prompt design |
| VisualOverlaySession | Visual overlay editing session |
| VisualEdit | Visual editor edit operation |
| AiElementsConfig | Vercel AI Elements config |
| NlSchema | Natural language schema |
| DataSchema | Database schema definition |
| FrameworkConfig | Multi-framework config |
| QueryConfig | TanStack Query config |
| ViewTransitionConfig | View transition config |
| VoiceConfig | Voice input config |
| MobileAppConfig | Mobile app generation config |

### Code Quality & Security

| Entity | Purpose |
|---|---|
| CodeQualityReview | Code review results |
| CodeReviewAgent | Review agent configuration |
| ReviewPipelineConfig | Review pipeline setup |
| MultiAgentReview | Multi-agent review session |
| SbomReport | SBOM vulnerability report |
| OAuthComplianceReport | OAuth compliance report |
| SecretScanResult | Secret detection result |
| BuildVerification | Build verification result |

### Testing

| Entity | Purpose |
|---|---|
| TestGenerationRecord | Generated test record |
| TestExecutionLog | Test execution log |
| SelfHealingTestResult | Self-healing test result |
| AutonomousTestExecution | Autonomous test execution |
| LiveBrowserTestResult | Live browser test result |
| VisualRegressionResult | Visual regression test result |

### Infrastructure & Deployment

| Entity | Purpose |
|---|---|
| InfrastructureConfig | IaC configuration |
| DeploymentHealth | Deployment health status |
| ContainerConfig | Docker container config |
| PreviewDeployment | Preview deployment record |
| PlatformUpgrade | Platform upgrade tracking |
| SandboxExecution | Sandbox execution record |
| DatabaseBranch | Database branch |

### Agents & Orchestration

| Entity | Purpose |
|---|---|
| BackgroundAgent | Background agent definition |
| BackgroundAgentExecution | Agent execution record |
| SubagentTask | Subagent task record |
| ParallelOrchestration | Parallel orchestration session |
| AgentAutomation | Agent automation rule |
| AgentSkill | Agent skill instruction pack |
| AgenticPlan | Autonomous plan |
| WorkflowExecution | Workflow execution instance |
| WorkflowExecutionState | Workflow state snapshot |
| AgentWorkflow | Agent workflow definition |
| WorkflowNode | Workflow graph node |
| WorkflowEdge | Workflow graph edge |
| A2A | Agent-to-agent task card |

### Integrations

| Entity | Purpose |
|---|---|
| McpConnection | MCP server connection |
| McpGatewayServer | MCP gateway server config |
| McpToolIntegration | MCP tool integration |
| GitHubSync | GitHub sync configuration |
| BidirectionalGitSync | Bidirectional git sync config |
| OAuthConnector | OAuth connector config |
| FigmaImport | Figma import record |

### Collaboration & Community

| Entity | Purpose |
|---|---|
| TeamWorkspace | Team workspace |
| CollaborativeSession | CRDT collaborative session |
| Suggestion | Feature suggestion |
| SupportPost | Support board post (with FeedbackType, RewardMessage) |
| PlanningSession | Planning/discussion session |
| ArenaComparison | Model arena comparison |
| MarketplaceTemplate | Marketplace template listing |
| AgentInboxItem | End-user feedback item |

### Analytics & Content

| Entity | Purpose |
|---|---|
| AnalyticsEvent | Analytics event record |
| GrowthMetrics | Growth metric snapshot |
| ObservabilityTrace | Distributed trace |
| PerformanceProfile | Performance profile data |
| ProjectDocumentation | Auto-generated documentation |
| ProjectIndex | Semantic project index |
| ProjectMemory | Persistent codebase memory |
| SemanticIndex | pgvector semantic index |
| OrganizationalMemory | Organizational memory with embeddings |
| DevPipeline | Dev pipeline definition |
| ApiDocConfig | OpenAPI doc configuration |

### Multi-Tenant & Config

| Entity | Purpose |
|---|---|
| WhiteLabelTenant | White-label tenant config |
| ServiceArchitecture | Microservice architecture definition |
| AppRecommendation | App recommendation |
| TechTrend | Technology trend record |
| Language | Supported language |
| Translation | i18n translation string |

---

## Backend DTOs

Data Transfer Objects under `platform/backend/AiDevRequest.API/DTOs/`.

| DTO File | Purpose |
|---|---|
| RequestDTOs.cs | Shared request/response DTOs (CreateDevRequestDto, UpdateDevRequestDto, etc.) |
| AdaptiveThinkingDtos.cs | Adaptive thinking configuration (ThinkingEffortLevel enum, EffortLevelConfigDto) |

---

## Frontend Pages

All under `platform/frontend/src/pages/`. 98 pages total.

### Home & Navigation

| Page | Route | Purpose |
|---|---|---|
| HomePage | / | Landing page with hero, features, pricing |
| LoginPage | (modal) | Login/register modal |
| NotFoundPage | * | 404 page |
| SettingsLayout | /settings/* | Settings page with 12 collapsible tab groups, search filter, auto-expand active group |
| OnboardingPage | /settings/onboarding | User onboarding wizard |

### Sites & Projects

| Page | Route | Purpose |
|---|---|---|
| ProjectsPage | /projects | User projects list with URLs, costs, plans |
| ProjectDetailPage | /projects/:id | Project detail with Overview/Cost/Plan/Logs tabs |
| SitesPage | /sites | User sites list |
| MySitesPage | /sites (alt) | My sites dashboard |
| PreviewPage | /preview | Project preview |
| PreviewDeploymentPage | /settings/preview-deployment | Edge preview deploys |
| ProjectVersionPage | /settings/version-history | Version history & diff |
| ProjectDocsPage | /settings/project-docs | Auto-generated documentation |
| ProjectHealthPage | /project-health | Project health overview |
| TicketProgressPage | /tickets | User ticket progress tracking with search, status filters, detail view |
| CodebaseMemoryPage | /settings/codebase-memory | Persistent codebase memory |
| ContextIndexPage | /settings/context-index | Semantic project index |

### AI & Generation (Settings sub-pages)

| Page | Route | Purpose |
|---|---|---|
| StreamingGenerationPage | /settings/streaming-generation | SSE code generation config |
| CompilerValidationPage | /settings/compiler-validation | Compiler validation settings |
| SpecificationPage | /settings/specifications | Spec-driven development |
| GenerativeUiPage | /settings/generative-ui | Generative UI chat |
| VisualEditorPage | /settings/visual-editor | Visual drag-and-drop UI editor |
| VisualPromptPage | /settings/visual-prompt | Visual prompt design |
| VisualOverlayPage | /settings/visual-overlay | Visual overlay editing |
| ComponentPreviewPage | /settings/component-preview | v0.dev-style preview |
| VariantComparisonPage | /settings/variant-comparison | A/B variant comparison |
| MultiFrameworkPage | /settings/multi-framework | Multi-framework generation |
| NlSchemaDesignerPage | /settings/nl-schema | NL schema designer |
| SchemaDesignerPage | /settings/schema-designer | Visual schema designer |
| AiElementsPage | /settings/ai-elements | AI Elements streaming |
| AiModelPage | /settings/ai-model | AI model configuration |
| ModelRoutingPage | /settings/model-routing | Model routing config |
| GenerationManifestPage | /settings/generation-manifest | Generation file manifest |
| CodeMergePage | /settings/code-merge | Incremental code regen |
| PlanningModePage | /settings/planning | Planning/discussion mode |
| VoicePage | /settings/voice | Voice input config |
| MobileAppPage | /settings/mobile-app | Mobile app generation |
| ViewTransitionPage | /settings/view-transitions | View transitions |
| QueryConfigPage | /settings/query-config | TanStack Query config |
| DynamicIntelligencePage | /settings/dynamic-intelligence | Dynamic intelligence |

### Code Quality & Security

| Page | Route | Purpose |
|---|---|---|
| CodeReviewPage | /settings/code-review | AI code review |
| ReviewPipelinePage | /settings/review-pipeline | Automated review pipeline |
| CompliancePage | /compliance | OAuth compliance |
| OAuthCompliancePage | /settings/oauth-compliance | OAuth compliance detail |
| SecretDetectionPage | /settings/secret-detection | Secret detection |
| SemanticSearchPage | /settings/semantic-search | Semantic search |

### Testing

| Page | Route | Purpose |
|---|---|---|
| TestGenerationPage | /settings/test-generation | AI test generation |
| VisualRegressionPage | /settings/visual-regression | Visual regression testing |
| SelfHealingTestPage | /settings/self-healing-test | Self-healing tests |

### Infrastructure & Deployment

| Page | Route | Purpose |
|---|---|---|
| InfrastructurePage | /infrastructure | IaC generation |
| DeploymentHealthPage | /settings/deployment-health | Deployment health |
| ContainerizationPage | /settings/containerization | Docker containerization |
| PlatformUpgradePage | /settings/platform-upgrade | .NET 10 upgrade |
| SandboxExecutionPage | /settings/sandbox | Sandbox execution |
| DatabaseBranchPage | /settings/database-branching | Database branching |

### Billing & Payments

| Page | Route | Purpose |
|---|---|---|
| BillingPage | /settings/billing | Billing settings |
| PaymentHistoryPage | /settings/payment-history | Payment history |
| UsagePage | /settings/usage | Token usage |
| UsageDashboardPage | /settings/usage-dashboard | Usage dashboard |
| BuyCreditsPage | /buy-credits | Credit purchase page |

### Agents & Orchestration

| Page | Route | Purpose |
|---|---|---|
| BackgroundAgentPage | /settings/background-agents | Background agents |
| SubagentOrchestrationPage | /settings/orchestration | Subagent orchestration |
| AgentAutomationPage | /settings/agent-automation | Agent automation |
| AgentSkillsPage | /settings/agent-skills | Agent skills management |
| LangGraphWorkflowPage | /langgraph-workflows/:workflowId | LangGraph workflow detail |
| AgenticPlannerPage | /settings/agentic-plan | Autonomous planner |
| WorkflowPage | /settings/workflows | Workflow management |
| A2APage | /a2a | Agent-to-agent protocol |

### Integrations

| Page | Route | Purpose |
|---|---|---|
| McpIntegrationPage | /settings/mcp-integration | MCP integration |
| McpGatewayPage | /settings/mcp-gateway | MCP gateway |
| McpToolIntegrationPage | /settings/mcp-tools | MCP tool integration |
| GitHubSyncPage | /settings/github-sync | GitHub sync |
| BidirectionalGitSyncPage | /settings/bidir-sync | Bidirectional git sync |
| BranchPerChatPage | /settings/branch-per-chat | Git branch per chat |
| OAuthConnectorsPage | /settings/oauth-connectors | OAuth connectors |
| FigmaImportPage | /settings/figma-import | Figma import |

### Marketplace & Arena

| Page | Route | Purpose |
|---|---|---|
| MarketplacePage | /settings/marketplace | Template marketplace |
| ArenaPage | /settings/arena | Model arena comparison |

### Analytics & Admin

| Page | Route | Purpose |
|---|---|---|
| AnalyticsDashboardPage | /settings/analytics | Product analytics |
| GrowthDashboardPage | /admin/growth | Growth metrics |
| AdminChurnPage | /admin/churn | Churn analysis |
| ObservabilityPage | /settings/observability | Observability tracing |
| PerformanceProfilePage | /settings/performance | Performance profiling |

### Collaboration & Community

| Page | Route | Purpose |
|---|---|---|
| CollaborativeEditingPage | /settings/collaborative-editing | CRDT collab editing |
| TeamPage | /teams | Team workspaces |
| SuggestionsPage | /suggestions | Feature suggestions list |
| SuggestionDetailPage | /suggestions/:id | Suggestion detail |
| SuggestionBoardPage | /settings/suggestion-board | Suggestion board |
| SupportBoardPage | /support | Support board |
| MemoryPage | /settings/memories | User memories |
| PreferencePage | /settings/preferences | User preferences |
| RecommendationsPage | /recommendations | App recommendations |
| AgentInboxPage | /settings/agent-inbox | Agent inbox |
| TemplatesPage | /templates | App/website templates gallery with category filtering |
| TicketProgressPage | /tickets | User ticket progress tracking with status filtering, search, expandable detail with timeline |

### Config & Misc

| Page | Route | Purpose |
|---|---|---|
| MicroservicesPage | /microservices | Microservice architecture |
| WhiteLabelPage | /whitelabel | White-label config |
| PipelineBuilderPage | /settings/pipelines | Pipeline builder |
| ApiDocsPage | /settings/apidocs | OpenAPI docs |
| ApiCliPage | /settings/api-cli | API CLI config |
| SettingsPage | /settings (main) | General settings |

### Admin Sub-pages

| Page | Path | Purpose |
|---|---|---|
| ChurnDashboard | pages/admin/ChurnDashboard | Churn dashboard component |
| LanguageManagement | pages/admin/LanguageManagement | Language management admin |
| SuggestionManagement | pages/admin/SuggestionManagement | Suggestion admin |

---

## Frontend Components

All under `platform/frontend/src/components/`.

### Layout & Navigation

| Component | Purpose |
|---|---|
| Layout | App shell with nav sidebar and content area |
| ErrorBoundary | React error boundary wrapper |

### Landing Page

| Component | Purpose |
|---|---|
| HeroSection | Landing page hero with CTA |
| FeaturesSection | Feature showcase grid |
| PricingSection | Pricing tier cards |
| TemplatesSection | Featured templates on homepage (3 templates) |
| StatsSection | Platform statistics |
| FooterSection | Footer with links |

### Code & Preview

| Component | Purpose |
|---|---|
| CodePreview | Syntax-highlighted code viewer |
| LivePreview | Live rendered preview iframe |
| MobilePreview | Mobile device frame preview |
| RealTimeLogViewer | SSE real-time log streaming with filtering |

### Generation & Refinement

| Component | Purpose |
|---|---|
| RefinementChat | Conversational refinement chat widget |
| StepIndicator | Multi-step progress indicator |
| ValidationProgress | Validation progress display |
| PowerLevelSelector | AI power level (model) selector |
| LanguageSelector | Programming language picker |
| PlanSelectionDialog | Plan/subscription selection modal |
| CreditEstimatePreview | Compact credit cost preview in request form |
| CreditEstimateCard | Detailed credit usage summary with step breakdown |

### Code Quality

| Component | Purpose |
|---|---|
| ReviewDashboard | Code review results dashboard |
| RiskScoreBadge | Risk score indicator badge |
| QualityConfidenceBadge | Quality confidence badge |
| CostSavingsDisplay | Cost savings display |
| FixHistoryDisplay | Fix history timeline |

### Git & Workflow

| Component | Purpose |
|---|---|
| BranchIndicator | Git branch status indicator |
| CommitTimeline | Commit history timeline |
| WorkflowGraphView | Visual workflow DAG viewer |
| WorkflowExecutionTimeline | Workflow execution timeline |

### Monitoring & Logs

| Component | Purpose |
|---|---|
| RealTimeLogViewer | SSE real-time log streaming viewer with filters |

### Visual Editor (`components/visual-editor/`)

| Component | Purpose |
|---|---|
| VisualEditorFrame | Main visual editor iframe container |
| DragDropOverlay | Drag-and-drop overlay for element placement |
| PropertyPanel | Element property editing panel |
| PointAndPromptDialog | Click-to-prompt AI editing dialog |
| ComponentLibrary | Draggable component library sidebar |

### Motion (`components/motion/`)

| Component | Purpose |
|---|---|
| FadeIn | Fade-in animation wrapper |
| StaggerChildren | Staggered children animation |

---

## Frontend API Modules

All under `platform/frontend/src/api/`. 92 modules total.

### Core

| Module | Backend Controller | Purpose |
|---|---|---|
| requests.ts | RequestsController | Dev request CRUD & pipeline |
| ticket-progress.ts | RequestsController | User ticket progress tracking |
| auth.ts | AuthController | Login, register, social auth |
| settings.ts | SettingsController | App settings |
| apikeys.ts | ApiKeysController | API key management |
| projects.ts | ProjectsController | Project dashboard, cost estimation, logs |
| sites.ts | SitesController | Site management |
| hosting.ts | HostingController | Hosting plans |
| domains.ts | DomainsController | Domain management |
| ticket-progress.ts | RequestsController | User ticket progress tracking |

### AI & Generation

| Module | Backend Controller | Purpose |
|---|---|---|
| streaming-generation.ts | StreamingGenerationController | SSE generation |
| compiler.ts | CompilerController | Compiler validation |
| specifications.ts | SpecificationController | Spec pipeline |
| generativeui.ts | GenerativeUiController | Generative UI |
| visual-editor.ts | VisualEditorController | Visual editor |
| visualprompt.ts | VisualPromptUiController | Visual prompt |
| visual-overlay.ts | VisualOverlayController | Visual overlay |
| component-preview.ts | ComponentPreviewController | Component preview |
| generation-variants.ts | VariantController | A/B variants |
| generation.ts | FileGenerationController | File generation |
| frameworkconfig.ts | FrameworkConfigController | Multi-framework |
| nlschema.ts | NlSchemaController | NL schema designer |
| schema-designer.ts | SchemaDesignerController | Schema designer |
| aiElements.ts | AiElementsController | AI Elements |
| aiModel.ts | AiModelController | AI model config |
| modelrouting.ts | ModelRoutingController | Model routing |
| refinement.ts | RefinementController | Refinement chat |
| codemerge.ts | CodeMergeController | Code merge |
| voice.ts | VoiceController | Voice input |
| mobileapp.ts | MobileAppController | Mobile app gen |
| viewtransition.ts | ViewTransitionController | View transitions |
| queryconfig.ts | QueryConfigController | Query config |
| agenticplan.ts | AgenticPlanController | Agentic planning |

### Code Quality & Security

| Module | Backend Controller | Purpose |
|---|---|---|
| code-review.ts | CodeQualityReviewController | Code review |
| reviewPipeline.ts | ReviewPipelineController | Review pipeline |
| multi-agent-review.ts | MultiAgentReviewController | Multi-agent review |
| security.ts | SecurityController | Security scanning |
| oauth-compliance.ts | OAuthComplianceController | OAuth compliance |
| secrets.ts | SecretDetectionController | Secret detection |
| semantic-search.ts | SemanticSearchController | Semantic search |

### Testing

| Module | Backend Controller | Purpose |
|---|---|---|
| test-generation.ts (not named) | TestGenerationController | Test generation |
| visualregression.ts | VisualRegressionController | Visual regression |

### Infrastructure

| Module | Backend Controller | Purpose |
|---|---|---|
| infrastructure.ts | InfrastructureController | IaC generation |
| deploymenthealth.ts | DeploymentHealthController | Deployment health |
| containerization.ts | ContainerizationController | Containerization |
| platformupgrade.ts | PlatformUpgradeController | Platform upgrade |
| sandbox-execution.ts | SandboxExecutionController | Sandbox execution |
| database-branch.ts | DatabaseBranchController | Database branching |
| preview.ts | PreviewController | Preview deployment |
| promotion.ts | PreviewController | Promote preview to production |

### Billing & Payments

| Module | Backend Controller | Purpose |
|---|---|---|
| billing.ts | BillingController | Billing |
| payments.ts | PaymentsController | Stripe payments |
| credits.ts | CreditController | Credits |
| usage-metering.ts | UsageMeteringController | Usage metering |

### Agents & Orchestration

| Module | Backend Controller | Purpose |
|---|---|---|
| backgroundagent.ts | BackgroundAgentController | Background agents |
| orchestration.ts | SubagentOrchestrationController | Subagent orchestration |
| agent-automation.ts | AgentAutomationController | Agent automation |
| agent-skills.ts | AgentSkillController | Agent skills |
| langgraph-workflows.ts | LangGraphWorkflowController | LangGraph workflows |
| workflows.ts | WorkflowController | Durable workflows |
| a2a.ts | A2AController | Agent-to-agent |

### Integrations

| Module | Backend Controller | Purpose |
|---|---|---|
| mcp-integration.ts | McpIntegrationController | MCP integration |
| mcpgateway.ts | McpGatewayController | MCP gateway |
| mcp-tools.ts | McpToolIntegrationController | MCP tools |
| github-sync.ts | GitHubSyncController | GitHub sync |
| bidir-sync.ts | BidirectionalGitSyncController | Bidirectional sync |
| git-branch.ts | GitBranchController | Git branching |
| oauthConnectors.ts | OAuthConnectorController | OAuth connectors |
| figmaimport.ts | FigmaImportController | Figma import |

### Marketplace & Arena

| Module | Backend Controller | Purpose |
|---|---|---|
| marketplace.ts | TemplateMarketplaceController | Marketplace |
| arena.ts | ArenaController | Arena comparison |

### Analytics & Admin

| Module | Backend Controller | Purpose |
|---|---|---|
| analytics-dashboard.ts | AnalyticsDashboardController | Analytics |
| growth.ts | AdminGrowthController | Growth metrics |
| admin.ts | AdminChurnController | Churn analysis |
| observability.ts | ObservabilityController | Observability |
| performance-profile.ts | PerformanceController | Performance |

### Collaboration & Community

| Module | Backend Controller | Purpose |
|---|---|---|
| collaborative-editing.ts | CollaborativeEditingController | Collab editing |
| teams.ts | TeamController | Teams |
| suggestions.ts | SuggestionsController | Suggestions |
| support.ts | SupportController | Support, feedback presets, credit rewards |
| memories.ts | MemoryController | Memories |
| preferences.ts | PreferenceController | Preferences |
| recommendations.ts | RecommendationController | Recommendations |
| trends.ts | TechTrendController | Tech trends |
| agent-inbox.ts | AgentInboxController | Agent inbox |

### Config & Misc

| Module | Backend Controller | Purpose |
|---|---|---|
| onboarding.ts | OnboardingController | Onboarding |
| project-versions.ts | ProjectVersionController | Version history |
| projectindex.ts | ProjectIndexController | Project index |
| projectmemory.ts | ProjectMemoryController | Project memory |
| projectDocs.ts | ProjectDocumentationController | Project docs |
| pipelines.ts | PipelinesController | Pipelines |
| apidocs.ts | ApiDocsController | API docs |
| planning.ts | PlanningSessionController | Planning mode |
| microservices.ts | MicroserviceController | Microservices |
| whitelabel.ts | WhiteLabelController | White-label |

---

## State Management

| Store/Context | File | Purpose |
|---|---|---|
| AuthContext | contexts/AuthContext.tsx | User auth state, token balance, login modal, social auth |

---

## Quick Reference: Finding Code by Feature

| If you need... | Look in... |
|---|---|
| Dev request CRUD | RequestsController, requests.ts, DevRequest entity |
| Auth/login | AuthController, auth.ts, AuthContext, User entity |
| Payments | PaymentsController + BillingController, payments.ts + billing.ts |
| Code generation | StreamingGenerationController, streaming-generation.ts |
| Code review | CodeQualityReviewController, code-review.ts |
| MCP tools | McpIntegrationController + McpGatewayController + McpToolIntegrationController |
| Visual editing | VisualEditorController, visual-editor.ts, components/visual-editor/ |
| Agent orchestration | SubagentOrchestrationController + BackgroundAgentController |
| GitHub sync | GitHubSyncController + BidirectionalGitSyncController |
| Semantic search | SemanticSearchController, EfCoreVectorSearchService, EmbeddingService |
| Org memory | OrganizationalMemoryController, MemoryExtractionService, MemoryRetrievalService |
