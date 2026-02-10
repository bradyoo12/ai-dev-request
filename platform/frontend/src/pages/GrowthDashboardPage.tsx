import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getGrowthOverview, getGrowthTrends, getGrowthFunnel, exportGrowthCsv
} from '../api/growth'
import type { GrowthOverview, GrowthTrend, FunnelStep } from '../api/growth'

export default function GrowthDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [overview, setOverview] = useState<GrowthOverview | null>(null)
  const [trends, setTrends] = useState<GrowthTrend[]>([])
  const [funnel, setFunnel] = useState<FunnelStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewData, trendsData, funnelData] = await Promise.all([
        getGrowthOverview(),
        getGrowthTrends(12),
        getGrowthFunnel(),
      ])
      setOverview(overviewData)
      setTrends(trendsData)
      setFunnel(funnelData)
    } catch {
      setError(t('error.requestFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getGrowthIndicator = (value: number) => {
    if (value === 0) return <span className="text-gray-400 text-sm">-</span>
    const isPositive = value > 0
    return (
      <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '\u25B2' : '\u25BC'} {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  const maxTrendValue = trends.length > 0
    ? Math.max(...trends.map(t => Math.max(t.visitors, t.registered, t.trialUsers, t.paidUsers)), 1)
    : 1

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">&larr;</button>
          <h2 className="text-2xl font-bold">{t('growth.title')}</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">{t('growth.loading', 'Loading...')}</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">&larr;</button>
        <h2 className="text-2xl font-bold">{t('growth.title')}</h2>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-400 text-sm">{t('growth.description', 'Track visitor, trial, and paid user growth metrics.')}</p>
        </div>
        <button
          onClick={() => exportGrowthCsv()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          {t('growth.export')}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-red-400">{error}</span>
          <button onClick={loadData} className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-lg text-sm">{t('common.retry', 'Retry')}</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('growth.visitors')}</div>
          <div className="text-2xl font-bold">{overview?.totalVisitors.toLocaleString() ?? 0}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('growth.trialUsers')}</div>
          <div className="text-2xl font-bold">{overview?.totalTrialUsers.toLocaleString() ?? 0}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('growth.paidUsers')}</div>
          <div className="text-2xl font-bold">{overview?.totalPaidUsers.toLocaleString() ?? 0}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('growth.growthRate')}</div>
          <div className="text-2xl font-bold">{overview?.monthlyGrowthRate ?? 0}%</div>
          {overview && getGrowthIndicator(overview.monthlyGrowthRate)}
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('growth.registered')}</div>
          <div className="text-xl font-bold">{overview?.totalRegistered.toLocaleString() ?? 0}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('growth.conversionRate')}</div>
          <div className="text-xl font-bold">{overview?.conversionRate ?? 0}%</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('growth.churnRate')}</div>
          <div className="text-xl font-bold">{overview?.churnRate ?? 0}%</div>
        </div>
      </div>

      {/* Monthly Trends (Bar Chart) */}
      {trends.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h4 className="font-bold mb-4">{t('growth.trends')}</h4>
          <div className="space-y-3">
            {trends.map((trend) => (
              <div key={trend.month}>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                  <span>{trend.month}</span>
                  <span>
                    {t('growth.visitors')}: {trend.visitors.toLocaleString()} |{' '}
                    {t('growth.registered')}: {trend.registered.toLocaleString()} |{' '}
                    {t('growth.trialUsers')}: {trend.trialUsers.toLocaleString()} |{' '}
                    {t('growth.paidUsers')}: {trend.paidUsers.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-1">
                  {/* Visitors bar */}
                  <div
                    className="h-3 bg-blue-500 rounded-sm transition-all"
                    style={{ width: `${(trend.visitors / maxTrendValue) * 100}%`, minWidth: trend.visitors > 0 ? '2px' : '0' }}
                    title={`${t('growth.visitors')}: ${trend.visitors}`}
                  />
                </div>
                <div className="flex gap-1 mt-0.5">
                  {/* Registered bar */}
                  <div
                    className="h-2 bg-green-500 rounded-sm transition-all"
                    style={{ width: `${(trend.registered / maxTrendValue) * 100}%`, minWidth: trend.registered > 0 ? '2px' : '0' }}
                    title={`${t('growth.registered')}: ${trend.registered}`}
                  />
                </div>
                <div className="flex gap-1 mt-0.5">
                  {/* Trial bar */}
                  <div
                    className="h-2 bg-yellow-500 rounded-sm transition-all"
                    style={{ width: `${(trend.trialUsers / maxTrendValue) * 100}%`, minWidth: trend.trialUsers > 0 ? '2px' : '0' }}
                    title={`${t('growth.trialUsers')}: ${trend.trialUsers}`}
                  />
                </div>
                <div className="flex gap-1 mt-0.5">
                  {/* Paid bar */}
                  <div
                    className="h-2 bg-purple-500 rounded-sm transition-all"
                    style={{ width: `${(trend.paidUsers / maxTrendValue) * 100}%`, minWidth: trend.paidUsers > 0 ? '2px' : '0' }}
                    title={`${t('growth.paidUsers')}: ${trend.paidUsers}`}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              {t('growth.visitors')}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-green-500 rounded-sm" />
              {t('growth.registered')}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-yellow-500 rounded-sm" />
              {t('growth.trialUsers')}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-purple-500 rounded-sm" />
              {t('growth.paidUsers')}
            </div>
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      {funnel.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h4 className="font-bold mb-4">{t('growth.funnel')}</h4>
          <div className="space-y-4">
            {funnel.map((step, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500']
              const color = colors[index % colors.length]
              return (
                <div key={step.stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{step.stage}</span>
                    <span className="text-gray-400">
                      {step.count.toLocaleString()} ({step.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className={`${color} h-full rounded-full transition-all flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(step.percentage, 2)}%` }}
                    >
                      {step.percentage >= 10 && (
                        <span className="text-xs font-medium text-white">{step.percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Conversion rates between stages */}
          {funnel.length >= 2 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                {funnel.slice(1).map((step, i) => {
                  const prevCount = funnel[i].count
                  const rate = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '0.0'
                  return (
                    <span key={step.stage}>
                      {funnel[i].stage} &rarr; {step.stage}: <span className="text-white font-medium">{rate}%</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!overview && trends.length === 0 && funnel.length === 0 && (
        <div className="text-center py-12 text-gray-400">{t('growth.noData')}</div>
      )}
    </section>
  )
}
