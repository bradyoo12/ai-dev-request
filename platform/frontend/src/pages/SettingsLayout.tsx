import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import SettingsPage from './SettingsPage'
import UsagePage from './UsagePage'
import BillingPage from './BillingPage'
import PaymentHistoryPage from './PaymentHistoryPage'
import MemoryPage from './MemoryPage'
import PreferencePage from './PreferencePage'
import InfrastructurePage from './InfrastructurePage'
import SecretDetectionPage from './SecretDetectionPage'
import PreviewDeploymentPage from './PreviewDeploymentPage'
import GenerationManifestPage from './GenerationManifestPage'
import OAuthCompliancePage from './OAuthCompliancePage'
import CompilerValidationPage from './CompilerValidationPage'
import ObservabilityPage from './ObservabilityPage'
import WorkflowPage from './WorkflowPage'
import SpecificationPage from './SpecificationPage'
import GitHubSyncPage from './GitHubSyncPage'
import CodeReviewPage from './CodeReviewPage'
import StreamingGenerationPage from './StreamingGenerationPage'
import McpIntegrationPage from './McpIntegrationPage'
import AnalyticsDashboardPage from './AnalyticsDashboardPage'
import MarketplacePage from './MarketplacePage'
import ContainerizationPage from './ContainerizationPage'
import TestGenerationPage from './TestGenerationPage'
import CollaborativeEditingPage from './CollaborativeEditingPage'
import OnboardingPage from './OnboardingPage'
import ProjectVersionPage from './ProjectVersionPage'
import ComponentPreviewPage from './ComponentPreviewPage'
import VariantComparisonPage from './VariantComparisonPage'
import PerformanceProfilePage from './PerformanceProfilePage'
import SchemaDesignerPage from './SchemaDesignerPage'
import ApiCliPage from './ApiCliPage'
import PipelineBuilderPage from './PipelineBuilderPage'
import ApiDocsPage from './ApiDocsPage'
import CodeMergePage from './CodeMergePage'
import VoicePage from './VoicePage'
import ModelRoutingPage from './ModelRoutingPage'
import ContextIndexPage from './ContextIndexPage'
import DeploymentHealthPage from './DeploymentHealthPage'
import GenerativeUiPage from './GenerativeUiPage'
import MobileAppPage from './MobileAppPage'
import BackgroundAgentPage from './BackgroundAgentPage'
import PlatformUpgradePage from './PlatformUpgradePage'
import VisualPromptPage from './VisualPromptPage'
import MultiFrameworkPage from './MultiFrameworkPage'
import ViewTransitionPage from './ViewTransitionPage'
import NlSchemaDesignerPage from './NlSchemaDesignerPage'
import QueryConfigPage from './QueryConfigPage'
import AgenticPlannerPage from './AgenticPlannerPage'
import VisualRegressionPage from './VisualRegressionPage'
import McpGatewayPage from './McpGatewayPage'
import CodebaseMemoryPage from './CodebaseMemoryPage'
import FigmaImportPage from './FigmaImportPage'
import ArenaPage from './ArenaPage'
import VisualOverlayPage from './VisualOverlayPage'
import SemanticSearchPage from './SemanticSearchPage'
import PlanningModePage from './PlanningModePage'
import ProjectDocsPage from './ProjectDocsPage'
import AiElementsPage from './AiElementsPage'
import ReviewPipelinePage from './ReviewPipelinePage'
import OAuthConnectorsPage from './OAuthConnectorsPage'
import AiModelPage from './AiModelPage'
import McpToolIntegrationPage from './McpToolIntegrationPage'
import BidirectionalGitSyncPage from './BidirectionalGitSyncPage'
import SelfHealingTestPage from './SelfHealingTestPage'
import MultiAgentTestPage from './MultiAgentTestPage'
import DatabaseBranchPage from './DatabaseBranchPage'
import SandboxExecutionPage from './SandboxExecutionPage'
import DynamicIntelligencePage from './DynamicIntelligencePage'
import AgentAutomationPage from './AgentAutomationPage'
import UsageDashboardPage from './UsageDashboardPage'
import SubagentOrchestrationPage from './SubagentOrchestrationPage'
import LangGraphPage from './LangGraphPage'
import HybridCachePage from './HybridCachePage'
import PlaywrightHealingPage from './PlaywrightHealingPage'
import SelfHealingPage from './SelfHealingPage'
import ProductionSandboxPage from './ProductionSandboxPage'
import OrgMemoryPage from './OrgMemoryPage'
import AgentRulesPage from './AgentRulesPage'
import ServerComponentsPage from './ServerComponentsPage'
import CodeLintPage from './CodeLintPage'
import VectorSearchPage from './VectorSearchPage'
import ReplTestPage from './ReplTestPage'
import AgentTerminalPage from './AgentTerminalPage'
import ComposerPage from './ComposerPage'
import DotnetPerfPage from './DotnetPerfPage'
import MultiModelRoutingPage from './MultiModelRoutingPage'
import BiomeLintPage from './BiomeLintPage'
import DeepWikiPage from './DeepWikiPage'
import BuildToolchainPage from './BuildToolchainPage'
import VisionToCodePage from './VisionToCodePage'
import DotnetUpgradePage from './DotnetUpgradePage'
import ParallelAgentsPage from './ParallelAgentsPage'
import WebMcpPage from './WebMcpPage'
import AgentSdkPage from './AgentSdkPage'
import TerminalExecutionPage from './TerminalExecutionPage'
import TursoDatabasePage from './TursoDatabasePage'
import WorkersAiPage from './WorkersAiPage'
import ReactUseHookPage from './ReactUseHookPage'
import EditPredictionPage from './EditPredictionPage'
import BrowserIdePage from './BrowserIdePage'
import GovernancePage from './GovernancePage'
import InferenceCostPage from './InferenceCostPage'
import LanguageExpansionPage from './LanguageExpansionPage'
import HybridValidationPage from './HybridValidationPage'
import AgentMessagesPage from './AgentMessagesPage'
import AgentTracePage from './AgentTracePage'
import AgenticWorkflowsPage from './AgenticWorkflowsPage'
import ConfidenceScorePage from './ConfidenceScorePage'
import AiModelMarketplacePage from './AiModelMarketplacePage'
import AgentInboxPage from './AgentInboxPage'
import AgentSkillsPage from './AgentSkillsPage'
import { useAuth } from '../contexts/AuthContext'

type SettingsTab = 'tokens' | 'usage' | 'billing' | 'payments' | 'memories' | 'preferences' | 'infrastructure' | 'secrets' | 'preview' | 'generation' | 'oauth' | 'compiler' | 'observability' | 'workflows' | 'specifications' | 'github-sync' | 'code-review' | 'streaming-generation' | 'mcp-integration' | 'analytics' | 'marketplace' | 'containerization' | 'test-generation' | 'collaborative-editing' | 'onboarding' | 'version-history' | 'component-preview' | 'variant-comparison' | 'performance' | 'schema-designer' | 'api-cli' | 'pipeline-builder' | 'api-docs' | 'code-merge' | 'voice-input' | 'model-routing' | 'context-index' | 'deployment-health' | 'generative-ui' | 'mobile-app' | 'background-agents' | 'platform-upgrade' | 'visual-prompt' | 'multi-framework' | 'view-transitions' | 'nl-schema' | 'query-config' | 'agentic-planning' | 'visual-regression' | 'mcp-gateway' | 'codebase-memory' | 'figma-import' | 'arena' | 'visual-overlay' | 'semantic-search' | 'planning-mode' | 'project-docs' | 'ai-elements' | 'review-pipeline' | 'oauth-connectors' | 'mcp-tools' | 'ai-model' | 'bidir-sync' | 'self-healing-test' | 'multi-agent-test' | 'database-branching' | 'sandbox' | 'dynamic-intelligence' | 'agent-automation' | 'usage-dashboard' | 'orchestration' | 'langgraph' | 'hybrid-cache' | 'playwright-healing' | 'self-healing-code' | 'production-sandboxes' | 'org-memory' | 'agent-rules' | 'server-components' | 'code-lint' | 'vector-search' | 'repl-test' | 'agent-terminal' | 'composer' | 'dotnet-perf' | 'multi-model' | 'biome-lint' | 'deepwiki' | 'build-toolchain' | 'vision-to-code' | 'dotnet10-upgrade' | 'parallel-agents' | 'webmcp' | 'agent-sdk' | 'auto-terminal' | 'turso-database' | 'workers-ai' | 'react-use-hook' | 'edit-predictions' | 'browser-ide' | 'governance' | 'inference-cost' | 'language-expansion' | 'hybrid-validation' | 'agent-messages' | 'agentic-workflows' | 'agent-trace' | 'confidence-scoring' | 'ai-marketplace' | 'agent-inbox' | 'agent-skills'

const VALID_TABS: SettingsTab[] = ['tokens', 'usage', 'billing', 'payments', 'memories', 'preferences', 'infrastructure', 'secrets', 'preview', 'generation', 'oauth', 'compiler', 'observability', 'workflows', 'specifications', 'github-sync', 'code-review', 'streaming-generation', 'mcp-integration', 'analytics', 'marketplace', 'containerization', 'test-generation', 'collaborative-editing', 'onboarding', 'version-history', 'component-preview', 'variant-comparison', 'performance', 'schema-designer', 'api-cli', 'pipeline-builder', 'api-docs', 'code-merge', 'voice-input', 'model-routing', 'context-index', 'deployment-health', 'generative-ui', 'mobile-app', 'background-agents', 'platform-upgrade', 'visual-prompt', 'multi-framework', 'view-transitions', 'nl-schema', 'query-config', 'agentic-planning', 'visual-regression', 'mcp-gateway', 'codebase-memory', 'figma-import', 'arena', 'visual-overlay', 'semantic-search', 'planning-mode', 'project-docs', 'ai-elements', 'review-pipeline', 'oauth-connectors', 'mcp-tools', 'ai-model', 'bidir-sync', 'self-healing-test', 'multi-agent-test', 'database-branching', 'sandbox', 'dynamic-intelligence', 'agent-automation', 'usage-dashboard', 'orchestration', 'langgraph', 'hybrid-cache', 'playwright-healing', 'self-healing-code', 'production-sandboxes', 'org-memory', 'agent-rules', 'server-components', 'code-lint', 'vector-search', 'repl-test', 'agent-terminal', 'composer', 'dotnet-perf', 'multi-model', 'biome-lint', 'deepwiki', 'build-toolchain', 'vision-to-code', 'dotnet10-upgrade', 'parallel-agents', 'webmcp', 'agent-sdk', 'auto-terminal', 'turso-database', 'workers-ai', 'react-use-hook', 'edit-predictions', 'browser-ide', 'governance', 'inference-cost', 'language-expansion', 'hybrid-validation', 'agent-messages', 'agentic-workflows', 'agent-trace', 'confidence-scoring', 'ai-marketplace', 'agent-inbox', 'agent-skills']

type TabGroupKey = 'core' | 'ai-generation' | 'code-quality' | 'testing' | 'security' | 'infrastructure' | 'billing-usage' | 'integrations' | 'collaboration' | 'analytics-admin' | 'agents' | 'other'

/** Tab label translation key and fallback for each tab */
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
  'nl-schema': ['settings.tabs.nlSchema', 'Schema AI'],
  'query-config': ['settings.tabs.queryConfig', 'Query'],
  'agentic-planning': ['settings.tabs.agenticPlanning', 'Planner'],
  'visual-regression': ['settings.tabs.visualRegression', 'Visual QA'],
  'mcp-gateway': ['settings.tabs.mcpGateway', 'MCP Gateway'],
  'codebase-memory': ['settings.tabs.codebaseMemory', 'Memory AI'],
  'figma-import': ['settings.tabs.figmaImport', 'Figma'],
  'arena': ['settings.tabs.arena', 'Arena'],
  'visual-overlay': ['settings.tabs.visualOverlay', 'Overlay Editor'],
  'semantic-search': ['settings.tabs.semanticSearch', 'Semantic Search'],
  'planning-mode': ['settings.tabs.planningMode', 'Planning'],
  'project-docs': ['settings.tabs.projectDocs', 'Project Docs'],
  'ai-elements': ['settings.tabs.aiElements', 'AI Elements'],
  'review-pipeline': ['settings.tabs.reviewPipeline', 'Review Pipeline'],
  'oauth-connectors': ['settings.tabs.oauthConnectors', 'OAuth Connectors'],
  'mcp-tools': ['settings.tabs.mcpTools', 'MCP Tools'],
  'ai-model': ['settings.tabs.aiModel', 'AI Engine'],
  'bidir-sync': ['settings.tabs.bidirSync', 'Git Sync+'],
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
  'self-healing-code': ['settings.tabs.selfHealingCode', 'Self-Heal'],
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
  'auto-terminal': ['settings.tabs.autoTerminal', 'Terminal'],
  'turso-database': ['settings.tabs.tursoDatabase', 'Turso DB'],
  'workers-ai': ['settings.tabs.workersAi', 'Workers AI'],
  'react-use-hook': ['settings.tabs.reactUseHook', 'use() Hook'],
  'edit-predictions': ['settings.tabs.editPredictions', 'Edit Predict'],
  'browser-ide': ['settings.tabs.browserIde', 'Browser IDE'],
  'governance': ['settings.tabs.governance', 'Governance'],
  'inference-cost': ['settings.tabs.inferenceCost', 'Cost Opt'],
  'language-expansion': ['settings.tabs.langExpansion', 'Languages'],
  'hybrid-validation': ['settings.tabs.hybridValidation', 'Hybrid AI'],
  'agent-messages': ['settings.tabs.agentMessages', 'Agent Comms'],
  'agentic-workflows': ['settings.tabs.agenticWorkflows', 'Workflows'],
  'agent-trace': ['settings.tabs.agentTrace', 'Agent Trace'],
  'confidence-scoring': ['settings.tabs.confidenceScoring', 'Confidence'],
  'ai-marketplace': ['settings.tabs.aiMarketplace', 'AI Models'],
  'agent-inbox': ['settings.tabs.agentInbox', 'Agent Inbox'],
  'agent-skills': ['settings.tabs.agentSkills', 'Agent Skills'],
}

/** Grouped tab categories with i18n-keyed group names */
const TAB_GROUPS: { key: TabGroupKey; labelKey: string; labelFallback: string; tabs: SettingsTab[] }[] = [
  {
    key: 'core',
    labelKey: 'settings.groups.core',
    labelFallback: 'Core',
    tabs: ['tokens', 'preferences', 'memories', 'specifications', 'onboarding', 'project-docs', 'version-history', 'performance'],
  },
  {
    key: 'ai-generation',
    labelKey: 'settings.groups.aiGeneration',
    labelFallback: 'AI & Generation',
    tabs: ['ai-model', 'streaming-generation', 'component-preview', 'generative-ui', 'visual-prompt', 'visual-overlay', 'schema-designer', 'nl-schema', 'multi-framework', 'generation', 'variant-comparison', 'model-routing', 'multi-model', 'vision-to-code', 'ai-elements', 'dynamic-intelligence', 'confidence-scoring', 'edit-predictions', 'hybrid-validation', 'ai-marketplace', 'context-index', 'codebase-memory', 'semantic-search', 'vector-search', 'query-config'],
  },
  {
    key: 'code-quality',
    labelKey: 'settings.groups.codeQuality',
    labelFallback: 'Code Quality',
    tabs: ['code-review', 'review-pipeline', 'multi-agent-test', 'compiler', 'code-lint', 'biome-lint', 'code-merge', 'self-healing-code'],
  },
  {
    key: 'testing',
    labelKey: 'settings.groups.testing',
    labelFallback: 'Testing',
    tabs: ['test-generation', 'self-healing-test', 'visual-regression', 'playwright-healing', 'repl-test'],
  },
  {
    key: 'security',
    labelKey: 'settings.groups.security',
    labelFallback: 'Security',
    tabs: ['secrets', 'oauth', 'governance', 'oauth-connectors'],
  },
  {
    key: 'infrastructure',
    labelKey: 'settings.groups.infrastructure',
    labelFallback: 'Infrastructure',
    tabs: ['infrastructure', 'containerization', 'preview', 'deployment-health', 'database-branching', 'sandbox', 'production-sandboxes', 'platform-upgrade', 'build-toolchain', 'dotnet-perf', 'dotnet10-upgrade', 'server-components', 'turso-database', 'hybrid-cache', 'react-use-hook', 'view-transitions'],
  },
  {
    key: 'billing-usage',
    labelKey: 'settings.groups.billingUsage',
    labelFallback: 'Billing & Usage',
    tabs: ['billing', 'usage', 'payments', 'usage-dashboard', 'inference-cost'],
  },
  {
    key: 'integrations',
    labelKey: 'settings.groups.integrations',
    labelFallback: 'Integrations',
    tabs: ['github-sync', 'bidir-sync', 'mcp-integration', 'mcp-gateway', 'mcp-tools', 'webmcp', 'figma-import', 'api-cli', 'api-docs', 'pipeline-builder'],
  },
  {
    key: 'collaboration',
    labelKey: 'settings.groups.collaboration',
    labelFallback: 'Collaboration',
    tabs: ['collaborative-editing', 'planning-mode', 'org-memory'],
  },
  {
    key: 'analytics-admin',
    labelKey: 'settings.groups.analyticsAdmin',
    labelFallback: 'Analytics & Admin',
    tabs: ['analytics', 'observability', 'marketplace', 'deepwiki', 'language-expansion'],
  },
  {
    key: 'agents',
    labelKey: 'settings.groups.agents',
    labelFallback: 'Agents',
    tabs: ['background-agents', 'orchestration', 'agent-automation', 'agent-skills', 'langgraph', 'agentic-planning', 'workflows', 'agentic-workflows', 'agent-inbox', 'agent-messages', 'agent-trace', 'agent-rules', 'agent-terminal', 'agent-sdk', 'auto-terminal', 'parallel-agents', 'composer', 'workers-ai'],
  },
  {
    key: 'other',
    labelKey: 'settings.groups.other',
    labelFallback: 'Other',
    tabs: ['mobile-app', 'voice-input', 'arena', 'browser-ide'],
  },
]

/** Collect all tabs already assigned to a group */
const GROUPED_TABS = new Set(TAB_GROUPS.flatMap((g) => g.tabs))

/** Any tabs in VALID_TABS not yet assigned go into "Other" */
const UNGROUPED_TABS = VALID_TABS.filter((t) => !GROUPED_TABS.has(t))
if (UNGROUPED_TABS.length > 0) {
  const otherGroup = TAB_GROUPS.find((g) => g.key === 'other')
  if (otherGroup) {
    otherGroup.tabs.push(...UNGROUPED_TABS)
  }
}

/** Find which group a tab belongs to */
function findGroupForTab(tab: SettingsTab): TabGroupKey | null {
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

  // Derive tab from URL path
  const pathTab = (() => {
    const path = location.pathname
    const prefix = '/settings/'
    if (!path.startsWith(prefix)) return null
    const slug = path.slice(prefix.length)
    // Map special slugs
    if (slug === 'compiler-validation') return 'compiler' as SettingsTab
    if (VALID_TABS.includes(slug as SettingsTab)) return slug as SettingsTab
    return null
  })()

  const initialTab = pathTab || (tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'tokens')
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(initialTab)

  // Search filter for tabs
  const [searchQuery, setSearchQuery] = useState('')

  // Expanded groups state - default: expand the group containing the active tab
  const [expandedGroups, setExpandedGroups] = useState<Set<TabGroupKey>>(() => {
    const activeGroup = findGroupForTab(initialTab)
    return new Set(activeGroup ? [activeGroup] : [])
  })

  // When active tab changes, auto-expand its group
  useEffect(() => {
    const group = findGroupForTab(settingsTab)
    if (group && !expandedGroups.has(group)) {
      setExpandedGroups((prev) => new Set([...prev, group]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsTab])

  const toggleGroup = useCallback((groupKey: TabGroupKey) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== settingsTab) {
      setSettingsTab(tabParam)
    }
  }, [tabParam, settingsTab])

  // Defensive auth check - this is a fallback in case route guard fails
  useEffect(() => {
    if (!requireAuth()) {
      navigate('/')
    }
  }, [requireAuth, navigate])

  // Filter groups and tabs based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return TAB_GROUPS

    const query = searchQuery.toLowerCase()
    return TAB_GROUPS.map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => {
        const [labelKey, fallback] = TAB_LABELS[tab]
        const label = t(labelKey, fallback)
        return label.toLowerCase().includes(query) || tab.toLowerCase().includes(query)
      }),
    })).filter((group) => group.tabs.length > 0)
  }, [searchQuery, t])

  // When searching, expand all groups that have matching tabs
  const displayGroups = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredGroups.map((g) => ({ ...g, expanded: true }))
    }
    return filteredGroups.map((g) => ({ ...g, expanded: expandedGroups.has(g.key) }))
  }, [filteredGroups, expandedGroups, searchQuery])

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
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar with grouped tabs */}
        <nav className="w-full md:w-64 md:min-w-[16rem] shrink-0" aria-label={t('settings.title')}>
          {/* Search input */}
          <div className="mb-3">
            <div className="relative">
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-500"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('settings.searchTabs', 'Search settings...')}
                className="w-full pl-9 pr-3 py-2 bg-warm-800 border border-warm-700 rounded-lg text-sm text-white placeholder-warm-500 focus:outline-none focus:ring-1 focus:ring-warm-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-500 hover:text-white"
                  aria-label={t('settings.clearSearch', 'Clear search')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* Grouped tab list */}
          <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin pr-1">
            {displayGroups.map((group) => (
              <div key={group.key}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-warm-400 hover:text-white transition-colors rounded-md hover:bg-warm-800/50"
                >
                  <span>{t(group.labelKey, group.labelFallback)}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${group.expanded ? 'rotate-90' : ''}`}
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>

                {/* Group tabs */}
                {group.expanded && (
                  <div className="ml-1 space-y-0.5 pb-1">
                    {group.tabs.map((tab) => {
                      const [labelKey, fallback] = TAB_LABELS[tab]
                      const isActive = settingsTab === tab
                      return (
                        <button
                          key={tab}
                          onClick={() => setSettingsTab(tab)}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'bg-warm-700 text-white font-medium'
                              : 'text-warm-400 hover:text-white hover:bg-warm-800/50'
                          }`}
                        >
                          {t(labelKey, fallback)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
            {displayGroups.length === 0 && searchQuery && (
              <p className="text-warm-500 text-sm px-3 py-4 text-center">
                {t('settings.noResults', 'No settings found')}
              </p>
            )}
          </div>
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
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
        </div>
      </div>
    </section>
  )
}
