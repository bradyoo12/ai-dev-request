import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Lazy-load all settings sub-pages for code splitting
const SettingsPage = lazy(() => import('./SettingsPage'))
const UsagePage = lazy(() => import('./UsagePage'))
const BillingPage = lazy(() => import('./BillingPage'))
const PaymentHistoryPage = lazy(() => import('./PaymentHistoryPage'))
const MemoryPage = lazy(() => import('./MemoryPage'))
const PreferencePage = lazy(() => import('./PreferencePage'))
const InfrastructurePage = lazy(() => import('./InfrastructurePage'))
const SecretDetectionPage = lazy(() => import('./SecretDetectionPage'))
const PreviewDeploymentPage = lazy(() => import('./PreviewDeploymentPage'))
const GenerationManifestPage = lazy(() => import('./GenerationManifestPage'))
const OAuthCompliancePage = lazy(() => import('./OAuthCompliancePage'))
const CompilerValidationPage = lazy(() => import('./CompilerValidationPage'))
const ObservabilityPage = lazy(() => import('./ObservabilityPage'))
const WorkflowPage = lazy(() => import('./WorkflowPage'))
const SpecificationPage = lazy(() => import('./SpecificationPage'))
const GitHubSyncPage = lazy(() => import('./GitHubSyncPage'))
const CodeReviewPage = lazy(() => import('./CodeReviewPage'))
const StreamingGenerationPage = lazy(() => import('./StreamingGenerationPage'))
const McpIntegrationPage = lazy(() => import('./McpIntegrationPage'))
const AnalyticsDashboardPage = lazy(() => import('./AnalyticsDashboardPage'))
const MarketplacePage = lazy(() => import('./MarketplacePage'))
const ContainerizationPage = lazy(() => import('./ContainerizationPage'))
const TestGenerationPage = lazy(() => import('./TestGenerationPage'))
const CollaborativeEditingPage = lazy(() => import('./CollaborativeEditingPage'))
const OnboardingPage = lazy(() => import('./OnboardingPage'))
const ProjectVersionPage = lazy(() => import('./ProjectVersionPage'))
const ComponentPreviewPage = lazy(() => import('./ComponentPreviewPage'))
const VariantComparisonPage = lazy(() => import('./VariantComparisonPage'))
const PerformanceProfilePage = lazy(() => import('./PerformanceProfilePage'))
const SchemaDesignerPage = lazy(() => import('./SchemaDesignerPage'))
const ApiCliPage = lazy(() => import('./ApiCliPage'))
const PipelineBuilderPage = lazy(() => import('./PipelineBuilderPage'))
const ApiDocsPage = lazy(() => import('./ApiDocsPage'))
const CodeMergePage = lazy(() => import('./CodeMergePage'))
const VoicePage = lazy(() => import('./VoicePage'))
const ModelRoutingPage = lazy(() => import('./ModelRoutingPage'))
const ContextIndexPage = lazy(() => import('./ContextIndexPage'))
const DeploymentHealthPage = lazy(() => import('./DeploymentHealthPage'))
const GenerativeUiPage = lazy(() => import('./GenerativeUiPage'))
const MobileAppPage = lazy(() => import('./MobileAppPage'))
const BackgroundAgentPage = lazy(() => import('./BackgroundAgentPage'))
const PlatformUpgradePage = lazy(() => import('./PlatformUpgradePage'))
const VisualPromptPage = lazy(() => import('./VisualPromptPage'))
const MultiFrameworkPage = lazy(() => import('./MultiFrameworkPage'))
const ViewTransitionPage = lazy(() => import('./ViewTransitionPage'))
const NlSchemaDesignerPage = lazy(() => import('./NlSchemaDesignerPage'))
const QueryConfigPage = lazy(() => import('./QueryConfigPage'))
const AgenticPlannerPage = lazy(() => import('./AgenticPlannerPage'))
const VisualRegressionPage = lazy(() => import('./VisualRegressionPage'))
const McpGatewayPage = lazy(() => import('./McpGatewayPage'))
const CodebaseMemoryPage = lazy(() => import('./CodebaseMemoryPage'))
const FigmaImportPage = lazy(() => import('./FigmaImportPage'))
const ArenaPage = lazy(() => import('./ArenaPage'))
const VisualOverlayPage = lazy(() => import('./VisualOverlayPage'))
const SemanticSearchPage = lazy(() => import('./SemanticSearchPage'))
const PlanningModePage = lazy(() => import('./PlanningModePage'))
const ProjectDocsPage = lazy(() => import('./ProjectDocsPage'))
const AiElementsPage = lazy(() => import('./AiElementsPage'))
const ReviewPipelinePage = lazy(() => import('./ReviewPipelinePage'))
const OAuthConnectorsPage = lazy(() => import('./OAuthConnectorsPage'))
const AiModelPage = lazy(() => import('./AiModelPage'))
const McpToolIntegrationPage = lazy(() => import('./McpToolIntegrationPage'))
const BidirectionalGitSyncPage = lazy(() => import('./BidirectionalGitSyncPage'))
const SelfHealingTestPage = lazy(() => import('./SelfHealingTestPage'))
const MultiAgentTestPage = lazy(() => import('./MultiAgentTestPage'))
const DatabaseBranchPage = lazy(() => import('./DatabaseBranchPage'))
const SandboxExecutionPage = lazy(() => import('./SandboxExecutionPage'))
const DynamicIntelligencePage = lazy(() => import('./DynamicIntelligencePage'))
const AgentAutomationPage = lazy(() => import('./AgentAutomationPage'))
const UsageDashboardPage = lazy(() => import('./UsageDashboardPage'))
const SubagentOrchestrationPage = lazy(() => import('./SubagentOrchestrationPage'))
const LangGraphPage = lazy(() => import('./LangGraphPage'))
const HybridCachePage = lazy(() => import('./HybridCachePage'))
const PlaywrightHealingPage = lazy(() => import('./PlaywrightHealingPage'))
const SelfHealingPage = lazy(() => import('./SelfHealingPage'))
const ProductionSandboxPage = lazy(() => import('./ProductionSandboxPage'))
const OrgMemoryPage = lazy(() => import('./OrgMemoryPage'))
const AgentRulesPage = lazy(() => import('./AgentRulesPage'))
const ServerComponentsPage = lazy(() => import('./ServerComponentsPage'))
const CodeLintPage = lazy(() => import('./CodeLintPage'))
const VectorSearchPage = lazy(() => import('./VectorSearchPage'))
const ReplTestPage = lazy(() => import('./ReplTestPage'))
const AgentTerminalPage = lazy(() => import('./AgentTerminalPage'))
const ComposerPage = lazy(() => import('./ComposerPage'))
const DotnetPerfPage = lazy(() => import('./DotnetPerfPage'))
const MultiModelRoutingPage = lazy(() => import('./MultiModelRoutingPage'))
const BiomeLintPage = lazy(() => import('./BiomeLintPage'))
const DeepWikiPage = lazy(() => import('./DeepWikiPage'))
const BuildToolchainPage = lazy(() => import('./BuildToolchainPage'))
const VisionToCodePage = lazy(() => import('./VisionToCodePage'))
const DotnetUpgradePage = lazy(() => import('./DotnetUpgradePage'))
const ParallelAgentsPage = lazy(() => import('./ParallelAgentsPage'))
const WebMcpPage = lazy(() => import('./WebMcpPage'))
const AgentSdkPage = lazy(() => import('./AgentSdkPage'))
const TerminalExecutionPage = lazy(() => import('./TerminalExecutionPage'))
const TursoDatabasePage = lazy(() => import('./TursoDatabasePage'))
const WorkersAiPage = lazy(() => import('./WorkersAiPage'))
const ReactUseHookPage = lazy(() => import('./ReactUseHookPage'))
const EditPredictionPage = lazy(() => import('./EditPredictionPage'))
const BrowserIdePage = lazy(() => import('./BrowserIdePage'))
const GovernancePage = lazy(() => import('./GovernancePage'))
const InferenceCostPage = lazy(() => import('./InferenceCostPage'))
const LanguageExpansionPage = lazy(() => import('./LanguageExpansionPage'))
const HybridValidationPage = lazy(() => import('./HybridValidationPage'))
const AgentMessagesPage = lazy(() => import('./AgentMessagesPage'))
const AgentTracePage = lazy(() => import('./AgentTracePage'))
const AgenticWorkflowsPage = lazy(() => import('./AgenticWorkflowsPage'))
const ConfidenceScorePage = lazy(() => import('./ConfidenceScorePage'))
const AiModelMarketplacePage = lazy(() => import('./AiModelMarketplacePage'))
const AgentInboxPage = lazy(() => import('./AgentInboxPage'))
const AgentSkillsPage = lazy(() => import('./AgentSkillsPage'))
const AgentBuilderPage = lazy(() => import('./AgentBuilderPage'))
const PlaywrightMcpPage = lazy(() => import('./PlaywrightMcpPage'))
const VisualWorkflowPage = lazy(() => import('./VisualWorkflowPage'))
const PatentAgentPage = lazy(() => import('./PatentAgentPage'))
const StreamingCodeGenPage = lazy(() => import('./StreamingCodeGenPage'))
const ManagedBackendPage = lazy(() => import('./ManagedBackendPage'))

const TabFallback = <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full" /></div>

type SettingsTab = 'tokens' | 'usage' | 'billing' | 'payments' | 'memories' | 'preferences' | 'infrastructure' | 'secrets' | 'preview' | 'generation' | 'oauth' | 'compiler' | 'observability' | 'workflows' | 'specifications' | 'github-sync' | 'code-review' | 'streaming-generation' | 'mcp-integration' | 'analytics' | 'marketplace' | 'containerization' | 'test-generation' | 'collaborative-editing' | 'onboarding' | 'version-history' | 'component-preview' | 'variant-comparison' | 'performance' | 'schema-designer' | 'api-cli' | 'pipeline-builder' | 'api-docs' | 'code-merge' | 'voice-input' | 'model-routing' | 'context-index' | 'deployment-health' | 'generative-ui' | 'mobile-app' | 'background-agents' | 'platform-upgrade' | 'visual-prompt' | 'multi-framework' | 'view-transitions' | 'nl-schema' | 'query-config' | 'agentic-planning' | 'visual-regression' | 'mcp-gateway' | 'codebase-memory' | 'figma-import' | 'arena' | 'visual-overlay' | 'semantic-search' | 'planning-mode' | 'project-docs' | 'ai-elements' | 'review-pipeline' | 'oauth-connectors' | 'mcp-tools' | 'ai-model' | 'bidir-sync' | 'self-healing-test' | 'multi-agent-test' | 'database-branching' | 'sandbox' | 'dynamic-intelligence' | 'agent-automation' | 'usage-dashboard' | 'orchestration' | 'langgraph' | 'hybrid-cache' | 'playwright-healing' | 'self-healing-code' | 'production-sandboxes' | 'org-memory' | 'agent-rules' | 'server-components' | 'code-lint' | 'vector-search' | 'repl-test' | 'agent-terminal' | 'composer' | 'dotnet-perf' | 'multi-model' | 'biome-lint' | 'deepwiki' | 'build-toolchain' | 'vision-to-code' | 'dotnet10-upgrade' | 'parallel-agents' | 'webmcp' | 'agent-sdk' | 'auto-terminal' | 'turso-database' | 'workers-ai' | 'react-use-hook' | 'edit-predictions' | 'browser-ide' | 'governance' | 'inference-cost' | 'language-expansion' | 'hybrid-validation' | 'agent-messages' | 'agentic-workflows' | 'agent-trace' | 'confidence-scoring' | 'ai-marketplace' | 'agent-inbox' | 'agent-skills' | 'agent-builder' | 'playwright-mcp' | 'visual-workflow' | 'patent-agent' | 'streaming-codegen' | 'managed-backend'

const VALID_TABS: SettingsTab[] = ['tokens', 'usage', 'billing', 'payments', 'memories', 'preferences', 'infrastructure', 'secrets', 'preview', 'generation', 'oauth', 'compiler', 'observability', 'workflows', 'specifications', 'github-sync', 'code-review', 'streaming-generation', 'mcp-integration', 'analytics', 'marketplace', 'containerization', 'test-generation', 'collaborative-editing', 'onboarding', 'version-history', 'component-preview', 'variant-comparison', 'performance', 'schema-designer', 'api-cli', 'pipeline-builder', 'api-docs', 'code-merge', 'voice-input', 'model-routing', 'context-index', 'deployment-health', 'generative-ui', 'mobile-app', 'background-agents', 'platform-upgrade', 'visual-prompt', 'multi-framework', 'view-transitions', 'nl-schema', 'query-config', 'agentic-planning', 'visual-regression', 'mcp-gateway', 'codebase-memory', 'figma-import', 'arena', 'visual-overlay', 'semantic-search', 'planning-mode', 'project-docs', 'ai-elements', 'review-pipeline', 'oauth-connectors', 'mcp-tools', 'ai-model', 'bidir-sync', 'self-healing-test', 'multi-agent-test', 'database-branching', 'sandbox', 'dynamic-intelligence', 'agent-automation', 'usage-dashboard', 'orchestration', 'langgraph', 'hybrid-cache', 'playwright-healing', 'self-healing-code', 'production-sandboxes', 'org-memory', 'agent-rules', 'server-components', 'code-lint', 'vector-search', 'repl-test', 'agent-terminal', 'composer', 'dotnet-perf', 'multi-model', 'biome-lint', 'deepwiki', 'build-toolchain', 'vision-to-code', 'dotnet10-upgrade', 'parallel-agents', 'webmcp', 'agent-sdk', 'auto-terminal', 'turso-database', 'workers-ai', 'react-use-hook', 'edit-predictions', 'browser-ide', 'governance', 'inference-cost', 'language-expansion', 'hybrid-validation', 'agent-messages', 'agentic-workflows', 'agent-trace', 'confidence-scoring', 'ai-marketplace', 'agent-inbox', 'agent-skills', 'agent-builder', 'playwright-mcp', 'visual-workflow', 'patent-agent', 'streaming-codegen', 'managed-backend']

type TabGroup = {
  key: string
  i18nKey: string
  tabs: SettingsTab[]
}

const TAB_GROUPS: TabGroup[] = [
  {
    key: 'account',
    i18nKey: 'settings.groups.account',
    tabs: ['tokens', 'billing', 'payments', 'usage', 'usage-dashboard', 'preferences', 'memories'],
  },
  {
    key: 'ai-generation',
    i18nKey: 'settings.groups.aiGeneration',
    tabs: ['ai-model', 'streaming-generation', 'streaming-codegen', 'generative-ui', 'visual-prompt', 'component-preview', 'variant-comparison', 'arena', 'ai-elements', 'multi-framework', 'multi-model', 'composer', 'model-routing', 'generation', 'ai-marketplace'],
  },
  {
    key: 'code-quality',
    i18nKey: 'settings.groups.codeQuality',
    tabs: ['code-review', 'review-pipeline', 'multi-agent-test', 'code-lint', 'compiler', 'self-healing-test', 'code-merge', 'biome-lint'],
  },
  {
    key: 'infrastructure',
    i18nKey: 'settings.groups.infrastructure',
    tabs: ['preview', 'containerization', 'database-branching', 'sandbox', 'infrastructure', 'platform-upgrade', 'deployment-health', 'production-sandboxes', 'managed-backend'],
  },
  {
    key: 'security',
    i18nKey: 'settings.groups.security',
    tabs: ['secrets', 'oauth', 'oauth-connectors', 'governance'],
  },
  {
    key: 'agents',
    i18nKey: 'settings.groups.agents',
    tabs: ['background-agents', 'agent-automation', 'agent-skills', 'agent-builder', 'agent-rules', 'agent-terminal', 'agent-trace', 'agentic-workflows', 'agent-messages', 'parallel-agents', 'agent-sdk', 'auto-terminal', 'confidence-scoring', 'orchestration', 'langgraph', 'agentic-planning', 'agent-inbox', 'dynamic-intelligence', 'visual-workflow'],
  },
  {
    key: 'testing',
    i18nKey: 'settings.groups.testing',
    tabs: ['test-generation', 'visual-regression', 'self-healing-code', 'playwright-healing', 'playwright-mcp', 'repl-test'],
  },
  {
    key: 'data-search',
    i18nKey: 'settings.groups.dataSearch',
    tabs: ['schema-designer', 'nl-schema', 'vector-search', 'org-memory', 'turso-database', 'hybrid-cache', 'deepwiki', 'codebase-memory', 'semantic-search', 'context-index', 'query-config'],
  },
  {
    key: 'dev-tools',
    i18nKey: 'settings.groups.devTools',
    tabs: ['specifications', 'github-sync', 'bidir-sync', 'collaborative-editing', 'version-history', 'performance', 'observability', 'build-toolchain', 'vision-to-code', 'edit-predictions', 'browser-ide', 'dotnet-perf', 'dotnet10-upgrade', 'figma-import', 'visual-overlay', 'planning-mode', 'project-docs', 'api-cli', 'api-docs', 'pipeline-builder', 'view-transitions', 'voice-input', 'mobile-app'],
  },
  {
    key: 'integrations',
    i18nKey: 'settings.groups.integrations',
    tabs: ['mcp-integration', 'mcp-gateway', 'mcp-tools', 'webmcp', 'workers-ai', 'react-use-hook', 'server-components'],
  },
  {
    key: 'analytics-growth',
    i18nKey: 'settings.groups.analyticsGrowth',
    tabs: ['analytics', 'marketplace', 'onboarding'],
  },
  {
    key: 'innovation',
    i18nKey: 'settings.groups.innovation',
    tabs: ['patent-agent'],
  },
  {
    key: 'other',
    i18nKey: 'settings.groups.other',
    tabs: ['workflows', 'language-expansion', 'hybrid-validation', 'inference-cost'],
  },
]

/** Map tab key to its i18n key and fallback label */
const TAB_LABELS: Record<SettingsTab, [string, string]> = {
  'tokens': ['settings.tabs.tokens', 'Token Balance'],
  'usage': ['settings.tabs.usage', 'Usage'],
  'billing': ['settings.tabs.billing', 'Billing'],
  'payments': ['settings.tabs.payments', 'Payments'],
  'memories': ['settings.tabs.memories', 'Memories'],
  'preferences': ['settings.tabs.preferences', 'Preferences'],
  'infrastructure': ['settings.tabs.infrastructure', 'Infrastructure'],
  'secrets': ['settings.tabs.secrets', 'Secrets'],
  'preview': ['settings.tabs.preview', 'Preview'],
  'generation': ['settings.tabs.generation', 'Generation'],
  'oauth': ['settings.tabs.oauth', 'OAuth'],
  'compiler': ['settings.tabs.compiler', 'Compiler'],
  'observability': ['settings.tabs.observability', 'Observability'],
  'workflows': ['settings.tabs.workflows', 'Workflows'],
  'specifications': ['settings.tabs.specifications', 'Specifications'],
  'github-sync': ['settings.tabs.githubSync', 'GitHub Sync'],
  'code-review': ['settings.tabs.codeReview', 'Code Review'],
  'streaming-generation': ['settings.tabs.streamingGeneration', 'Live Generation'],
  'mcp-integration': ['settings.tabs.mcpIntegration', 'MCP'],
  'analytics': ['settings.tabs.analytics', 'Analytics'],
  'marketplace': ['settings.tabs.marketplace', 'Marketplace'],
  'containerization': ['settings.tabs.containerization', 'Containers'],
  'test-generation': ['settings.tabs.testGeneration', 'Tests'],
  'collaborative-editing': ['settings.tabs.collaborativeEditing', 'Collab'],
  'onboarding': ['settings.tabs.onboarding', 'Onboarding'],
  'version-history': ['settings.tabs.versionHistory', 'Versions'],
  'component-preview': ['settings.tabs.componentPreview', 'Preview'],
  'variant-comparison': ['settings.tabs.variantComparison', 'Variants'],
  'performance': ['settings.tabs.performance', 'Performance'],
  'schema-designer': ['settings.tabs.schemaDesigner', 'Schema'],
  'api-cli': ['settings.tabs.apiCli', 'API & CLI'],
  'pipeline-builder': ['settings.tabs.pipelineBuilder', 'Pipelines'],
  'api-docs': ['settings.tabs.apiDocs', 'API Docs'],
  'code-merge': ['settings.tabs.codeMerge', 'Code Merge'],
  'voice-input': ['settings.tabs.voiceInput', 'Voice'],
  'model-routing': ['settings.tabs.modelRouting', 'AI Models'],
  'context-index': ['settings.tabs.contextIndex', 'Context Index'],
  'deployment-health': ['settings.tabs.deploymentHealth', 'Health'],
  'generative-ui': ['settings.tabs.generativeUi', 'Gen UI'],
  'mobile-app': ['settings.tabs.mobileApp', 'Mobile'],
  'background-agents': ['settings.tabs.backgroundAgents', 'Agents'],
  'platform-upgrade': ['settings.tabs.platformUpgrade', 'Platform'],
  'visual-prompt': ['settings.tabs.visualPrompt', 'Visual UI'],
  'multi-framework': ['settings.tabs.multiFramework', 'Frameworks'],
  'view-transitions': ['settings.tabs.viewTransitions', 'Transitions'],
  'nl-schema': ['settings.tabs.nlSchema', 'NL Schema'],
  'query-config': ['settings.tabs.queryConfig', 'Query Config'],
  'agentic-planning': ['settings.tabs.agenticPlanning', 'Planner'],
  'visual-regression': ['settings.tabs.visualRegression', 'Visual QA'],
  'mcp-gateway': ['settings.tabs.mcpGateway', 'MCP Gateway'],
  'codebase-memory': ['settings.tabs.codebaseMemory', 'Memory AI'],
  'figma-import': ['settings.tabs.figmaImport', 'Figma'],
  'arena': ['settings.tabs.arena', 'Arena'],
  'visual-overlay': ['settings.tabs.visualOverlay', 'Overlay Editor'],
  'semantic-search': ['settings.tabs.semanticSearch', 'Semantic Search'],
  'planning-mode': ['settings.tabs.planningMode', 'Planning Mode'],
  'project-docs': ['settings.tabs.projectDocs', 'Project Docs'],
  'ai-elements': ['settings.tabs.aiElements', 'AI Elements'],
  'review-pipeline': ['settings.tabs.reviewPipeline', 'Review Pipeline'],
  'oauth-connectors': ['settings.tabs.oauthConnectors', 'OAuth Connectors'],
  'mcp-tools': ['settings.tabs.mcpTools', 'MCP Tools'],
  'ai-model': ['settings.tabs.aiModel', 'AI Model'],
  'bidir-sync': ['settings.tabs.bidirSync', 'Bidir Sync'],
  'self-healing-test': ['settings.tabs.selfHealingTest', 'Self-Healing'],
  'multi-agent-test': ['settings.tabs.multiAgentTest', 'Multi-Agent Test'],
  'database-branching': ['settings.tabs.databaseBranching', 'DB Branching'],
  'sandbox': ['settings.tabs.sandbox', 'Sandbox'],
  'dynamic-intelligence': ['settings.tabs.dynamicIntelligence', 'Intelligence'],
  'agent-automation': ['settings.tabs.agentAutomation', 'Agent Auto'],
  'usage-dashboard': ['settings.tabs.usageDashboard', 'Usage Metering'],
  'orchestration': ['settings.tabs.orchestration', 'Orchestration'],
  'langgraph': ['settings.tabs.langgraph', 'LangGraph'],
  'hybrid-cache': ['settings.tabs.hybridCache', 'Cache'],
  'playwright-healing': ['settings.tabs.playwrightHealing', 'Test Heal'],
  'self-healing-code': ['settings.tabs.selfHealingCode', 'Self-Healing Code'],
  'production-sandboxes': ['settings.tabs.productionSandboxes', 'Sandboxes'],
  'org-memory': ['settings.tabs.orgMemory', 'Org Memory'],
  'agent-rules': ['settings.tabs.agentRules', 'Agent Rules'],
  'server-components': ['settings.tabs.serverComponents', 'Server Components'],
  'code-lint': ['settings.tabs.codeLint', 'Code Lint'],
  'vector-search': ['settings.tabs.vectorSearch', 'Vector Search'],
  'repl-test': ['settings.tabs.replTest', 'REPL Test'],
  'agent-terminal': ['settings.tabs.agentTerminal', 'Agent Terminal'],
  'composer': ['settings.tabs.composer', 'Composer'],
  'dotnet-perf': ['settings.tabs.dotnetPerf', '.NET Perf'],
  'multi-model': ['settings.tabs.multiModel', 'Multi-Model'],
  'biome-lint': ['settings.tabs.biomeLint', 'Biome Lint'],
  'deepwiki': ['settings.tabs.deepwiki', 'DeepWiki'],
  'build-toolchain': ['settings.tabs.buildToolchain', 'Build'],
  'vision-to-code': ['settings.tabs.visionToCode', 'Vision'],
  'dotnet10-upgrade': ['settings.tabs.dotnet10', '.NET 10'],
  'parallel-agents': ['settings.tabs.parallelAgents', 'Parallel'],
  'webmcp': ['settings.tabs.webmcp', 'WebMCP'],
  'agent-sdk': ['settings.tabs.agentSdk', 'Agent SDK'],
  'auto-terminal': ['settings.tabs.autoTerminal', 'Auto Terminal'],
  'turso-database': ['settings.tabs.tursoDatabase', 'Turso DB'],
  'workers-ai': ['settings.tabs.workersAi', 'Workers AI'],
  'react-use-hook': ['settings.tabs.reactUseHook', 'React Hooks'],
  'edit-predictions': ['settings.tabs.editPredictions', 'Edit Predict'],
  'browser-ide': ['settings.tabs.browserIde', 'Browser IDE'],
  'governance': ['settings.tabs.governance', 'Governance'],
  'inference-cost': ['settings.tabs.inferenceCost', 'Inference Cost'],
  'language-expansion': ['settings.tabs.langExpansion', 'Languages'],
  'hybrid-validation': ['settings.tabs.hybridValidation', 'Hybrid AI'],
  'agent-messages': ['settings.tabs.agentMessages', 'Agent Comms'],
  'agentic-workflows': ['settings.tabs.agenticWorkflows', 'Workflows'],
  'agent-trace': ['settings.tabs.agentTrace', 'Agent Trace'],
  'confidence-scoring': ['settings.tabs.confidenceScoring', 'Confidence'],
  'ai-marketplace': ['settings.tabs.aiMarketplace', 'AI Models'],
  'agent-inbox': ['settings.tabs.agentInbox', 'Agent Inbox'],
  'agent-skills': ['settings.tabs.agentSkills', 'Agent Skills'],
  'agent-builder': ['settings.tabs.agentBuilder', 'Agent Builder'],
  'playwright-mcp': ['settings.tabs.playwrightMcp', 'Playwright MCP'],
  'visual-workflow': ['settings.tabs.visualWorkflow', 'Visual Workflow'],
  'patent-agent': ['settings.tabs.patentAgent', 'Patent Agent'],
  'streaming-codegen': ['settings.tabs.streamingCodegen', 'Live Code Gen'],
  'managed-backend': ['settings.tabs.managedBackend', 'Managed Backend'],
}

/** Find which group a tab belongs to */
function findGroupForTab(tab: SettingsTab): string | null {
  for (const group of TAB_GROUPS) {
    if (group.tabs.includes(tab)) return group.key
  }
  return null
}

export default function SettingsLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { setTokenBalance, requireAuth } = useAuth()
  const tabParam = searchParams.get('tab') as SettingsTab | null

  // Derive tab from URL path — check all known settings sub-paths
  const pathTab = useMemo<SettingsTab | null>(() => {
    const match = location.pathname.match(/^\/settings\/(.+)$/)
    if (!match) return null
    const slug = match[1]
    // Special case: compiler-validation maps to 'compiler'
    if (slug === 'compiler-validation') return 'compiler'
    // Check if slug is a valid tab
    if (VALID_TABS.includes(slug as SettingsTab)) return slug as SettingsTab
    return null
  }, [location.pathname])

  const initialTab = pathTab || (tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'tokens')
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(initialTab)

  // Track which groups are expanded — default: expand the group containing the active tab
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    const activeGroup = findGroupForTab(initialTab)
    if (activeGroup) initial.add(activeGroup)
    return initial
  })

  // Mobile sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }, [])

  const handleTabSelect = useCallback((tab: SettingsTab) => {
    setSettingsTab(tab)
    // Auto-expand the group containing the selected tab
    const group = findGroupForTab(tab)
    if (group) {
      setExpandedGroups(prev => {
        if (prev.has(group)) return prev
        const next = new Set(prev)
        next.add(group)
        return next
      })
    }
    // Close mobile sidebar after selection
    setSidebarOpen(false)
  }, [])

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== settingsTab) {
      setSettingsTab(tabParam)
      const group = findGroupForTab(tabParam)
      if (group) {
        setExpandedGroups(prev => {
          if (prev.has(group)) return prev
          const next = new Set(prev)
          next.add(group)
          return next
        })
      }
    }
  }, [tabParam, settingsTab])

  // Defensive auth check - this is a fallback in case route guard fails
  useEffect(() => {
    if (!requireAuth()) {
      navigate('/')
    }
  }, [requireAuth, navigate])

  // Sidebar navigation content (shared between desktop & mobile)
  const sidebarNav = (
    <nav className="settings-sidebar-nav flex flex-col gap-1" role="tablist" aria-label={t('settings.title')}>
      {TAB_GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.key)
        const hasActiveTab = group.tabs.includes(settingsTab)
        return (
          <div key={group.key} className="settings-group">
            <button
              onClick={() => toggleGroup(group.key)}
              className={`w-full flex items-center justify-between py-2.5 sm:py-2 px-3 rounded-md text-sm font-semibold transition-colors min-h-[44px] sm:min-h-0 ${
                hasActiveTab ? 'text-white bg-warm-800' : 'text-warm-400 hover:text-white hover:bg-warm-800/50'
              }`}
              aria-expanded={isExpanded}
            >
              <span>{t(group.i18nKey, group.key)}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isExpanded && (
              <div className="flex flex-col gap-0.5 mt-0.5 ml-2 pl-2 border-l border-warm-700/50">
                {group.tabs.map((tab) => {
                  const [i18nKey, fallback] = TAB_LABELS[tab]
                  return (
                    <button
                      key={tab}
                      onClick={() => handleTabSelect(tab)}
                      role="tab"
                      aria-selected={settingsTab === tab}
                      className={`text-left py-2.5 sm:py-1.5 px-3 rounded-md text-sm transition-colors min-h-[44px] sm:min-h-0 ${
                        settingsTab === tab
                          ? 'bg-warm-700 text-white font-medium'
                          : 'text-warm-400 hover:text-white hover:bg-warm-800/50'
                      }`}
                    >
                      {t(i18nKey, fallback)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-warm-400 hover:text-white transition-colors"
          aria-label={t('settings.backToHome', 'Back to home')}
        >
          <span aria-hidden="true">&larr;</span>
        </button>
        <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-warm-400 hover:text-white transition-colors rounded-lg hover:bg-warm-800/50"
          aria-label={t('settings.toggleNav', 'Toggle navigation')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile collapsible sidebar */}
      {sidebarOpen && (
        <div className="md:hidden mb-4 bg-warm-900 rounded-lg p-3 max-h-[60vh] overflow-y-auto">
          {sidebarNav}
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0 bg-warm-900 rounded-lg p-3 max-h-[calc(100vh-8rem)] overflow-y-auto sticky top-4 settings-sidebar">
          {sidebarNav}
        </aside>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={TabFallback}>
      {settingsTab === 'tokens' && <SettingsPage onBalanceChange={(b) => setTokenBalance(b)} />}
      {settingsTab === 'usage' && <UsagePage />}
      {settingsTab === 'billing' && <BillingPage />}
      {settingsTab === 'payments' && <PaymentHistoryPage />}
      {settingsTab === 'memories' && <MemoryPage />}
      {settingsTab === 'preferences' && <PreferencePage />}
      {settingsTab === 'infrastructure' && <InfrastructurePage />}
      {settingsTab === 'secrets' && <SecretDetectionPage />}
      {settingsTab === 'preview' && <PreviewDeploymentPage />}
      {settingsTab === 'generation' && <GenerationManifestPage />}
      {settingsTab === 'oauth' && <OAuthCompliancePage />}
      {settingsTab === 'compiler' && <CompilerValidationPage />}
      {settingsTab === 'observability' && <ObservabilityPage />}
      {settingsTab === 'workflows' && <WorkflowPage />}
      {settingsTab === 'specifications' && <SpecificationPage />}
      {settingsTab === 'github-sync' && <GitHubSyncPage />}
      {settingsTab === 'code-review' && <CodeReviewPage />}
      {settingsTab === 'streaming-generation' && <StreamingGenerationPage />}
      {settingsTab === 'mcp-integration' && <McpIntegrationPage />}
      {settingsTab === 'analytics' && <AnalyticsDashboardPage />}
      {settingsTab === 'marketplace' && <MarketplacePage />}
      {settingsTab === 'containerization' && <ContainerizationPage />}
      {settingsTab === 'test-generation' && <TestGenerationPage />}
      {settingsTab === 'collaborative-editing' && <CollaborativeEditingPage />}
      {settingsTab === 'onboarding' && <OnboardingPage />}
      {settingsTab === 'version-history' && <ProjectVersionPage />}
      {settingsTab === 'component-preview' && <ComponentPreviewPage />}
      {settingsTab === 'variant-comparison' && <VariantComparisonPage />}
      {settingsTab === 'performance' && <PerformanceProfilePage />}
      {settingsTab === 'schema-designer' && <SchemaDesignerPage />}
      {settingsTab === 'api-cli' && <ApiCliPage />}
      {settingsTab === 'pipeline-builder' && <PipelineBuilderPage />}
      {settingsTab === 'api-docs' && <ApiDocsPage />}
      {settingsTab === 'code-merge' && <CodeMergePage />}
      {settingsTab === 'voice-input' && <VoicePage />}
      {settingsTab === 'model-routing' && <ModelRoutingPage />}
      {settingsTab === 'context-index' && <ContextIndexPage />}
      {settingsTab === 'deployment-health' && <DeploymentHealthPage />}
      {settingsTab === 'generative-ui' && <GenerativeUiPage />}
      {settingsTab === 'mobile-app' && <MobileAppPage />}
      {settingsTab === 'background-agents' && <BackgroundAgentPage />}
      {settingsTab === 'platform-upgrade' && <PlatformUpgradePage />}
      {settingsTab === 'visual-prompt' && <VisualPromptPage />}
      {settingsTab === 'multi-framework' && <MultiFrameworkPage />}
      {settingsTab === 'view-transitions' && <ViewTransitionPage />}
      {settingsTab === 'nl-schema' && <NlSchemaDesignerPage />}
      {settingsTab === 'query-config' && <QueryConfigPage />}
      {settingsTab === 'agentic-planning' && <AgenticPlannerPage />}
      {settingsTab === 'visual-regression' && <VisualRegressionPage />}
      {settingsTab === 'mcp-gateway' && <McpGatewayPage />}
      {settingsTab === 'codebase-memory' && <CodebaseMemoryPage />}
      {settingsTab === 'figma-import' && <FigmaImportPage />}
      {settingsTab === 'arena' && <ArenaPage />}
      {settingsTab === 'visual-overlay' && <VisualOverlayPage />}
      {settingsTab === 'semantic-search' && <SemanticSearchPage />}
      {settingsTab === 'planning-mode' && <PlanningModePage />}
      {settingsTab === 'project-docs' && <ProjectDocsPage />}
      {settingsTab === 'ai-elements' && <AiElementsPage />}
      {settingsTab === 'review-pipeline' && <ReviewPipelinePage />}
      {settingsTab === 'oauth-connectors' && <OAuthConnectorsPage />}
      {settingsTab === 'mcp-tools' && <McpToolIntegrationPage />}
      {settingsTab === 'ai-model' && <AiModelPage />}
      {settingsTab === 'bidir-sync' && <BidirectionalGitSyncPage />}
      {settingsTab === 'self-healing-test' && <SelfHealingTestPage />}
      {settingsTab === 'multi-agent-test' && <MultiAgentTestPage />}
      {settingsTab === 'database-branching' && <DatabaseBranchPage />}
      {settingsTab === 'sandbox' && <SandboxExecutionPage />}
      {settingsTab === 'dynamic-intelligence' && <DynamicIntelligencePage />}
      {settingsTab === 'agent-automation' && <AgentAutomationPage />}
      {settingsTab === 'usage-dashboard' && <UsageDashboardPage />}
      {settingsTab === 'orchestration' && <SubagentOrchestrationPage />}
      {settingsTab === 'langgraph' && <LangGraphPage />}
      {settingsTab === 'hybrid-cache' && <HybridCachePage />}
      {settingsTab === 'playwright-healing' && <PlaywrightHealingPage />}
      {settingsTab === 'self-healing-code' && <SelfHealingPage />}
      {settingsTab === 'production-sandboxes' && <ProductionSandboxPage />}
      {settingsTab === 'org-memory' && <OrgMemoryPage />}
      {settingsTab === 'agent-rules' && <AgentRulesPage />}
      {settingsTab === 'server-components' && <ServerComponentsPage />}
      {settingsTab === 'code-lint' && <CodeLintPage />}
      {settingsTab === 'vector-search' && <VectorSearchPage />}
      {settingsTab === 'repl-test' && <ReplTestPage />}
      {settingsTab === 'agent-terminal' && <AgentTerminalPage />}
      {settingsTab === 'composer' && <ComposerPage />}
      {settingsTab === 'dotnet-perf' && <DotnetPerfPage />}
      {settingsTab === 'multi-model' && <MultiModelRoutingPage />}
      {settingsTab === 'biome-lint' && <BiomeLintPage />}
      {settingsTab === 'deepwiki' && <DeepWikiPage />}
      {settingsTab === 'build-toolchain' && <BuildToolchainPage />}
      {settingsTab === 'vision-to-code' && <VisionToCodePage />}
      {settingsTab === 'dotnet10-upgrade' && <DotnetUpgradePage />}
      {settingsTab === 'parallel-agents' && <ParallelAgentsPage />}
      {settingsTab === 'webmcp' && <WebMcpPage />}
      {settingsTab === 'agent-sdk' && <AgentSdkPage />}
      {settingsTab === 'auto-terminal' && <TerminalExecutionPage />}
      {settingsTab === 'turso-database' && <TursoDatabasePage />}
      {settingsTab === 'workers-ai' && <WorkersAiPage />}
      {settingsTab === 'react-use-hook' && <ReactUseHookPage />}
      {settingsTab === 'edit-predictions' && <EditPredictionPage />}
      {settingsTab === 'browser-ide' && <BrowserIdePage />}
      {settingsTab === 'governance' && <GovernancePage />}
      {settingsTab === 'inference-cost' && <InferenceCostPage />}
      {settingsTab === 'language-expansion' && <LanguageExpansionPage />}
      {settingsTab === 'hybrid-validation' && <HybridValidationPage />}
      {settingsTab === 'agent-messages' && <AgentMessagesPage />}
      {settingsTab === 'agent-trace' && <AgentTracePage />}
      {settingsTab === 'agentic-workflows' && <AgenticWorkflowsPage />}
      {settingsTab === 'confidence-scoring' && <ConfidenceScorePage />}
      {settingsTab === 'ai-marketplace' && <AiModelMarketplacePage />}
      {settingsTab === 'agent-inbox' && <AgentInboxPage />}
      {settingsTab === 'agent-skills' && <AgentSkillsPage />}
      {settingsTab === 'agent-builder' && <AgentBuilderPage />}
      {settingsTab === 'playwright-mcp' && <PlaywrightMcpPage />}
      {settingsTab === 'visual-workflow' && <VisualWorkflowPage />}
      {settingsTab === 'patent-agent' && <PatentAgentPage />}
      {settingsTab === 'streaming-codegen' && <StreamingCodeGenPage />}
      {settingsTab === 'managed-backend' && <ManagedBackendPage />}
          </Suspense>
        </div>
      </div>
    </section>
  )
}
