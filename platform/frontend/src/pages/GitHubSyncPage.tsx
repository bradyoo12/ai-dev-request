import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getGitHubSyncConfig,
  updateGitHubSyncConfig,
  listConnectedRepos,
  pushToGitHub,
  pullFromGitHub,
  getGitHubSyncStats,
  type GitHubSyncConfig,
  type ConnectedRepo,
  type GitHubSyncStats,
} from '../api/githubSync'

type SyncSubTab = 'repositories' | 'configure' | 'stats'

const STATUS_COLORS: Record<string, string> = {
  synced: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  conflict: 'bg-red-500/20 text-red-400 border-red-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const CONFLICT_STRATEGIES = [
  { value: 'ai-merge', label: 'AI Merge' },
  { value: 'manual', label: 'Manual' },
  { value: 'prefer-remote', label: 'Prefer Remote' },
  { value: 'prefer-local', label: 'Prefer Local' },
] as const

export default function GitHubSyncPage() {
  const { t } = useTranslation()
  const [subTab, setSubTab] = useState<SyncSubTab>('repositories')
  const [config, setConfig] = useState<GitHubSyncConfig | null>(null)
  const [repos, setRepos] = useState<ConnectedRepo[]>([])
  const [stats, setStats] = useState<GitHubSyncStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (subTab === 'stats') loadStats()
  }, [subTab])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function loadData() {
    try {
      setLoading(true)
      const [configRes, reposRes] = await Promise.all([
        getGitHubSyncConfig(),
        listConnectedRepos(),
      ])
      setConfig(configRes)
      setRepos(reposRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.githubSync.errorLoading', 'Failed to load GitHub sync settings'))
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const data = await getGitHubSyncStats()
      setStats(data)
    } catch { /* ignore */ }
  }

  async function handleConfigChange(updates: Partial<GitHubSyncConfig>) {
    try {
      const updated = await updateGitHubSyncConfig(updates)
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.githubSync.errorSaving', 'Failed to save settings'))
    }
  }

  async function handlePush(repoName: string) {
    setActionLoading(`push-${repoName}`)
    try {
      const result = await pushToGitHub(repoName)
      setToast({ message: result.message, type: 'success' })
      await loadData()
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Push failed', type: 'error' })
    }
    setActionLoading(null)
  }

  async function handlePull(repoName: string) {
    setActionLoading(`pull-${repoName}`)
    try {
      const result = await pullFromGitHub(repoName)
      setToast({
        message: result.message,
        type: result.success ? 'success' : 'error',
      })
      await loadData()
      if (subTab === 'stats') await loadStats()
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Pull failed', type: 'error' })
    }
    setActionLoading(null)
  }

  function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        {t('settings.githubSync.loading', 'Loading GitHub sync settings...')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">
          {t('settings.githubSync.title', 'GitHub Sync')}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {t('settings.githubSync.description', 'Bidirectional synchronization between generated projects and GitHub repositories')}
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${
          toast.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:text-white">&times;</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setSubTab('repositories')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'repositories' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.githubSync.tabs.repositories', 'Repositories')}
        </button>
        <button
          onClick={() => setSubTab('configure')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'configure' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.githubSync.tabs.configure', 'Configure')}
        </button>
        <button
          onClick={() => setSubTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'stats' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('settings.githubSync.tabs.stats', 'Stats')}
        </button>
      </div>

      {/* Repositories Tab */}
      {subTab === 'repositories' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {t('settings.githubSync.reposDescription', 'Connected repositories with push and pull actions')}
          </p>
          <div className="space-y-3">
            {repos.map(repo => (
              <div
                key={repo.id}
                className="border border-gray-700 bg-gray-800 rounded-lg p-5 hover:border-gray-600 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* GitHub icon */}
                    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{repo.name}</h4>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {repo.url}
                      </a>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    STATUS_COLORS[repo.status] || 'bg-gray-700 text-gray-400 border-gray-600'
                  }`}>
                    {repo.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/></svg>
                      {repo.branch}
                    </span>
                    <span>{repo.commits} commits</span>
                    <span>{t('settings.githubSync.lastSynced', 'Last synced')}: {formatTimeAgo(repo.lastSynced)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePush(repo.name)}
                      disabled={actionLoading === `push-${repo.name}`}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {actionLoading === `push-${repo.name}` ? (
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                      )}
                      {t('settings.githubSync.push', 'Push')}
                    </button>
                    <button
                      onClick={() => handlePull(repo.name)}
                      disabled={actionLoading === `pull-${repo.name}`}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {actionLoading === `pull-${repo.name}` ? (
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                      )}
                      {t('settings.githubSync.pull', 'Pull')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configure Tab */}
      {subTab === 'configure' && config && (
        <div className="space-y-6">
          {/* Sync Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">
              {t('settings.githubSync.syncSettings', 'Sync Settings')}
            </h4>
            <div className="space-y-4">
              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">
                    {t('settings.githubSync.autoSync', 'Auto Sync')}
                  </label>
                  <p className="text-xs text-gray-500">
                    {t('settings.githubSync.autoSyncDesc', 'Automatically sync changes when code is generated')}
                  </p>
                </div>
                <button
                  onClick={() => handleConfigChange({ autoSync: !config.autoSync })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.autoSync ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    config.autoSync ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              {/* Sync On Push */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">
                    {t('settings.githubSync.syncOnPush', 'Sync on Push')}
                  </label>
                  <p className="text-xs text-gray-500">
                    {t('settings.githubSync.syncOnPushDesc', 'Push generated changes to GitHub automatically')}
                  </p>
                </div>
                <button
                  onClick={() => handleConfigChange({ syncOnPush: !config.syncOnPush })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.syncOnPush ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    config.syncOnPush ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              {/* Sync On Pull */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">
                    {t('settings.githubSync.syncOnPull', 'Sync on Pull')}
                  </label>
                  <p className="text-xs text-gray-500">
                    {t('settings.githubSync.syncOnPullDesc', 'Pull remote changes before generating new code')}
                  </p>
                </div>
                <button
                  onClick={() => handleConfigChange({ syncOnPull: !config.syncOnPull })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.syncOnPull ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    config.syncOnPull ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              {/* Webhook Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">
                    {t('settings.githubSync.webhookEnabled', 'Webhook Notifications')}
                  </label>
                  <p className="text-xs text-gray-500">
                    {t('settings.githubSync.webhookEnabledDesc', 'Receive push notifications from GitHub via webhooks')}
                  </p>
                </div>
                <button
                  onClick={() => handleConfigChange({ webhookEnabled: !config.webhookEnabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.webhookEnabled ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    config.webhookEnabled ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Conflict Resolution */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">
              {t('settings.githubSync.conflictResolution', 'Conflict Resolution')}
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">
                    {t('settings.githubSync.conflictStrategy', 'Resolution Strategy')}
                  </label>
                  <p className="text-xs text-gray-500">
                    {t('settings.githubSync.conflictStrategyDesc', 'How to handle merge conflicts between local and remote')}
                  </p>
                </div>
                <select
                  value={config.conflictResolution}
                  onChange={(e) => handleConfigChange({ conflictResolution: e.target.value })}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
                >
                  {CONFLICT_STRATEGIES.map(s => (
                    <option key={s.value} value={s.value}>
                      {t(`settings.githubSync.strategy.${s.value}`, s.label)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Strategy description */}
              <div className="bg-gray-700/50 rounded-lg p-3 text-xs text-gray-400">
                {config.conflictResolution === 'ai-merge' && t('settings.githubSync.strategyAiMergeDesc', 'AI will attempt to automatically resolve merge conflicts using semantic understanding of the code.')}
                {config.conflictResolution === 'manual' && t('settings.githubSync.strategyManualDesc', 'You will be notified of conflicts and can resolve them manually through the interface.')}
                {config.conflictResolution === 'prefer-remote' && t('settings.githubSync.strategyRemoteDesc', 'Remote changes from GitHub will always take priority over local changes.')}
                {config.conflictResolution === 'prefer-local' && t('settings.githubSync.strategyLocalDesc', 'Local generated changes will always take priority over remote changes.')}
              </div>
            </div>
          </div>

          {/* Branch Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">
              {t('settings.githubSync.branchSettings', 'Branch Settings')}
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-300">
                  {t('settings.githubSync.defaultBranch', 'Default Branch')}
                </label>
                <p className="text-xs text-gray-500">
                  {t('settings.githubSync.defaultBranchDesc', 'The default branch for push and pull operations')}
                </p>
              </div>
              <select
                value={config.defaultBranch}
                onChange={(e) => handleConfigChange({ defaultBranch: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
              >
                <option value="main">main</option>
                <option value="develop">develop</option>
                <option value="staging">staging</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {subTab === 'stats' && (
        <div className="space-y-6">
          <p className="text-sm text-gray-400">
            {t('settings.githubSync.statsDescription', 'Sync activity metrics and history')}
          </p>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Pushes */}
            <div className="border border-gray-700 bg-gray-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('settings.githubSync.stats.totalPushes', 'Total Pushes')}
                  </p>
                  <p className="text-2xl font-bold text-white">{stats?.totalPushes ?? config?.totalPushes ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Total Pulls */}
            <div className="border border-gray-700 bg-gray-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('settings.githubSync.stats.totalPulls', 'Total Pulls')}
                  </p>
                  <p className="text-2xl font-bold text-white">{stats?.totalPulls ?? config?.totalPulls ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Total Conflicts */}
            <div className="border border-gray-700 bg-gray-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('settings.githubSync.stats.totalConflicts', 'Conflicts Resolved')}
                  </p>
                  <p className="text-2xl font-bold text-white">{stats?.totalConflicts ?? config?.totalConflicts ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Total Merges */}
            <div className="border border-gray-700 bg-gray-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {t('settings.githubSync.stats.totalMerges', 'Successful Merges')}
                  </p>
                  <p className="text-2xl font-bold text-white">{stats?.totalMerges ?? config?.totalMerges ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {stats?.recentActivity && stats.recentActivity.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-medium text-white mb-4">
                {t('settings.githubSync.recentActivity', 'Recent Activity')}
              </h4>
              <div className="space-y-2">
                {stats.recentActivity.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        entry.action === 'push'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {entry.action}
                      </span>
                      <span className="text-sm text-gray-300">{entry.repoName}</span>
                      <span className="text-xs text-gray-500 font-mono">{entry.commitSha}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{entry.filesChanged} files</span>
                      <span className={entry.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                        {entry.status}
                      </span>
                      <span>{formatTimeAgo(entry.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
