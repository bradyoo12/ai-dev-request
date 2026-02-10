import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  connectRepo,
  disconnectRepo,
  pushToRepo,
  pullFromRepo,
  getSyncStatus,
  resolveConflicts,
  getSyncHistory,
} from '../api/github-sync'
import type { GitHubSync, SyncHistory } from '../api/github-sync'

export default function GitHubSyncPage() {
  const { t } = useTranslation()
  const [syncStatus, setSyncStatus] = useState<GitHubSync | null>(null)
  const [history, setHistory] = useState<SyncHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState<number>(1)
  const [projectIdInput, setProjectIdInput] = useState('1')
  const [repoOwner, setRepoOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [resolution, setResolution] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true)
      const [statusData, historyData] = await Promise.all([
        getSyncStatus(projectId),
        getSyncHistory(projectId),
      ])
      setSyncStatus(statusData)
      setHistory(historyData)
    } catch {
      setError(t('githubSync.loadError', 'Failed to load sync status'))
    } finally {
      setLoading(false)
    }
  }, [projectId, t])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleConnect = async () => {
    if (!repoOwner.trim() || !repoName.trim()) return
    try {
      setError('')
      setSyncing(true)
      const sync = await connectRepo(projectId, { repoOwner, repoName })
      setSyncStatus(sync)
      setRepoOwner('')
      setRepoName('')
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('githubSync.connectError', 'Connection failed'))
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setError('')
      await disconnectRepo(projectId)
      setSyncStatus(null)
      setHistory([])
      setShowDisconnectConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('githubSync.disconnectError', 'Disconnect failed'))
    }
  }

  const handlePush = async () => {
    try {
      setError('')
      setSyncing(true)
      const sync = await pushToRepo(projectId)
      setSyncStatus(sync)
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('githubSync.pushError', 'Push failed'))
    } finally {
      setSyncing(false)
    }
  }

  const handlePull = async () => {
    try {
      setError('')
      setSyncing(true)
      const sync = await pullFromRepo(projectId)
      setSyncStatus(sync)
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('githubSync.pullError', 'Pull failed'))
    } finally {
      setSyncing(false)
    }
  }

  const handleResolveConflicts = async () => {
    if (!resolution.trim()) return
    try {
      setError('')
      const sync = await resolveConflicts(projectId, resolution)
      setSyncStatus(sync)
      setResolution('')
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('githubSync.resolveError', 'Conflict resolution failed'))
    }
  }

  const handleLoadProject = () => {
    const parsed = parseInt(projectIdInput, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setProjectId(parsed)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-900/50 text-green-400'
      case 'connected': return 'bg-blue-900/50 text-blue-400'
      case 'syncing': return 'bg-yellow-900/50 text-yellow-400'
      case 'conflict': return 'bg-red-900/50 text-red-400'
      case 'error': return 'bg-red-900/50 text-red-400'
      case 'disconnected': return 'bg-gray-700 text-gray-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-400'
      case 'connected': return 'bg-blue-400'
      case 'syncing': return 'bg-yellow-400 animate-pulse'
      case 'conflict': return 'bg-red-400'
      case 'error': return 'bg-red-400'
      default: return 'bg-gray-400'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'connect': return '🔗'
      case 'push': return '⬆'
      case 'pull': return '⬇'
      default: return '•'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('githubSync.loading', 'Loading sync status...')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Project ID Selector */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">{t('githubSync.projectId', 'Project ID')}:</label>
          <input
            type="number"
            value={projectIdInput}
            onChange={(e) => setProjectIdInput(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-24"
            min={1}
          />
          <button
            onClick={handleLoadProject}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {t('githubSync.load', 'Load')}
          </button>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="ml-auto px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              {showHistory ? t('githubSync.hideHistory', 'Hide History') : t('githubSync.showHistory', 'Show History')} ({history.length})
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {syncStatus ? (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusDot(syncStatus.status)}`}></div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(syncStatus.status)}`}>
                  {syncStatus.status}
                </span>
                <span className="text-sm text-gray-300 font-mono">
                  {syncStatus.gitHubRepoOwner}/{syncStatus.gitHubRepoName}
                </span>
              </div>
              <a
                href={syncStatus.gitHubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {t('githubSync.viewOnGitHub', 'View on GitHub')} &rarr;
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500">{t('githubSync.branch', 'Branch')}</span>
                <p className="text-gray-300 font-mono">{syncStatus.branch}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('githubSync.lastCommit', 'Last Commit')}</span>
                <p className="text-gray-300 font-mono">{syncStatus.lastSyncCommitSha || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('githubSync.lastPush', 'Last Push')}</span>
                <p className="text-gray-300">{syncStatus.lastPushAt ? new Date(syncStatus.lastPushAt).toLocaleString() : '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">{t('githubSync.lastPull', 'Last Pull')}</span>
                <p className="text-gray-300">{syncStatus.lastPullAt ? new Date(syncStatus.lastPullAt).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h4 className="text-sm font-bold mb-4">{t('githubSync.actions', 'Sync Actions')}</h4>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePush}
                disabled={syncing || syncStatus.status === 'syncing'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <span>&#8593;</span>
                {syncing ? t('githubSync.pushing', 'Pushing...') : t('githubSync.push', 'Push to GitHub')}
              </button>
              <button
                onClick={handlePull}
                disabled={syncing || syncStatus.status === 'syncing'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <span>&#8595;</span>
                {syncing ? t('githubSync.pulling', 'Pulling...') : t('githubSync.pull', 'Pull from GitHub')}
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="ml-auto px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                {t('githubSync.disconnect', 'Disconnect')}
              </button>
            </div>
          </div>

          {/* Conflict Resolution */}
          {syncStatus.status === 'conflict' && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-5">
              <h4 className="text-sm font-bold text-red-400 mb-3">{t('githubSync.conflictTitle', 'Merge Conflicts Detected')}</h4>
              {syncStatus.conflictDetails && (
                <pre className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 mb-4 overflow-x-auto">
                  {syncStatus.conflictDetails}
                </pre>
              )}
              <div className="flex items-start gap-3">
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white flex-1"
                >
                  <option value="">{t('githubSync.selectResolution', 'Select resolution strategy...')}</option>
                  <option value="ours">{t('githubSync.keepOurs', 'Keep our changes (generated code)')}</option>
                  <option value="theirs">{t('githubSync.keepTheirs', 'Keep their changes (GitHub)')}</option>
                  <option value="merge">{t('githubSync.autoMerge', 'Auto-merge (best effort)')}</option>
                </select>
                <button
                  onClick={handleResolveConflicts}
                  disabled={!resolution}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {t('githubSync.resolve', 'Resolve')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Connect Form */
        <div className="bg-gray-800 rounded-xl p-6">
          <h4 className="text-sm font-bold mb-4">{t('githubSync.connectTitle', 'Connect to GitHub Repository')}</h4>
          <p className="text-sm text-gray-400 mb-4">
            {t('githubSync.connectDescription', 'Link your project to a GitHub repository to enable two-way sync. Push generated code and pull your changes back.')}
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">{t('githubSync.repoOwner', 'Repository Owner')}</label>
              <input
                type="text"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
                placeholder="username-or-org"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="text-gray-500 pb-2">/</div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">{t('githubSync.repoName', 'Repository Name')}</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-project"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={syncing || !repoOwner.trim() || !repoName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {syncing ? t('githubSync.connecting', 'Connecting...') : t('githubSync.connect', 'Connect')}
            </button>
          </div>
        </div>
      )}

      {/* Sync History */}
      {showHistory && history.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3">{t('githubSync.historyTitle', 'Sync History')}</h3>
          <div className="space-y-2">
            {history.map((entry, idx) => (
              <div key={idx} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm">{getActionIcon(entry.action)}</span>
                  <span className="text-sm text-gray-300 capitalize">{entry.action}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    entry.status === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {entry.status}
                  </span>
                  {entry.commitSha && (
                    <span className="text-xs font-mono text-gray-500">{entry.commitSha}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
                  {entry.details && (
                    <p className="text-xs text-gray-400 mt-0.5">{entry.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{t('githubSync.disconnectTitle', 'Disconnect Repository')}</h3>
            <p className="text-sm text-gray-400 mb-4">
              {t('githubSync.disconnectWarning', 'This will remove the connection between your project and the GitHub repository. The repository itself will not be deleted.')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
              >
                {t('githubSync.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t('githubSync.confirmDisconnect', 'Disconnect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
