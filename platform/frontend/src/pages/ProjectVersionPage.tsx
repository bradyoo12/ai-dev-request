import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getVersions,
  getDiff,
  rollbackToVersion,
  type ProjectVersion,
  type VersionDiff,
} from '../api/project-versions'

export default function ProjectVersionPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('')
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDiff, setSelectedDiff] = useState<VersionDiff | null>(null)
  const [diffLoading, setDiffLoading] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [diffFrom, setDiffFrom] = useState('')
  const [diffTo, setDiffTo] = useState('')

  async function loadVersions() {
    if (!projectId.trim()) return
    setLoading(true)
    setError('')
    setSelectedDiff(null)
    try {
      const v = await getVersions(projectId)
      setVersions(v)
      if (v.length >= 2) {
        setDiffFrom(v[1].id)
        setDiffTo(v[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('versionHistory.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDiff() {
    if (!diffFrom || !diffTo) return
    setDiffLoading(true)
    setError('')
    try {
      const d = await getDiff(projectId, diffFrom, diffTo)
      setSelectedDiff(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('versionHistory.error.diffFailed'))
    } finally {
      setDiffLoading(false)
    }
  }

  async function handleRollback(versionId: string) {
    setRolling(true)
    setError('')
    try {
      await rollbackToVersion(projectId, versionId)
      await loadVersions()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('versionHistory.error.rollbackFailed'))
    } finally {
      setRolling(false)
    }
  }

  useEffect(() => {
    if (projectId) loadVersions()
  }, [])

  const sourceColors: Record<string, string> = {
    build: 'bg-blue-600/20 text-blue-400',
    rebuild: 'bg-purple-600/20 text-purple-400',
    rollback: 'bg-yellow-600/20 text-yellow-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-warm-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">{t('versionHistory.title')}</h3>
        <p className="text-warm-400 text-sm mb-4">{t('versionHistory.subtitle')}</p>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder={t('versionHistory.projectId')}
            className="flex-1 bg-warm-800 border border-warm-700 rounded px-3 py-2 text-white text-sm"
          />
          <button
            onClick={loadVersions}
            disabled={loading || !projectId.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {loading ? t('versionHistory.loading') : t('versionHistory.load')}
          </button>
        </div>
      </div>

      {/* Version Timeline */}
      {versions.length > 0 && (
        <div className="bg-warm-900 rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4">{t('versionHistory.timeline')}</h4>
          <div className="space-y-3">
            {versions.map((v, index) => (
              <div
                key={v.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-warm-700/50 bg-warm-800/30"
              >
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-green-600 text-white' : 'bg-warm-700 text-warm-300'
                  }`}>
                    v{v.versionNumber}
                  </div>
                  {index < versions.length - 1 && (
                    <div className="w-0.5 h-6 bg-warm-700 mt-1" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{v.label || `Version ${v.versionNumber}`}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceColors[v.source] || 'bg-warm-600/20 text-warm-400'}`}>
                      {v.source}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">
                        {t('versionHistory.latest')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-warm-400">
                    {v.fileCount} {t('versionHistory.files')} &middot; {new Date(v.createdAt).toLocaleString()}
                  </p>
                  {v.changedFiles.length > 0 && (
                    <p className="text-xs text-warm-500 mt-1">
                      {v.changedFiles.length} {t('versionHistory.changedFiles')}
                    </p>
                  )}
                </div>
                {index > 0 && (
                  <button
                    onClick={() => handleRollback(v.id)}
                    disabled={rolling}
                    className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-700/50 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {rolling ? t('versionHistory.rollingBack') : t('versionHistory.rollback')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diff Viewer */}
      {versions.length >= 2 && (
        <div className="bg-warm-900 rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4">{t('versionHistory.diffTitle')}</h4>
          <div className="flex gap-3 mb-4">
            <select
              value={diffFrom}
              onChange={(e) => setDiffFrom(e.target.value)}
              className="flex-1 bg-warm-800 border border-warm-700 rounded px-3 py-2 text-white text-sm"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>v{v.versionNumber} - {v.label || `Version ${v.versionNumber}`}</option>
              ))}
            </select>
            <span className="text-warm-400 self-center">&rarr;</span>
            <select
              value={diffTo}
              onChange={(e) => setDiffTo(e.target.value)}
              className="flex-1 bg-warm-800 border border-warm-700 rounded px-3 py-2 text-white text-sm"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>v{v.versionNumber} - {v.label || `Version ${v.versionNumber}`}</option>
              ))}
            </select>
            <button
              onClick={handleDiff}
              disabled={diffLoading || !diffFrom || !diffTo || diffFrom === diffTo}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {diffLoading ? t('versionHistory.comparing') : t('versionHistory.compare')}
            </button>
          </div>

          {selectedDiff && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{selectedDiff.addedFiles.length}</p>
                  <p className="text-sm text-warm-400">{t('versionHistory.added')}</p>
                </div>
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{selectedDiff.removedFiles.length}</p>
                  <p className="text-sm text-warm-400">{t('versionHistory.removed')}</p>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{selectedDiff.modifiedFiles.length}</p>
                  <p className="text-sm text-warm-400">{t('versionHistory.modified')}</p>
                </div>
              </div>

              {selectedDiff.addedFiles.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-400 mb-2">+ {t('versionHistory.addedFiles')}</h5>
                  <div className="bg-warm-800/50 rounded p-2 space-y-1">
                    {selectedDiff.addedFiles.map((f) => (
                      <p key={f} className="text-xs text-green-300 font-mono">+ {f}</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedDiff.removedFiles.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-400 mb-2">- {t('versionHistory.removedFiles')}</h5>
                  <div className="bg-warm-800/50 rounded p-2 space-y-1">
                    {selectedDiff.removedFiles.map((f) => (
                      <p key={f} className="text-xs text-red-300 font-mono">- {f}</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedDiff.modifiedFiles.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-yellow-400 mb-2">~ {t('versionHistory.modifiedFiles')}</h5>
                  <div className="bg-warm-800/50 rounded p-2 space-y-1">
                    {selectedDiff.modifiedFiles.map((f) => (
                      <p key={f} className="text-xs text-yellow-300 font-mono">~ {f}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && versions.length === 0 && projectId && (
        <div className="bg-warm-900 rounded-lg p-8 text-center">
          <p className="text-warm-400">{t('versionHistory.empty')}</p>
        </div>
      )}
    </div>
  )
}
