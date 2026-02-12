import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getTraces,
  getTrace,
  getCostAnalytics,
  getPerformanceMetrics,
  getUsageAnalytics,
  type TraceRecord,
  type TraceDetailResult,
  type CostAnalyticsResult,
  type PerformanceMetricsResult,
  type UsageAnalyticsResult,
} from '../api/observability'

type ObservabilityView = 'traces' | 'cost' | 'performance' | 'usage'

export default function ObservabilityPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<ObservabilityView>('traces')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Traces state
  const [traces, setTraces] = useState<TraceRecord[]>([])
  const [traceTotalCount, setTraceTotalCount] = useState(0)
  const [tracePage, setTracePage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [selectedTrace, setSelectedTrace] = useState<TraceDetailResult | null>(null)

  // Analytics state
  const [costData, setCostData] = useState<CostAnalyticsResult | null>(null)
  const [perfData, setPerfData] = useState<PerformanceMetricsResult | null>(null)
  const [usageData, setUsageData] = useState<UsageAnalyticsResult | null>(null)
  const [granularity, setGranularity] = useState('daily')

  const pageSize = 20

  async function loadTraces() {
    try {
      setLoading(true)
      setError('')
      const result = await getTraces(
        tracePage,
        pageSize,
        statusFilter || undefined,
        modelFilter || undefined
      )
      setTraces(result.traces)
      setTraceTotalCount(result.totalCount)
    } catch {
      setError(t('observability.loadError', 'Failed to load traces'))
    } finally {
      setLoading(false)
    }
  }

  async function loadCostAnalytics() {
    try {
      setLoading(true)
      setError('')
      const result = await getCostAnalytics(undefined, undefined, granularity)
      setCostData(result)
    } catch {
      setError(t('observability.costError', 'Failed to load cost analytics'))
    } finally {
      setLoading(false)
    }
  }

  async function loadPerformance() {
    try {
      setLoading(true)
      setError('')
      const result = await getPerformanceMetrics()
      setPerfData(result)
    } catch {
      setError(t('observability.perfError', 'Failed to load performance metrics'))
    } finally {
      setLoading(false)
    }
  }

  async function loadUsageAnalytics() {
    try {
      setLoading(true)
      setError('')
      const result = await getUsageAnalytics(undefined, undefined, granularity)
      setUsageData(result)
    } catch {
      setError(t('observability.usageError', 'Failed to load usage analytics'))
    } finally {
      setLoading(false)
    }
  }

  async function handleTraceClick(traceId: string) {
    try {
      const detail = await getTrace(traceId)
      setSelectedTrace(detail)
    } catch {
      setError(t('observability.traceDetailError', 'Failed to load trace detail'))
    }
  }

  useEffect(() => {
    if (view === 'traces') loadTraces()
    else if (view === 'cost') loadCostAnalytics()
    else if (view === 'performance') loadPerformance()
    else if (view === 'usage') loadUsageAnalytics()
  }, [view, tracePage, statusFilter, modelFilter, granularity])

  const totalPages = Math.ceil(traceTotalCount / pageSize)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  const formatCost = (c: number) => `$${c.toFixed(6)}`
  const formatLatency = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'text-green-400 bg-green-900/30'
      case 'running': return 'text-blue-400 bg-blue-900/30'
      case 'error': return 'text-red-400 bg-red-900/30'
      default: return 'text-warm-400 bg-warm-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t('observability.title', 'LLM Observability')}</h3>
        <p className="text-sm text-warm-400 mt-1">
          {t('observability.description', 'Trace AI pipeline executions, analyze costs, and monitor performance.')}
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        {(['traces', 'cost', 'performance', 'usage'] as ObservabilityView[]).map((v) => (
          <button
            key={v}
            onClick={() => { setView(v); setSelectedTrace(null) }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              view === v ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {t(`observability.tab.${v}`, v.charAt(0).toUpperCase() + v.slice(1))}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-warm-400 text-sm">{t('observability.loading', 'Loading...')}</p>
        </div>
      )}

      {/* Trace list view */}
      {!loading && view === 'traces' && !selectedTrace && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setTracePage(1) }}
              className="bg-warm-800 border border-warm-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">{t('observability.allStatuses', 'All statuses')}</option>
              <option value="completed">{t('observability.completed', 'Completed')}</option>
              <option value="running">{t('observability.running', 'Running')}</option>
              <option value="error">{t('observability.error', 'Error')}</option>
            </select>
            <select
              value={modelFilter}
              onChange={(e) => { setModelFilter(e.target.value); setTracePage(1) }}
              className="bg-warm-800 border border-warm-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">{t('observability.allModels', 'All models')}</option>
              <option value="haiku">Haiku</option>
              <option value="sonnet">Sonnet</option>
              <option value="opus">Opus</option>
            </select>
          </div>

          {traces.length === 0 ? (
            <div className="text-center py-12 bg-warm-800/50 rounded-lg">
              <p className="text-warm-400">{t('observability.noTraces', 'No traces found.')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-warm-400 border-b border-warm-700">
                      <th className="text-left py-2 px-2">{t('observability.traceId', 'Trace ID')}</th>
                      <th className="text-left py-2 px-2">{t('observability.model', 'Model')}</th>
                      <th className="text-right py-2 px-2">{t('observability.tokens', 'Tokens')}</th>
                      <th className="text-right py-2 px-2">{t('observability.cost', 'Cost')}</th>
                      <th className="text-right py-2 px-2">{t('observability.latency', 'Latency')}</th>
                      <th className="text-center py-2 px-2">{t('observability.status', 'Status')}</th>
                      <th className="text-left py-2 px-2">{t('observability.date', 'Date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traces.map((tr) => (
                      <tr
                        key={tr.id}
                        onClick={() => handleTraceClick(tr.traceId)}
                        className="border-b border-warm-700/50 hover:bg-warm-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-2 px-2 font-mono text-xs text-blue-400">
                          {tr.traceId.slice(0, 12)}...
                        </td>
                        <td className="py-2 px-2 text-warm-300">{tr.model || '-'}</td>
                        <td className="py-2 px-2 text-right">{tr.totalTokens.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right text-yellow-400">{formatCost(tr.totalCost)}</td>
                        <td className="py-2 px-2 text-right">{formatLatency(tr.latencyMs)}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(tr.status)}`}>
                            {tr.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-warm-400 text-xs">{formatDate(tr.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setTracePage((p) => Math.max(1, p - 1))}
                    disabled={tracePage === 1}
                    className="px-3 py-1 text-sm rounded bg-warm-700 text-warm-300 hover:bg-warm-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('payments.prev', 'Prev')}
                  </button>
                  <span className="text-sm text-warm-400">{tracePage} / {totalPages}</span>
                  <button
                    onClick={() => setTracePage((p) => Math.min(totalPages, p + 1))}
                    disabled={tracePage === totalPages}
                    className="px-3 py-1 text-sm rounded bg-warm-700 text-warm-300 hover:bg-warm-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('payments.next', 'Next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Trace detail view */}
      {!loading && view === 'traces' && selectedTrace && (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedTrace(null)}
            className="text-sm text-warm-400 hover:text-white transition-colors"
          >
            &larr; {t('observability.backToTraces', 'Back to traces')}
          </button>

          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">{t('observability.traceDetail', 'Trace Detail')}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(selectedTrace.status)}`}>
                {selectedTrace.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-xs text-warm-400">{t('observability.traceId', 'Trace ID')}</div>
                <div className="font-mono text-sm text-blue-400 break-all">{selectedTrace.traceId}</div>
              </div>
              <div>
                <div className="text-xs text-warm-400">{t('observability.tokens', 'Tokens')}</div>
                <div className="text-lg font-bold">{selectedTrace.totalTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-warm-400">{t('observability.cost', 'Cost')}</div>
                <div className="text-lg font-bold text-yellow-400">{formatCost(selectedTrace.totalCost)}</div>
              </div>
              <div>
                <div className="text-xs text-warm-400">{t('observability.latency', 'Latency')}</div>
                <div className="text-lg font-bold">{formatLatency(selectedTrace.latencyMs)}</div>
              </div>
            </div>

            {/* Span waterfall */}
            <h5 className="text-sm font-medium text-warm-300 mb-3">
              {t('observability.spans', 'Spans')} ({selectedTrace.spans.length})
            </h5>
            {selectedTrace.spans.length === 0 ? (
              <p className="text-warm-500 text-sm">{t('observability.noSpans', 'No spans recorded.')}</p>
            ) : (
              <div className="space-y-2">
                {selectedTrace.spans.map((span) => {
                  const maxLatency = Math.max(...selectedTrace.spans.map((s) => s.latencyMs), 1)
                  const widthPercent = Math.max(2, (span.latencyMs / maxLatency) * 100)
                  return (
                    <div key={span.id} className="bg-warm-900 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{span.spanName}</span>
                          {span.model && (
                            <span className="text-xs px-1.5 py-0.5 bg-warm-700 rounded text-warm-300">
                              {span.model}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-xs ${statusColor(span.status)}`}>
                            {span.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-warm-400">
                          <span>{span.totalTokens.toLocaleString()} tokens</span>
                          <span className="text-yellow-400">{formatCost(span.cost)}</span>
                          <span>{formatLatency(span.latencyMs)}</span>
                        </div>
                      </div>
                      {/* Waterfall bar */}
                      <div className="w-full bg-warm-800 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-warm-500">
                        <span>{t('observability.input', 'In')}: {span.inputTokens.toLocaleString()}</span>
                        <span>{t('observability.output', 'Out')}: {span.outputTokens.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cost analytics view */}
      {!loading && view === 'cost' && costData && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className="bg-warm-800 border border-warm-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="daily">{t('observability.daily', 'Daily')}</option>
              <option value="weekly">{t('observability.weekly', 'Weekly')}</option>
              <option value="monthly">{t('observability.monthly', 'Monthly')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded-xl p-5">
              <div className="text-sm text-warm-300">{t('observability.totalCost', 'Total Cost')}</div>
              <div className="text-3xl font-bold text-yellow-400">{formatCost(costData.totalCost)}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-300">{t('observability.totalTraces', 'Total Traces')}</div>
              <div className="text-3xl font-bold">{costData.totalTraces.toLocaleString()}</div>
            </div>
          </div>

          {/* Cost chart (simple bar representation) */}
          {costData.buckets.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="text-sm font-medium mb-4">{t('observability.costTrend', 'Cost Trend')}</h4>
              <div className="flex items-end gap-1 h-40">
                {costData.buckets.map((b) => {
                  const maxCost = Math.max(...costData.buckets.map((x) => x.cost), 0.000001)
                  const heightPercent = Math.max(2, (b.cost / maxCost) * 100)
                  return (
                    <div
                      key={b.date}
                      className="flex-1 group relative"
                      title={`${b.date}: ${formatCost(b.cost)} (${b.traceCount} traces)`}
                    >
                      <div
                        className="bg-yellow-500/80 hover:bg-yellow-400 rounded-t transition-colors mx-0.5"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <div className="text-[10px] text-warm-500 text-center mt-1 truncate">
                        {b.date.slice(5)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cost by model */}
          {costData.costByModel.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="text-sm font-medium mb-4">{t('observability.costByModel', 'Cost by Model')}</h4>
              <div className="space-y-3">
                {costData.costByModel.map((m) => {
                  const maxModelCost = Math.max(...costData.costByModel.map((x) => x.cost), 0.000001)
                  const widthPercent = (m.cost / maxModelCost) * 100
                  return (
                    <div key={m.model}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-warm-300">{m.model}</span>
                        <span className="text-yellow-400">{formatCost(m.cost)} ({m.traceCount} traces)</span>
                      </div>
                      <div className="w-full bg-warm-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance view */}
      {!loading && view === 'performance' && perfData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('observability.successRate', 'Success Rate')}</div>
              <div className={`text-3xl font-bold ${perfData.successRate >= 95 ? 'text-green-400' : perfData.successRate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                {perfData.successRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('observability.avgLatency', 'Avg Latency')}</div>
              <div className="text-3xl font-bold">{formatLatency(perfData.avgLatencyMs)}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('observability.totalTraces', 'Total Traces')}</div>
              <div className="text-3xl font-bold">{perfData.totalTraces.toLocaleString()}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('observability.errors', 'Errors')}</div>
              <div className="text-3xl font-bold text-red-400">{perfData.errorCount}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="text-sm font-medium mb-4">{t('observability.latencyPercentiles', 'Latency Percentiles')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xs text-warm-400 mb-1">P50</div>
                <div className="text-xl font-bold text-green-400">{formatLatency(perfData.p50LatencyMs)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-warm-400 mb-1">P95</div>
                <div className="text-xl font-bold text-yellow-400">{formatLatency(perfData.p95LatencyMs)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-warm-400 mb-1">P99</div>
                <div className="text-xl font-bold text-red-400">{formatLatency(perfData.p99LatencyMs)}</div>
              </div>
            </div>
            {/* Visual percentile bar */}
            <div className="mt-4 relative h-6 bg-warm-700 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-green-600/60 rounded-l-full" style={{ width: '50%' }} />
              <div className="absolute inset-y-0 left-[50%] bg-yellow-600/60" style={{ width: '45%' }} />
              <div className="absolute inset-y-0 right-0 bg-red-600/60 rounded-r-full" style={{ width: '5%' }} />
              <div className="absolute inset-0 flex items-center justify-around text-xs font-medium">
                <span>P50: {formatLatency(perfData.p50LatencyMs)}</span>
                <span>P95: {formatLatency(perfData.p95LatencyMs)}</span>
                <span>P99: {formatLatency(perfData.p99LatencyMs)}</span>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="text-sm font-medium mb-2">{t('observability.avgTokens', 'Avg Tokens/Trace')}</h4>
            <div className="text-2xl font-bold">{perfData.avgTokensPerTrace.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Usage analytics view */}
      {!loading && view === 'usage' && usageData && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className="bg-warm-800 border border-warm-700 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="daily">{t('observability.daily', 'Daily')}</option>
              <option value="weekly">{t('observability.weekly', 'Weekly')}</option>
              <option value="monthly">{t('observability.monthly', 'Monthly')}</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('observability.inputTokens', 'Input Tokens')}</div>
              <div className="text-2xl font-bold text-blue-400">{usageData.totalInputTokens.toLocaleString()}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('observability.outputTokens', 'Output Tokens')}</div>
              <div className="text-2xl font-bold text-purple-400">{usageData.totalOutputTokens.toLocaleString()}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('observability.totalTokens', 'Total Tokens')}</div>
              <div className="text-2xl font-bold">{usageData.totalTokens.toLocaleString()}</div>
            </div>
          </div>

          {/* Usage chart */}
          {usageData.buckets.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="text-sm font-medium mb-4">{t('observability.usageTrend', 'Token Usage Trend')}</h4>
              <div className="flex items-end gap-1 h-40">
                {usageData.buckets.map((b) => {
                  const maxTokens = Math.max(...usageData.buckets.map((x) => x.totalTokens), 1)
                  const inputHeight = (b.inputTokens / maxTokens) * 100
                  const outputHeight = (b.outputTokens / maxTokens) * 100
                  return (
                    <div
                      key={b.date}
                      className="flex-1 flex flex-col justify-end"
                      title={`${b.date}: ${b.totalTokens.toLocaleString()} tokens`}
                    >
                      <div
                        className="bg-purple-500/80 rounded-t-sm mx-0.5"
                        style={{ height: `${Math.max(1, outputHeight)}%` }}
                      />
                      <div
                        className="bg-blue-500/80 mx-0.5"
                        style={{ height: `${Math.max(1, inputHeight)}%` }}
                      />
                      <div className="text-[10px] text-warm-500 text-center mt-1 truncate">
                        {b.date.slice(5)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-warm-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500/80 rounded-sm inline-block" />
                  {t('observability.input', 'Input')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-500/80 rounded-sm inline-block" />
                  {t('observability.output', 'Output')}
                </span>
              </div>
            </div>
          )}

          {/* Usage by model */}
          {usageData.usageByModel.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="text-sm font-medium mb-4">{t('observability.usageByModel', 'Usage by Model')}</h4>
              <div className="space-y-3">
                {usageData.usageByModel.map((m) => {
                  const maxModelTokens = Math.max(...usageData.usageByModel.map((x) => x.totalTokens), 1)
                  const widthPercent = (m.totalTokens / maxModelTokens) * 100
                  return (
                    <div key={m.model}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-warm-300">{m.model}</span>
                        <span>{m.totalTokens.toLocaleString()} tokens ({m.spanCount} spans)</span>
                      </div>
                      <div className="w-full bg-warm-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
