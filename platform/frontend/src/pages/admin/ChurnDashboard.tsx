import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  getChurnOverview, getChurnTrends, getChurnByPlan, getSubscriptionEvents, getChurnExportUrl
} from '../../api/admin'
import type { ChurnOverview, ChurnTrend, ChurnByPlan, SubscriptionEvent } from '../../api/admin'

export default function ChurnDashboard() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<ChurnOverview | null>(null)
  const [trends, setTrends] = useState<ChurnTrend[]>([])
  const [planData, setPlanData] = useState<ChurnByPlan[]>([])
  const [events, setEvents] = useState<SubscriptionEvent[]>([])
  const [eventsTotal, setEventsTotal] = useState(0)
  const [eventsPage, setEventsPage] = useState(1)
  const [eventFilter, setEventFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const eventsPageSize = 20

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadEvents()
  }, [eventsPage, eventFilter, planFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewData, trendsData, planDataResult] = await Promise.all([
        getChurnOverview(),
        getChurnTrends(12),
        getChurnByPlan(),
      ])
      setOverview(overviewData)
      setTrends(trendsData)
      setPlanData(planDataResult)
    } catch {
      // Silent fail - dashboard will show empty state
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const data = await getSubscriptionEvents(eventsPage, eventsPageSize, eventFilter, planFilter)
      setEvents(data.items)
      setEventsTotal(data.total)
    } catch {
      // Silent fail
    }
  }

  const formatKrw = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount)
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Created': return 'bg-green-600'
      case 'Upgraded': return 'bg-blue-600'
      case 'Downgraded': return 'bg-orange-600'
      case 'Canceled': return 'bg-red-600'
      case 'Renewed': return 'bg-purple-600'
      case 'Reactivated': return 'bg-teal-600'
      default: return 'bg-gray-600'
    }
  }

  const getChangeIndicator = (value: number, inverted = false) => {
    const isPositive = inverted ? value < 0 : value > 0
    if (value === 0) return <span className="text-gray-400 text-sm">-</span>
    return (
      <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '\u25B2' : '\u25BC'} {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  const totalPages = Math.ceil(eventsTotal / eventsPageSize)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('churn.loading')}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">{t('churn.title')}</h3>
          <p className="text-gray-400 text-sm mt-1">{t('churn.description')}</p>
        </div>
        <a
          href={getChurnExportUrl()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          {t('churn.exportCsv')}
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('churn.activeSubscribers')}</div>
          <div className="text-2xl font-bold">{overview?.activeSubscribers.toLocaleString() ?? 0}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('churn.churnRate')}</div>
          <div className="text-2xl font-bold">{overview?.churnRate ?? 0}%</div>
          {overview && getChangeIndicator(Number(overview.churnRateChange), true)}
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('churn.mrr')}</div>
          <div className="text-2xl font-bold">{formatKrw(Number(overview?.mrr ?? 0))}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">{t('churn.netGrowth')}</div>
          <div className="text-2xl font-bold">
            {(overview?.netGrowth ?? 0) >= 0 ? '+' : ''}{overview?.netGrowth ?? 0}
          </div>
          <span className="text-sm text-gray-400">
            vs {overview?.netGrowthPrevious ?? 0} {t('churn.lastMonth')}
          </span>
        </div>
      </div>

      {/* Trend Chart */}
      {trends.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h4 className="font-bold mb-4">{t('churn.trendTitle')}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="churnRate"
                name={t('churn.churnRate')}
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalSubscribers"
                name={t('churn.subscribers')}
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Churn by Plan */}
      {planData.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h4 className="font-bold mb-4">{t('churn.byPlanTitle')}</h4>
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-2">{t('churn.plan')}</th>
                  <th className="pb-2 text-right">{t('churn.active')}</th>
                  <th className="pb-2 text-right">{t('churn.churned')}</th>
                  <th className="pb-2 text-right">{t('churn.churnRate')}</th>
                  <th className="pb-2 text-right">{t('churn.revenueLost')}</th>
                </tr>
              </thead>
              <tbody>
                {planData.map(row => (
                  <tr key={row.plan} className="border-b border-gray-700/50">
                    <td className="py-3 font-medium">{row.plan}</td>
                    <td className="py-3 text-right">{row.activeSubscribers.toLocaleString()}</td>
                    <td className="py-3 text-right">{row.churnedSubscribers}</td>
                    <td className="py-3 text-right">{row.churnRate}%</td>
                    <td className="py-3 text-right">{formatKrw(row.revenueLost)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-3">{t('churn.total')}</td>
                  <td className="py-3 text-right">{planData.reduce((s, r) => s + r.activeSubscribers, 0).toLocaleString()}</td>
                  <td className="py-3 text-right">{planData.reduce((s, r) => s + r.churnedSubscribers, 0)}</td>
                  <td className="py-3 text-right">{overview?.churnRate ?? 0}%</td>
                  <td className="py-3 text-right">{formatKrw(planData.reduce((s, r) => s + r.revenueLost, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscription Events */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold">{t('churn.eventsTitle')}</h4>
          <div className="flex gap-2">
            <select
              value={eventFilter}
              onChange={(e) => { setEventFilter(e.target.value); setEventsPage(1) }}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">{t('churn.filter.allEvents')}</option>
              <option value="Created">{t('churn.event.created')}</option>
              <option value="Upgraded">{t('churn.event.upgraded')}</option>
              <option value="Downgraded">{t('churn.event.downgraded')}</option>
              <option value="Canceled">{t('churn.event.canceled')}</option>
              <option value="Renewed">{t('churn.event.renewed')}</option>
              <option value="Reactivated">{t('churn.event.reactivated')}</option>
            </select>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setEventsPage(1) }}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">{t('churn.filter.allPlans')}</option>
              <option value="Free">Free</option>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">{t('churn.noEvents')}</div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-2">{t('churn.time')}</th>
                    <th className="pb-2">{t('churn.user')}</th>
                    <th className="pb-2">{t('churn.eventType')}</th>
                    <th className="pb-2">{t('churn.planChange')}</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id} className="border-b border-gray-700/30">
                      <td className="py-2 text-sm text-gray-400">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 text-sm">
                        {event.userEmail || event.userId.slice(0, 8) + '...'}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                          {t(`churn.event.${event.eventType.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="py-2 text-sm">
                        {event.fromPlan && event.toPlan ? (
                          <span>{event.fromPlan} &rarr; {event.toPlan}</span>
                        ) : event.toPlan ? (
                          <span>- &rarr; {event.toPlan}</span>
                        ) : event.fromPlan ? (
                          <span>{event.fromPlan} &rarr; -</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                  disabled={eventsPage === 1}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm"
                >
                  &larr;
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-400">
                  {eventsPage} / {totalPages}
                </span>
                <button
                  onClick={() => setEventsPage(p => Math.min(totalPages, p + 1))}
                  disabled={eventsPage === totalPages}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm"
                >
                  &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
