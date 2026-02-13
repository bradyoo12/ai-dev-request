import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listHealingResults,
  healTest,
  approveHealing,
  rejectHealing,
  getHealingStats,
  getHealingStrategies,
  type PlaywrightHealingResult,
  type HealingStrategy,
  type HealingStats,
} from '../api/playwrighthealing'

type HealingTab = 'heal' | 'results' | 'stats'

const STATUS_COLORS: Record<string, string> = {
  healed: 'bg-green-600 text-white',
  failed: 'bg-red-600 text-white',
  pending: 'bg-yellow-700 text-yellow-200',
  'manual-review': 'bg-orange-700 text-orange-200',
}

export default function PlaywrightHealingPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<HealingTab>('heal')
  const [results, setResults] = useState<PlaywrightHealingResult[]>([])
  const [strategies, setStrategies] = useState<HealingStrategy[]>([])
  const [stats, setStats] = useState<HealingStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Heal form
  const [testFile, setTestFile] = useState('')
  const [testName, setTestName] = useState('')
  const [originalSelector, setOriginalSelector] = useState('')
  const [healing, setHealing] = useState(false)
  const [lastResult, setLastResult] = useState<PlaywrightHealingResult | null>(null)

  useEffect(() => {
    loadStrategies()
  }, [])

  useEffect(() => {
    if (tab === 'results') loadResults()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadStrategies() {
    try {
      const data = await getHealingStrategies()
      setStrategies(data)
    } catch { /* ignore */ }
  }

  async function loadResults() {
    setLoading(true)
    try {
      const data = await listHealingResults()
      setResults(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getHealingStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleHeal() {
    if (!originalSelector.trim()) return
    setHealing(true)
    setLastResult(null)
    try {
      const result = await healTest({ testFile, testName, originalSelector })
      setLastResult(result)
    } catch { /* ignore */ }
    setHealing(false)
  }

  async function handleApprove(id: string) {
    try {
      const updated = await approveHealing(id)
      setResults(prev => prev.map(r => r.id === id ? updated : r))
    } catch { /* ignore */ }
  }

  async function handleReject(id: string) {
    try {
      const updated = await rejectHealing(id)
      setResults(prev => prev.map(r => r.id === id ? updated : r))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('pwHealing.title', 'Self-Healing Tests')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('pwHealing.subtitle', 'AI-powered Playwright test healing with MCP integration')}</p>
      </div>

      <div className="flex gap-2">
        {(['heal', 'results', 'stats'] as HealingTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`pwHealing.tabs.${tabId}`, tabId === 'heal' ? 'Heal' : tabId === 'results' ? 'Results' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Heal Tab */}
      {tab === 'heal' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('pwHealing.healTest', 'Heal Broken Test')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('pwHealing.testFile', 'Test File')}</label>
                <input
                  value={testFile}
                  onChange={e => setTestFile(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm font-mono"
                  placeholder="e.g., homepage.spec.ts"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('pwHealing.testName', 'Test Name')}</label>
                <input
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., displays header with branding"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('pwHealing.originalSelector', 'Broken Selector')}</label>
              <input
                value={originalSelector}
                onChange={e => setOriginalSelector(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm font-mono"
                placeholder="e.g., text=AI Engine or .submit-btn or #main-header"
              />
            </div>
            <button
              onClick={handleHeal}
              disabled={healing || !originalSelector.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {healing ? t('pwHealing.healing', 'Healing...') : t('pwHealing.healBtn', 'Heal Selector')}
            </button>
          </div>

          {/* Healing Result */}
          {lastResult && (
            <div className={`bg-warm-800 rounded-lg p-5 border-l-4 ${lastResult.status === 'healed' ? 'border-green-500' : 'border-orange-500'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{t('pwHealing.result', 'Healing Result')}</h4>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[lastResult.status] || 'bg-warm-700 text-warm-300'}`}>
                  {lastResult.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-warm-500">{t('pwHealing.original', 'Original')}</p>
                    <p className="text-sm text-red-400 font-mono bg-warm-900 rounded px-2 py-1 mt-0.5">{lastResult.originalSelector}</p>
                  </div>
                  <div>
                    <p className="text-xs text-warm-500">{t('pwHealing.healed', 'Healed')}</p>
                    <p className="text-sm text-green-400 font-mono bg-warm-900 rounded px-2 py-1 mt-0.5">{lastResult.healedSelector}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-warm-500 mt-2">
                  <span>{t('pwHealing.strategy', 'Strategy')}: <span className="text-white">{lastResult.healingStrategy}</span></span>
                  <span>{t('pwHealing.confidence', 'Confidence')}: <span className="text-white">{Math.round(lastResult.confidence * 100)}%</span></span>
                  <span>{t('pwHealing.attempts', 'Attempts')}: <span className="text-white">{lastResult.healingAttempts}</span></span>
                  <span>{Math.round(lastResult.healingTimeMs)}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Strategies */}
          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{t('pwHealing.strategies', 'Healing Strategies')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {strategies.map(s => (
                <div key={s.id} className="bg-warm-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-white font-medium">{s.name}</span>
                  </div>
                  <p className="text-xs text-warm-400">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {tab === 'results' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('pwHealing.loading', 'Loading...')}</p>
          ) : results.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('pwHealing.noResults', 'No healing results yet. Try healing a broken selector!')}</p>
            </div>
          ) : (
            results.map(r => (
              <div key={r.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{r.testName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[r.status] || 'bg-warm-700 text-warm-300'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-warm-500 text-xs font-mono mt-1">{r.testFile}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-xs text-warm-500">{t('pwHealing.original', 'Original')}</p>
                        <p className="text-xs text-red-400 font-mono truncate">{r.originalSelector}</p>
                      </div>
                      <div>
                        <p className="text-xs text-warm-500">{t('pwHealing.healed', 'Healed')}</p>
                        <p className="text-xs text-green-400 font-mono truncate">{r.healedSelector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                      <span>{r.healingStrategy}</span>
                      <span>{Math.round(r.confidence * 100)}%</span>
                      <span>{Math.round(r.healingTimeMs)}ms</span>
                      <span>{new Date(r.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {r.status === 'manual-review' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="px-3 py-1 bg-green-700 text-white rounded text-xs hover:bg-green-600"
                      >
                        {t('pwHealing.approve', 'Approve')}
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600"
                      >
                        {t('pwHealing.reject', 'Reject')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('pwHealing.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('pwHealing.noStats', 'No healing statistics yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('pwHealing.stats.totalHealings', 'Total Healings'), value: stats.totalHealings },
                  { label: t('pwHealing.stats.healRate', 'Heal Rate'), value: `${stats.healRate}%` },
                  { label: t('pwHealing.stats.avgConfidence', 'Avg Confidence'), value: `${stats.avgConfidence}%` },
                  { label: t('pwHealing.stats.avgTime', 'Avg Time'), value: `${stats.avgHealingTimeMs}ms` },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-warm-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.successfulHealings}</p>
                  <p className="text-xs text-warm-400 mt-1">{t('pwHealing.stats.successful', 'Successful')}</p>
                </div>
                <div className="bg-warm-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.failedHealings}</p>
                  <p className="text-xs text-warm-400 mt-1">{t('pwHealing.stats.failed', 'Failed')}</p>
                </div>
                <div className="bg-warm-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-400">{stats.pendingReview}</p>
                  <p className="text-xs text-warm-400 mt-1">{t('pwHealing.stats.pendingReview', 'Pending Review')}</p>
                </div>
              </div>

              {stats.byStrategy.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('pwHealing.stats.byStrategy', 'By Strategy')}</h4>
                  <div className="space-y-2">
                    {stats.byStrategy.map(s => {
                      const info = strategies.find(st => st.id === s.strategy)
                      return (
                        <div key={s.strategy} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info?.color || '#6b7280' }} />
                            <span className="text-sm text-white">{info?.name || s.strategy}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-warm-500">
                            <span>{s.count} {t('pwHealing.healings', 'healings')}</span>
                            <span>{s.avgConfidence}% {t('pwHealing.confidence', 'confidence')}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
