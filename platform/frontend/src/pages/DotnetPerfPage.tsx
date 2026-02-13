import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/performanceopt'

type Tab = 'benchmark' | 'history' | 'categories' | 'stats'

export default function DotnetPerfPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('benchmark')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('perf.title', '.NET 9 Performance')}</h2>
        <p className="text-warm-400 mt-1">{t('perf.subtitle', 'Benchmark and optimize backend performance with .NET 9 features — AOT, JSON, HTTP/3, GC')}</p>
      </div>
      <div className="flex gap-2">
        {(['benchmark', 'history', 'categories', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`perf.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'benchmark' && <BenchmarkTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function BenchmarkTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [category, setCategory] = useState('json')
  const [categories, setCategories] = useState<api.OptCategory[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.BenchmarkResponse | null>(null)

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}) }, [])

  const handleRun = async () => {
    if (!project.trim()) return
    setRunning(true)
    try {
      const res = await api.runBenchmark(project, category)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('perf.runBenchmark', 'Run Performance Benchmark')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('perf.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-api" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('perf.category', 'Optimization Category')}</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleRun} disabled={running || !project.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('perf.running', 'Benchmarking...') : t('perf.runBtn', 'Run Benchmark')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.optimization.improvementPercent}%</div>
              <div className="text-sm text-warm-400">{t('perf.improvement', 'Improvement')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.optimization.memorySavedPercent}%</div>
              <div className="text-sm text-warm-400">{t('perf.memorySaved', 'Memory Saved')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{result.optimization.throughputRps}</div>
              <div className="text-sm text-warm-400">{t('perf.throughput', 'Throughput (RPS)')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{result.optimization.benchmarkRuns}</div>
              <div className="text-sm text-warm-400">{t('perf.runs', 'Benchmark Runs')}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">{t('perf.latencyComparison', 'Latency Comparison')}</h4>
              <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">{result.optimization.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-warm-900 rounded-lg text-center">
                <div className="text-sm text-warm-400 mb-1">{t('perf.baseline', 'Baseline')}</div>
                <div className="text-xl font-bold text-red-400">{result.optimization.baselineLatencyMs}ms</div>
              </div>
              <div className="p-3 bg-warm-900 rounded-lg text-center">
                <div className="text-sm text-warm-400 mb-1">{t('perf.optimized', 'Optimized')}</div>
                <div className="text-xl font-bold text-green-400">{result.optimization.optimizedLatencyMs}ms</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('perf.details', 'Benchmark Details')}</h4>
            <div className="space-y-2">
              {result.benchmarkDetails.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg text-sm">
                  <span className="text-warm-300">{d.metric}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-400">{d.before}</span>
                    <span className="text-warm-500">&rarr;</span>
                    <span className="text-green-400">{d.after}</span>
                    <span className="text-blue-400 font-medium">{d.improvement}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { t } = useTranslation()
  const [items, setItems] = useState<api.PerformanceOptimization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listOptimizations().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('perf.loading', 'Loading...')}</div>
  if (items.length === 0) return <div className="text-warm-400">{t('perf.noHistory', 'No benchmark history yet.')}</div>

  return (
    <div className="space-y-3">
      {items.map(o => (
        <div key={o.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{o.projectName}</div>
            <div className="text-sm text-warm-400">{o.category} · {o.improvementPercent}% faster · {o.memorySavedPercent}% less memory · {o.benchmarkRuns} runs</div>
            <div className="text-xs text-warm-500 mt-1">{o.baselineLatencyMs}ms &rarr; {o.optimizedLatencyMs}ms · {o.throughputRps} RPS</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${o.status === 'optimized' ? 'bg-green-600 text-white' : o.status === 'failed' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {o.status}
            </span>
            <button onClick={async () => { await api.deleteOptimization(o.id); setItems(prev => prev.filter(x => x.id !== o.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('perf.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function CategoriesTab() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<api.OptCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('perf.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('perf.categoriesTitle', '.NET 9 Optimization Categories')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(c => (
            <div key={c.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                  <h4 className="text-white font-medium">{c.name}</h4>
                </div>
                <span className="text-sm font-bold text-green-400">+{c.improvement}</span>
              </div>
              <p className="text-sm text-warm-400">{c.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('perf.featuresTitle', '.NET 9 Key Features')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: t('perf.feat.sourceGen', 'Source Generators'), desc: t('perf.feat.sourceGenDesc', 'Compile-time JSON serialization for zero-reflection performance'), stat: '35% faster' },
            { name: t('perf.feat.http3', 'HTTP/3 + QUIC'), desc: t('perf.feat.http3Desc', 'Next-gen protocol with multiplexing and reduced latency'), stat: '25% lower latency' },
            { name: t('perf.feat.aot', 'Native AOT'), desc: t('perf.feat.aotDesc', 'Ahead-of-time compilation for instant startup and lower memory'), stat: '40% less memory' },
          ].map(f => (
            <div key={f.name} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{f.name}</span>
                <span className="text-xs text-green-400">{f.stat}</span>
              </div>
              <p className="text-sm text-warm-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<api.OptStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getOptStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('perf.loading', 'Loading...')}</div>
  if (!stats || stats.totalOptimizations === 0) return <div className="text-warm-400">{t('perf.noStats', 'No performance statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { value: stats.totalOptimizations, label: t('perf.stats.optimizations', 'Optimizations') },
          { value: `${stats.avgImprovement}%`, label: t('perf.stats.avgImprovement', 'Avg Improvement'), color: 'text-green-400' },
          { value: `${stats.avgMemorySaved}%`, label: t('perf.stats.avgMemory', 'Avg Memory Saved'), color: 'text-blue-400' },
          { value: stats.totalBenchmarks, label: t('perf.stats.benchmarks', 'Total Benchmarks') },
          { value: `${stats.avgThroughput}`, label: t('perf.stats.throughput', 'Avg Throughput (RPS)'), color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('perf.stats.byCategory', 'By Category')}</h4>
          <div className="space-y-2">
            {stats.byCategory.map(c => (
              <div key={c.category} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{c.category}</span>
                <span className="text-warm-400 text-sm">{c.count} {t('perf.optimizationsLabel', 'optimizations')} · {c.avgImprovement}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('perf.stats.byStatus', 'By Status')}</h4>
          <div className="space-y-2">
            {stats.byStatus.map(s => (
              <div key={s.status} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{s.status}</span>
                <span className="text-warm-400 text-sm">{s.count} {t('perf.optimizationsLabel', 'optimizations')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
