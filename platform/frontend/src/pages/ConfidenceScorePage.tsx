import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listScores, evaluateRequest, deleteScore, getScoreStats, getConfidenceLevels } from '../api/confidencescore'
import type { ConfidenceScore, EvaluateResponse, ConfidenceLevel, ConfidenceStats } from '../api/confidencescore'

type Tab = 'evaluate' | 'history' | 'levels' | 'stats'

export default function ConfidenceScorePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('evaluate')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<EvaluateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<ConfidenceScore[]>([])
  const [levels, setLevels] = useState<ConfidenceLevel[]>([])
  const [stats, setStats] = useState<ConfidenceStats>({ total: 0, byLevel: [] })

  useEffect(() => {
    if (tab === 'history') listScores().then(setHistory)
    if (tab === 'levels') getConfidenceLevels().then(setLevels)
    if (tab === 'stats') getScoreStats().then(setStats)
  }, [tab])

  const handleEvaluate = async () => {
    if (!title || !description) return
    setLoading(true)
    try {
      const r = await evaluateRequest(title, description)
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  const levelColor = (l: string) => {
    switch (l) {
      case 'green': return 'text-green-400'
      case 'yellow': return 'text-yellow-400'
      case 'red': return 'text-red-400'
      default: return 'text-warm-400'
    }
  }

  const levelBg = (l: string) => {
    switch (l) {
      case 'green': return 'bg-green-600'
      case 'yellow': return 'bg-yellow-600'
      case 'red': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const scoreBar = (score: number) => (
    <div className="w-full bg-warm-700 rounded-full h-2">
      <div className={`h-2 rounded-full ${score >= 0.7 ? 'bg-green-500' : score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
        style={{ width: `${Math.min(score * 100, 100)}%` }} />
    </div>
  )

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('confidence.title', 'AI Task Confidence Scoring')}</h3>
      <div className="flex gap-2 mb-6">
        {(['evaluate', 'history', 'levels', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-400 hover:text-white'}`}
          >{t(`confidence.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}</button>
        ))}
      </div>

      {tab === 'evaluate' && (
        <div className="bg-warm-800 rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-sm text-warm-400 mb-1">{t('confidence.requestTitle', 'Request Title')}</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add user authentication"
              className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-warm-400 mb-1">{t('confidence.requestDesc', 'Request Description')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Describe your development request in detail..."
              className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white resize-none" />
          </div>
          <button onClick={handleEvaluate} disabled={loading || !title || !description}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('confidence.evaluating', 'Evaluating...') : t('confidence.evaluate', 'Evaluate Confidence')}
          </button>

          {result && (
            <div className="mt-6 bg-warm-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{t('confidence.result', 'Confidence Assessment')}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${levelColor(result.confidenceLevel)}`}>
                    {(result.score * 100).toFixed(0)}%
                  </span>
                  <span className={`${levelBg(result.confidenceLevel)} text-white text-xs px-2 py-1 rounded`}>
                    {result.confidenceLevel.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('confidence.complexity', 'Complexity')}</div>
                  <div className="text-lg font-bold text-white capitalize">{result.complexityRating}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('confidence.ambiguity', 'Ambiguity')}</div>
                  <div className="text-lg font-bold text-white capitalize">{result.ambiguityLevel}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('confidence.feasibility', 'Feasibility')}</div>
                  <div className="text-lg font-bold text-white capitalize">{result.feasibilityRating}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('confidence.effort', 'Est. Effort')}</div>
                  <div className="text-lg font-bold text-white">{result.estimatedEffort}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-warm-400 text-sm mb-2">{t('confidence.factors', 'Scoring Factors')}</div>
                <div className="space-y-2">
                  {result.factors.map((f, i) => (
                    <div key={i} className="bg-warm-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm font-medium">{f.factor}</span>
                        <span className={`text-sm font-bold ${f.score >= 0.7 ? 'text-green-400' : f.score >= 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {(f.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      {scoreBar(f.score)}
                      <div className="text-warm-400 text-xs mt-1">{f.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {result.suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="text-warm-400 text-sm mb-2">{t('confidence.suggestions', 'Refinement Suggestions')}</div>
                  <div className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-2 text-yellow-400 text-sm flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-warm-800 rounded-lg p-3">
                <div className="text-warm-400 text-sm mb-1">{t('confidence.recommendation', 'Recommendation')}</div>
                <div className="text-white text-sm">{result.recommendation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 && <div className="text-warm-400 text-center py-8">{t('confidence.noHistory', 'No evaluations yet')}</div>}
          {history.map(s => (
            <div key={s.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{s.requestTitle}</span>
                  <span className={`${levelBg(s.confidenceLevel)} text-white text-xs px-2 py-0.5 rounded`}>{s.confidenceLevel}</span>
                  <span className="text-warm-300 text-sm">{(s.score * 100).toFixed(0)}%</span>
                </div>
                <div className="text-warm-400 text-sm mt-1">
                  {s.complexityRating} complexity | {s.ambiguityLevel} ambiguity | {s.feasibilityRating} | {s.estimatedEffort} | {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={async () => { await deleteScore(s.id); setHistory(h => h.filter(x => x.id !== s.id)) }}
                className="text-red-400 hover:text-red-300 text-sm">{t('common.delete', 'Delete')}</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'levels' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levels.map(l => (
            <div key={l.id} className="bg-warm-800 rounded-lg p-5 border-t-4" style={{ borderTopColor: l.color }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">{l.name}</h4>
                <span className="text-warm-400 text-xs font-mono">{l.scoreRange}</span>
              </div>
              <p className="text-warm-400 text-sm mb-3">{l.description}</p>
              <div className="mb-3">
                <span className="text-warm-300 text-xs">{t('confidence.successRate', 'Success Rate')}: </span>
                <span className="text-white text-sm font-bold">{l.successRate}</span>
              </div>
              <ul className="space-y-1">
                {l.characteristics.map(c => (
                  <li key={c} className="text-warm-300 text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="bg-warm-800 rounded-lg p-6 mb-4">
            <div className="text-warm-400 text-sm">{t('confidence.totalEvals', 'Total Evaluations')}</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.byLevel.map(s => (
              <div key={s.level} className="bg-warm-800 rounded-lg p-4">
                <div className={`font-medium ${levelColor(s.level)}`}>{s.level.toUpperCase()}</div>
                <div className="text-warm-400 text-sm mt-1">
                  {t('confidence.stats.count', 'Count')}: {s.count} | {t('confidence.stats.avgScore', 'Avg Score')}: {(s.avgScore * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
