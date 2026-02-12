import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getRecommendations,
  refreshRecommendations,
  dismissRecommendation,
  getInterests,
  addInterest,
  deleteInterest,
  type AppRecommendation,
  type UserInterest,
} from '../api/recommendations'
import { useAuth } from '../contexts/AuthContext'

const INTEREST_CATEGORIES = [
  'food', 'fitness', 'travel', 'music', 'education',
  'finance', 'pets', 'tech', 'recipes', 'events',
] as const

export default function RecommendationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [recommendations, setRecommendations] = useState<AppRecommendation[]>([])
  const [interests, setInterests] = useState<UserInterest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [showInterestDialog, setShowInterestDialog] = useState(false)
  const [newInterestCategory, setNewInterestCategory] = useState('food')
  const [addingInterest, setAddingInterest] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [recsResult, interestsResult] = await Promise.all([
        getRecommendations(),
        getInterests(),
      ])
      setRecommendations(recsResult)
      setInterests(interestsResult)
    } catch {
      setError(t('recommend.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleRefresh() {
    try {
      setRefreshing(true)
      const result = await refreshRecommendations()
      setRecommendations(result)
    } catch {
      setError(t('recommend.refreshError'))
    } finally {
      setRefreshing(false)
    }
  }

  async function handleDismiss(id: number) {
    try {
      await dismissRecommendation(id)
      setRecommendations(prev => prev.filter(r => r.id !== id))
    } catch {
      setError(t('recommend.dismissError'))
    }
  }

  async function handleAddInterest() {
    try {
      setAddingInterest(true)
      await addInterest({ category: newInterestCategory })
      setShowInterestDialog(false)
      await loadData()
    } catch {
      setError(t('recommend.interestAddError'))
    } finally {
      setAddingInterest(false)
    }
  }

  async function handleDeleteInterest(id: number) {
    try {
      await deleteInterest(id)
      setInterests(prev => prev.filter(i => i.id !== id))
    } catch {
      setError(t('recommend.interestDeleteError'))
    }
  }

  function handleUseTemplate(promptTemplate: string) {
    navigate('/', { state: { prefill: promptTemplate } })
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">{t('recommend.title')}</h2>
          <p className="text-warm-400">{t('recommend.loginRequired')}</p>
        </div>
      </div>
    )
  }

  if (loading && recommendations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8 text-warm-400">{t('recommend.loading')}</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('recommend.title')}</h2>
          <p className="text-sm text-warm-400 mt-1">{t('recommend.description')}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {refreshing ? t('recommend.refreshing') : t('recommend.refresh')}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Interests Section */}
      <div className="bg-warm-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-warm-300">{t('recommend.yourInterests')}</h3>
          <button
            onClick={() => setShowInterestDialog(true)}
            className="text-xs text-purple-400 hover:text-purple-200 transition-colors"
          >
            {t('recommend.addInterest')}
          </button>
        </div>
        {interests.length === 0 ? (
          <p className="text-xs text-warm-500">{t('recommend.noInterests')}</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {interests.map((interest) => (
              <span
                key={interest.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-purple-900/40 text-purple-300"
              >
                {t(`recommend.interest.${interest.category}`)}
                <button
                  onClick={() => handleDeleteInterest(interest.id)}
                  className="text-purple-500 hover:text-red-400 ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12 bg-warm-800/50 rounded-lg">
          <p className="text-warm-400">{t('recommend.empty')}</p>
          <p className="text-sm text-warm-500 mt-1">{t('recommend.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-warm-800 rounded-xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/50 text-purple-300">
                    {t(`recommend.interest.${rec.interestCategory}`)}
                  </span>
                  <span className="text-xs text-green-400 font-medium">
                    {rec.matchPercent}% {t('recommend.match')}
                  </span>
                </div>
                <button
                  onClick={() => handleDismiss(rec.id)}
                  className="text-warm-500 hover:text-red-400 transition-colors text-sm"
                  title={t('recommend.dismiss')}
                >
                  &times;
                </button>
              </div>
              <h4 className="text-white font-semibold mb-2">{rec.title}</h4>
              <p className="text-sm text-warm-400 mb-2 flex-1">{rec.description}</p>
              <p className="text-xs text-warm-500 mb-4">{rec.reason}</p>
              <button
                onClick={() => handleUseTemplate(rec.promptTemplate)}
                className="w-full py-2 text-sm bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors"
              >
                {t('recommend.startBuilding')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Interest Dialog */}
      {showInterestDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowInterestDialog(false)}>
          <div className="bg-warm-800 rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t('recommend.addInterestTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('recommend.interestLabel')}</label>
                <select
                  value={newInterestCategory}
                  onChange={e => setNewInterestCategory(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg p-2 text-white text-sm"
                >
                  {INTEREST_CATEGORIES.map(c => (
                    <option key={c} value={c}>{t(`recommend.interest.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowInterestDialog(false)}
                  className="px-4 py-2 text-sm text-warm-400 hover:text-white transition-colors"
                >
                  {t('tokens.confirm.cancel')}
                </button>
                <button
                  onClick={handleAddInterest}
                  disabled={addingInterest}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {addingInterest ? t('recommend.adding') : t('recommend.addInterest')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
