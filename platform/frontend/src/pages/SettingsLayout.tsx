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
import { useAuth } from '../contexts/AuthContext'

type SettingsTab = 'tokens' | 'usage' | 'billing' | 'payments' | 'memories' | 'preferences' | 'infrastructure' | 'secrets' | 'preview' | 'generation' | 'oauth' | 'compiler' | 'observability' | 'workflows' | 'specifications' | 'github-sync' | 'code-review' | 'streaming-generation' | 'mcp-integration' | 'analytics' | 'marketplace' | 'containerization' | 'test-generation' | 'collaborative-editing'

const VALID_TABS: SettingsTab[] = ['tokens', 'usage', 'billing', 'payments', 'memories', 'preferences', 'infrastructure', 'secrets', 'preview', 'generation', 'oauth', 'compiler', 'observability', 'workflows', 'specifications', 'github-sync', 'code-review', 'streaming-generation', 'mcp-integration', 'analytics', 'marketplace', 'containerization', 'test-generation', 'collaborative-editing']

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
    : location.pathname === '/settings/collaborative-editing' ? 'collaborative-editing' as SettingsTab : null
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
          className="text-gray-400 hover:text-white transition-colors"
        >
          &larr;
        </button>
        <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
      </div>
      <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setSettingsTab('tokens')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'tokens' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.tokens')}
        </button>
        <button
          onClick={() => setSettingsTab('usage')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'usage' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.usage')}
        </button>
        <button
          onClick={() => setSettingsTab('billing')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'billing' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
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
            settingsTab === 'payments' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.payments')}
        </button>
        <button
          onClick={() => setSettingsTab('memories')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'memories' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.memories')}
        </button>
        <button
          onClick={() => setSettingsTab('preferences')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'preferences' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.preferences')}
        </button>
        <button
          onClick={() => setSettingsTab('infrastructure')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'infrastructure' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.infrastructure', 'Infrastructure')}
        </button>
        <button
          onClick={() => setSettingsTab('secrets')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'secrets' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.secrets', 'Secrets')}
        </button>
        <button
          onClick={() => setSettingsTab('preview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'preview' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.preview', 'Preview')}
        </button>
        <button
          onClick={() => setSettingsTab('generation')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'generation' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.generation', 'Generation')}
        </button>
        <button
          onClick={() => setSettingsTab('oauth')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'oauth' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.oauth', 'OAuth')}
        </button>
        <button
          onClick={() => setSettingsTab('compiler')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'compiler' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.compiler', 'Compiler')}
        </button>
        <button
          onClick={() => setSettingsTab('observability')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'observability' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.observability', 'Observability')}
        </button>
        <button
          onClick={() => setSettingsTab('workflows')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'workflows' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.workflows', 'Workflows')}
        </button>
        <button
          onClick={() => setSettingsTab('specifications')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'specifications' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.specifications', 'Specifications')}
        </button>
        <button
          onClick={() => setSettingsTab('github-sync')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'github-sync' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.githubSync', 'GitHub Sync')}
        </button>
        <button
          onClick={() => setSettingsTab('code-review')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'code-review' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.codeReview', 'Code Review')}
        </button>
        <button
          onClick={() => setSettingsTab('streaming-generation')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            settingsTab === 'streaming-generation' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
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
            settingsTab === 'mcp-integration' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
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
            settingsTab === 'analytics' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
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
            settingsTab === 'marketplace' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
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
            settingsTab === 'containerization' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
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
            settingsTab === 'test-generation' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
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
            settingsTab === 'collaborative-editing' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1 justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {t('settings.tabs.collaborativeEditing', 'Collab')}
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
    </section>
  )
}
