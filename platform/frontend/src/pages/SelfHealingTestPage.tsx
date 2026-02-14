import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  triggerSelfHealing,
  getSelfHealingResults,
  getSelfHealingHistory,
  repairLocators,
  getHealingTimeline,
  type SelfHealingTestResult,
  type HealedTestDetail,
  type FailedTestDetail,
  type RepairedLocator,
  type HealingTimelineEntry,
} from '../api/self-healing-test'

type ActiveTab = 'analysis' | 'repair' | 'timeline'

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis')

  // Repair state
  const [repairTestFile, setRepairTestFile] = useState('')
  const [repairTestName, setRepairTestName] = useState('')
  const [repairLocator, setRepairLocator] = useState('')
  const [repairError, setRepairError] = useState('')
  const [repairing, setRepairing] = useState(false)
  const [repairedLocators, setRepairedLocators] = useState<RepairedLocator[]>([])
  const [repairSummary, setRepairSummary] = useState('')

  // Timeline state
  const [timeline, setTimeline] = useState<HealingTimelineEntry[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

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

  async function handleRepairLocators() {
    if (!repairLocator.trim()) return
    setRepairing(true)
    setError('')
    setRepairedLocators([])
    setRepairSummary('')
    try {
      const result = await repairLocators(projectId, [{
        testFile: repairTestFile,
        testName: repairTestName,
        originalLocator: repairLocator,
        errorMessage: repairError || undefined,
      }])
      setRepairedLocators(result.repairedLocators)
      setRepairSummary(result.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('selfHealing.error.repairFailed', 'Locator repair failed'))
    } finally {
      setRepairing(false)
    }
  }

  async function loadTimeline() {
    setTimelineLoading(true)
    try {
      const data = await getHealingTimeline(projectId)
      setTimeline(data)
    } catch { /* ignore */ }
    setTimelineLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'timeline') loadTimeline()
  }, [activeTab, projectId])

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

  const healRate = result && result.totalTests > 0
    ? Math.round((result.healedTests / result.totalTests) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('selfHealing.title', 'Self-Healing Test Automation')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('selfHealing.subtitle', 'AI analyzes failing tests, repairs broken locators, and tracks healing activity')}</p>
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

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {([
          { id: 'analysis' as ActiveTab, label: t('selfHealing.tabs.analysis', 'Self-Healing Analysis') },
          { id: 'repair' as ActiveTab, label: t('selfHealing.tabs.repair', 'Locator Repair') },
          { id: 'timeline' as ActiveTab, label: t('selfHealing.tabs.timeline', 'Healing Timeline') },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
            >
              {analyzing ? t('selfHealing.analyzing', 'Analyzing...') : t('selfHealing.analyze', 'Run Self-Healing Analysis')}
            </button>
          </div>

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

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                  <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${healRate >= 80 ? 'text-green-400' : healRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{healRate}%</div>
                    <div className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.healRate', 'Heal Rate')}</div>
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
        </div>
      )}

      {/* Locator Repair Tab */}
      {activeTab === 'repair' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-xl p-6 space-y-4">
            <h4 className="font-semibold">{t('selfHealing.repair.title', 'AI Locator Repair')}</h4>
            <p className="text-warm-400 text-sm">{t('selfHealing.repair.description', 'Submit broken Playwright locators and AI will suggest resilient replacements using MCP accessibility tree analysis.')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('selfHealing.repair.testFile', 'Test File')}</label>
                <input
                  value={repairTestFile}
                  onChange={(e) => setRepairTestFile(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="e.g., login.spec.ts"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('selfHealing.repair.testName', 'Test Name')}</label>
                <input
                  value={repairTestName}
                  onChange={(e) => setRepairTestName(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., should submit login form"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('selfHealing.repair.brokenLocator', 'Broken Locator')}</label>
              <input
                value={repairLocator}
                onChange={(e) => setRepairLocator(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="e.g., .old-submit-btn or page.locator('#removed-element')"
              />
            </div>

            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('selfHealing.repair.errorMessage', 'Error Message (optional)')}</label>
              <input
                value={repairError}
                onChange={(e) => setRepairError(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g., Timeout waiting for selector"
              />
            </div>

            <button
              onClick={handleRepairLocators}
              disabled={repairing || !repairLocator.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
            >
              {repairing ? t('selfHealing.repair.repairing', 'Repairing...') : t('selfHealing.repair.repairBtn', 'Repair Locator')}
            </button>
          </div>

          {/* Repair Results */}
          {repairedLocators.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-2">{t('selfHealing.repair.results', 'Repair Results')}</h4>
              {repairSummary && <p className="text-warm-400 text-sm mb-4">{repairSummary}</p>}
              <div className="space-y-3">
                {repairedLocators.map((loc, idx) => (
                  <div key={idx} className="bg-warm-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${confidenceBadge(loc.confidence)}`}>
                          {loc.confidence}%
                        </span>
                        <span className="text-sm font-medium">{loc.testName}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-warm-600 rounded text-warm-300">{loc.strategy}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-red-400">{t('selfHealing.repair.original', 'Original')}</span>
                        <pre className="mt-1 p-2 bg-warm-900 rounded text-xs text-red-300 font-mono overflow-x-auto">{loc.originalLocator}</pre>
                      </div>
                      <div>
                        <span className="text-xs text-green-400">{t('selfHealing.repair.repaired', 'Repaired')}</span>
                        <pre className="mt-1 p-2 bg-warm-900 rounded text-xs text-green-300 font-mono overflow-x-auto">{loc.repairedLocatorValue}</pre>
                      </div>
                    </div>
                    <p className="text-xs text-warm-400">{loc.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">{t('selfHealing.timeline.title', 'Healing Activity Timeline')}</h4>
              <button
                onClick={loadTimeline}
                disabled={timelineLoading}
                className="px-3 py-1.5 bg-warm-700 hover:bg-warm-600 rounded-lg text-xs transition-colors"
              >
                {t('selfHealing.timeline.refresh', 'Refresh')}
              </button>
            </div>
            <p className="text-warm-400 text-sm">{t('selfHealing.timeline.description', 'Track all self-healing activity including healed tests, failed repairs, and confidence trends.')}</p>
          </div>

          {timelineLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!timelineLoading && timeline.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <div className="space-y-3">
                {timeline.map((entry) => (
                  <div key={entry.id} className={`rounded-lg p-3 border-l-4 ${
                    entry.action === 'healed' ? 'border-green-500 bg-green-900/10' :
                    entry.action === 'failed' ? 'border-red-500 bg-red-900/10' :
                    'border-yellow-500 bg-yellow-900/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entry.action === 'healed' ? 'bg-green-900/50 text-green-300' :
                          entry.action === 'failed' ? 'bg-red-900/50 text-red-300' :
                          'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {entry.action}
                        </span>
                        <span className="text-sm font-medium">{entry.testName}</span>
                        {entry.confidence > 0 && (
                          <span className={`text-xs ${confidenceColor(entry.confidence)}`}>{entry.confidence}%</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-warm-500">
                        <span>v{entry.analysisVersion}</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {entry.originalLocator && entry.healedLocator && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <span className="text-xs text-red-400">{t('selfHealing.timeline.before', 'Before')}</span>
                          <pre className="mt-0.5 p-1.5 bg-warm-900 rounded text-xs text-warm-300 font-mono overflow-x-auto">{entry.originalLocator}</pre>
                        </div>
                        <div>
                          <span className="text-xs text-green-400">{t('selfHealing.timeline.after', 'After')}</span>
                          <pre className="mt-0.5 p-1.5 bg-warm-900 rounded text-xs text-warm-300 font-mono overflow-x-auto">{entry.healedLocator}</pre>
                        </div>
                      </div>
                    )}
                    {entry.reason && (
                      <p className="text-xs text-warm-400 mt-1">{entry.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!timelineLoading && timeline.length === 0 && (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <p className="text-warm-400">{t('selfHealing.timeline.empty', 'No healing activity yet. Run a self-healing analysis to see the timeline.')}</p>
            </div>
          )}
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
