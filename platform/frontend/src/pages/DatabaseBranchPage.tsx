import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createDatabaseBranch,
  listDatabaseBranches,
  mergeDatabaseBranch,
  discardDatabaseBranch,
  getDatabaseBranchDiff,
  type DatabaseBranch,
  type SchemaDiff,
} from '../api/database-branch'

export default function DatabaseBranchPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('00000000-0000-0000-0000-000000000001')
  const [branches, setBranches] = useState<DatabaseBranch[]>([])
  const [newBranchName, setNewBranchName] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [selectedDiff, setSelectedDiff] = useState<SchemaDiff | null>(null)
  const [diffLoading, setDiffLoading] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        await loadBranches()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('dbBranch.error.loadFailed', 'Failed to load database branches')
        setError(errorMessage)
        console.error('DatabaseBranchPage error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [projectId])

  function parseJson<T>(json: string | null | undefined): T[] {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  async function loadBranches() {
    setError('')
    const data = await listDatabaseBranches(projectId)
    setBranches(data)
  }

  async function handleCreate() {
    if (!newBranchName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createDatabaseBranch(projectId, newBranchName.trim())
      setNewBranchName('')
      await loadBranches()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dbBranch.error.createFailed', 'Failed to create branch'))
    } finally {
      setCreating(false)
    }
  }

  async function handleMerge(branchId: string) {
    setError('')
    try {
      await mergeDatabaseBranch(projectId, branchId)
      await loadBranches()
      if (selectedDiff?.branchId === branchId) setSelectedDiff(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dbBranch.error.mergeFailed', 'Failed to merge branch'))
    }
  }

  async function handleDiscard(branchId: string) {
    setError('')
    try {
      await discardDatabaseBranch(projectId, branchId)
      await loadBranches()
      if (selectedDiff?.branchId === branchId) setSelectedDiff(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dbBranch.error.discardFailed', 'Failed to discard branch'))
    }
  }

  async function handleViewDiff(branchId: string) {
    if (selectedDiff?.branchId === branchId) {
      setSelectedDiff(null)
      return
    }
    setDiffLoading(branchId)
    try {
      const diff = await getDatabaseBranchDiff(projectId, branchId)
      setSelectedDiff(diff)
    } catch {
      setError(t('dbBranch.error.diffFailed', 'Failed to load schema diff'))
    } finally {
      setDiffLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/50 text-green-300'
      case 'merged': return 'bg-blue-900/50 text-blue-300'
      case 'discarded': return 'bg-warm-700 text-warm-400'
      default: return 'bg-warm-700 text-warm-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('dbBranch.title', 'Database Branching')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('dbBranch.subtitle', 'Git-like branching for your database schema per project version')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-warm-400">{t('dbBranch.projectId', 'Project ID')}:</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-72 bg-warm-700 border border-warm-600 rounded px-2 py-1 text-sm font-mono"
          />
        </div>
      </div>

      {/* Create Branch */}
      <div className="bg-warm-800 rounded-xl p-6">
        <h4 className="font-semibold mb-3">{t('dbBranch.createTitle', 'Create New Branch')}</h4>
        <div className="flex gap-3">
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder={t('dbBranch.branchNamePlaceholder', 'e.g. feature/add-payments')}
            className="flex-1 bg-warm-700 border border-warm-600 rounded-lg px-4 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newBranchName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
          >
            {creating ? t('dbBranch.creating', 'Creating...') : t('dbBranch.createBranch', 'Create Branch')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => {
              setError('')
              setLoading(true)
              loadBranches().finally(() => setLoading(false))
            }}
            className="ml-3 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
          >
            {t('dbBranch.retry', 'Retry')}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Branch List */}
      {!loading && branches.length > 0 && (
        <div className="bg-warm-800 rounded-xl p-6">
          <h4 className="font-semibold mb-4">{t('dbBranch.branchList', 'Branches')}</h4>
          <div className="space-y-3">
            {branches.map((branch) => (
              <div key={branch.id} className="bg-warm-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-400">
                      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>
                    </svg>
                    <span className="font-medium font-mono text-sm">{branch.branchName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(branch.status)}`}>
                      {branch.status}
                    </span>
                    <span className="text-xs text-warm-500">{t('dbBranch.from', 'from')} {branch.sourceBranch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDiff(branch.id)}
                      className="px-3 py-1 bg-warm-600 hover:bg-warm-500 rounded text-xs transition-colors"
                    >
                      {diffLoading === branch.id
                        ? t('dbBranch.loadingDiff', 'Loading...')
                        : selectedDiff?.branchId === branch.id
                          ? t('dbBranch.hideDiff', 'Hide Diff')
                          : t('dbBranch.viewDiff', 'View Diff')}
                    </button>
                    {branch.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleMerge(branch.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                        >
                          {t('dbBranch.merge', 'Merge')}
                        </button>
                        <button
                          onClick={() => handleDiscard(branch.id)}
                          className="px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded text-xs transition-colors"
                        >
                          {t('dbBranch.discard', 'Discard')}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Branch details */}
                <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-warm-500">{t('dbBranch.schemaVersion', 'Schema Version')}:</span>
                    <span className="ml-1 text-warm-300 font-mono">{branch.schemaVersion}</span>
                  </div>
                  <div>
                    <span className="text-warm-500">{t('dbBranch.tables', 'Tables')}:</span>
                    <span className="ml-1 text-warm-300">{parseJson<string>(branch.tablesJson).length}</span>
                  </div>
                  <div>
                    <span className="text-warm-500">{t('dbBranch.migrations', 'Migrations')}:</span>
                    <span className="ml-1 text-warm-300">{parseJson<string>(branch.migrationsJson).length} {t('dbBranch.pending', 'pending')}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-warm-500">
                  {t('dbBranch.created', 'Created')}: {new Date(branch.createdAt).toLocaleString()}
                  {branch.mergedAt && <span className="ml-3">{t('dbBranch.mergedAt', 'Merged')}: {new Date(branch.mergedAt).toLocaleString()}</span>}
                  {branch.discardedAt && <span className="ml-3">{t('dbBranch.discardedAt', 'Discarded')}: {new Date(branch.discardedAt).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schema Diff Viewer */}
      {selectedDiff && (
        <div className="bg-warm-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">
              {t('dbBranch.diffTitle', 'Schema Diff')}: <span className="font-mono text-blue-400">{selectedDiff.branchName}</span> {t('dbBranch.vs', 'vs')} <span className="font-mono text-green-400">{selectedDiff.sourceBranch}</span>
            </h4>
            <button onClick={() => setSelectedDiff(null)} className="text-warm-400 hover:text-white text-sm">
              {t('dbBranch.closeDiff', 'Close')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
              <div className="text-xs text-green-400 font-medium mb-2">{t('dbBranch.diff.added', 'Added Tables')}</div>
              {selectedDiff.addedTables.length === 0 ? (
                <span className="text-xs text-warm-500">{t('dbBranch.diff.none', 'None')}</span>
              ) : (
                selectedDiff.addedTables.map(table => (
                  <div key={table} className="text-sm font-mono text-green-300">+ {table}</div>
                ))
              )}
            </div>
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
              <div className="text-xs text-red-400 font-medium mb-2">{t('dbBranch.diff.removed', 'Removed Tables')}</div>
              {selectedDiff.removedTables.length === 0 ? (
                <span className="text-xs text-warm-500">{t('dbBranch.diff.none', 'None')}</span>
              ) : (
                selectedDiff.removedTables.map(table => (
                  <div key={table} className="text-sm font-mono text-red-300">- {table}</div>
                ))
              )}
            </div>
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-3">
              <div className="text-xs text-yellow-400 font-medium mb-2">{t('dbBranch.diff.modified', 'Modified Tables')}</div>
              {selectedDiff.modifiedTables.length === 0 ? (
                <span className="text-xs text-warm-500">{t('dbBranch.diff.none', 'None')}</span>
              ) : (
                selectedDiff.modifiedTables.map(mod => (
                  <div key={mod.tableName} className="mb-1">
                    <div className="text-sm font-mono text-yellow-300">~ {mod.tableName}</div>
                    <div className="text-xs text-warm-400 ml-3">{mod.changeDescription}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unchanged tables */}
          <div className="bg-warm-700/30 rounded-lg p-3">
            <div className="text-xs text-warm-500 font-medium mb-2">{t('dbBranch.diff.unchanged', 'Unchanged Tables')}</div>
            <div className="flex flex-wrap gap-2">
              {selectedDiff.unchangedTables.map(table => (
                <span key={table} className="px-2 py-1 bg-warm-700 rounded text-xs font-mono text-warm-400">{table}</span>
              ))}
            </div>
          </div>

          {/* Pending Migrations */}
          {selectedDiff.pendingMigrations.length > 0 && (
            <div className="mt-4 bg-warm-700/30 rounded-lg p-3">
              <div className="text-xs text-warm-500 font-medium mb-2">{t('dbBranch.diff.pendingMigrations', 'Pending Migrations')}</div>
              {selectedDiff.pendingMigrations.map((m, i) => (
                <div key={i} className="text-xs font-mono text-warm-300">{m}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && branches.length === 0 && (
        <div className="bg-warm-800 rounded-xl p-12 text-center">
          <div className="text-warm-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>
            </svg>
          </div>
          <p className="text-warm-400">{t('dbBranch.empty', 'No database branches yet. Create a branch to get started with schema isolation.')}</p>
        </div>
      )}
    </div>
  )
}
