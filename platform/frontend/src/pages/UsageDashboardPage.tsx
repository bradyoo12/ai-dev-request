import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getUsageSummary,
  getUsageHistory,
  getProjectCostBreakdown,
  getSpendingAlerts,
  type UsageSummary,
  type UsageMeter,
  type ProjectCostBreakdown,
  type SpendingAlertResult,
} from '../api/usage-metering'

export default function UsageDashboardPage() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [history, setHistory] = useState<UsageMeter[]>([])
  const [alerts, setAlerts] = useState<SpendingAlertResult | null>(null)
  const [projectId, setProjectId] = useState('')
  const [projectCosts, setProjectCosts] = useState<ProjectCostBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [summaryData, historyData, alertData] = await Promise.all([
        getUsageSummary(),
        getUsageHistory(20),
        getSpendingAlerts(),
      ])
      setSummary(summaryData)
      setHistory(historyData)
      setAlerts(alertData)
    } catch {
      setError(t('usageDashboard.error.loadFailed', 'Failed to load usage data'))
    } finally {
      setLoading(false)
    }
  }

  async function handleProjectLookup() {
    if (!projectId.trim()) return
    try {
      const data = await getProjectCostBreakdown(projectId)
      setProjectCosts(data)
    } catch {
      setError(t('usageDashboard.error.projectFailed', 'Failed to load project costs'))
    }
  }

  const meterTypeLabel = (type: string) => {
    switch (type) {
      case 'ai_compute': return t('usageDashboard.type.aiCompute', 'AI Compute')
      case 'build_minutes': return t('usageDashboard.type.buildMinutes', 'Build Minutes')
      case 'test_runs': return t('usageDashboard.type.testRuns', 'Test Runs')
      case 'preview_deploys': return t('usageDashboard.type.previewDeploys', 'Preview Deploys')
      default: return type
    }
  }

  const outcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'success': return 'bg-green-900/50 text-green-300'
      case 'failed': return 'bg-red-900/50 text-red-300'
      case 'partial': return 'bg-yellow-900/50 text-yellow-300'
      default: return 'bg-warm-700 text-warm-300'
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'billed': return 'bg-blue-900/50 text-blue-300'
      case 'credited': return 'bg-green-900/50 text-green-300'
      case 'pending': return 'bg-yellow-900/50 text-yellow-300'
      default: return 'bg-warm-700 text-warm-300'
    }
  }

  const alertBadge = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-900/30 border-red-700 text-red-300'
      case 'warning': return 'bg-yellow-900/30 border-yellow-700 text-yellow-300'
      case 'info': return 'bg-blue-900/30 border-blue-700 text-blue-300'
      default: return 'bg-warm-700 border-warm-600 text-warm-300'
    }
  }

  // Compute max cost for bar chart normalization
  const costValues = summary ? [
    summary.aiComputeCost,
    summary.buildMinutesCost,
    summary.testRunsCost,
    summary.previewDeploysCost,
  ] : []
  const maxCost = Math.max(...costValues, 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('usageDashboard.title', 'Usage Dashboard')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('usageDashboard.subtitle', 'Effort-based pricing with usage metering and outcome billing')}</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
        >
          {showHistory ? t('usageDashboard.hideSummary', 'Summary') : t('usageDashboard.showHistory', 'History')}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Spending Alerts */}
      {!loading && alerts && alerts.alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.alerts.map((alert, idx) => (
            <div key={idx} className={`border rounded-lg p-4 flex items-center gap-3 ${alertBadge(alert.level)}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
              <div>
                <span className="text-xs font-semibold uppercase">{alert.level}</span>
                <p className="text-sm">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && summary && !showHistory && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-blue-400">${summary.totalSpend.toFixed(2)}</div>
              <div className="text-xs text-warm-400 mt-2">{t('usageDashboard.totalSpend', 'Total Spend')}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-purple-400">${summary.aiComputeCost.toFixed(2)}</div>
              <div className="text-xs text-warm-400 mt-2">{t('usageDashboard.type.aiCompute', 'AI Compute')}</div>
              <div className="text-xs text-warm-500 mt-1">{summary.aiComputeUnits.toFixed(0)} {t('usageDashboard.units', 'units')}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-yellow-400">${summary.buildMinutesCost.toFixed(2)}</div>
              <div className="text-xs text-warm-400 mt-2">{t('usageDashboard.type.buildMinutes', 'Build Minutes')}</div>
              <div className="text-xs text-warm-500 mt-1">{summary.buildMinutesUnits.toFixed(0)} {t('usageDashboard.minutes', 'min')}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-green-400">${summary.testRunsCost.toFixed(2)}</div>
              <div className="text-xs text-warm-400 mt-2">{t('usageDashboard.type.testRuns', 'Test Runs')}</div>
              <div className="text-xs text-warm-500 mt-1">{summary.testRunsUnits.toFixed(0)} {t('usageDashboard.runs', 'runs')}</div>
            </div>
          </div>

          {/* Cost Breakdown Chart (bar visualization) */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-4">{t('usageDashboard.costBreakdown', 'Cost Breakdown')}</h4>
            <div className="space-y-3">
              {[
                { label: t('usageDashboard.type.aiCompute', 'AI Compute'), value: summary.aiComputeCost, color: 'bg-purple-500' },
                { label: t('usageDashboard.type.buildMinutes', 'Build Minutes'), value: summary.buildMinutesCost, color: 'bg-yellow-500' },
                { label: t('usageDashboard.type.testRuns', 'Test Runs'), value: summary.testRunsCost, color: 'bg-green-500' },
                { label: t('usageDashboard.type.previewDeploys', 'Preview Deploys'), value: summary.previewDeploysCost, color: 'bg-blue-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-warm-300">{item.label}</span>
                    <span className="text-warm-400">${item.value.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-warm-700 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${maxCost > 0 ? (item.value / maxCost) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outcome Stats */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-4">{t('usageDashboard.outcomeStats', 'Outcome Statistics')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{summary.successCount}</div>
                <div className="text-xs text-warm-400 mt-1">{t('usageDashboard.outcome.success', 'Success')}</div>
              </div>
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{summary.failedCount}</div>
                <div className="text-xs text-warm-400 mt-1">{t('usageDashboard.outcome.failed', 'Failed')}</div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{summary.partialCount}</div>
                <div className="text-xs text-warm-400 mt-1">{t('usageDashboard.outcome.partial', 'Partial')}</div>
              </div>
            </div>
          </div>

          {/* Spending Summary */}
          {alerts && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-4">{t('usageDashboard.spendingSummary', 'Monthly Spending')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-400">${alerts.monthlySpend.toFixed(2)}</div>
                  <div className="text-xs text-warm-400 mt-1">{t('usageDashboard.currentSpend', 'Current Month')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-warm-300">${alerts.projectedMonthly.toFixed(2)}</div>
                  <div className="text-xs text-warm-400 mt-1">{t('usageDashboard.projected', 'Projected')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-400">${alerts.warningThreshold.toFixed(2)}</div>
                  <div className="text-xs text-warm-400 mt-1">{t('usageDashboard.warningLimit', 'Warning Limit')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-400">${alerts.criticalThreshold.toFixed(2)}</div>
                  <div className="text-xs text-warm-400 mt-1">{t('usageDashboard.criticalLimit', 'Critical Limit')}</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-warm-700 rounded-full h-3 relative">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      alerts.monthlySpend >= alerts.criticalThreshold ? 'bg-red-500' :
                      alerts.monthlySpend >= alerts.warningThreshold ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((alerts.monthlySpend / alerts.criticalThreshold) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-warm-500 mt-1">
                  <span>$0</span>
                  <span>${alerts.criticalThreshold.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Per-Project Cost Lookup */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-4">{t('usageDashboard.projectCosts', 'Per-Project Cost Breakdown')}</h4>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder={t('usageDashboard.projectIdPlaceholder', 'Enter project ID...')}
                className="flex-1 bg-warm-700 border border-warm-600 rounded px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={handleProjectLookup}
                disabled={!projectId.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
              >
                {t('usageDashboard.lookup', 'Lookup')}
              </button>
            </div>

            {projectCosts && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-warm-400">{t('usageDashboard.projectTotal', 'Total Project Cost')}</span>
                  <span className="text-lg font-bold text-blue-400">${projectCosts.totalCost.toFixed(2)}</span>
                </div>
                {projectCosts.byType.length > 0 && (
                  <div className="space-y-2">
                    {projectCosts.byType.map((tc) => (
                      <div key={tc.meterType} className="bg-warm-700/50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm">{meterTypeLabel(tc.meterType)}</span>
                          <span className="text-xs text-warm-500 ml-2">{tc.count} {t('usageDashboard.records', 'records')}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">${tc.totalCost.toFixed(2)}</div>
                          <div className="text-xs text-warm-500">{tc.units.toFixed(1)} {t('usageDashboard.units', 'units')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {projectCosts.byOutcome.length > 0 && (
                  <div className="flex gap-3 mt-2">
                    {projectCosts.byOutcome.map((oc) => (
                      <div key={oc.outcome} className="bg-warm-700/50 rounded-lg p-2 px-3 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${outcomeBadge(oc.outcome)}`}>{oc.outcome}</span>
                        <span className="text-sm">${oc.totalCost.toFixed(2)}</span>
                        <span className="text-xs text-warm-500">({oc.count})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {projectCosts && projectCosts.totalRecords === 0 && (
              <p className="text-warm-400 text-sm">{t('usageDashboard.noProjectData', 'No usage data for this project.')}</p>
            )}
          </div>
        </>
      )}

      {/* Usage History Timeline */}
      {!loading && showHistory && (
        <div className="bg-warm-800 rounded-xl p-6">
          <h4 className="font-semibold mb-4">{t('usageDashboard.historyTitle', 'Usage History')}</h4>
          {history.length === 0 ? (
            <p className="text-warm-400 text-sm">{t('usageDashboard.noHistory', 'No usage history.')}</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-warm-700/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${outcomeBadge(h.outcome)}`}>
                      {h.outcome}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(h.status)}`}>
                      {h.status}
                    </span>
                    <span className="text-sm">{meterTypeLabel(h.meterType)}</span>
                    <span className="text-xs text-warm-500">{h.units.toFixed(1)} {t('usageDashboard.units', 'units')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">${h.totalCost.toFixed(4)}</span>
                    <span className="text-xs text-warm-500">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !summary && !error && (
        <div className="bg-warm-800 rounded-xl p-12 text-center">
          <div className="text-warm-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <path d="M3 3v18h18"/>
              <path d="m19 9-5 5-4-4-3 3"/>
            </svg>
          </div>
          <p className="text-warm-400">{t('usageDashboard.empty', 'No usage data yet. Usage will appear here as you use AI compute, build minutes, test runs, and preview deploys.')}</p>
        </div>
      )}
    </div>
  )
}
