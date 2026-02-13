import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAgentInboxItems,
  updateAgentInboxStatus,
  implementAgentInboxItem,
  deleteAgentInboxItem,
  type AgentInboxItem,
} from '../api/agent-inbox'

const STATUSES = ['all', 'pending', 'in_progress', 'completed', 'dismissed'] as const
const TYPES = ['all', 'suggestion', 'bug'] as const
const PAGE_SIZE = 20

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'bug':
      return 'bg-red-500/20 text-red-300 border border-red-500/30'
    case 'suggestion':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'feature':
      return 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    default:
      return 'bg-warm-700/30 text-warm-300 border border-warm-600/30'
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
    case 'in_progress':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'completed':
      return 'bg-green-500/20 text-green-300 border border-green-500/30'
    case 'dismissed':
      return 'bg-warm-700/30 text-warm-400 border border-warm-600/30'
    default:
      return 'bg-warm-700/30 text-warm-300 border border-warm-600/30'
  }
}

export default function AgentInboxPage() {
  const { t } = useTranslation()

  const [projectId, setProjectId] = useState('')
  const [items, setItems] = useState<AgentInboxItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [snippetCopied, setSnippetCopied] = useState(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAgentInboxItems(page, PAGE_SIZE, statusFilter, typeFilter)
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to load inbox items:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, typeFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleImplement = async (id: string) => {
    try {
      await implementAgentInboxItem(id)
      await loadItems()
    } catch (err) {
      console.error('Failed to implement:', err)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await updateAgentInboxStatus(id, 'dismissed')
      await loadItems()
    } catch (err) {
      console.error('Failed to dismiss:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAgentInboxItem(id)
      await loadItems()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const embedSnippet = `<script src="${window.location.origin}/widget/feedback-widget.js"
  data-user-id="${projectId || 'YOUR_USER_ID'}"
  data-api-url="${import.meta.env.VITE_API_URL || 'http://localhost:5000'}">
</script>`

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet)
      setSnippetCopied(true)
      setTimeout(() => setSnippetCopied(false), 2000)
    } catch {
      console.error('Failed to copy snippet')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-1">{t('agentInbox.title')}</h3>
        <p className="text-warm-400 text-sm">{t('agentInbox.description')}</p>
      </div>

      {/* Project ID Input */}
      <div className="bg-warm-800 rounded-lg p-4">
        <label className="block text-sm font-medium text-warm-300 mb-2">
          {t('agentInbox.projectId')}
        </label>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder={t('agentInbox.projectIdPlaceholder')}
          className="w-full bg-warm-900 border border-warm-700 rounded-md px-3 py-2 text-sm text-white placeholder-warm-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1 overflow-x-auto whitespace-nowrap" role="tablist">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {t(`agentInbox.status.${s}`)}
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex gap-2">
        {TYPES.map((tp) => (
          <button
            key={tp}
            onClick={() => { setTypeFilter(tp); setPage(1) }}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              typeFilter === tp ? 'bg-warm-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`agentInbox.type.${tp}`)}
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="text-center text-warm-400 py-8">{t('agentInbox.loading')}</div>
      ) : items.length === 0 ? (
        <div className="text-center text-warm-400 py-8">{t('agentInbox.empty')}</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-white truncate">
                      {item.title || t('agentInbox.untitled')}
                    </h4>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeBadgeClass(item.type)}`}>
                      {item.type}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(item.status)}`}>
                      {t(`agentInbox.status.${item.status}`)}
                    </span>
                  </div>
                  <p className="text-warm-300 text-sm line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                    {item.submitterName && <span>{item.submitterName}</span>}
                    {item.submitterEmail && <span>{item.submitterEmail}</span>}
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="capitalize">{item.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleImplement(item.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        {t('agentInbox.implement')}
                      </button>
                      <button
                        onClick={() => handleDismiss(item.id)}
                        className="px-3 py-1.5 bg-warm-700 hover:bg-warm-600 text-warm-300 text-xs font-medium rounded-md transition-colors"
                      >
                        {t('agentInbox.dismiss')}
                      </button>
                    </>
                  )}
                  {item.triggeredDevRequestId && (
                    <span className="text-xs text-green-400">
                      {t('agentInbox.implemented')}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2 py-1.5 text-red-400 hover:text-red-300 text-xs transition-colors"
                    title={t('agentInbox.delete')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm bg-warm-800 text-warm-300 rounded-md disabled:opacity-50"
          >
            {t('agentInbox.prev')}
          </button>
          <span className="px-3 py-1 text-sm text-warm-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm bg-warm-800 text-warm-300 rounded-md disabled:opacity-50"
          >
            {t('agentInbox.next')}
          </button>
        </div>
      )}

      {/* Embed Snippet */}
      <div className="bg-warm-800 rounded-lg p-4 border border-warm-700/50">
        <h4 className="text-sm font-semibold text-white mb-2">{t('agentInbox.embedTitle')}</h4>
        <p className="text-warm-400 text-xs mb-3">{t('agentInbox.embedDescription')}</p>
        <div className="relative">
          <pre className="bg-warm-900 rounded-md p-3 text-xs text-warm-300 overflow-x-auto">
            {embedSnippet}
          </pre>
          <button
            onClick={handleCopySnippet}
            className="absolute top-2 right-2 px-2 py-1 bg-warm-700 hover:bg-warm-600 text-warm-300 text-xs rounded transition-colors"
          >
            {snippetCopied ? t('agentInbox.copied') : t('agentInbox.copy')}
          </button>
        </div>
      </div>
    </div>
  )
}
