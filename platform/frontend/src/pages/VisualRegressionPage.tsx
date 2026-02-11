import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { VisualRegressionResult, Viewport, VisualRegressionStats } from '../api/visualregression'
import { listResults, captureBaseline, runComparison, getViewports, getVisualRegressionStats } from '../api/visualregression'

type Tab = 'capture' | 'results' | 'stats'

export default function VisualRegressionPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('capture')
  const [projectName, setProjectName] = useState('')
  const [pageUrl, setPageUrl] = useState('')
  const [viewport, setViewport] = useState('1280x720')
  const [threshold, setThreshold] = useState(0.1)
  const [viewports, setViewports] = useState<Viewport[]>([])
  const [result, setResult] = useState<VisualRegressionResult | null>(null)
  const [results, setResults] = useState<VisualRegressionResult[]>([])
  const [stats, setStats] = useState<VisualRegressionStats | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    getViewports().then(setViewports).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'results') listResults().then(setResults).catch(() => {})
    if (tab === 'stats') getVisualRegressionStats().then(setStats).catch(() => {})
  }, [tab])

  const handleCapture = async () => {
    if (!projectName.trim()) return
    setCapturing(true)
    try {
      const res = await captureBaseline(projectName, pageUrl || '/', viewport, threshold)
      setResult(res)
    } catch { /* ignore */ }
    setCapturing(false)
  }

  const handleCompare = async () => {
    if (!projectName.trim()) return
    setComparing(true)
    try {
      const res = await runComparison(projectName, pageUrl || '/', viewport, threshold)
      setResult(res)
    } catch { /* ignore */ }
    setComparing(false)
  }

  const statusBadge = (passed: boolean, status: string) => {
    if (status === 'baseline_captured') return 'bg-blue-900/30 text-blue-400'
    return passed ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
  }

  const statusLabel = (passed: boolean, status: string) => {
    if (status === 'baseline_captured') return t('visualRegression.baseline', 'Baseline')
    return passed ? t('visualRegression.passed', 'Passed') : t('visualRegression.failed', 'Failed')
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('visualRegression.title', 'Visual Regression Testing')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('visualRegression.subtitle', 'Capture screenshots and detect visual differences across project iterations')}</p>

      <div className="flex gap-2 mb-6">
        {(['capture', 'results', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`visualRegression.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'capture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('visualRegression.projectName', 'Project Name')}</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Web App"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('visualRegression.pageUrl', 'Page URL')}</label>
                <input
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  placeholder="/"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('visualRegression.viewport', 'Viewport')}</label>
                <select
                  value={viewport}
                  onChange={(e) => setViewport(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {viewports.map((vp) => (
                    <option key={vp.id} value={`${vp.width}x${vp.height}`}>{vp.name} ({vp.width}x{vp.height})</option>
                  ))}
                  {viewports.length === 0 && <option value="1280x720">Desktop (1280x720)</option>}
                </select>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{t('visualRegression.threshold', 'Threshold')}</span>
                  <span className="text-blue-400">{threshold}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{t('visualRegression.thresholdDesc', 'Maximum allowed mismatch percentage')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCapture}
                  disabled={capturing || !projectName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {capturing ? t('visualRegression.capturing', 'Capturing...') : t('visualRegression.captureBtn', 'Capture Baseline')}
                </button>
                <button
                  onClick={handleCompare}
                  disabled={comparing || !projectName.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                >
                  {comparing ? t('visualRegression.comparing', 'Comparing...') : t('visualRegression.compareBtn', 'Run Compare')}
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{result.projectName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(result.passed, result.status)}`}>{statusLabel(result.passed, result.status)}</span>
                </div>
                <span className="text-xs text-gray-500">{result.viewportSize}</span>
              </div>

              {result.status === 'completed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {result.mismatchPercentage}%
                    </div>
                    <div className="text-sm text-gray-400">
                      <div>{t('visualRegression.mismatch', 'Mismatch')}</div>
                      <div className="text-xs">{result.pixelsDifferent.toLocaleString()} / {result.totalPixels.toLocaleString()} {t('visualRegression.pixels', 'pixels')}</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(result.mismatchPercentage * 10, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{result.captureTimeMs}ms</div>
                  <div className="text-xs text-gray-400">{t('visualRegression.captureTime', 'Capture')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{result.compareTimeMs}ms</div>
                  <div className="text-xs text-gray-400">{t('visualRegression.compareTime', 'Compare')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{result.threshold}%</div>
                  <div className="text-xs text-gray-400">{t('visualRegression.thresholdLabel', 'Threshold')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{result.viewportSize}</div>
                  <div className="text-xs text-gray-400">{t('visualRegression.viewportLabel', 'Viewport')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'results' && (
        <div className="space-y-3">
          {results.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t('visualRegression.noResults', 'No test results yet. Capture a baseline to get started!')}</div>
          )}
          {results.map((r) => (
            <div key={r.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{r.projectName}</div>
                <div className="text-xs text-gray-400 mt-1">{r.pageUrl} — {r.viewportSize}</div>
              </div>
              <div className="flex items-center gap-3">
                {r.status === 'completed' && (
                  <span className={`text-sm font-bold ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {r.mismatchPercentage}%
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(r.passed, r.status)}`}>{statusLabel(r.passed, r.status)}</span>
                <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTests}</div>
              <div className="text-sm text-gray-400">{t('visualRegression.stats.total', 'Total Tests')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.passedTests}</div>
              <div className="text-sm text-gray-400">{t('visualRegression.stats.passed', 'Passed')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.failedTests}</div>
              <div className="text-sm text-gray-400">{t('visualRegression.stats.failed', 'Failed')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.passRate}%</div>
              <div className="text-sm text-gray-400">{t('visualRegression.stats.passRate', 'Pass Rate')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.avgMismatch}%</div>
              <div className="text-sm text-gray-400">{t('visualRegression.stats.avgMismatch', 'Avg Mismatch')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalPixelsAnalyzed.toLocaleString()}</div>
              <div className="text-sm text-gray-400">{t('visualRegression.stats.pixels', 'Pixels Analyzed')}</div>
            </div>
          </div>
          {stats.recentResults.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">{t('visualRegression.stats.recent', 'Recent Results')}</h4>
              <div className="space-y-2">
                {stats.recentResults.map((r, i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{r.projectName}</span>
                      <span className="text-xs text-gray-400 ml-2">{r.pageUrl}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${r.passed ? 'text-green-400' : 'text-red-400'}`}>{r.mismatchPercentage}%</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(r.passed, r.status)}`}>{statusLabel(r.passed, r.status)}</span>
                      <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
