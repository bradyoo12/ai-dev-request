import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  triggerSelfHealing,
  getSelfHealingResults,
  getSelfHealingHistory,
  type SelfHealingTestResult,
  type HealedTestDetail,
  type FailedTestDetail,
} from '../api/self-healing-test'

export default function SelfHealingTestPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('00000000-0000-0000-0000-000000000001')
  const [result, setResult] = useState<SelfHealingTestResult | null>(null)
  const [history, setHistory] = useState<SelfHealingTestResult[]>([])
  const [healedTests, setHealedTests] = useState<HealedTestDetail[]>([])
  const [failedDetails, setFailedDetails] = useState<FailedTestDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [expandedHealed, setExpandedHealed] = useState<string | null>(null)

  useEffect(() => {
    loadResults()
  }, [projectId])

  function parseJson<T>(json: string | null | undefined): T[] {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const data = await getSelfHealingResults(projectId)
      setResult(data)
      if (data) {
        setHealedTests(parseJson<HealedTestDetail>(data.healedTestsJson))
        setFailedDetails(parseJson<FailedTestDetail>(data.failedTestDetailsJson))
      } else {
        setHealedTests([])
        setFailedDetails([])
      }
    } catch {
      setError(t('selfHealing.error.loadFailed', 'Failed to load self-healing results'))
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setError('')
    try {
      const data = await triggerSelfHealing(projectId)
      setResult(data)
      setHealedTests(parseJson<HealedTestDetail>(data.healedTestsJson))
      setFailedDetails(parseJson<FailedTestDetail>(data.failedTestDetailsJson))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('selfHealing.error.analyzeFailed', 'Self-healing analysis failed'))
    } finally {
      setAnalyzing(false)
    }
  }

  async function loadHistory() {
    try {
      const h = await getSelfHealingHistory(projectId)
      setHistory(h)
      setShowHistory(true)
    } catch {
      setError(t('selfHealing.error.historyFailed', 'Failed to load history'))
    }
  }

  const confidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const confidenceBadge = (score: number) => {
    if (score >= 80) return 'bg-green-900/50 text-green-300'
    if (score >= 50) return 'bg-yellow-900/50 text-yellow-300'
    return 'bg-red-900/50 text-red-300'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('selfHealing.title', 'Self-Healing Test Automation')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('selfHealing.subtitle', 'AI analyzes failing tests and generates auto-fixes with confidence scores')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-warm-400">{t('selfHealing.projectId', 'Project ID')}:</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-72 bg-warm-700 border border-warm-600 rounded px-2 py-1 text-sm font-mono"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
          >
            {analyzing ? t('selfHealing.analyzing', 'Analyzing...') : t('selfHealing.analyze', 'Run Self-Healing Analysis')}
          </button>
          <button
            onClick={loadHistory}
            className="px-3 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
          >
            {t('selfHealing.history', 'History')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && result && (
        <>
          {/* Summary Card */}
          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  result.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                  result.status === 'analyzing' ? 'bg-blue-900/50 text-blue-300' :
                  result.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                  'bg-warm-700 text-warm-300'
                }`}>
                  {result.status}
                </span>
                <span className="text-sm text-warm-400">v{result.analysisVersion}</span>
              </div>
              {result.updatedAt && (
                <span className="text-xs text-warm-500">{new Date(result.updatedAt).toLocaleString()}</span>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{result.totalTests}</div>
                <div className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.total', 'Total Tests')}</div>
              </div>
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{result.failedTests}</div>
                <div className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.failed', 'Failed')}</div>
              </div>
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{result.healedTests}</div>
                <div className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.healed', 'Healed')}</div>
              </div>
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{result.skippedTests}</div>
                <div className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.skipped', 'Skipped')}</div>
              </div>
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className={`text-2xl font-bold ${confidenceColor(result.confidenceScore)}`}>{result.confidenceScore}%</div>
                <div className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.confidence', 'Confidence')}</div>
              </div>
            </div>
          </div>

          {/* Confidence Bar */}
          {result.status === 'completed' && (
            <div className="bg-warm-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t('selfHealing.overallConfidence', 'Overall Confidence')}</span>
                <span className="text-sm text-warm-400">{result.confidenceScore}%</span>
              </div>
              <div className="w-full bg-warm-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    result.confidenceScore >= 80 ? 'bg-green-500' :
                    result.confidenceScore >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(result.confidenceScore, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Healed Tests List */}
          {healedTests.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-4">{t('selfHealing.healedTitle', 'Healed Tests')}</h4>
              <div className="space-y-2">
                {healedTests.map((test, idx) => (
                  <div
                    key={idx}
                    onClick={() => setExpandedHealed(expandedHealed === test.testName ? null : test.testName)}
                    className="bg-warm-700/50 rounded-lg p-3 cursor-pointer hover:bg-warm-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${confidenceBadge(test.confidence)}`}>
                          {test.confidence}%
                        </span>
                        <span className="text-sm font-medium">{test.testName}</span>
                      </div>
                      <span className="text-xs text-warm-400 font-mono">{test.filePath}</span>
                    </div>
                    <p className="text-xs text-warm-400 mt-1">{test.reason}</p>
                    {expandedHealed === test.testName && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <span className="text-xs text-red-400 font-medium">{t('selfHealing.original', 'Original:')}</span>
                          <pre className="mt-1 p-2 bg-warm-900 rounded text-xs text-warm-300 overflow-x-auto max-h-40">
                            {test.originalCode}
                          </pre>
                        </div>
                        <div>
                          <span className="text-xs text-green-400 font-medium">{t('selfHealing.fixed', 'Fixed:')}</span>
                          <pre className="mt-1 p-2 bg-warm-900 rounded text-xs text-warm-300 overflow-x-auto max-h-40">
                            {test.fixedCode}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Tests List */}
          {failedDetails.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-4">{t('selfHealing.failedTitle', 'Failed Tests (Unable to Auto-Fix)')}</h4>
              <div className="space-y-2">
                {failedDetails.map((test, idx) => (
                  <div key={idx} className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-300">{test.testName}</span>
                      <span className="text-xs text-warm-400 font-mono">{test.filePath}</span>
                    </div>
                    <p className="text-xs text-red-300/80 mt-1">{test.errorMessage}</p>
                    {test.stackTrace && (
                      <pre className="mt-2 p-2 bg-warm-900 rounded text-xs text-warm-500 overflow-x-auto max-h-24">
                        {test.stackTrace}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !result && (
        <div className="bg-warm-800 rounded-xl p-12 text-center">
          <div className="text-warm-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <p className="text-warm-400">{t('selfHealing.empty', 'No self-healing results yet. Click "Run Self-Healing Analysis" to start.')}</p>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-warm-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">{t('selfHealing.historyTitle', 'Analysis History')}</h4>
            <button onClick={() => setShowHistory(false)} className="text-warm-400 hover:text-white text-sm">
              {t('selfHealing.close', 'Close')}
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-warm-400 text-sm">{t('selfHealing.noHistory', 'No analysis history.')}</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-warm-700/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      h.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                      h.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                      'bg-warm-600 text-warm-300'
                    }`}>
                      {h.status}
                    </span>
                    <span className="text-sm">v{h.analysisVersion}</span>
                    <span className="text-xs text-warm-400">
                      {h.totalTests} total, {h.healedTests} healed, {h.confidenceScore}% confidence
                    </span>
                  </div>
                  <span className="text-xs text-warm-500">{new Date(h.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
