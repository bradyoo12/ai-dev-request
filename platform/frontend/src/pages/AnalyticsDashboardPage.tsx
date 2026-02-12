import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getDashboardMetrics,
  getFunnelData,
  getUsageBreakdown,
  getTrends,
} from '../api/analytics-dashboard'
import type {
  DashboardMetrics,
  FunnelData,
  UsageBreakdown,
  TrendPoint,
} from '../api/analytics-dashboard'

type Period = 'daily' | 'weekly' | 'monthly'
type TrendMetric = 'active_users' | 'total_events' | 'requests' | 'builds' | 'deployments'

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation()

  const [period, setPeriod] = useState<Period>('weekly')
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('total_events')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null)
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [usage, setUsage] = useState<UsageBreakdown[]>([])
  const [trends, setTrends] = useState<TrendPoint[]>([])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [dashData, funnelData, usageData, trendData] = await Promise.all([
        getDashboardMetrics(period),
        getFunnelData(period),
        getUsageBreakdown(period),
        getTrends(period, trendMetric),
      ])
      setDashboard(dashData)
      setFunnel(funnelData)
      setUsage(usageData)
      setTrends(trendData)
    } catch {
      setError(t('analytics.loadError', 'Failed to load analytics data'))
    } finally {
      setLoading(false)
    }
  }, [period, trendMetric, t])

  useEffect(() => { loadData() }, [loadData])

  const maxFunnelCount = funnel?.stages?.[0]?.count || 1

  if (loading) {
    return (
      <div className="text-center py-12 text-warm-400">
        {t('analytics.loading', 'Loading analytics...')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            {t('analytics.title', 'Product Analytics')}
          </span>
        </h3>
        <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'
              }`}
            >
              {t(`analytics.period.${p}`, p.charAt(0).toUpperCase() + p.slice(1))}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-warm-900 rounded-xl p-4">
            <div className="text-sm text-warm-400 mb-1">{t('analytics.activeUsers', 'Active Users')}</div>
            <div className="text-2xl font-bold text-blue-400">{dashboard.activeUsers}</div>
          </div>
          <div className="bg-warm-900 rounded-xl p-4">
            <div className="text-sm text-warm-400 mb-1">{t('analytics.totalRequests', 'Total Requests')}</div>
            <div className="text-2xl font-bold text-green-400">{dashboard.totalRequests}</div>
          </div>
          <div className="bg-warm-900 rounded-xl p-4">
            <div className="text-sm text-warm-400 mb-1">{t('analytics.completionRate', 'Completion Rate')}</div>
            <div className="text-2xl font-bold text-yellow-400">{dashboard.completionRate}%</div>
          </div>
          <div className="bg-warm-900 rounded-xl p-4">
            <div className="text-sm text-warm-400 mb-1">{t('analytics.avgBuildTime', 'Avg Build Time')}</div>
            <div className="text-2xl font-bold text-purple-400">{dashboard.avgBuildTimeMinutes}m</div>
          </div>
        </div>
      )}

      {/* Funnel Visualization */}
      {funnel && funnel.stages.length > 0 && (
        <div className="bg-warm-900 rounded-xl p-6">
          <h4 className="text-md font-bold mb-4">
            {t('analytics.funnelTitle', 'Conversion Funnel')}
          </h4>
          <div className="space-y-3">
            {funnel.stages.map((stage) => {
              const widthPercent = maxFunnelCount > 0
                ? Math.max((stage.count / maxFunnelCount) * 100, 2)
                : 2
              return (
                <div key={stage.name} className="flex items-center gap-3">
                  <div className="w-40 text-sm text-warm-300 truncate">{stage.name}</div>
                  <div className="flex-1 bg-warm-800 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                      {stage.count}
                    </span>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs text-green-400">{stage.conversionRate}%</span>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs text-red-400">-{stage.dropOffRate}%</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
            <div className="w-40" />
            <div className="flex-1" />
            <div className="w-20 text-right">{t('analytics.conversion', 'Conv.')}</div>
            <div className="w-20 text-right">{t('analytics.dropOff', 'Drop-off')}</div>
          </div>
        </div>
      )}

      {/* Usage Breakdown */}
      {usage.length > 0 && (
        <div className="bg-warm-900 rounded-xl p-6">
          <h4 className="text-md font-bold mb-4">
            {t('analytics.usageTitle', 'Feature Usage Breakdown')}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-warm-400 border-b border-warm-700">
                  <th className="text-left py-2 px-3">{t('analytics.eventType', 'Event Type')}</th>
                  <th className="text-right py-2 px-3">{t('analytics.count', 'Count')}</th>
                  <th className="text-right py-2 px-3">{t('analytics.uniqueUsers', 'Unique Users')}</th>
                  <th className="text-left py-2 px-3 w-1/3">{t('analytics.distribution', 'Distribution')}</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((item) => {
                  const maxCount = usage[0]?.count || 1
                  const barWidth = Math.max((item.count / maxCount) * 100, 2)
                  return (
                    <tr key={item.eventType} className="border-b border-warm-800">
                      <td className="py-2 px-3 font-mono text-xs text-blue-400">{item.eventType}</td>
                      <td className="py-2 px-3 text-right text-warm-300">{item.count}</td>
                      <td className="py-2 px-3 text-right text-warm-300">{item.uniqueUsers}</td>
                      <td className="py-2 px-3">
                        <div className="bg-warm-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends Section */}
      <div className="bg-warm-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-bold">
            {t('analytics.trendsTitle', 'Trends')}
          </h4>
          <select
            value={trendMetric}
            onChange={(e) => setTrendMetric(e.target.value as TrendMetric)}
            className="bg-warm-800 text-white rounded-lg px-3 py-1 text-sm border border-warm-700"
          >
            <option value="total_events">{t('analytics.metric.totalEvents', 'Total Events')}</option>
            <option value="active_users">{t('analytics.metric.activeUsers', 'Active Users')}</option>
            <option value="requests">{t('analytics.metric.requests', 'Requests')}</option>
            <option value="builds">{t('analytics.metric.builds', 'Builds')}</option>
            <option value="deployments">{t('analytics.metric.deployments', 'Deployments')}</option>
          </select>
        </div>

        {trends.length > 0 ? (
          <div className="space-y-2">
            {/* Simple bar chart */}
            <div className="flex items-end gap-1 h-40">
              {trends.map((point) => {
                const maxVal = Math.max(...trends.map((t) => t.value), 1)
                const heightPercent = (point.value / maxVal) * 100
                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center justify-end"
                    title={`${point.date}: ${point.value}`}
                  >
                    <div className="text-xs text-warm-400 mb-1">{Math.round(point.value)}</div>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-500 min-h-[2px]"
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-1">
              {trends.map((point) => (
                <div key={point.date} className="flex-1 text-center text-xs text-warm-500 truncate">
                  {point.date.slice(5)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-warm-400 text-sm">
            {t('analytics.noTrendData', 'No trend data available for this period.')}
          </div>
        )}
      </div>
    </div>
  )
}
