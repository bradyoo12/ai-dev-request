import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listRecords, analyzeRequest, deleteRecord, getCostStats, getStrategies } from '../api/inferencecost'
import type { InferenceCostRecord, AnalyzeResponse, CostStrategy, CostStats } from '../api/inferencecost'

type Tab = 'analyze' | 'history' | 'strategies' | 'stats'

export default function InferenceCostPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('analyze')
  const [records, setRecords] = useState<InferenceCostRecord[]>([])
  const [strategies, setStrategies] = useState<CostStrategy[]>([])
  const [stats, setStats] = useState<CostStats | null>(null)
  const [projectName, setProjectName] = useState('')
  const [requestType, setRequestType] = useState('complex')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tab === 'history') listRecords().then(setRecords).catch(() => {})
    if (tab === 'strategies') getStrategies().then(setStrategies).catch(() => {})
    if (tab === 'stats') getCostStats().then(setStats).catch(() => {})
  }, [tab])

  const handleAnalyze = async () => {
    if (!projectName.trim()) return
    setLoading(true)
    try {
      const res = await analyzeRequest(projectName, requestType)
      setResult(res)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id)
      setRecords(prev => prev.filter(r => r.id !== id))
    } catch { /* ignore */ }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'analyze', label: t('costopt.tab.analyze', 'Analyze') },
    { key: 'history', label: t('costopt.tab.history', 'History') },
    { key: 'strategies', label: t('costopt.tab.strategies', 'Strategies') },
    { key: 'stats', label: t('costopt.tab.stats', 'Stats') },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">{t('costopt.title', 'AI Inference Cost Optimization')}</h2>
      <p className="text-warm-400 text-sm mb-4">{t('costopt.subtitle', 'Smart model routing, caching, and batching for 60-80% cost savings')}</p>

      <div className="flex gap-2 mb-4">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${tab === tb.key ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'}`}
          >{tb.label}</button>
        ))}
      </div>

      {tab === 'analyze' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('costopt.projectName', 'Project Name')}</label>
              <input value={projectName} onChange={e => setProjectName(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" placeholder="my-project" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('costopt.requestType', 'Request Complexity')}</label>
              <select value={requestType} onChange={e => setRequestType(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
                <option value="simple">Simple (Haiku)</option>
                <option value="complex">Complex (Sonnet)</option>
                <option value="critical">Critical (Opus)</option>
              </select>
            </div>
          </div>
          <button onClick={handleAnalyze} disabled={loading || !projectName.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('costopt.analyzing', 'Analyzing...') : t('costopt.analyze', 'Analyze Cost')}
          </button>

          {result && (
            <div className="bg-warm-800 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-medium">{t('costopt.result', 'Cost Analysis')}</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('costopt.originalCost', 'Original')}</div>
                  <div className="text-red-400 font-medium">{result.costBreakdown.originalCost}</div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('costopt.finalCost', 'Optimized')}</div>
                  <div className="text-green-400 font-medium">{result.costBreakdown.finalCost}</div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('costopt.savings', 'Savings')}</div>
                  <div className="text-blue-400 font-medium">{result.costBreakdown.savings}</div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('costopt.savingsPercent', 'Savings %')}</div>
                  <div className="text-green-400 font-medium">{result.costBreakdown.savingsPercent}</div>
                </div>
              </div>
              <div className="bg-warm-900 rounded p-3 text-sm">
                <div className="text-warm-400 text-xs mb-1">{t('costopt.routingDecision', 'Routing Decision')}</div>
                <div className="text-warm-300">{result.routing.original} → {result.routing.routed}: {result.routing.reason}</div>
              </div>
              <div className="flex gap-3 text-xs">
                <span className={`px-2 py-0.5 rounded ${result.optimizations.cacheHit ? 'bg-green-900 text-green-300' : 'bg-warm-700 text-warm-400'}`}>
                  Cache: {result.optimizations.cacheHit ? 'HIT' : 'MISS'}
                </span>
                <span className={`px-2 py-0.5 rounded ${result.optimizations.batched ? 'bg-green-900 text-green-300' : 'bg-warm-700 text-warm-400'}`}>
                  Batch: {result.optimizations.batched ? 'YES' : 'NO'}
                </span>
                <span className={`px-2 py-0.5 rounded ${result.optimizations.responseReused ? 'bg-green-900 text-green-300' : 'bg-warm-700 text-warm-400'}`}>
                  Reuse: {result.optimizations.responseReused ? `YES (${result.optimizations.similarity})` : 'NO'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {records.length === 0 && <p className="text-warm-400 text-sm">{t('costopt.noHistory', 'No cost records yet.')}</p>}
          {records.map(r => (
            <div key={r.id} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{r.projectName}</div>
                <div className="text-warm-400 text-xs mt-0.5">
                  {r.modelUsed} &middot; ${r.costUsd.toFixed(4)} (was ${r.originalCostUsd.toFixed(4)}) &middot; {r.savingsPercent}% saved &middot; {r.optimizationStrategy}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded bg-green-900 text-green-300">-{r.savingsPercent}%</span>
                <button onClick={() => handleDelete(r.id)} className="text-warm-500 hover:text-red-400 text-xs">{t('common.delete', 'Delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'strategies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {strategies.map(s => (
              <div key={s.id} className="bg-warm-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-white font-medium">{s.name}</span>
                  <span className="text-xs bg-warm-700 text-green-300 px-2 py-0.5 rounded">{s.savingsRange}</span>
                </div>
                <p className="text-warm-400 text-sm">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">{t('costopt.features', 'Features')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-white text-sm font-medium">{t('costopt.feat.routing', 'Smart Routing')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('costopt.feat.routingDesc', 'Automatically route requests to the most cost-effective model based on complexity')}</div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">{t('costopt.feat.caching', 'Prompt Caching')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('costopt.feat.cachingDesc', 'Cache common system prompts for up to 90% cost reduction on repeated calls')}</div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">{t('costopt.feat.reuse', 'Response Reuse')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('costopt.feat.reuseDesc', 'Semantic search for similar past responses before making new API calls')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          {!stats || stats.totalRequests === 0 ? (
            <p className="text-warm-400 text-sm">{t('costopt.noStats', 'No cost optimization statistics yet.')}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('costopt.stats.requests', 'Total Requests')}</div>
                  <div className="text-white text-lg font-bold">{stats.totalRequests}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('costopt.stats.totalSavings', 'Total Savings')}</div>
                  <div className="text-green-400 text-lg font-bold">${stats.totalSavingsUsd.toFixed(2)}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('costopt.stats.avgSavings', 'Avg Savings')}</div>
                  <div className="text-blue-400 text-lg font-bold">{stats.avgSavingsPercent}%</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('costopt.stats.cacheHit', 'Cache Hit Rate')}</div>
                  <div className="text-white text-lg font-bold">{stats.cacheHitRate}%</div>
                </div>
              </div>
              {stats.byStrategy.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">{t('costopt.stats.byStrategy', 'By Strategy')}</h3>
                  <div className="space-y-2">
                    {stats.byStrategy.map(s => (
                      <div key={s.strategy} className="flex justify-between text-sm">
                        <span className="text-warm-300">{s.strategy}</span>
                        <span className="text-warm-400">{s.count} requests &middot; {s.avgSavingsPercent}% avg savings &middot; ${s.totalSavingsUsd.toFixed(4)} saved</span>
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
