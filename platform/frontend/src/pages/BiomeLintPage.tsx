import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/biomelint'

type Tab = 'run' | 'history' | 'presets' | 'stats'

export default function BiomeLintPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('run')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('biome.title', 'Biome Toolchain')}</h2>
        <p className="text-warm-400 mt-1">{t('biome.subtitle', 'Lightning-fast linting and formatting — 4x faster than ESLint + Prettier')}</p>
      </div>
      <div className="flex gap-2">
        {(['run', 'history', 'presets', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`biome.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'run' && <RunTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'presets' && <PresetsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function RunTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [toolchain, setToolchain] = useState('biome')
  const [preset, setPreset] = useState('recommended')
  const [typeAware, setTypeAware] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.LintRunResponse | null>(null)

  const handleRun = async () => {
    if (!project.trim()) return
    setRunning(true)
    try {
      const res = await api.runLint(project, toolchain, preset, typeAware)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('biome.runLint', 'Run Lint & Format')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('biome.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-react-app" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('biome.toolchain', 'Toolchain')}</label>
            <select value={toolchain} onChange={e => setToolchain(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="biome">Biome</option>
              <option value="eslint-prettier">ESLint + Prettier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('biome.preset', 'Config Preset')}</label>
            <select value={preset} onChange={e => setPreset(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="recommended">{t('biome.presetRecommended', 'Recommended')}</option>
              <option value="strict">{t('biome.presetStrict', 'Strict')}</option>
              <option value="minimal">{t('biome.presetMinimal', 'Minimal')}</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={typeAware} onChange={e => setTypeAware(e.target.checked)} className="w-4 h-4 rounded border-warm-600 bg-warm-700 text-blue-600" />
              <span className="text-sm text-warm-300">{t('biome.typeAware', 'Enable Type-Aware Rules')}</span>
            </label>
          </div>
        </div>
        <button onClick={handleRun} disabled={running || !project.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('biome.running', 'Analyzing...') : t('biome.runBtn', 'Run Analysis')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.result.speedupFactor}x</div>
              <div className="text-sm text-warm-400">{t('biome.speedup', 'Speedup vs ESLint')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.result.totalFiles}</div>
              <div className="text-sm text-warm-400">{t('biome.filesLinted', 'Files Linted')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{result.result.errors}</div>
              <div className="text-sm text-warm-400">{t('biome.errors', 'Errors Found')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{result.result.autoFixed}</div>
              <div className="text-sm text-warm-400">{t('biome.autoFixed', 'Auto-Fixed')}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">{t('biome.speedComparison', 'Speed Comparison')}</h4>
              <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">{result.result.toolchain}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-warm-900 rounded-lg text-center">
                <div className="text-sm text-warm-400 mb-1">Biome</div>
                <div className="text-xl font-bold text-green-400">{result.comparison.biome.totalMs}ms</div>
              </div>
              <div className="p-3 bg-warm-900 rounded-lg text-center">
                <div className="text-sm text-warm-400 mb-1">ESLint + Prettier</div>
                <div className="text-xl font-bold text-red-400">{result.comparison.eslintPrettier.totalMs}ms</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('biome.detailedBreakdown', 'Detailed Breakdown')}</h4>
            <div className="space-y-2">
              {result.details.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg text-sm">
                  <span className="text-warm-300">{d.metric}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-green-400">{d.biome}</span>
                    <span className="text-warm-500">vs</span>
                    <span className="text-red-400">{d.eslint}</span>
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
  const [items, setItems] = useState<api.BiomeLintResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listLintResults().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('biome.loading', 'Loading...')}</div>
  if (items.length === 0) return <div className="text-warm-400">{t('biome.noHistory', 'No lint history yet.')}</div>

  return (
    <div className="space-y-3">
      {items.map(r => (
        <div key={r.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{r.projectName}</div>
            <div className="text-sm text-warm-400">{r.toolchain} · {r.configPreset} · {r.totalFiles} files · {r.errors} errors · {r.autoFixed} fixed</div>
            <div className="text-xs text-warm-500 mt-1">{r.totalDurationMs}ms · {r.speedupFactor}x speedup{r.typeAwareEnabled ? ` · ${r.typeAwareIssues} type issues` : ''}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${r.status === 'completed' ? 'bg-green-600 text-white' : r.status === 'failed' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {r.status}
            </span>
            <button onClick={async () => { await api.deleteLintResult(r.id); setItems(prev => prev.filter(x => x.id !== r.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('biome.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PresetsTab() {
  const { t } = useTranslation()
  const [presets, setPresets] = useState<api.LintPreset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getPresets().then(setPresets).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('biome.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('biome.presetsTitle', 'Biome Configuration Presets')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map(p => (
            <div key={p.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                  <h4 className="text-white font-medium">{p.name}</h4>
                </div>
                <span className="text-sm font-bold text-blue-400">{p.rules} rules</span>
              </div>
              <p className="text-sm text-warm-400">{p.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('biome.featuresTitle', 'Biome Key Features')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: t('biome.feat.speed', 'Rust-Powered Speed'), desc: t('biome.feat.speedDesc', 'Single Rust binary replaces ESLint + Prettier with 4x faster execution'), stat: '4x faster' },
            { name: t('biome.feat.typeAware', 'Type-Aware Rules'), desc: t('biome.feat.typeAwareDesc', 'Custom type inference engine — no TypeScript compiler dependency'), stat: 'No tsc needed' },
            { name: t('biome.feat.zeroConfig', 'Zero Configuration'), desc: t('biome.feat.zeroConfigDesc', 'Works out of the box — one biome.json replaces multiple config files'), stat: '1 config file' },
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
  const [stats, setStats] = useState<api.LintStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getLintStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('biome.loading', 'Loading...')}</div>
  if (!stats || stats.totalRuns === 0) return <div className="text-warm-400">{t('biome.noStats', 'No lint statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: stats.totalRuns, label: t('biome.stats.runs', 'Total Runs') },
          { value: `${stats.avgSpeedup}x`, label: t('biome.stats.avgSpeedup', 'Avg Speedup'), color: 'text-green-400' },
          { value: stats.totalErrors, label: t('biome.stats.totalErrors', 'Total Errors'), color: 'text-red-400' },
          { value: stats.totalAutoFixed, label: t('biome.stats.autoFixed', 'Total Auto-Fixed'), color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('biome.stats.byToolchain', 'By Toolchain')}</h4>
          <div className="space-y-2">
            {stats.byToolchain?.map(tc => (
              <div key={tc.toolchain} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{tc.toolchain}</span>
                <span className="text-warm-400 text-sm">{tc.count} runs · {tc.avgDuration}ms avg</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('biome.stats.byPreset', 'By Preset')}</h4>
          <div className="space-y-2">
            {stats.byPreset?.map(p => (
              <div key={p.preset} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{p.preset}</span>
                <span className="text-warm-400 text-sm">{p.count} runs · {p.avgErrors} avg errors</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
