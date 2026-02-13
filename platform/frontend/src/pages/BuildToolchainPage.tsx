import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/buildtoolchain'

type Tab = 'benchmark' | 'history' | 'bundlers' | 'stats'

export default function BuildToolchainPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('benchmark')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('build.title', 'Build Toolchain')}</h2>
        <p className="text-warm-400 mt-1">{t('build.subtitle', 'Vite 8 Rolldown — 3x faster builds with unified Rust-based bundling')}</p>
      </div>
      <div className="flex gap-2">
        {(['benchmark', 'history', 'bundlers', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`build.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'benchmark' && <BenchmarkTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'bundlers' && <BundlersTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function BenchmarkTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [bundler, setBundler] = useState('rolldown')
  const [fullBundle, setFullBundle] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.BenchmarkResponse | null>(null)

  const handleRun = async () => {
    if (!project.trim()) return
    setRunning(true)
    try {
      const res = await api.runBenchmark(project, bundler, fullBundle)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('build.runBenchmark', 'Run Build Benchmark')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('build.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-react-app" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('build.bundler', 'Bundler')}</label>
            <select value={bundler} onChange={e => setBundler(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="rolldown">Rolldown (Vite 8)</option>
              <option value="esbuild-rollup">esbuild + Rollup (Vite 7)</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={fullBundle} onChange={e => setFullBundle(e.target.checked)} className="w-4 h-4 rounded border-warm-600 bg-warm-700 text-blue-600" />
          <span className="text-sm text-warm-300">{t('build.fullBundleMode', 'Enable Full Bundle Mode (10x fewer network requests)')}</span>
        </label>
        <button onClick={handleRun} disabled={running || !project.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('build.running', 'Benchmarking...') : t('build.runBtn', 'Run Benchmark')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.result.speedupFactor}x</div>
              <div className="text-sm text-warm-400">{t('build.speedup', 'Build Speedup')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.result.totalModules}</div>
              <div className="text-sm text-warm-400">{t('build.modules', 'Modules')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{result.result.chunksGenerated}</div>
              <div className="text-sm text-warm-400">{t('build.chunks', 'Chunks')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{result.result.treeShakingPercent}%</div>
              <div className="text-sm text-warm-400">{t('build.treeShaking', 'Tree Shaking')}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">{t('build.comparison', 'Bundler Comparison')}</h4>
              <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">{result.result.bundler}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-warm-900 rounded-lg text-center">
                <div className="text-sm text-warm-400 mb-1">Rolldown (Vite 8)</div>
                <div className="text-xl font-bold text-green-400">{result.comparison.rolldown.buildMs}ms</div>
              </div>
              <div className="p-3 bg-warm-900 rounded-lg text-center">
                <div className="text-sm text-warm-400 mb-1">esbuild + Rollup (Vite 7)</div>
                <div className="text-xl font-bold text-red-400">{result.comparison.esbuildRollup.buildMs}ms</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('build.details', 'Detailed Breakdown')}</h4>
            <div className="space-y-2">
              {result.details.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg text-sm">
                  <span className="text-warm-300">{d.metric}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-green-400">{d.rolldown}</span>
                    <span className="text-warm-500">vs</span>
                    <span className="text-red-400">{d.esbuild}</span>
                    <span className="text-blue-400 font-medium">{d.speedup}</span>
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
  const [items, setItems] = useState<api.BuildToolchainResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listBenchmarks().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('build.loading', 'Loading...')}</div>
  if (items.length === 0) return <div className="text-warm-400">{t('build.noHistory', 'No benchmark history yet.')}</div>

  return (
    <div className="space-y-3">
      {items.map(r => (
        <div key={r.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{r.projectName}</div>
            <div className="text-sm text-warm-400">{r.bundler} · {r.totalModules} modules · {r.buildDurationMs}ms build · {r.bundleSizeKb}KB</div>
            <div className="text-xs text-warm-500 mt-1">{r.speedupFactor}x speedup · {r.treeShakingPercent}% tree shaking · {r.chunksGenerated} chunks</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${r.status === 'completed' ? 'bg-green-600 text-white' : r.status === 'failed' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {r.status}
            </span>
            <button onClick={async () => { await api.deleteBenchmark(r.id); setItems(prev => prev.filter(x => x.id !== r.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('build.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function BundlersTab() {
  const { t } = useTranslation()
  const [bundlers, setBundlers] = useState<api.BundlerInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getBundlers().then(setBundlers).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('build.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('build.bundlersTitle', 'Available Bundlers')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bundlers.map(b => (
            <div key={b.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: b.color }} />
                  <h4 className="text-white font-medium">{b.name}</h4>
                </div>
                <span className="text-sm font-bold text-green-400">{b.speed}</span>
              </div>
              <p className="text-sm text-warm-400">{b.description}</p>
              <div className="mt-2 text-xs text-warm-500">{t('build.language', 'Language')}: {b.language}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('build.featuresTitle', 'Vite 8 Key Features')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: t('build.feat.rolldown', 'Rolldown Bundler'), desc: t('build.feat.rolldownDesc', 'Unified Rust-based bundler replaces esbuild + Rollup for consistent dev/prod behavior'), stat: '3x faster' },
            { name: t('build.feat.fullBundle', 'Full Bundle Mode'), desc: t('build.feat.fullBundleDesc', 'Pre-bundles all modules — 10x fewer network requests during development'), stat: '10x fewer reqs' },
            { name: t('build.feat.hmr', 'Instant HMR'), desc: t('build.feat.hmrDesc', 'Sub-50ms hot module replacement with Rust-powered module graph updates'), stat: '<50ms updates' },
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
  const [stats, setStats] = useState<api.BuildStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getBuildStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('build.loading', 'Loading...')}</div>
  if (!stats || stats.totalBenchmarks === 0) return <div className="text-warm-400">{t('build.noStats', 'No build statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: stats.totalBenchmarks, label: t('build.stats.benchmarks', 'Benchmarks') },
          { value: `${stats.avgSpeedup}x`, label: t('build.stats.avgSpeedup', 'Avg Speedup'), color: 'text-green-400' },
          { value: `${stats.avgBuildMs}ms`, label: t('build.stats.avgBuild', 'Avg Build Time'), color: 'text-blue-400' },
          { value: `${stats.avgTreeShaking}%`, label: t('build.stats.treeShaking', 'Avg Tree Shaking'), color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('build.stats.byBundler', 'By Bundler')}</h4>
          <div className="space-y-2">
            {stats.byBundler?.map(b => (
              <div key={b.bundler} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{b.bundler}</span>
                <span className="text-warm-400 text-sm">{b.count} runs · {b.avgBuildMs}ms avg</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('build.stats.byStatus', 'By Status')}</h4>
          <div className="space-y-2">
            {stats.byStatus?.map(s => (
              <div key={s.status} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{s.status}</span>
                <span className="text-warm-400 text-sm">{s.count} runs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
