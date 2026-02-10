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
import { useAuth } from '../contexts/AuthContext'

type SettingsTab = 'tokens' | 'usage' | 'billing' | 'payments' | 'memories' | 'preferences' | 'infrastructure' | 'secrets' | 'preview' | 'generation' | 'oauth' | 'compiler' | 'observability' | 'workflows' | 'specifications' | 'github-sync' | 'code-review' | 'streaming-generation' | 'mcp-integration' | 'analytics'

const VALID_TABS: SettingsTab[] = ['tokens', 'usage', 'billing', 'payments', 'memories', 'preferences', 'infrastructure', 'secrets', 'preview', 'generation', 'oauth', 'compiler', 'observability', 'workflows', 'specifications', 'github-sync', 'code-review', 'streaming-generation', 'mcp-integration', 'analytics']

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
    : location.pathname === '/settings/analytics' ? 'analytics' as SettingsTab : null
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
    </section>
  )
}
