import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listHealingRuns,
  startHealingRun,
  retryHealingRun,
  getHealingStats,
  getBrowsers,
  type SelfHealingRun,
  type BrowserInfo,
  type SelfHealingStats,
} from '../api/selfhealing'

type HealingTab = 'start' | 'runs' | 'stats'

const STATUS_COLORS: Record<string, string> = {
  passed: 'bg-green-600 text-white',
  failed: 'bg-red-600 text-white',
  partial: 'bg-yellow-700 text-yellow-200',
  running: 'bg-blue-600 text-white',
  testing: 'bg-blue-700 text-blue-200',
  healing: 'bg-orange-700 text-orange-200',
  pending: 'bg-warm-600 text-warm-300',
}

const RESULT_COLORS: Record<string, string> = {
  passed: 'text-green-400',
  failed: 'text-red-400',
  partial: 'text-yellow-400',
}

export default function SelfHealingPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<HealingTab>('start')
  const [runs, setRuns] = useState<SelfHealingRun[]>([])
  const [browsers, setBrowsers] = useState<BrowserInfo[]>([])
  const [stats, setStats] = useState<SelfHealingStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Start form
  const [projectName, setProjectName] = useState('')
  const [testCommand, setTestCommand] = useState('npx playwright test')
  const [browserType, setBrowserType] = useState('chromium')
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [starting, setStarting] = useState(false)
  const [lastRun, setLastRun] = useState<SelfHealingRun | null>(null)

  useEffect(() => {
    loadBrowsers()
  }, [])

  useEffect(() => {
    if (tab === 'runs') loadRuns()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadBrowsers() {
    try {
      const data = await getBrowsers()
      setBrowsers(data)
    } catch { /* ignore */ }
  }

  async function loadRuns() {
    setLoading(true)
    try {
      const data = await listHealingRuns()
      setRuns(data)
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

  async function handleStart() {
    if (!projectName.trim()) return
    setStarting(true)
    setLastRun(null)
    try {
      const run = await startHealingRun({ projectName, testCommand, browserType, maxAttempts })
      setLastRun(run)
    } catch { /* ignore */ }
    setStarting(false)
  }

  async function handleRetry(id: string) {
    try {
      const updated = await retryHealingRun(id)
      setRuns(prev => prev.map(r => r.id === id ? updated : r))
    } catch { /* ignore */ }
  }

  function parseJson(json: string): string[] {
    try { return JSON.parse(json) } catch { return [] }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('selfHealing.title', 'Self-Healing Code')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('selfHealing.subtitle', 'Autonomous testing loop with live browser verification')}</p>
      </div>

      <div className="flex gap-2">
        {(['start', 'runs', 'stats'] as HealingTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`selfHealing.tabs.${tabId}`, tabId === 'start' ? 'Start' : tabId === 'runs' ? 'Runs' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Start Tab */}
      {tab === 'start' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('selfHealing.startRun', 'Start Healing Run')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('selfHealing.projectName', 'Project Name')}</label>
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., my-ecommerce-app"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('selfHealing.testCommand', 'Test Command')}</label>
                <input
                  value={testCommand}
                  onChange={e => setTestCommand(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm font-mono"
                  placeholder="npx playwright test"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('selfHealing.browser', 'Browser')}</label>
                <select
                  value={browserType}
                  onChange={e => setBrowserType(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  {browsers.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                  {browsers.length === 0 && (
                    <>
                      <option value="chromium">Chromium</option>
                      <option value="firefox">Firefox</option>
                      <option value="webkit">WebKit</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('selfHealing.maxAttempts', 'Max Attempts')}</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxAttempts}
                  onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleStart}
              disabled={starting || !projectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {starting ? t('selfHealing.starting', 'Starting...') : t('selfHealing.startBtn', 'Start Healing Run')}
            </button>
          </div>

          {/* Run Result */}
          {lastRun && (
            <div className={`bg-warm-800 rounded-lg p-5 border-l-4 ${lastRun.finalResult === 'passed' ? 'border-green-500' : lastRun.finalResult === 'partial' ? 'border-yellow-500' : 'border-red-500'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{t('selfHealing.runResult', 'Run Result')}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[lastRun.status] || 'bg-warm-700 text-warm-300'}`}>
                    {lastRun.status}
                  </span>
                  <span className={`text-sm font-medium ${RESULT_COLORS[lastRun.finalResult] || 'text-warm-300'}`}>
                    {lastRun.finalResult}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{lastRun.testsPassed}</p>
                  <p className="text-xs text-warm-500">{t('selfHealing.passed', 'Passed')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">{lastRun.testsFailed}</p>
                  <p className="text-xs text-warm-500">{t('selfHealing.failed', 'Failed')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{lastRun.currentAttempt}/{lastRun.maxAttempts}</p>
                  <p className="text-xs text-warm-500">{t('selfHealing.attempts', 'Attempts')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{Math.round(lastRun.totalDurationMs)}ms</p>
                  <p className="text-xs text-warm-500">{t('selfHealing.duration', 'Duration')}</p>
                </div>
              </div>
              {parseJson(lastRun.errorsJson).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-warm-500 mb-1">{t('selfHealing.errors', 'Errors Detected')}</p>
                  <div className="space-y-1">
                    {parseJson(lastRun.errorsJson).map((err, i) => (
                      <p key={i} className="text-xs text-red-400 font-mono bg-warm-900 rounded px-2 py-1">{err}</p>
                    ))}
                  </div>
                </div>
              )}
              {parseJson(lastRun.fixesJson).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-warm-500 mb-1">{t('selfHealing.fixes', 'Fixes Applied')}</p>
                  <div className="space-y-1">
                    {parseJson(lastRun.fixesJson).map((fix, i) => (
                      <p key={i} className="text-xs text-green-400 font-mono bg-warm-900 rounded px-2 py-1">{fix}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Browsers */}
          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{t('selfHealing.browsers', 'Supported Browsers')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {browsers.map(b => (
                <div key={b.id} className="bg-warm-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-sm text-white font-medium">{b.name}</span>
                  </div>
                  <p className="text-xs text-warm-400">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Runs Tab */}
      {tab === 'runs' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('selfHealing.loading', 'Loading...')}</p>
          ) : runs.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('selfHealing.noRuns', 'No healing runs yet. Start one from the Start tab!')}</p>
            </div>
          ) : (
            runs.map(r => (
              <div key={r.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{r.projectName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[r.status] || 'bg-warm-700 text-warm-300'}`}>
                        {r.status}
                      </span>
                      <span className={`text-xs font-medium ${RESULT_COLORS[r.finalResult] || 'text-warm-400'}`}>
                        {r.finalResult}
                      </span>
                    </div>
                    <p className="text-warm-500 text-xs font-mono mt-1">{r.testCommand}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-warm-500">
                      <span className="text-green-400">{r.testsPassed} {t('selfHealing.passed', 'passed')}</span>
                      <span className="text-red-400">{r.testsFailed} {t('selfHealing.failed', 'failed')}</span>
                      <span>{r.currentAttempt}/{r.maxAttempts} {t('selfHealing.attempts', 'attempts')}</span>
                      <span>{r.browserType}</span>
                      <span>{Math.round(r.totalDurationMs)}ms</span>
                      <span>{new Date(r.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {r.finalResult !== 'passed' && r.currentAttempt < r.maxAttempts && (
                    <button
                      onClick={() => handleRetry(r.id)}
                      className="px-3 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-600 flex-shrink-0"
                    >
                      {t('selfHealing.retry', 'Retry')}
                    </button>
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
            <p className="text-warm-400 text-sm">{t('selfHealing.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('selfHealing.noStats', 'No healing statistics yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('selfHealing.stats.totalRuns', 'Total Runs'), value: stats.totalRuns },
                  { label: t('selfHealing.stats.passRate', 'Pass Rate'), value: `${stats.passRate}%` },
                  { label: t('selfHealing.stats.healRate', 'Heal Rate'), value: `${stats.healRate}%` },
                  { label: t('selfHealing.stats.avgAttempts', 'Avg Attempts'), value: stats.avgAttempts },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-warm-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.totalTestsPassed}</p>
                  <p className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.totalPassed', 'Tests Passed')}</p>
                </div>
                <div className="bg-warm-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.totalTestsFailed}</p>
                  <p className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.totalFailed', 'Tests Failed')}</p>
                </div>
                <div className="bg-warm-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.avgTestDurationMs}ms</p>
                  <p className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.avgTestTime', 'Avg Test Time')}</p>
                </div>
                <div className="bg-warm-800 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.avgHealingDurationMs}ms</p>
                  <p className="text-xs text-warm-400 mt-1">{t('selfHealing.stats.avgHealTime', 'Avg Heal Time')}</p>
                </div>
              </div>

              {stats.byBrowser.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('selfHealing.stats.byBrowser', 'By Browser')}</h4>
                  <div className="space-y-2">
                    {stats.byBrowser.map(b => {
                      const info = browsers.find(br => br.id === b.browser)
                      return (
                        <div key={b.browser} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info?.color || '#6b7280' }} />
                            <span className="text-sm text-white">{info?.name || b.browser}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-warm-500">
                            <span>{b.count} {t('selfHealing.runs', 'runs')}</span>
                            <span>{b.passRate}% {t('selfHealing.passRate', 'pass rate')}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {stats.byResult.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('selfHealing.stats.byResult', 'By Result')}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {stats.byResult.map(r => (
                      <div key={r.result} className="bg-warm-700 rounded-lg p-3 text-center">
                        <p className={`text-xl font-bold ${RESULT_COLORS[r.result] || 'text-white'}`}>{r.count}</p>
                        <p className="text-xs text-warm-400 mt-1 capitalize">{r.result}</p>
                      </div>
                    ))}
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
