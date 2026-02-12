import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listSnapshots,
  toggleLock,
  resolveConflict,
  getMergeStats,
  type CodeSnapshot,
  type MergeStats,
} from '../api/codemerge'

const STATUS_COLORS: Record<string, string> = {
  Synced: 'bg-green-600/20 text-green-400',
  UserModified: 'bg-yellow-600/20 text-yellow-400',
  Conflicted: 'bg-red-600/20 text-red-400',
  Merged: 'bg-blue-600/20 text-blue-400',
}

const FILE_ICONS: Record<string, string> = {
  '.tsx': 'text-blue-400',
  '.ts': 'text-blue-300',
  '.jsx': 'text-yellow-400',
  '.js': 'text-yellow-300',
  '.cs': 'text-purple-400',
  '.py': 'text-green-400',
  '.css': 'text-pink-400',
  '.html': 'text-orange-400',
  '.json': 'text-warm-400',
}

function getFileColor(path: string): string {
  const ext = path.substring(path.lastIndexOf('.'))
  return FILE_ICONS[ext] || 'text-warm-400'
}

export default function CodeMergePage() {
  const { t } = useTranslation()
  const [snapshots, setSnapshots] = useState<CodeSnapshot[]>([])
  const [stats, setStats] = useState<MergeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSnapshot, setSelectedSnapshot] = useState<CodeSnapshot | null>(null)
  const [resolving, setResolving] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [snapshotsData, statsData] = await Promise.all([listSnapshots(), getMergeStats()])
      setSnapshots(snapshotsData)
      setStats(statsData)
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('codeMerge.loadError'))
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleLock(snapshot: CodeSnapshot) {
    try {
      const updated = await toggleLock(snapshot.id, !snapshot.isLocked)
      setSnapshots(snapshots.map(s => s.id === updated.id ? updated : s))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('codeMerge.lockError'))
    }
  }

  async function handleResolve(snapshot: CodeSnapshot, resolution: string) {
    try {
      setResolving(true)
      const updated = await resolveConflict(snapshot.id, resolution)
      setSnapshots(snapshots.map(s => s.id === updated.id ? updated : s))
      setSelectedSnapshot(null)
      const newStats = await getMergeStats()
      setStats(newStats)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('codeMerge.resolveError'))
    } finally {
      setResolving(false)
    }
  }

  const filteredSnapshots = snapshots.filter(s => {
    if (filter === 'all') return true
    if (filter === 'modified') return s.status === 'UserModified'
    if (filter === 'conflicted') return s.status === 'Conflicted'
    if (filter === 'locked') return s.isLocked
    return true
  })

  if (loading) {
    return <div className="text-warm-400 text-center py-12">{t('codeMerge.loading')}</div>
  }

  // Detail view for conflict resolution
  if (selectedSnapshot) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedSnapshot(null)} className="text-warm-400 hover:text-white text-sm">
            {t('codeMerge.backToList')}
          </button>
          <h3 className="text-xl font-bold">{selectedSnapshot.filePath}</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[selectedSnapshot.status] || 'bg-warm-600/20 text-warm-400'}`}>
            {selectedSnapshot.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-400 mb-2">{t('codeMerge.aiBaseline')} (v{selectedSnapshot.version})</h4>
            <pre className="text-xs text-warm-300 overflow-auto max-h-80 bg-warm-900 rounded p-3 font-mono">
              {selectedSnapshot.baselineContent}
            </pre>
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-400 mb-2">{t('codeMerge.userVersion')}</h4>
            <pre className="text-xs text-warm-300 overflow-auto max-h-80 bg-warm-900 rounded p-3 font-mono">
              {selectedSnapshot.userContent || t('codeMerge.noChanges')}
            </pre>
          </div>
        </div>

        {selectedSnapshot.status === 'Conflicted' && (
          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-warm-300 mb-3">{t('codeMerge.resolveConflict')}</h4>
            <div className="flex gap-3">
              <button
                onClick={() => handleResolve(selectedSnapshot, 'keep-user')}
                disabled={resolving}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded text-sm"
              >
                {t('codeMerge.keepUser')}
              </button>
              <button
                onClick={() => handleResolve(selectedSnapshot, 'keep-ai')}
                disabled={resolving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-sm"
              >
                {t('codeMerge.keepAi')}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">{t('codeMerge.title')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('codeMerge.subtitle')}</p>
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-400 text-sm">{error}</div>}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-warm-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{stats.totalFiles}</div>
            <div className="text-xs text-warm-400">{t('codeMerge.statTotal')}</div>
          </div>
          <div className="bg-warm-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.syncedFiles}</div>
            <div className="text-xs text-warm-400">{t('codeMerge.statSynced')}</div>
          </div>
          <div className="bg-warm-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.modifiedFiles}</div>
            <div className="text-xs text-warm-400">{t('codeMerge.statModified')}</div>
          </div>
          <div className="bg-warm-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.conflictedFiles}</div>
            <div className="text-xs text-warm-400">{t('codeMerge.statConflicted')}</div>
          </div>
          <div className="bg-warm-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.mergedFiles}</div>
            <div className="text-xs text-warm-400">{t('codeMerge.statMerged')}</div>
          </div>
          <div className="bg-warm-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.lockedFiles}</div>
            <div className="text-xs text-warm-400">{t('codeMerge.statLocked')}</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'modified', 'conflicted', 'locked'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm ${
              filter === f ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {t(`codeMerge.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* File list */}
      {filteredSnapshots.length === 0 ? (
        <div className="text-center py-12 text-warm-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>
          <p>{t('codeMerge.noFiles')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSnapshots.map(snapshot => (
            <div key={snapshot.id} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`font-mono text-sm ${getFileColor(snapshot.filePath)}`}>
                  {snapshot.filePath}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${STATUS_COLORS[snapshot.status] || 'bg-warm-600/20 text-warm-400'}`}>
                  {snapshot.status}
                </span>
                <span className="text-warm-500 text-xs shrink-0">v{snapshot.version}</span>
                {snapshot.isLocked && (
                  <span className="text-purple-400 text-xs shrink-0" title={t('codeMerge.locked')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {(snapshot.status === 'Conflicted' || snapshot.hasUserChanges) && (
                  <button
                    onClick={() => setSelectedSnapshot(snapshot)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-xs"
                  >
                    {snapshot.status === 'Conflicted' ? t('codeMerge.resolve') : t('codeMerge.viewDiff')}
                  </button>
                )}
                <button
                  onClick={() => handleToggleLock(snapshot)}
                  className={`px-3 py-1 rounded text-xs ${
                    snapshot.isLocked
                      ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400'
                      : 'bg-warm-700 hover:bg-warm-600 text-warm-400'
                  }`}
                >
                  {snapshot.isLocked ? t('codeMerge.unlock') : t('codeMerge.lock')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
