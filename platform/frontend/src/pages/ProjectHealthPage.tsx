import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getTrendReports,
  getUserReviews,
  getRecommendations,
  updateRecommendationStatus,
  type TrendReport,
  type TrendItem,
  type ProjectReview,
  type UpdateRecommendationItem,
} from '../api/trends'
import { useAuth } from '../contexts/AuthContext'

const TREND_CATEGORIES = ['ai_model', 'ui_framework', 'backend', 'security', 'infrastructure'] as const

export default function ProjectHealthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'trends' | 'reviews'>('reviews')
  const [trends, setTrends] = useState<TrendReport[]>([])
  const [reviews, setReviews] = useState<ProjectReview[]>([])
  const [selectedReview, setSelectedReview] = useState<ProjectReview | null>(null)
  const [recommendations, setRecommendations] = useState<UpdateRecommendationItem[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    try {
      setLoading(true)
      const [trendsResult, reviewsResult] = await Promise.all([
        getTrendReports(),
        getUserReviews(),
      ])
      setTrends(trendsResult)
      setReviews(reviewsResult)
    } catch {
      setError(t('health.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleSelectReview(review: ProjectReview) {
    setSelectedReview(review)
    try {
      const recs = await getRecommendations(review.id)
      setRecommendations(recs)
    } catch {
      setError(t('health.recsLoadError'))
    }
  }

  async function handleUpdateStatus(recId: number, status: string) {
    try {
      const updated = await updateRecommendationStatus(recId, status)
      setRecommendations(prev => prev.map(r => r.id === recId ? updated : r))
    } catch {
      setError(t('health.statusUpdateError'))
    }
  }

  function parseTrends(summaryJson: string): TrendItem[] {
    try { return JSON.parse(summaryJson) } catch { return [] }
  }

  function severityColor(severity: string) {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/40'
      case 'high': return 'text-orange-400 bg-orange-900/40'
      case 'medium': return 'text-yellow-400 bg-yellow-900/40'
      case 'low': return 'text-green-400 bg-green-900/40'
      default: return 'text-warm-400 bg-warm-700'
    }
  }

  function healthScoreColor(score: number) {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('health.title')}</h2>
        <p className="text-warm-400">{t('health.loginRequired')}</p>
      </div>
    )
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto text-center py-8 text-warm-400">{t('health.loading')}</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-warm-400 hover:text-white transition-colors">
          &larr;
        </button>
        <div>
          <h2 className="text-2xl font-bold">{t('health.title')}</h2>
          <p className="text-sm text-warm-400 mt-1">{t('health.description')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'reviews' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('health.tab.reviews')}
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'trends' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('health.tab.trends')}
        </button>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-warm-800/50 rounded-lg">
              <p className="text-warm-400">{t('health.noReviews')}</p>
              <p className="text-sm text-warm-500 mt-1">{t('health.noReviewsHint')}</p>
            </div>
          ) : !selectedReview ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <button
                  key={review.id}
                  onClick={() => handleSelectReview(review)}
                  className="w-full bg-warm-800 rounded-lg p-4 flex items-center justify-between hover:bg-warm-750 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{review.projectName}</p>
                    <p className="text-xs text-warm-500 mt-1">
                      {t('health.reviewed')}: {new Date(review.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${healthScoreColor(review.healthScore)}`}>
                        {review.healthScore}
                      </div>
                      <div className="text-xs text-warm-500">{t('health.score')}</div>
                    </div>
                    <div className="flex gap-1 text-xs">
                      {review.criticalCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-400">{review.criticalCount}</span>
                      )}
                      {review.highCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-400">{review.highCount}</span>
                      )}
                      {review.mediumCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400">{review.mediumCount}</span>
                      )}
                      {review.lowCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-green-900/40 text-green-400">{review.lowCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => { setSelectedReview(null); setRecommendations([]) }}
                className="text-sm text-warm-400 hover:text-white transition-colors"
              >
                &larr; {t('health.backToList')}
              </button>

              <div className="bg-warm-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{selectedReview.projectName}</h3>
                  <div className={`text-3xl font-bold ${healthScoreColor(selectedReview.healthScore)}`}>
                    {selectedReview.healthScore}<span className="text-sm text-warm-500">/100</span>
                  </div>
                </div>
                <p className="text-xs text-warm-500">
                  {t('health.reviewed')}: {new Date(selectedReview.reviewedAt).toLocaleDateString()}
                </p>
              </div>

              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-warm-400">{t('health.noRecs')}</div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="bg-warm-800 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityColor(rec.severity)}`}>
                              {t(`health.severity.${rec.severity}`)}
                            </span>
                            <span className="text-xs text-warm-500">{t(`health.cat.${rec.category}`)}</span>
                          </div>
                          <h4 className="text-sm font-medium text-white">{rec.title}</h4>
                          <p className="text-xs text-warm-400 mt-1">{rec.description}</p>
                          {(rec.currentVersion || rec.recommendedVersion) && (
                            <p className="text-xs text-warm-500 mt-1">
                              {rec.currentVersion && <>{rec.currentVersion}</>}
                              {rec.currentVersion && rec.recommendedVersion && ' → '}
                              {rec.recommendedVersion && <span className="text-green-400">{rec.recommendedVersion}</span>}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {rec.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(rec.id, 'accepted')}
                                className="px-2 py-1 text-xs bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 transition-colors"
                              >
                                {t('health.accept')}
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(rec.id, 'rejected')}
                                className="px-2 py-1 text-xs bg-warm-700 text-warm-400 rounded hover:bg-warm-600 transition-colors"
                              >
                                {t('health.reject')}
                              </button>
                            </>
                          )}
                          {rec.status !== 'pending' && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              rec.status === 'accepted' ? 'bg-green-900/30 text-green-400' :
                              rec.status === 'applied' ? 'bg-blue-900/30 text-blue-400' :
                              'bg-warm-700 text-warm-400'
                            }`}>
                              {t(`health.status.${rec.status}`)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterCategory === '' ? 'bg-purple-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'
              }`}
            >
              {t('health.filterAll')}
            </button>
            {TREND_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filterCategory === cat ? 'bg-purple-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'
                }`}
              >
                {t(`health.trendCat.${cat}`)}
              </button>
            ))}
          </div>

          {trends.filter(tr => !filterCategory || tr.category === filterCategory).length === 0 ? (
            <div className="text-center py-12 bg-warm-800/50 rounded-lg">
              <p className="text-warm-400">{t('health.noTrends')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trends
                .filter(tr => !filterCategory || tr.category === filterCategory)
                .map((report) => (
                  <div key={report.id} className="bg-warm-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/40 text-purple-300">
                        {t(`health.trendCat.${report.category}`)}
                      </span>
                      <span className="text-xs text-warm-500">
                        {new Date(report.analyzedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {parseTrends(report.summaryJson).map((item, idx) => (
                        <div key={idx} className="border-l-2 border-warm-700 pl-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-white">{item.Title}</h4>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              item.Impact === 'critical' ? 'bg-red-900/40 text-red-400' :
                              item.Impact === 'high' ? 'bg-orange-900/40 text-orange-400' :
                              item.Impact === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                              'bg-green-900/40 text-green-400'
                            }`}>
                              {item.Impact}
                            </span>
                          </div>
                          <p className="text-xs text-warm-400 mt-0.5">{item.Description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
