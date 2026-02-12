import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getBidirSyncConfig,
  updateBidirSyncConfig,
  pushToGitHub,
  pullFromGitHub,
  getBidirSyncHistory,
  getBidirSyncStats,
  type BidirectionalGitSyncConfig,
  type SyncHistoryEntry,
  type BidirSyncStats,
} from '../api/bidir-sync'

type SubTab = 'sync' | 'history' | 'stats'

const STATUS_COLORS: Record<string, string> = {
  synced: 'bg-green-900 text-green-300 border-green-700',
  ahead: 'bg-blue-900 text-blue-300 border-blue-700',
  behind: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  diverged: 'bg-red-900 text-red-300 border-red-700',
  disconnected: 'bg-gray-700 text-gray-400 border-gray-600',
}

const OP_COLORS: Record<string, string> = {
  push: 'bg-blue-900 text-blue-300',
  pull: 'bg-purple-900 text-purple-300',
}

const HISTORY_STATUS_COLORS: Record<string, string> = {
  success: 'text-green-400',
  conflict: 'text-red-400',
  error: 'text-red-400',
}

export default function BidirectionalGitSyncPage() {
  const { t } = useTranslation()
  const [subTab, setSubTab] = useState<SubTab>('sync')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync tab state
  const [projectId, setProjectId] = useState<number>(1)
  const [config, setConfig] = useState<BidirectionalGitSyncConfig | null>(null)
  const [repoOwner, setRepoOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [pushResult, setPushResult] = useState<string | null>(null)
  const [pullResult, setPullResult] = useState<string | null>(null)

  // History tab state
  const [history, setHistory] = useState<SyncHistoryEntry[]>([])

  // Stats tab state
  const [stats, setStats] = useState<BidirSyncStats | null>(null)

  useEffect(() => {
    loadConfig()
  }, [projectId])

  useEffect(() => {
    if (subTab === 'history') loadHistory()
    if (subTab === 'stats') loadStats()
  }, [subTab])

  async function loadConfig() {
    try {
      setLoading(true)
      setError('')
      const data = await getBidirSyncConfig(projectId)
      setConfig(data)
      setRepoOwner(data.repoOwner || '')
      setRepoName(data.repoName || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidirSync.errorLoading', 'Failed to load sync config'))
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    if (!repoOwner || !repoName) {
      setError(t('bidirSync.errorRepoRequired', 'Repository owner and name are required'))
      return
    }
    try {
      setError('')
      const updated = await updateBidirSyncConfig(projectId, { repoOwner, repoName })
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidirSync.errorConnect', 'Failed to connect repository'))
    }
  }

  async function handleToggle(field: 'syncEnabled' | 'autoPushEnabled' | 'autoPullEnabled' | 'webhookEnabled') {
    if (!config) return
    try {
      setError('')
      const updated = await updateBidirSyncConfig(projectId, { [field]: !config[field] })
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidirSync.errorToggle', 'Failed to update setting'))
    }
  }

  async function handlePush() {
    try {
      setPushing(true)
      setError('')
      setPushResult(null)
      const result = await pushToGitHub(projectId)
      setPushResult(`Pushed ${result.filesCount} files to ${result.branch} (${result.commitSha})`)
      await loadConfig()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidirSync.errorPush', 'Push failed'))
    } finally {
      setPushing(false)
    }
  }

  async function handlePull() {
    try {
      setPulling(true)
      setError('')
      setPullResult(null)
      const result = await pullFromGitHub(projectId)
      if (result.hasConflicts) {
        setPullResult(`Pulled ${result.changedFiles.length} files with ${result.conflictFiles.length} conflict(s)`)
      } else {
        setPullResult(`Pulled ${result.changedFiles.length} files successfully`)
      }
      await loadConfig()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bidirSync.errorPull', 'Pull failed'))
    } finally {
      setPulling(false)
    }
  }

  async function loadHistory() {
    setLoading(true)
    try {
      const data = await getBidirSyncHistory(projectId)
      setHistory(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getBidirSyncStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  if (loading && !config) {
    return <div className="text-center py-12 text-gray-400">{t('bidirSync.loading', 'Loading sync settings...')}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('bidirSync.title', 'Bidirectional Git Sync')}</h3>
        <p className="text-sm text-gray-400 mt-1">{t('bidirSync.description', 'Two-way synchronization between generated projects and GitHub repositories')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setSubTab('sync')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'sync' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('bidirSync.tabs.sync', 'Sync')}
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'history' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('bidirSync.tabs.history', 'History')}
        </button>
        <button
          onClick={() => setSubTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'stats' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('bidirSync.tabs.stats', 'Stats')}
        </button>
      </div>

      {/* Sync Tab */}
      {subTab === 'sync' && (
        <div className="space-y-6">
          {/* Project ID Input */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('bidirSync.projectSelection', 'Project Selection')}</h4>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300">{t('bidirSync.projectId', 'Project ID')}</label>
              <input
                type="number"
                min={1}
                value={projectId}
                onChange={(e) => setProjectId(parseInt(e.target.value) || 1)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white w-24"
              />
              <button
                onClick={loadConfig}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
              >
                {t('bidirSync.load', 'Load')}
              </button>
            </div>
          </div>

          {/* Repository Connection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('bidirSync.repoConnection', 'Repository Connection')}</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">{t('bidirSync.repoOwner', 'Repository Owner')}</label>
                  <input
                    type="text"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                    placeholder="owner"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">{t('bidirSync.repoName', 'Repository Name')}</label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="repo-name"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
                  />
                </div>
              </div>
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm text-white font-medium transition-colors"
              >
                {config?.status !== 'disconnected'
                  ? t('bidirSync.updateRepo', 'Update Repository')
                  : t('bidirSync.connectRepo', 'Connect Repository')}
              </button>
            </div>
          </div>

          {/* Status Badge + Ahead/Behind */}
          {config && config.status !== 'disconnected' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-medium text-white mb-4">{t('bidirSync.syncStatus', 'Sync Status')}</h4>
              <div className="flex items-center gap-4 mb-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLORS[config.status] || STATUS_COLORS.disconnected}`}>
                  {config.status.toUpperCase()}
                </span>
                {config.aheadCount > 0 && (
                  <span className="text-sm text-blue-400">
                    {config.aheadCount} commit(s) ahead
                  </span>
                )}
                {config.behindCount > 0 && (
                  <span className="text-sm text-yellow-400">
                    {config.behindCount} commit(s) behind
                  </span>
                )}
                {config.lastSyncAt && (
                  <span className="text-xs text-gray-500">
                    Last sync: {new Date(config.lastSyncAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Push/Pull Buttons */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handlePush}
                  disabled={pushing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm text-white font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                  {pushing ? t('bidirSync.pushing', 'Pushing...') : t('bidirSync.push', 'Push to GitHub')}
                </button>
                <button
                  onClick={handlePull}
                  disabled={pulling}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded text-sm text-white font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>
                  {pulling ? t('bidirSync.pulling', 'Pulling...') : t('bidirSync.pull', 'Pull from GitHub')}
                </button>
              </div>

              {/* Push/Pull result messages */}
              {pushResult && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-400 text-sm mb-3">
                  {pushResult}
                </div>
              )}
              {pullResult && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-purple-400 text-sm mb-3">
                  {pullResult}
                </div>
              )}

              {/* Conflict list */}
              {config.conflictFiles && config.conflictFiles.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-red-400 mb-2">{t('bidirSync.conflicts', 'Conflicting Files')}</h5>
                  <ul className="space-y-1">
                    {config.conflictFiles.map((file, i) => (
                      <li key={i} className="text-sm text-red-300 font-mono flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Toggle settings */}
          {config && config.status !== 'disconnected' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-medium text-white mb-4">{t('bidirSync.settings', 'Sync Settings')}</h4>
              <div className="space-y-4">
                {([
                  { field: 'syncEnabled' as const, label: 'Sync Enabled', desc: 'Enable bidirectional sync for this project' },
                  { field: 'autoPushEnabled' as const, label: 'Auto Push', desc: 'Automatically push changes after generation' },
                  { field: 'autoPullEnabled' as const, label: 'Auto Pull', desc: 'Automatically pull upstream changes' },
                  { field: 'webhookEnabled' as const, label: 'Webhook', desc: 'Receive push notifications from GitHub' },
                ]).map(({ field, label, desc }) => (
                  <div key={field} className="flex items-center justify-between">
                    <div>
                      <label className="text-sm text-gray-300">{label}</label>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(field)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        config[field] ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        config[field] ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">{t('bidirSync.historyDescription', 'Sync operation history for the selected project')}</p>
          {loading ? (
            <div className="text-center py-8 text-gray-400">{t('bidirSync.loadingHistory', 'Loading history...')}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('bidirSync.noHistory', 'No sync operations yet')}</div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${OP_COLORS[entry.operation] || 'bg-gray-700 text-gray-300'}`}>
                      {entry.operation.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-300 font-mono">{entry.commitSha}</span>
                    <span className="text-sm text-gray-400">{entry.files} file(s)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${HISTORY_STATUS_COLORS[entry.status] || 'text-gray-400'}`}>
                      {entry.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {subTab === 'stats' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">{t('bidirSync.loadingStats', 'Loading stats...')}</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{stats.totalSyncs}</div>
                  <div className="text-sm text-gray-400">{t('bidirSync.stats.totalSyncs', 'Total Syncs')}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{stats.totalPushes}</div>
                  <div className="text-sm text-gray-400">{t('bidirSync.stats.totalPushes', 'Total Pushes')}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">{stats.totalPulls}</div>
                  <div className="text-sm text-gray-400">{t('bidirSync.stats.totalPulls', 'Total Pulls')}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">{stats.totalConflicts}</div>
                  <div className="text-sm text-gray-400">{t('bidirSync.stats.totalConflicts', 'Conflicts')}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{stats.conflictsResolved}</div>
                  <div className="text-sm text-gray-400">{t('bidirSync.stats.conflictsResolved', 'Resolved')}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[stats.status] || STATUS_COLORS.disconnected}`}>
                      {stats.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">{t('bidirSync.stats.overallStatus', 'Overall Status')}</div>
                </div>
              </div>

              {/* Sync Distribution */}
              {stats.totalSyncs > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="font-medium text-white mb-4">{t('bidirSync.stats.distribution', 'Sync Distribution')}</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-400">Pushes</span>
                        <span className="text-gray-400">{stats.totalSyncs > 0 ? Math.round((stats.totalPushes / stats.totalSyncs) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${stats.totalSyncs > 0 ? (stats.totalPushes / stats.totalSyncs) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-purple-400">Pulls</span>
                        <span className="text-gray-400">{stats.totalSyncs > 0 ? Math.round((stats.totalPulls / stats.totalSyncs) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${stats.totalSyncs > 0 ? (stats.totalPulls / stats.totalSyncs) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">{t('bidirSync.noStats', 'No stats available')}</div>
          )}
        </div>
      )}
    </div>
  )
}
