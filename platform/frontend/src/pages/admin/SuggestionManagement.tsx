import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAdminSuggestions,
  updateSuggestionStatus,
  addSuggestionComment,
} from '../../api/suggestions'
import type { Suggestion } from '../../api/suggestions'

const allStatuses = ['pending', 'reviewing', 'in_progress', 'approved', 'implemented', 'resolved', 'on_hold', 'closed']

export default function SuggestionManagement() {
  const { t } = useTranslation()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [actionDialog, setActionDialog] = useState<{ suggestion: Suggestion; type: 'status' | 'reply' } | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [replyContent, setReplyContent] = useState('')

  const pageSize = 15

  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminSuggestions(page, pageSize, statusFilter, categoryFilter)
      setSuggestions(data.items)
      setTotal(data.total)
      setStatusCounts(data.statusCounts)
    } catch { /* silent */ }
    setLoading(false)
  }, [page, statusFilter, categoryFilter])

  useEffect(() => { loadSuggestions() }, [loadSuggestions])

  const handleStatusChange = async () => {
    if (!actionDialog || !newStatus) return
    try {
      await updateSuggestionStatus(actionDialog.suggestion.id, newStatus, statusNote || undefined)
      setActionDialog(null)
      setNewStatus('')
      setStatusNote('')
      loadSuggestions()
    } catch { /* silent */ }
  }

  const handleReply = async () => {
    if (!actionDialog || !replyContent.trim()) return
    try {
      await addSuggestionComment(actionDialog.suggestion.id, replyContent.trim(), true)
      setActionDialog(null)
      setReplyContent('')
      loadSuggestions()
    } catch { /* silent */ }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600'
      case 'reviewing': return 'bg-blue-600'
      case 'in_progress': return 'bg-purple-600'
      case 'approved': return 'bg-blue-600'
      case 'implemented': return 'bg-green-600'
      case 'resolved': return 'bg-green-600'
      case 'on_hold': return 'bg-orange-600'
      case 'closed': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    const key = `feedback.status.${status}`
    const translated = t(key)
    return translated === key ? status : translated
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="p-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Admin &gt; {t('feedback.admin.title')}</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Status summary tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setStatusFilter('all'); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === 'all' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            {t('feedback.admin.all')} ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
          </button>
          {allStatuses.map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === status ? getStatusColor(status) : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              {getStatusLabel(status)} ({statusCounts[status] || 0})
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-3 mb-6">
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">{t('suggestions.filter.all')}</option>
            <option value="feature_request">{t('suggestions.category.featureRequest')}</option>
            <option value="bug_report">{t('suggestions.category.bugReport')}</option>
            <option value="improvement">{t('suggestions.category.improvement')}</option>
            <option value="inquiry">{t('suggestions.category.inquiry')}</option>
          </select>
          <span className="ml-auto text-sm text-gray-400">{t('suggestions.totalCount', { count: total })}</span>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">{t('suggestions.empty')}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="p-4">#</th>
                  <th className="p-4">{t('feedback.admin.titleCol')}</th>
                  <th className="p-4">{t('feedback.admin.categoryCol')}</th>
                  <th className="p-4">{t('feedback.admin.statusCol')}</th>
                  <th className="p-4">{t('feedback.admin.votesCol')}</th>
                  <th className="p-4">{t('feedback.admin.dateCol')}</th>
                  <th className="p-4">{t('feedback.admin.actionsCol')}</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map(s => (
                  <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="p-4 text-gray-500">{s.id}</td>
                    <td className="p-4">
                      <div className="font-medium text-white max-w-xs truncate">{s.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{s.description}</div>
                    </td>
                    <td className="p-4 text-sm">{t(`suggestions.category.${s.category === 'feature_request' ? 'featureRequest' : s.category === 'bug_report' ? 'bugReport' : s.category}`)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                        {getStatusLabel(s.status)}
                      </span>
                    </td>
                    <td className="p-4 text-yellow-400">{s.upvoteCount}</td>
                    <td className="p-4 text-sm text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setActionDialog({ suggestion: s, type: 'status' }); setNewStatus(s.status) }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
                        >
                          {t('feedback.admin.changeStatus')}
                        </button>
                        <button
                          onClick={() => setActionDialog({ suggestion: s, type: 'reply' })}
                          className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 rounded text-xs transition-colors"
                        >
                          {t('feedback.admin.reply')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm">←</button>
            <span className="px-3 py-1.5 text-sm text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm">→</button>
          </div>
        )}

        {/* Action Dialog */}
        {actionDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-96">
              {actionDialog.type === 'status' ? (
                <>
                  <h3 className="text-lg font-bold mb-4">{t('feedback.admin.changeStatus')}</h3>
                  <p className="text-sm text-gray-400 mb-3">#{actionDialog.suggestion.id} — {actionDialog.suggestion.title}</p>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded mb-3"
                  >
                    {allStatuses.map(s => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    placeholder={t('feedback.admin.notePlaceholder')}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded mb-4 text-sm"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => { setActionDialog(null); setStatusNote('') }}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">{t('tokens.confirm.cancel')}</button>
                    <button onClick={handleStatusChange}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors">{t('feedback.admin.apply')}</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-4">{t('feedback.admin.reply')}</h3>
                  <p className="text-sm text-gray-400 mb-3">#{actionDialog.suggestion.id} — {actionDialog.suggestion.title}</p>
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder={t('feedback.admin.replyPlaceholder')}
                    className="w-full h-32 p-2 bg-gray-900 border border-gray-700 rounded mb-4 text-sm resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => { setActionDialog(null); setReplyContent('') }}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">{t('tokens.confirm.cancel')}</button>
                    <button onClick={handleReply} disabled={!replyContent.trim()}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors">{t('feedback.send')}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
