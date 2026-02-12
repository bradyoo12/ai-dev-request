import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  analyzeTestFailure,
  getHealingHistory,
  getReviewQueue,
  getHealingStats,
  getHealingSettings,
  updateHealingSettings,
  approveHealing,
  rejectHealing,
  type TestHealingRecord,
  type TestHealingSettings,
  type TestHealingStats,
  type SuggestedFix,
  type DiffInfo,
} from '../api/test-healing'

type TabView = 'dashboard' | 'review' | 'history' | 'settings'

export default function TestHealingPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState(1)
  const [tab, setTab] = useState<TabView>('dashboard')
  const [stats, setStats] = useState<TestHealingStats | null>(null)
  const [history, setHistory] = useState<TestHealingRecord[]>([])
  const [reviewQueue, setReviewQueue] = useState<TestHealingRecord[]>([])
  const [settings, setSettings] = useState<TestHealingSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<TestHealingRecord | null>(null)

  // Analyze form state
  const [testFilePath, setTestFilePath] = useState('')
  const [originalSelector, setOriginalSelector] = useState('')
  const [failureReason, setFailureReason] = useState('')
  const [locatorStrategy, setLocatorStrategy] = useState('css')
  const [componentName, setComponentName] = useState('')

  useEffect(() => {
    loadData()
  }, [projectId])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [statsData, historyData, queueData, settingsData] = await Promise.all([
        getHealingStats(projectId),
        getHealingHistory(projectId),
        getReviewQueue(projectId),
        getHealingSettings(projectId),
      ])
      setStats(statsData)
      setHistory(historyData)
      setReviewQueue(queueData)
      setSettings(settingsData)
    } catch {
      setError(t('testHealing.error.loadFailed', 'Failed to load test healing data'))
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    if (!testFilePath || !originalSelector || !failureReason) {
      setError(t('testHealing.error.requiredFields', 'Please fill in all required fields'))
      return
    }
    setAnalyzing(true)
    setError('')
    setSuccess('')
    try {
      const result = await analyzeTestFailure(projectId, {
        testFilePath,
        originalSelector,
        failureReason,
        locatorStrategy,
        componentName: componentName || undefined,
      })
      setSelectedRecord(result)
      setSuccess(t('testHealing.analyzeSuccess', 'Analysis complete! Confidence: {{score}}%', { score: result.confidenceScore }))
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('testHealing.error.analyzeFailed', 'Analysis failed'))
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveHealing(projectId, id)
      setSuccess(t('testHealing.approved', 'Healing approved'))
      await loadData()
    } catch {
      setError(t('testHealing.error.approveFailed', 'Failed to approve healing'))
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectHealing(projectId, id)
      setSuccess(t('testHealing.rejected', 'Healing rejected'))
      await loadData()
    } catch {
      setError(t('testHealing.error.rejectFailed', 'Failed to reject healing'))
    }
  }

  async function handleSaveSettings() {
    if (!settings) return
    try {
      const updated = await updateHealingSettings(projectId, settings)
      setSettings(updated)
      setSuccess(t('testHealing.settingsSaved', 'Settings saved'))
    } catch {
      setError(t('testHealing.error.settingsFailed', 'Failed to save settings'))
    }
  }

  function getConfidenceColor(score: number): string {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  function getConfidenceBg(score: number): string {
    if (score >= 80) return 'bg-green-900/50 text-green-300'
    if (score >= 50) return 'bg-yellow-900/50 text-yellow-300'
    return 'bg-red-900/50 text-red-300'
  }

  function getStatusBadge(status: string): string {
    switch (status) {
      case 'healed': return 'bg-green-900/50 text-green-300'
      case 'analyzing': return 'bg-blue-900/50 text-blue-300'
      case 'needs_review': return 'bg-yellow-900/50 text-yellow-300'
      case 'failed': return 'bg-red-900/50 text-red-300'
      default: return 'bg-warm-700 text-warm-300'
    }
  }

  function parseDiff(json?: string | null): DiffInfo | null {
    if (!json) return null
    try { return JSON.parse(json) } catch { return null }
  }

  function parseSuggestedFix(json?: string | null): SuggestedFix | null {
    if (!json) return null
    try { return JSON.parse(json) } catch { return null }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('testHealing.title', 'Self-Healing Tests')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('testHealing.subtitle', 'AI-powered test automation that detects and fixes broken tests automatically')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-warm-400">{t('testHealing.projectId', 'Project ID')}:</label>
          <input
            type="number"
            min={1}
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="w-20 bg-warm-700 border border-warm-600 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        {(['dashboard', 'review', 'history', 'settings'] as TabView[]).map(t_tab => (
          <button
            key={t_tab}
            onClick={() => setTab(t_tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === t_tab ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {t_tab === 'dashboard' ? t('testHealing.tabs.dashboard', 'Dashboard') :
             t_tab === 'review' ? t('testHealing.tabs.review', 'Review Queue') + (reviewQueue.length > 0 ? ` (${reviewQueue.length})` : '') :
             t_tab === 'history' ? t('testHealing.tabs.history', 'History') :
             t('testHealing.tabs.settings', 'Settings')}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-300 text-sm">{success}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Dashboard Tab */}
      {!loading && tab === 'dashboard' && (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-warm-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalAnalyzed}</div>
                <div className="text-xs text-warm-400 mt-1">{t('testHealing.stats.totalAnalyzed', 'Total Analyzed')}</div>
              </div>
              <div className="bg-warm-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.autoHealed}</div>
                <div className="text-xs text-warm-400 mt-1">{t('testHealing.stats.autoHealed', 'Auto-Healed')}</div>
              </div>
              <div className="bg-warm-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.needsReview}</div>
                <div className="text-xs text-warm-400 mt-1">{t('testHealing.stats.needsReview', 'Needs Review')}</div>
              </div>
              <div className="bg-warm-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                <div className="text-xs text-warm-400 mt-1">{t('testHealing.stats.failed', 'Failed')}</div>
              </div>
              <div className="bg-warm-800 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${getConfidenceColor(stats.averageConfidence)}`}>{stats.averageConfidence}%</div>
                <div className="text-xs text-warm-400 mt-1">{t('testHealing.stats.avgConfidence', 'Avg Confidence')}</div>
              </div>
              <div className="bg-warm-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.healingRate}%</div>
                <div className="text-xs text-warm-400 mt-1">{t('testHealing.stats.healingRate', 'Healing Rate')}</div>
              </div>
            </div>
          )}

          {/* Analyze Form */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-4">{t('testHealing.analyzeTitle', 'Analyze Test Failure')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('testHealing.form.testFile', 'Test File Path')} *</label>
                <input
                  type="text"
                  value={testFilePath}
                  onChange={(e) => setTestFilePath(e.target.value)}
                  placeholder="e.g., tests/login.spec.ts"
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('testHealing.form.selector', 'Original Selector')} *</label>
                <input
                  type="text"
                  value={originalSelector}
                  onChange={(e) => setOriginalSelector(e.target.value)}
                  placeholder='e.g., .login-btn, [data-testid="submit"]'
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('testHealing.form.failure', 'Failure Reason')} *</label>
                <input
                  type="text"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="e.g., Element not found: .login-btn"
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('testHealing.form.strategy', 'Locator Strategy')}</label>
                <select
                  value={locatorStrategy}
                  onChange={(e) => setLocatorStrategy(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="css">CSS Selector</option>
                  <option value="xpath">XPath</option>
                  <option value="text">Text Content</option>
                  <option value="role">ARIA Role</option>
                  <option value="testid">Test ID</option>
                  <option value="intent">Intent-based</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('testHealing.form.component', 'Component Name')}</label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="e.g., LoginForm"
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
                >
                  {analyzing ? t('testHealing.analyzing', 'Analyzing...') : t('testHealing.analyze', 'Analyze & Heal')}
                </button>
              </div>
            </div>
          </div>

          {/* Selected Record Detail */}
          {selectedRecord && (
            <div className="bg-warm-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">{t('testHealing.resultTitle', 'Healing Result')}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedRecord.status)}`}>
                    {selectedRecord.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceBg(selectedRecord.confidenceScore)}`}>
                    {selectedRecord.confidenceScore}% {t('testHealing.confidence', 'confidence')}
                  </span>
                </div>
              </div>

              {selectedRecord.healingSummary && (
                <p className="text-warm-300 text-sm mb-4">{selectedRecord.healingSummary}</p>
              )}

              {/* Diff View */}
              {(() => {
                const diff = parseDiff(selectedRecord.diffJson)
                if (!diff) return null
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-red-900/20 rounded-lg p-3">
                      <div className="text-xs text-red-400 mb-1 font-medium">{t('testHealing.original', 'Original')}</div>
                      <code className="text-sm text-red-300 font-mono break-all">{diff.before}</code>
                    </div>
                    <div className="bg-green-900/20 rounded-lg p-3">
                      <div className="text-xs text-green-400 mb-1 font-medium">{t('testHealing.healed', 'Healed')}</div>
                      <code className="text-sm text-green-300 font-mono break-all">{diff.after}</code>
                    </div>
                  </div>
                )
              })()}

              {/* Suggested Fix */}
              {(() => {
                const fix = parseSuggestedFix(selectedRecord.suggestedFixJson)
                if (!fix) return null
                return (
                  <div className="bg-warm-700/50 rounded-lg p-4">
                    <div className="text-xs text-warm-400 mb-2 font-medium">{t('testHealing.suggestedFix', 'Suggested Fix')}</div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-warm-500">{t('testHealing.selector', 'Selector')}:</span>
                        <code className="ml-2 text-sm text-blue-300 font-mono">{fix.selector}</code>
                      </div>
                      {fix.assertion && (
                        <div>
                          <span className="text-xs text-warm-500">{t('testHealing.assertion', 'Assertion')}:</span>
                          <code className="ml-2 text-sm text-purple-300 font-mono">{fix.assertion}</code>
                        </div>
                      )}
                      {fix.explanation && (
                        <div>
                          <span className="text-xs text-warm-500">{t('testHealing.explanation', 'Explanation')}:</span>
                          <p className="mt-1 text-sm text-warm-300">{fix.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Confidence Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-warm-400">{t('testHealing.confidenceScore', 'Confidence Score')}</span>
                  <span className={`text-xs font-medium ${getConfidenceColor(selectedRecord.confidenceScore)}`}>
                    {selectedRecord.confidenceScore}%
                  </span>
                </div>
                <div className="w-full bg-warm-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      selectedRecord.confidenceScore >= 80 ? 'bg-green-500' :
                      selectedRecord.confidenceScore >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(selectedRecord.confidenceScore, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Queue Tab */}
      {!loading && tab === 'review' && (
        <div className="space-y-4">
          {reviewQueue.length === 0 ? (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <p className="text-warm-400">{t('testHealing.noReviewItems', 'No items pending review. All tests are passing or auto-healed.')}</p>
            </div>
          ) : (
            reviewQueue.map(record => (
              <div key={record.id} className="bg-warm-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceBg(record.confidenceScore)}`}>
                      {record.confidenceScore}% {t('testHealing.confidence', 'confidence')}
                    </span>
                    <span className="text-sm font-mono text-warm-300">{record.testFilePath}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(record.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
                    >
                      {t('testHealing.approve', 'Approve')}
                    </button>
                    <button
                      onClick={() => handleReject(record.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
                    >
                      {t('testHealing.reject', 'Reject')}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-warm-300 mb-3">{record.healingSummary}</p>

                {/* Diff */}
                {(() => {
                  const diff = parseDiff(record.diffJson)
                  if (!diff) return null
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-900/20 rounded-lg p-2">
                        <div className="text-xs text-red-400 mb-1">{t('testHealing.original', 'Original')}</div>
                        <code className="text-xs text-red-300 font-mono break-all">{diff.before}</code>
                      </div>
                      <div className="bg-green-900/20 rounded-lg p-2">
                        <div className="text-xs text-green-400 mb-1">{t('testHealing.healed', 'Healed')}</div>
                        <code className="text-xs text-green-300 font-mono break-all">{diff.after}</code>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {!loading && tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <p className="text-warm-400">{t('testHealing.noHistory', 'No healing history yet.')}</p>
            </div>
          ) : (
            history.map(record => (
              <div key={record.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(record.status)}`}>
                    {record.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConfidenceBg(record.confidenceScore)}`}>
                    {record.confidenceScore}%
                  </span>
                  <span className="text-sm font-mono text-warm-300">{record.testFilePath}</span>
                  <span className="text-xs text-warm-500 truncate max-w-xs">{record.healingSummary}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-warm-500">v{record.healingVersion}</span>
                  <span className="text-xs text-warm-500">{new Date(record.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {!loading && tab === 'settings' && settings && (
        <div className="bg-warm-800 rounded-xl p-6 space-y-6">
          <h4 className="font-semibold">{t('testHealing.settingsTitle', 'Self-Healing Configuration')}</h4>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.autoHealEnabled}
                onChange={(e) => setSettings({ ...settings, autoHealEnabled: e.target.checked })}
                className="rounded bg-warm-700 border-warm-600"
              />
              <div>
                <div className="text-sm font-medium">{t('testHealing.settings.autoHeal', 'Enable Auto-Healing')}</div>
                <div className="text-xs text-warm-400">{t('testHealing.settings.autoHealDesc', 'Automatically analyze and fix broken tests when failures are detected')}</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.autoApproveHighConfidence}
                onChange={(e) => setSettings({ ...settings, autoApproveHighConfidence: e.target.checked })}
                className="rounded bg-warm-700 border-warm-600"
              />
              <div>
                <div className="text-sm font-medium">{t('testHealing.settings.autoApprove', 'Auto-Approve High Confidence Fixes')}</div>
                <div className="text-xs text-warm-400">{t('testHealing.settings.autoApproveDesc', 'Automatically approve fixes above the confidence threshold')}</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifyOnLowConfidence}
                onChange={(e) => setSettings({ ...settings, notifyOnLowConfidence: e.target.checked })}
                className="rounded bg-warm-700 border-warm-600"
              />
              <div>
                <div className="text-sm font-medium">{t('testHealing.settings.notify', 'Notify on Low Confidence')}</div>
                <div className="text-xs text-warm-400">{t('testHealing.settings.notifyDesc', 'Flag low-confidence fixes for manual review')}</div>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">{t('testHealing.settings.threshold', 'Confidence Threshold')} ({settings.confidenceThreshold}%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.confidenceThreshold}
                onChange={(e) => setSettings({ ...settings, confidenceThreshold: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-warm-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('testHealing.settings.strategy', 'Preferred Locator Strategy')}</label>
              <select
                value={settings.preferredLocatorStrategy}
                onChange={(e) => setSettings({ ...settings, preferredLocatorStrategy: e.target.value })}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="intent">{t('testHealing.strategy.intent', 'Intent-based (AI semantic)')}</option>
                <option value="testid">{t('testHealing.strategy.testid', 'Test ID (data-testid)')}</option>
                <option value="role">{t('testHealing.strategy.role', 'ARIA Role')}</option>
                <option value="text">{t('testHealing.strategy.text', 'Text content')}</option>
                <option value="css">{t('testHealing.strategy.css', 'CSS Selector')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('testHealing.settings.maxAttempts', 'Max Healing Attempts')}</label>
              <input
                type="number"
                min={1}
                max={10}
                value={settings.maxHealingAttempts}
                onChange={(e) => setSettings({ ...settings, maxHealingAttempts: Number(e.target.value) })}
                className="w-32 bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            {t('testHealing.saveSettings', 'Save Settings')}
          </button>
        </div>
      )}
    </div>
  )
}
