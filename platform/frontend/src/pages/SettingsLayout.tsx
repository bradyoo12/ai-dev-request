import { useState, useEffect } from 'react'
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
import { useAuth } from '../contexts/AuthContext'

type SettingsTab = 'tokens' | 'usage' | 'billing' | 'payments' | 'memories' | 'preferences' | 'infrastructure' | 'secrets' | 'preview' | 'generation' | 'oauth' | 'compiler' | 'observability' | 'workflows' | 'specifications' | 'github-sync' | 'code-review' | 'streaming-generation' | 'mcp-integration' | 'analytics' | 'marketplace' | 'containerization' | 'test-generation' | 'collaborative-editing' | 'onboarding' | 'version-history' | 'component-preview' | 'variant-comparison' | 'performance' | 'schema-designer' | 'api-cli' | 'pipeline-builder' | 'api-docs' | 'code-merge' | 'voice-input' | 'model-routing' | 'context-index' | 'deployment-health' | 'generative-ui' | 'mobile-app' | 'background-agents' | 'platform-upgrade' | 'visual-prompt' | 'multi-framework' | 'view-transitions' | 'nl-schema' | 'query-config' | 'agentic-planning' | 'visual-regression' | 'mcp-gateway' | 'codebase-memory' | 'figma-import' | 'arena' | 'visual-overlay' | 'semantic-search' | 'planning-mode' | 'project-docs' | 'ai-elements' | 'review-pipeline' | 'oauth-connectors' | 'mcp-tools' | 'ai-model' | 'bidir-sync' | 'self-healing-test' | 'database-branching' | 'sandbox' | 'dynamic-intelligence' | 'agent-automation' | 'usage-dashboard' | 'orchestration' | 'langgraph' | 'hybrid-cache' | 'playwright-healing' | 'self-healing-code' | 'production-sandboxes' | 'org-memory' | 'agent-rules' | 'server-components' | 'code-lint'

const VALID_TABS: SettingsTab[] = ['tokens', 'usage', 'billing', 'payments', 'memories', 'preferences', 'infrastructure', 'secrets', 'preview', 'generation', 'oauth', 'compiler', 'observability', 'workflows', 'specifications', 'github-sync', 'code-review', 'streaming-generation', 'mcp-integration', 'analytics', 'marketplace', 'containerization', 'test-generation', 'collaborative-editing', 'onboarding', 'version-history', 'component-preview', 'variant-comparison', 'performance', 'schema-designer', 'api-cli', 'pipeline-builder', 'api-docs', 'code-merge', 'voice-input', 'model-routing', 'context-index', 'deployment-health', 'generative-ui', 'mobile-app', 'background-agents', 'platform-upgrade', 'visual-prompt', 'multi-framework', 'view-transitions', 'nl-schema', 'query-config', 'agentic-planning', 'visual-regression', 'mcp-gateway', 'codebase-memory', 'figma-import', 'arena', 'visual-overlay', 'semantic-search', 'planning-mode', 'project-docs', 'ai-elements', 'review-pipeline', 'oauth-connectors', 'mcp-tools', 'ai-model', 'bidir-sync', 'self-healing-test', 'database-branching', 'sandbox', 'dynamic-intelligence', 'agent-automation', 'usage-dashboard', 'orchestration', 'langgraph', 'hybrid-cache', 'playwright-healing', 'self-healing-code', 'production-sandboxes', 'org-memory', 'agent-rules', 'server-components', 'code-lint']

export default function SettingsLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { setTokenBalance } = useAuth()
  const tabParam = searchParams.get('tab') as SettingsTab | null
  const pathTab = location.pathname === '/settings/specifications' ? 'specifications' as SettingsTab
    : location.pathname === '/settings/github-sync' ? 'github-sync' as SettingsTab
    : location.pathname === '/settings/code-review' ? 'code-review' as SettingsTab
    : location.pathname === '/settings/streaming-generation' ? 'streaming-generation' as SettingsTab
    : location.pathname === '/settings/billing' ? 'billing' as SettingsTab
    : location.pathname === '/settings/mcp-integration' ? 'mcp-integration' as SettingsTab
    : location.pathname === '/settings/analytics' ? 'analytics' as SettingsTab
    : location.pathname === '/settings/marketplace' ? 'marketplace' as SettingsTab
    : location.pathname === '/settings/containerization' ? 'containerization' as SettingsTab
    : location.pathname === '/settings/test-generation' ? 'test-generation' as SettingsTab
    : location.pathname === '/settings/collaborative-editing' ? 'collaborative-editing' as SettingsTab
    : location.pathname === '/settings/onboarding' ? 'onboarding' as SettingsTab
    : location.pathname === '/settings/version-history' ? 'version-history' as SettingsTab
    : location.pathname === '/settings/component-preview' ? 'component-preview' as SettingsTab
    : location.pathname === '/settings/variant-comparison' ? 'variant-comparison' as SettingsTab
    : location.pathname === '/settings/performance' ? 'performance' as SettingsTab
    : location.pathname === '/settings/schema-designer' ? 'schema-designer' as SettingsTab
    : location.pathname === '/settings/api-cli' ? 'api-cli' as SettingsTab
    : location.pathname === '/settings/pipeline-builder' ? 'pipeline-builder' as SettingsTab
    : location.pathname === '/settings/api-docs' ? 'api-docs' as SettingsTab
    : location.pathname === '/settings/code-merge' ? 'code-merge' as SettingsTab
    : location.pathname === '/settings/voice-input' ? 'voice-input' as SettingsTab
    : location.pathname === '/settings/model-routing' ? 'model-routing' as SettingsTab
    : location.pathname === '/settings/context-index' ? 'context-index' as SettingsTab
    : location.pathname === '/settings/deployment-health' ? 'deployment-health' as SettingsTab
    : location.pathname === '/settings/generative-ui' ? 'generative-ui' as SettingsTab
    : location.pathname === '/settings/mobile-app' ? 'mobile-app' as SettingsTab
    : location.pathname === '/settings/background-agents' ? 'background-agents' as SettingsTab
    : location.pathname === '/settings/platform-upgrade' ? 'platform-upgrade' as SettingsTab
    : location.pathname === '/settings/visual-prompt' ? 'visual-prompt' as SettingsTab
    : location.pathname === '/settings/multi-framework' ? 'multi-framework' as SettingsTab
    : location.pathname === '/settings/view-transitions' ? 'view-transitions' as SettingsTab
    : location.pathname === '/settings/nl-schema' ? 'nl-schema' as SettingsTab
    : location.pathname === '/settings/query-config' ? 'query-config' as SettingsTab
    : location.pathname === '/settings/agentic-planning' ? 'agentic-planning' as SettingsTab
    : location.pathname === '/settings/visual-regression' ? 'visual-regression' as SettingsTab
    : location.pathname === '/settings/mcp-gateway' ? 'mcp-gateway' as SettingsTab
    : location.pathname === '/settings/codebase-memory' ? 'codebase-memory' as SettingsTab
    : location.pathname === '/settings/figma-import' ? 'figma-import' as SettingsTab
    : location.pathname === '/settings/arena' ? 'arena' as SettingsTab
    : location.pathname === '/settings/visual-overlay' ? 'visual-overlay' as SettingsTab
    : location.pathname === '/settings/semantic-search' ? 'semantic-search' as SettingsTab
    : location.pathname === '/settings/planning-mode' ? 'planning-mode' as SettingsTab
    : location.pathname === '/settings/project-docs' ? 'project-docs' as SettingsTab
    : location.pathname === '/settings/ai-elements' ? 'ai-elements' as SettingsTab
    : location.pathname === '/settings/review-pipeline' ? 'review-pipeline' as SettingsTab
    : location.pathname === '/settings/oauth-connectors' ? 'oauth-connectors' as SettingsTab
    : location.pathname === '/settings/mcp-tools' ? 'mcp-tools' as SettingsTab
    : location.pathname === '/settings/ai-model' ? 'ai-model' as SettingsTab
    : location.pathname === '/settings/bidir-sync' ? 'bidir-sync' as SettingsTab
    : location.pathname === '/settings/self-healing-test' ? 'self-healing-test' as SettingsTab
    : location.pathname === '/settings/database-branching' ? 'database-branching' as SettingsTab
    : location.pathname === '/settings/sandbox' ? 'sandbox' as SettingsTab
    : location.pathname === '/settings/dynamic-intelligence' ? 'dynamic-intelligence' as SettingsTab
    : location.pathname === '/settings/agent-automation' ? 'agent-automation' as SettingsTab
    : location.pathname === '/settings/usage-dashboard' ? 'usage-dashboard' as SettingsTab
    : location.pathname === '/settings/orchestration' ? 'orchestration' as SettingsTab
    : location.pathname === '/settings/langgraph' ? 'langgraph' as SettingsTab
    : location.pathname === '/settings/hybrid-cache' ? 'hybrid-cache' as SettingsTab
    : location.pathname === '/settings/playwright-healing' ? 'playwright-healing' as SettingsTab
    : location.pathname === '/settings/self-healing-code' ? 'self-healing-code' as SettingsTab
    : location.pathname === '/settings/production-sandboxes' ? 'production-sandboxes' as SettingsTab
    : location.pathname === '/settings/org-memory' ? 'org-memory' as SettingsTab
    : location.pathname === '/settings/agent-rules' ? 'agent-rules' as SettingsTab
    : location.pathname === '/settings/server-components' ? 'server-components' as SettingsTab
    : location.pathname === '/settings/code-lint' ? 'code-lint' as SettingsTab
    : location.pathname === '/settings/observability' ? 'observability' as SettingsTab : null
  const initialTab = pathTab || (tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'tokens')
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== settingsTab) {
      setSettingsTab(tabParam)
    }
  }, [tabParam, settingsTab])

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
      <div className="flex gap-1 mb-6 bg-warm-800 rounded-lg p-1 overflow-x-auto whitespace-nowrap" role="tablist" aria-label={t('settings.title')}>
        <button
          onClick={() => setSettingsTab('tokens')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'tokens' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.tokens')}
        </button>
        <button
          onClick={() => setSettingsTab('usage')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'usage' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.usage')}
        </button>
        <button
          onClick={() => setSettingsTab('billing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'billing' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            {t('settings.tabs.billing')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('payments')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'payments' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.payments')}
        </button>
        <button
          onClick={() => setSettingsTab('memories')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'memories' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.memories')}
        </button>
        <button
          onClick={() => setSettingsTab('preferences')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'preferences' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.preferences')}
        </button>
        <button
          onClick={() => setSettingsTab('infrastructure')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'infrastructure' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.infrastructure', 'Infrastructure')}
        </button>
        <button
          onClick={() => setSettingsTab('secrets')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'secrets' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.secrets', 'Secrets')}
        </button>
        <button
          onClick={() => setSettingsTab('preview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'preview' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.preview', 'Preview')}
        </button>
        <button
          onClick={() => setSettingsTab('generation')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'generation' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.generation', 'Generation')}
        </button>
        <button
          onClick={() => setSettingsTab('oauth')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'oauth' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.oauth', 'OAuth')}
        </button>
        <button
          onClick={() => setSettingsTab('compiler')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'compiler' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.compiler', 'Compiler')}
        </button>
        <button
          onClick={() => setSettingsTab('observability')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'observability' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.observability', 'Observability')}
        </button>
        <button
          onClick={() => setSettingsTab('workflows')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'workflows' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.workflows', 'Workflows')}
        </button>
        <button
          onClick={() => setSettingsTab('specifications')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'specifications' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.specifications', 'Specifications')}
        </button>
        <button
          onClick={() => setSettingsTab('github-sync')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'github-sync' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.githubSync', 'GitHub Sync')}
        </button>
        <button
          onClick={() => setSettingsTab('code-review')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'code-review' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.codeReview', 'Code Review')}
        </button>
        <button
          onClick={() => setSettingsTab('streaming-generation')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'streaming-generation' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            {t('settings.tabs.streamingGeneration', 'Live Generation')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('mcp-integration')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'mcp-integration' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/><path d="M12 17v5"/></svg>
            {t('settings.tabs.mcpIntegration', 'MCP')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('analytics')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'analytics' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            {t('settings.tabs.analytics', 'Analytics')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('marketplace')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'marketplace' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
            {t('settings.tabs.marketplace', 'Marketplace')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('containerization')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'containerization' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            {t('settings.tabs.containerization', 'Containers')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('test-generation')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'test-generation' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
            {t('settings.tabs.testGeneration', 'Tests')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('collaborative-editing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'collaborative-editing' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {t('settings.tabs.collaborativeEditing', 'Collab')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('onboarding')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'onboarding' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {t('settings.tabs.onboarding', 'Onboarding')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('version-history')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'version-history' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {t('settings.tabs.versionHistory', 'Versions')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('component-preview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'component-preview' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
            {t('settings.tabs.componentPreview', 'Preview')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('variant-comparison')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'variant-comparison' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
            {t('settings.tabs.variantComparison', 'Variants')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('performance')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'performance' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            {t('settings.tabs.performance', 'Performance')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('schema-designer')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'schema-designer' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
            {t('settings.tabs.schemaDesigner', 'Schema')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('api-cli')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'api-cli' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
            {t('settings.tabs.apiCli', 'API & CLI')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('pipeline-builder')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'pipeline-builder' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>
            {t('settings.tabs.pipelineBuilder', 'Pipelines')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('api-docs')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'api-docs' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
            {t('settings.tabs.apiDocs', 'API Docs')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('code-merge')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'code-merge' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>
            {t('settings.tabs.codeMerge', 'Code Merge')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('voice-input')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'voice-input' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            {t('settings.tabs.voiceInput', 'Voice')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('model-routing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'model-routing' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            {t('settings.tabs.modelRouting', 'AI Models')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('context-index')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'context-index' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            {t('settings.tabs.contextIndex', 'Context Index')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('deployment-health')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'deployment-health' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            {t('settings.tabs.deploymentHealth', 'Health')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('generative-ui')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'generative-ui' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {t('settings.tabs.generativeUi', 'Gen UI')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('mobile-app')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'mobile-app' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            {t('settings.tabs.mobileApp', 'Mobile')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('background-agents')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'background-agents' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            {t('settings.tabs.backgroundAgents', 'Agents')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('platform-upgrade')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'platform-upgrade' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            {t('settings.tabs.platformUpgrade', 'Platform')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('visual-prompt')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'visual-prompt' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            {t('settings.tabs.visualPrompt', 'Visual UI')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('multi-framework')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'multi-framework' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            {t('settings.tabs.multiFramework', 'Frameworks')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('view-transitions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'view-transitions' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            {t('settings.tabs.viewTransitions', 'Transitions')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('nl-schema')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'nl-schema' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
            {t('settings.tabs.nlSchema', 'Schema AI')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('query-config')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'query-config' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.22-8.56"/><path d="M21 3v9h-9"/></svg>
            {t('settings.tabs.queryConfig', 'Query')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('agentic-planning')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'agentic-planning' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            {t('settings.tabs.agenticPlanning', 'Planner')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('visual-regression')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'visual-regression' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
            {t('settings.tabs.visualRegression', 'Visual QA')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('mcp-gateway')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'mcp-gateway' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M4.22 4.22l2.83 2.83"/><path d="M16.95 16.95l2.83 2.83"/><path d="M1 12h4"/><path d="M19 12h4"/><path d="M4.22 19.78l2.83-2.83"/><path d="M16.95 7.05l2.83-2.83"/></svg>
            {t('settings.tabs.mcpGateway', 'MCP Gateway')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('codebase-memory')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'codebase-memory' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/><path d="M19 9H5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z"/><path d="M12 14v8"/><path d="M8 18h8"/></svg>
            {t('settings.tabs.codebaseMemory', 'Memory AI')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('figma-import')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'figma-import' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/><path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/></svg>
            {t('settings.tabs.figmaImport', 'Figma')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('arena')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'arena' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
            {t('settings.tabs.arena', 'Arena')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('visual-overlay')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'visual-overlay' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            {t('settings.tabs.visualOverlay', 'Overlay Editor')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('semantic-search')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'semantic-search' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
            {t('settings.tabs.semanticSearch', 'Semantic Search')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('planning-mode')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'planning-mode' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>
            {t('settings.tabs.planningMode', 'Planning')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('project-docs')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'project-docs' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            {t('settings.tabs.projectDocs', 'Project Docs')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('ai-elements')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'ai-elements' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            {t('settings.tabs.aiElements', 'AI Elements')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('review-pipeline')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'review-pipeline' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
            {t('settings.tabs.reviewPipeline', 'Review Pipeline')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('oauth-connectors')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'oauth-connectors' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
            {t('settings.tabs.oauthConnectors', 'OAuth Connectors')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('mcp-tools')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'mcp-tools' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            {t('settings.tabs.mcpTools', 'MCP Tools')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('ai-model')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'ai-model' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 2 3 3 3 5s-3 3-3 5a3 3 0 0 0 6 0c0-2-3-3-3-5s3-3 3-5a3 3 0 0 0-3-3z"/><path d="M12 22v-2"/><path d="M12 2V0"/></svg>
            {t('settings.tabs.aiModel', 'AI Engine')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('bidir-sync')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'bidir-sync' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/><path d="M18 3v12a9 9 0 0 1-9-9"/></svg>
            {t('settings.tabs.bidirSync', 'Git Sync+')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('self-healing-test')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'self-healing-test' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/><circle cx="12" cy="12" r="3"/></svg>
            {t('settings.tabs.selfHealingTest', 'Self-Healing')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('database-branching')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'database-branching' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>
            {t('settings.tabs.databaseBranching', 'DB Branching')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('sandbox')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'sandbox' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>
            {t('settings.tabs.sandbox', 'Sandbox')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('dynamic-intelligence')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'dynamic-intelligence' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            {t('settings.tabs.dynamicIntelligence', 'Intelligence')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('agent-automation')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'agent-automation' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01"/><path d="M16 16h.01"/></svg>
            {t('settings.tabs.agentAutomation', 'Agent Auto')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('usage-dashboard')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'usage-dashboard' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            {t('settings.tabs.usageDashboard', 'Usage Metering')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('orchestration')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'orchestration' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="12" cy="5" r="2"/></svg>
            {t('settings.tabs.orchestration', 'Orchestration')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('langgraph')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'langgraph' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 12v4M2 12h4m12 0h4m-5.66-5.66 2.83-2.83M4.83 19.17l2.83-2.83m0-8.68L4.83 4.83m14.34 14.34-2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>
            {t('settings.tabs.langgraph', 'LangGraph')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('hybrid-cache')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'hybrid-cache' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            {t('settings.tabs.hybridCache', 'Cache')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('playwright-healing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'playwright-healing' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/><circle cx="12" cy="12" r="3"/></svg>
            {t('settings.tabs.playwrightHealing', 'Test Heal')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('self-healing-code')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'self-healing-code' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {t('settings.tabs.selfHealingCode', 'Self-Heal')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('production-sandboxes')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'production-sandboxes' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            {t('settings.tabs.productionSandboxes', 'Sandboxes')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('org-memory')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'org-memory' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            {t('settings.tabs.orgMemory', 'Org Memory')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('agent-rules')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'agent-rules' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            {t('settings.tabs.agentRules', 'Agent Rules')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('server-components')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'server-components' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            {t('settings.tabs.serverComponents', 'Server Components')}
          </span>
        </button>
        <button
          onClick={() => setSettingsTab('code-lint')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'code-lint' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {t('settings.tabs.codeLint', 'Code Lint')}
          </span>
        </button>
      </div>
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
    </section>
  )
}
