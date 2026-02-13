import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listDemos, runBenchmark, deleteDemo, getUseHookStats, getPatterns } from '../api/reactusehook'
import type { ReactUseHookDemo, BenchmarkResponse, DataPattern, UseHookStats } from '../api/reactusehook'

type Tab = 'benchmark' | 'history' | 'patterns' | 'stats'

export default function ReactUseHookPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('benchmark')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{t('usehook.title', 'React 19 use() Hook')}</h2>
        <p className="text-warm-400 text-sm mt-1">{t('usehook.subtitle', 'Async data loading with native Suspense integration and request deduplication')}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['benchmark', 'history', 'patterns', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'}`}>
            {t(`usehook.tab.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'benchmark' && <BenchmarkTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'patterns' && <PatternsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function BenchmarkTab() {
  const { t } = useTranslation()
  const [componentName, setComponentName] = useState('')
  const [dataSource, setDataSource] = useState('api')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BenchmarkResponse | null>(null)

  const handleBenchmark = async () => {
    if (!componentName) return
    setLoading(true)
    try {
      const res = await runBenchmark(componentName, dataSource)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-warm-800 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('usehook.componentName', 'Component Name')}</label>
          <input value={componentName} onChange={e => setComponentName(e.target.value)} placeholder="UserProfile" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('usehook.dataSource', 'Data Source')}</label>
          <select value={dataSource} onChange={e => setDataSource(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
            <option value="api">REST API</option>
            <option value="graphql">GraphQL</option>
            <option value="websocket">WebSocket</option>
            <option value="cache">Cache</option>
          </select>
        </div>
        <button onClick={handleBenchmark} disabled={loading || !componentName} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('usehook.running', 'Running Benchmark...') : t('usehook.run', 'Run Benchmark')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('usehook.comparison', 'use() vs useEffect Comparison')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                <div className="text-blue-400 text-sm font-semibold mb-2">use() Hook</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-warm-400">Render</span><span className="text-white">{result.useHook.renderTimeMs}ms</span></div>
                  <div className="flex justify-between"><span className="text-warm-400">Fetch</span><span className="text-white">{result.useHook.dataFetchMs}ms</span></div>
                  <div className="flex justify-between"><span className="text-warm-400">Re-renders</span><span className="text-white">{result.useHook.reRenderCount}</span></div>
                  <div className="flex justify-between"><span className="text-warm-400">Boilerplate</span><span className="text-white">{result.useHook.boilerplateLines} lines</span></div>
                  <div className="flex justify-between"><span className="text-warm-400">Score</span><span className="text-green-400 font-bold">{result.useHook.performanceScore}</span></div>
                </div>
              </div>
              <div className="bg-warm-700/50 border border-warm-600/30 rounded-lg p-3">
                <div className="text-warm-400 text-sm font-semibold mb-2">useEffect</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-warm-400">Render</span><span className="text-white">{result.useEffect.renderTimeMs}ms</span></div>
                  <div className="flex justify-between"><span className="text-warm-400">Fetch</span><span className="text-white">{result.useEffect.dataFetchMs}ms</span></div>
                  <div className="flex justify-between"><span className="text-warm-400">Re-renders</span><span className="text-white">{result.useEffect.reRenderCount}</span></div>
                  <div className="flex justify-between"><span className="text-warm-400">Boilerplate</span><span className="text-white">{result.useEffect.boilerplateLines} lines</span></div>
                  <div className="flex justify-between"><span className="text-warm-400">Score</span><span className="text-warm-300">{result.useEffect.performanceScore}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('usehook.improvements', 'Improvements')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-warm-700 rounded p-3 text-center">
                <div className="text-green-400 text-lg font-bold">{result.improvement.renderTimeReduction}</div>
                <div className="text-warm-400 text-xs">{t('usehook.renderTime', 'Render Time')}</div>
              </div>
              <div className="bg-warm-700 rounded p-3 text-center">
                <div className="text-green-400 text-lg font-bold">{result.improvement.fetchTimeReduction}</div>
                <div className="text-warm-400 text-xs">{t('usehook.fetchTime', 'Fetch Time')}</div>
              </div>
              <div className="bg-warm-700 rounded p-3 text-center">
                <div className="text-green-400 text-lg font-bold">{result.improvement.reRenderReduction}</div>
                <div className="text-warm-400 text-xs">{t('usehook.reRenders', 'Re-renders')}</div>
              </div>
              <div className="bg-warm-700 rounded p-3 text-center">
                <div className="text-green-400 text-lg font-bold">{result.improvement.boilerplateReduction}</div>
                <div className="text-warm-400 text-xs">{t('usehook.boilerplate', 'Boilerplate')}</div>
              </div>
              <div className="bg-warm-700 rounded p-3 text-center">
                <div className="text-green-400 text-lg font-bold">{result.improvement.scoreImprovement}</div>
                <div className="text-warm-400 text-xs">{t('usehook.score', 'Score')}</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('usehook.codeComparison', 'Code Comparison')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-warm-400 text-xs mb-1">{t('usehook.before', 'Before (useEffect)')}</div>
                <pre className="bg-warm-900 rounded p-3 text-red-300 text-xs overflow-x-auto whitespace-pre-wrap">{result.codeComparison.before}</pre>
              </div>
              <div>
                <div className="text-warm-400 text-xs mb-1">{t('usehook.after', 'After (use)')}</div>
                <pre className="bg-warm-900 rounded p-3 text-green-300 text-xs overflow-x-auto whitespace-pre-wrap">{result.codeComparison.after}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { t } = useTranslation()
  const [demos, setDemos] = useState<ReactUseHookDemo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listDemos().then(setDemos).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!demos.length) return <div className="text-warm-400 text-sm">{t('usehook.noHistory', 'No benchmarks yet.')}</div>

  return (
    <div className="space-y-2">
      {demos.map(d => (
        <div key={d.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium">{d.componentName} <span className="text-warm-500">({d.dataSource})</span></div>
            <div className="text-warm-500 text-xs mt-1">
              {d.renderTimeMs}ms render | {d.dataFetchMs}ms fetch | {d.reRenderCount} re-renders | {d.boilerplateLines} lines | score: {d.performanceScore}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-warm-500 text-xs">{new Date(d.createdAt).toLocaleDateString()}</span>
            <button onClick={async () => { await deleteDemo(d.id); setDemos(p => p.filter(x => x.id !== d.id)) }} className="text-red-400 hover:text-red-300 text-xs">{t('common.delete', 'Delete')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PatternsTab() {
  const { t } = useTranslation()
  const [patterns, setPatterns] = useState<DataPattern[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getPatterns().then(setPatterns).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>

  const features = [
    { name: t('usehook.feat.suspense', 'Native Suspense'), desc: t('usehook.feat.suspenseDesc', 'Automatic loading states with React Suspense boundaries — no manual isLoading flags') },
    { name: t('usehook.feat.dedup', 'Request Deduplication'), desc: t('usehook.feat.dedupDesc', 'Identical requests are automatically deduplicated, reducing network traffic and improving performance') },
    { name: t('usehook.feat.errorBoundary', 'Error Boundaries'), desc: t('usehook.feat.errorBoundaryDesc', 'Failed requests automatically propagate to the nearest error boundary for graceful error handling') }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {patterns.map(p => (
          <div key={p.id} className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-white font-medium">{p.name}</span>
              {p.recommended && <span className="text-green-400 text-xs ml-auto">{t('usehook.recommended', 'Recommended')}</span>}
            </div>
            <p className="text-warm-400 text-sm">{p.description}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {features.map((f, i) => (
          <div key={i} className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium">{f.name}</h4>
            <p className="text-warm-400 text-sm mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<UseHookStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getUseHookStats().then(setStats).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!stats || stats.totalBenchmarks === 0) return <div className="text-warm-400 text-sm">{t('usehook.noStats', 'No benchmark statistics yet.')}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('usehook.stats.benchmarks', 'Total Benchmarks')}</div>
          <div className="text-white text-xl font-bold">{stats.totalBenchmarks}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('usehook.stats.renderTime', 'Avg Render')}</div>
          <div className="text-green-400 text-xl font-bold">{stats.avgRenderTimeMs}ms</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('usehook.stats.fetchTime', 'Avg Fetch')}</div>
          <div className="text-white text-xl font-bold">{stats.avgDataFetchMs}ms</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('usehook.stats.score', 'Avg Score')}</div>
          <div className="text-blue-400 text-xl font-bold">{stats.avgPerformanceScore}</div>
        </div>
      </div>
      {stats.byDataSource && stats.byDataSource.length > 0 && (
        <div className="bg-warm-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('usehook.stats.bySource', 'By Data Source')}</h3>
          <div className="space-y-2">
            {stats.byDataSource.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                <span className="text-white text-sm">{s.dataSource}</span>
                <div className="flex gap-4">
                  <span className="text-warm-400 text-sm">{s.count} benchmarks</span>
                  <span className="text-green-400 text-sm">{s.avgPerformanceScore} score</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
