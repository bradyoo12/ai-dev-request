import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getSuggestions, voteSuggestion } from '../api/suggestions'
import type { Suggestion } from '../api/suggestions'

interface SuggestionBoardPageProps {
  onBalanceChange?: (balance: number) => void
}

export default function SuggestionBoardPage({ onBalanceChange: _onBalanceChange }: SuggestionBoardPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [voteError, setVoteError] = useState('')

  const pageSize = 10

  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSuggestions(page, pageSize, category, sort)
      setSuggestions(data.items)
      setTotal(data.total)
    } catch {
      setError(t('error.requestFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, category, sort, t])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  const handleVote = async (id: number) => {
    try {
      const result = await voteSuggestion(id)
      setSuggestions(prev =>
        prev.map(s =>
          s.id === id ? { ...s, upvoteCount: result.upvoteCount } : s
        )
      )
    } catch {
      setVoteError(t('error.requestFailed'))
      setTimeout(() => setVoteError(''), 3000)
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

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'feature_request': return t('suggestions.category.featureRequest')
      case 'bug_report': return t('suggestions.category.bugReport')
      case 'improvement': return t('suggestions.category.improvement')
      case 'inquiry': return t('suggestions.category.inquiry')
      default: return cat
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-600', label: t('feedback.status.pending') }
      case 'reviewing': return { color: 'bg-blue-600', label: t('feedback.status.reviewing') }
      case 'in_progress': return { color: 'bg-purple-600', label: t('feedback.status.in_progress') }
      case 'approved': return { color: 'bg-blue-600', label: t('feedback.status.approved') }
      case 'implemented': return { color: 'bg-green-600', label: t('feedback.status.implemented') }
      case 'resolved': return { color: 'bg-green-600', label: t('feedback.status.resolved') }
      case 'on_hold': return { color: 'bg-orange-600', label: t('feedback.status.on_hold') }
      case 'closed': return { color: 'bg-warm-600', label: t('feedback.status.closed') }
      default: return { color: 'bg-warm-600', label: status }
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">{t('suggestions.boardTitle')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('suggestions.boardDescription')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-red-400">{error}</span>
          <button onClick={loadSuggestions} className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-lg text-sm">{t('common.retry')}</button>
        </div>
      )}

      {voteError && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-4 text-sm text-red-400">
          {voteError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="bg-warm-800 border border-warm-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t('suggestions.filter.all')}</option>
          <option value="feature_request">{t('suggestions.category.featureRequest')}</option>
          <option value="bug_report">{t('suggestions.category.bugReport')}</option>
          <option value="improvement">{t('suggestions.category.improvement')}</option>
          <option value="inquiry">{t('suggestions.category.inquiry')}</option>
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1) }}
          className="bg-warm-800 border border-warm-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">{t('suggestions.sort.newest')}</option>
          <option value="popular">{t('suggestions.sort.popular')}</option>
          <option value="oldest">{t('suggestions.sort.oldest')}</option>
        </select>
        <div className="ml-auto text-sm text-warm-400">
          {t('suggestions.totalCount', { count: total })}
        </div>
      </div>

      {/* Suggestion List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-warm-400">{t('suggestions.loading')}</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 bg-warm-800 rounded-xl">
          <div className="text-4xl mb-3">💡</div>
          <p className="text-warm-400">{t('suggestions.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const statusBadge = getStatusBadge(suggestion.status)
            return (
              <div key={suggestion.id} className="bg-warm-800 rounded-xl p-4 flex gap-4">
                {/* Vote button */}
                <div className="flex flex-col items-center gap-1 min-w-[48px]">
                  <button
                    onClick={() => handleVote(suggestion.id)}
                    className="p-1.5 rounded-lg hover:bg-warm-700 transition-colors text-warm-400 hover:text-blue-400"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 3L3 13h14L10 3z" />
                    </svg>
                  </button>
                  <span className="text-lg font-bold text-yellow-400">{suggestion.upvoteCount}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className="font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => navigate(`/suggestions/${suggestion.id}`)}
                    >
                      {getCategoryIcon(suggestion.category)} {suggestion.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <p className="text-warm-400 text-sm mt-1 line-clamp-2">{suggestion.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                    <span>{getCategoryLabel(suggestion.category)}</span>
                    <span>·</span>
                    <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                    {suggestion.tokenReward > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-yellow-400">🎁 {suggestion.tokenReward} tokens</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-warm-800 hover:bg-warm-700 disabled:opacity-50 rounded-lg text-sm"
          >
            ←
          </button>
          <span className="px-3 py-1.5 text-sm text-warm-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-warm-800 hover:bg-warm-700 disabled:opacity-50 rounded-lg text-sm"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
