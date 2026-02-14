import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getSuggestion,
  getSuggestionComments,
  getSuggestionHistory,
  addSuggestionComment,
  voteSuggestion,
} from '../api/suggestions'
import type { Suggestion, SuggestionComment, StatusHistoryEntry } from '../api/suggestions'

const statusFlow = ['pending', 'reviewing', 'in_progress', 'resolved']

export default function SuggestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [suggestion, setSuggestion] = useState<(Suggestion & { userVoted?: boolean }) | null>(null)
  const [comments, setComments] = useState<SuggestionComment[]>([])
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [voteError, setVoteError] = useState('')
  const [commentError, setCommentError] = useState('')

  useEffect(() => {
    if (!id) return
    const numId = Number(id)
    setLoading(true)
    Promise.all([
      getSuggestion(numId),
      getSuggestionComments(numId),
      getSuggestionHistory(numId),
    ])
      .then(([s, c, h]) => {
        setSuggestion(s)
        setComments(c)
        setHistory(h)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleVote = async () => {
    if (!suggestion) return
    try {
      const result = await voteSuggestion(suggestion.id)
      setSuggestion(prev => prev ? { ...prev, upvoteCount: result.upvoteCount, userVoted: result.voted } : null)
    } catch {
      setVoteError(t('error.requestFailed'))
      setTimeout(() => setVoteError(''), 3000)
    }
  }

  const handleSendComment = async () => {
    if (!suggestion || !newComment.trim()) return
    setSending(true)
    try {
      const comment = await addSuggestionComment(suggestion.id, newComment.trim())
      setComments(prev => [...prev, comment])
      setSuggestion(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null)
      setNewComment('')
    } catch {
      setCommentError(t('error.requestFailed'))
      setTimeout(() => setCommentError(''), 3000)
    }
    setSending(false)
  }

  const getStatusLabel = (status: string) => {
    const key = `feedback.status.${status}`
    const translated = t(key)
    return translated === key ? status : translated
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
      case 'closed': return 'bg-warm-600'
      default: return 'bg-warm-600'
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'feature_request': return '💡'
      case 'bug_report': return '🐛'
      case 'improvement': return '⚡'
      case 'inquiry': return '❓'
      default: return '💡'
    }
  }

  if (loading) {
    return (
      <section>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-warm-400">{t('suggestions.loading')}</p>
        </div>
      </section>
    )
  }

  if (!suggestion) {
    return (
      <section>
        <p className="text-warm-400 text-center py-12">{t('api.error.notFound')}</p>
      </section>
    )
  }

  const currentStatusIdx = statusFlow.indexOf(suggestion.status)

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/suggestions')} className="text-warm-400 hover:text-white transition-colors">
          &larr;
        </button>
        <h2 className="text-2xl font-bold">
          {getCategoryIcon(suggestion.category)} {suggestion.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                {getStatusLabel(suggestion.status)}
              </span>
              <span className="text-sm text-warm-500">
                #{suggestion.id} &middot; {new Date(suggestion.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-warm-300 whitespace-pre-wrap">{suggestion.description}</p>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-warm-700">
              <button
                onClick={handleVote}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  suggestion.userVoted ? 'bg-blue-600 text-white' : 'bg-warm-700 hover:bg-warm-600 text-warm-300'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3L3 13h14L10 3z" /></svg>
                <span className="font-bold">{suggestion.upvoteCount}</span>
              </button>
              {suggestion.tokenReward > 0 && (
                <span className="text-yellow-400 text-sm">🎁 {suggestion.tokenReward} tokens</span>
              )}
            </div>
            {voteError && <p className="text-red-400 text-sm mt-2">{voteError}</p>}
          </div>

          {/* Comments */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h3 className="font-bold mb-4">{t('feedback.comments')} ({comments.length})</h3>
            {comments.length === 0 ? (
              <p className="text-warm-500 text-sm">{t('feedback.noComments')}</p>
            ) : (
              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.id} className={`rounded-lg p-4 ${c.isAdminReply ? 'bg-blue-900/30 border border-blue-800' : 'bg-warm-900'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-medium ${c.isAdminReply ? 'text-blue-400' : 'text-warm-400'}`}>
                        {c.isAdminReply ? t('feedback.admin') : t('feedback.user')}
                      </span>
                      <span className="text-xs text-warm-600">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-warm-300 text-sm whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                placeholder={t('feedback.commentPlaceholder')}
                className="flex-1 p-2.5 bg-warm-900 border border-warm-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleSendComment}
                disabled={!newComment.trim() || sending}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
              >
                {t('feedback.send')}
              </button>
            </div>
            {commentError && <p className="text-red-400 text-sm mt-2">{commentError}</p>}
          </div>
        </div>

        {/* Sidebar - Status Timeline */}
        <div className="space-y-6">
          <div className="bg-warm-800 rounded-xl p-6">
            <h3 className="font-bold mb-4">{t('feedback.timeline')}</h3>
            <div className="space-y-4">
              {statusFlow.map((status, i) => {
                const isCompleted = currentStatusIdx >= i
                const isCurrent = suggestion.status === status
                const historyEntry = history.find(h => h.toStatus === status)
                return (
                  <div key={status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isCompleted ? 'bg-green-600 text-white' : 'bg-warm-700 text-warm-500'
                      } ${isCurrent ? 'ring-2 ring-green-400' : ''}`}>
                        {isCompleted ? '✓' : i + 1}
                      </div>
                      {i < statusFlow.length - 1 && (
                        <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-600' : 'bg-warm-700'}`} />
                      )}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${isCompleted ? 'text-white' : 'text-warm-500'}`}>
                        {getStatusLabel(status)}
                      </div>
                      {historyEntry && (
                        <div className="text-xs text-warm-500 mt-0.5">
                          {new Date(historyEntry.createdAt).toLocaleString()}
                          {historyEntry.note && <span className="block text-warm-600 mt-0.5">{historyEntry.note}</span>}
                        </div>
                      )}
                      {status === 'pending' && !historyEntry && (
                        <div className="text-xs text-warm-500 mt-0.5">
                          {new Date(suggestion.createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Info card */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h3 className="font-bold mb-3">{t('feedback.info')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-400">{t('feedback.category')}</span>
                <span>{getCategoryIcon(suggestion.category)} {t(`suggestions.category.${suggestion.category === 'feature_request' ? 'featureRequest' : suggestion.category === 'bug_report' ? 'bugReport' : suggestion.category}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-400">{t('feedback.submitted')}</span>
                <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-400">{t('feedback.lastUpdated')}</span>
                <span>{new Date(suggestion.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
