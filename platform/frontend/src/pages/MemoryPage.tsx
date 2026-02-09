import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getMemories, addMemory, deleteMemory, deleteAllMemories, type MemoryRecord } from '../api/memories'

export default function MemoryPage() {
  const { t } = useTranslation()
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [adding, setAdding] = useState(false)

  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)

  const categories = ['general', 'preference', 'tech_stack', 'workflow', 'project']

  async function loadMemories() {
    try {
      setLoading(true)
      const result = await getMemories(page, pageSize)
      setMemories(result.memories)
      setTotalCount(result.totalCount)
    } catch {
      setError(t('memory.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMemories() }, [page])

  async function handleAdd() {
    if (!newContent.trim()) return
    try {
      setAdding(true)
      await addMemory({ content: newContent.trim(), category: newCategory })
      setNewContent('')
      setNewCategory('general')
      setShowAddDialog(false)
      setPage(1)
      await loadMemories()
    } catch {
      setError(t('memory.addError'))
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMemory(id)
      await loadMemories()
    } catch {
      setError(t('memory.deleteError'))
    }
  }

  async function handleDeleteAll() {
    try {
      await deleteAllMemories()
      setDeleteAllConfirm(false)
      setPage(1)
      await loadMemories()
    } catch {
      setError(t('memory.deleteAllError'))
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading && memories.length === 0) {
    return <div className="text-center py-8 text-gray-400">{t('memory.loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('memory.title')}</h3>
          <p className="text-sm text-gray-400 mt-1">{t('memory.description')}</p>
        </div>
        <div className="flex gap-2">
          {memories.length > 0 && (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              {t('memory.deleteAll')}
            </button>
          )}
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('memory.add')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {memories.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400">{t('memory.empty')}</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-400">{t('memory.totalCount', { count: totalCount })}</div>
          <div className="space-y-3">
            {memories.map((m) => (
              <div key={m.id} className="bg-gray-800 rounded-lg p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{m.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300">
                      {m.category}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                      {m.scope}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors text-sm shrink-0"
                >
                  {t('memory.delete')}
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('payments.prev')}
              </button>
              <span className="text-sm text-gray-400">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('payments.next')}
              </button>
            </div>
          )}
        </>
      )}

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t('memory.addTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('memory.contentLabel')}</label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm resize-none"
                  rows={3}
                  placeholder={t('memory.contentPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('memory.categoryLabel')}</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{t(`memory.category.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('tokens.confirm.cancel')}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding || !newContent.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {adding ? t('memory.adding') : t('memory.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setDeleteAllConfirm(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">{t('memory.deleteAllTitle')}</h3>
            <p className="text-sm text-gray-400 mb-4">{t('memory.deleteAllConfirm')}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteAllConfirm(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {t('tokens.confirm.cancel')}
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('memory.deleteAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
