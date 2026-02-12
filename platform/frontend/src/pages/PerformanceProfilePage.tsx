import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  runProfile,
  getResults,
  getHistory,
  applyOptimizations,
  type PerformanceProfile,
  type OptimizationSuggestion,
} from '../api/performance-profile'

export default function PerformanceProfilePage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('')
  const [profile, setProfile] = useState<PerformanceProfile | null>(null)
  const [history, setHistory] = useState<PerformanceProfile[]>([])
  const [profiling, setProfiling] = useState(false)
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  async function handleProfile() {
    if (!projectId.trim()) return
    setProfiling(true)
    setError('')
    try {
      const result = await runProfile(projectId.trim())
      setProfile(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('performanceProfile.error.profileFailed'))
    } finally {
      setProfiling(false)
    }
  }

  async function handleLoad() {
    if (!projectId.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await getResults(projectId.trim())
      setProfile(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('performanceProfile.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadHistory() {
    if (!projectId.trim()) return
    setError('')
    try {
      const results = await getHistory(projectId.trim())
      setHistory(results)
      setShowHistory(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('performanceProfile.error.loadFailed'))
    }
  }

  async function handleOptimize(suggestionIds: string[]) {
    if (!profile) return
    setOptimizing(true)
    setError('')
    try {
      const result = await applyOptimizations(projectId, profile.id, suggestionIds)
      setProfile(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('performanceProfile.error.optimizeFailed'))
    } finally {
      setOptimizing(false)
    }
  }

  function getSuggestions(): OptimizationSuggestion[] {
    if (!profile) return []
    try {
      return JSON.parse(profile.suggestionsJson)
    } catch {
      return []
    }
  }

  function scoreColor(score: number): string {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  function scoreBg(score: number): string {
    if (score >= 80) return 'bg-green-600/20 border-green-700/50'
    if (score >= 60) return 'bg-yellow-600/20 border-yellow-700/50'
    return 'bg-red-600/20 border-red-700/50'
  }

  function scoreLabel(score: number): string {
    if (score >= 80) return t('performanceProfile.excellent')
    if (score >= 60) return t('performanceProfile.good')
    return t('performanceProfile.needsWork')
  }

  const categoryColors: Record<string, string> = {
    bundle: 'bg-blue-600/20 text-blue-400 border-blue-700/50',
    rendering: 'bg-purple-600/20 text-purple-400 border-purple-700/50',
    data: 'bg-cyan-600/20 text-cyan-400 border-cyan-700/50',
    accessibility: 'bg-orange-600/20 text-orange-400 border-orange-700/50',
    seo: 'bg-green-600/20 text-green-400 border-green-700/50',
  }

  const effortColors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  }

  const suggestions = getSuggestions()
  const pendingSuggestions = suggestions.filter(s => !s.applied)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-warm-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">{t('performanceProfile.title')}</h3>
        <p className="text-warm-400 text-sm mb-4">{t('performanceProfile.subtitle')}</p>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder={t('performanceProfile.projectIdPlaceholder')}
            className="w-full bg-warm-800 border border-warm-700 rounded px-3 py-2 text-white text-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={handleProfile}
              disabled={profiling || !projectId.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {profiling ? t('performanceProfile.profiling') : t('performanceProfile.runProfile')}
            </button>
            <button
              onClick={handleLoad}
              disabled={loading || !projectId.trim()}
              className="px-4 py-2 bg-warm-700 hover:bg-warm-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {loading ? t('performanceProfile.loading') : t('performanceProfile.loadResults')}
            </button>
            <button
              onClick={handleLoadHistory}
              disabled={!projectId.trim()}
              className="px-4 py-2 bg-warm-700 hover:bg-warm-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              {t('performanceProfile.viewHistory')}
            </button>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      {profile && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: t('performanceProfile.overall'), score: profile.overallScore },
            { label: t('performanceProfile.bundle'), score: profile.bundleScore },
            { label: t('performanceProfile.rendering'), score: profile.renderingScore },
            { label: t('performanceProfile.dataLoading'), score: profile.dataLoadingScore },
            { label: t('performanceProfile.accessibility'), score: profile.accessibilityScore },
            { label: t('performanceProfile.seo'), score: profile.seoScore },
          ].map(({ label, score }) => (
            <div key={label} className={`rounded-lg border p-4 text-center ${scoreBg(score)}`}>
              <p className="text-xs text-warm-400 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</p>
              <p className={`text-xs mt-1 ${scoreColor(score)}`}>{scoreLabel(score)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Summary */}
      {profile && (
        <div className="bg-warm-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-warm-300">{t('performanceProfile.metrics')}</h4>
            <span className="text-xs text-warm-500">
              {profile.estimatedBundleSizeKb} KB {t('performanceProfile.estimatedBundle')}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-warm-800/50 rounded p-3">
              <p className="text-xs text-warm-500">{t('performanceProfile.suggestions')}</p>
              <p className="text-lg font-semibold text-white">{profile.suggestionCount}</p>
            </div>
            <div className="bg-warm-800/50 rounded p-3">
              <p className="text-xs text-warm-500">{t('performanceProfile.applied')}</p>
              <p className="text-lg font-semibold text-white">{profile.optimizationsApplied}</p>
            </div>
            <div className="bg-warm-800/50 rounded p-3">
              <p className="text-xs text-warm-500">{t('performanceProfile.status')}</p>
              <p className={`text-lg font-semibold ${profile.status === 'optimized' ? 'text-green-400' : 'text-blue-400'}`}>
                {profile.status === 'optimized' ? t('performanceProfile.optimized') : t('performanceProfile.completed')}
              </p>
            </div>
            <div className="bg-warm-800/50 rounded p-3">
              <p className="text-xs text-warm-500">{t('performanceProfile.pending')}</p>
              <p className="text-lg font-semibold text-yellow-400">{pendingSuggestions.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Suggestions */}
      {profile && suggestions.length > 0 && (
        <div className="bg-warm-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-warm-300">{t('performanceProfile.optimizations')}</h4>
            {pendingSuggestions.length > 0 && (
              <button
                onClick={() => handleOptimize(pendingSuggestions.map(s => s.id))}
                disabled={optimizing}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs rounded transition-colors"
              >
                {optimizing ? t('performanceProfile.applying') : t('performanceProfile.fixAll')}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border rounded-lg p-3 transition-colors ${
                  suggestion.applied
                    ? 'border-green-700/30 bg-green-900/10'
                    : 'border-warm-700/50 bg-warm-800/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs border ${categoryColors[suggestion.category] || 'bg-warm-600/20 text-warm-400 border-warm-700/50'}`}>
                        {suggestion.category}
                      </span>
                      <span className={`text-xs ${effortColors[suggestion.effort] || 'text-warm-400'}`}>
                        {suggestion.effort} {t('performanceProfile.effort')}
                      </span>
                      <span className="text-xs text-warm-500">
                        {t('performanceProfile.impact')}: {suggestion.impact}%
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium">{suggestion.title}</p>
                    <p className="text-xs text-warm-400 mt-1">{suggestion.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {suggestion.applied ? (
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-medium">
                        {t('performanceProfile.fixed')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOptimize([suggestion.id])}
                        disabled={optimizing}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded transition-colors"
                      >
                        {t('performanceProfile.applyFix')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && history.length > 0 && (
        <div className="bg-warm-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-warm-300 mb-3">{t('performanceProfile.history')}</h4>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                onClick={() => { setProfile(h); setShowHistory(false) }}
                className="flex items-center justify-between bg-warm-800/50 rounded p-3 cursor-pointer hover:bg-warm-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${scoreColor(h.overallScore)}`}>{h.overallScore}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${h.status === 'optimized' ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}`}>
                    {h.status}
                  </span>
                </div>
                <span className="text-xs text-warm-500">{new Date(h.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!profile && !profiling && !loading && (
        <div className="bg-warm-900 rounded-lg p-12 text-center">
          <p className="text-warm-400">{t('performanceProfile.empty')}</p>
        </div>
      )}
    </div>
  )
}
