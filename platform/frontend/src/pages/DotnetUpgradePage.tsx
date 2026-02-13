import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/dotnetupgrade'

type Tab = 'analyze' | 'history' | 'features' | 'stats'

export default function DotnetUpgradePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('analyze')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('dotnet10.title', '.NET 10 LTS Upgrade')}</h2>
        <p className="text-warm-400 mt-1">{t('dotnet10.subtitle', 'Analyze upgrade path to .NET 10 LTS with EF Core vector search, C# 14, and MCP support')}</p>
      </div>
      <div className="flex gap-2">
        {(['analyze', 'history', 'features', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`dotnet10.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'analyze' && <AnalyzeTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'features' && <FeaturesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function AnalyzeTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [currentVersion, setCurrentVersion] = useState('net9.0')
  const [vectorSearch, setVectorSearch] = useState(false)
  const [nativeAot, setNativeAot] = useState(false)
  const [mcpSupport, setMcpSupport] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.AnalyzeResponse | null>(null)

  const handleAnalyze = async () => {
    if (!project.trim()) return
    setRunning(true)
    try {
      const res = await api.analyzeUpgrade(project, currentVersion, vectorSearch, nativeAot, mcpSupport)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('dotnet10.analyzeTitle', 'Upgrade Analysis')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('dotnet10.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="AiDevRequest.API" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('dotnet10.currentVersion', 'Current Version')}</label>
            <select value={currentVersion} onChange={e => setCurrentVersion(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="net9.0">.NET 9</option>
              <option value="net8.0">.NET 8 LTS</option>
              <option value="net7.0">.NET 7</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={vectorSearch} onChange={e => setVectorSearch(e.target.checked)} className="w-4 h-4 rounded border-warm-600 bg-warm-700 text-blue-600" />
            <span className="text-sm text-warm-300">{t('dotnet10.enableVector', 'Enable EF Core Vector Search')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={nativeAot} onChange={e => setNativeAot(e.target.checked)} className="w-4 h-4 rounded border-warm-600 bg-warm-700 text-blue-600" />
            <span className="text-sm text-warm-300">{t('dotnet10.enableAot', 'Enable Native AOT')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={mcpSupport} onChange={e => setMcpSupport(e.target.checked)} className="w-4 h-4 rounded border-warm-600 bg-warm-700 text-blue-600" />
            <span className="text-sm text-warm-300">{t('dotnet10.enableMcp', 'Enable MCP Support')}</span>
          </label>
        </div>
        <button onClick={handleAnalyze} disabled={running || !project.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('dotnet10.analyzing', 'Analyzing...') : t('dotnet10.analyzeBtn', 'Analyze Upgrade')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.result.startupTimeReduction}%</div>
              <div className="text-sm text-warm-400">{t('dotnet10.startupReduction', 'Startup Faster')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.result.memoryReduction}%</div>
              <div className="text-sm text-warm-400">{t('dotnet10.memoryReduction', 'Memory Saved')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{result.result.throughputIncrease}%</div>
              <div className="text-sm text-warm-400">{t('dotnet10.throughputIncrease', 'Throughput Up')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{result.result.packagesUpgraded}</div>
              <div className="text-sm text-warm-400">{t('dotnet10.packages', 'Packages')}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('dotnet10.perfComparison', 'Performance Comparison')}</h4>
            <div className="space-y-2">
              {result.performanceComparison.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg text-sm">
                  <span className="text-warm-300">{p.metric}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-400">{p.net9}</span>
                    <span className="text-warm-500">→</span>
                    <span className="text-green-400">{p.net10}</span>
                    <span className="text-blue-400 font-medium">+{p.improvement}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">{t('dotnet10.packageUpgrades', 'Package Upgrades')}</h4>
              <div className="space-y-2">
                {result.packageUpgrades.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-warm-900 rounded text-sm">
                    <span className="text-white">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-warm-400">{p.from} → {p.to}</span>
                      {p.hasBreaking && <span className="px-1.5 py-0.5 text-xs bg-red-600 text-white rounded">Breaking</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">{t('dotnet10.csharp14', 'C# 14 Adoptions')}</h4>
              <div className="space-y-2">
                {result.csharp14Features.map((f, i) => (
                  <div key={i} className="p-2 bg-warm-900 rounded text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{f.feature}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">{f.adoptions} uses</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${f.effort === 'Low' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>{f.effort}</span>
                      </div>
                    </div>
                    <p className="text-warm-400 text-xs mt-1">{f.description}</p>
                  </div>
                ))}
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
  const [items, setItems] = useState<api.DotnetUpgradeResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listUpgrades().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('dotnet10.loading', 'Loading...')}</div>
  if (items.length === 0) return <div className="text-warm-400">{t('dotnet10.noHistory', 'No upgrade analyses yet.')}</div>

  return (
    <div className="space-y-3">
      {items.map(r => (
        <div key={r.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{r.projectName}</div>
            <div className="text-sm text-warm-400">{r.currentVersion} → {r.targetVersion} · {r.packagesUpgraded} packages · {r.breakingChanges} breaking · {r.cSharp14Adoptions} C# 14</div>
            <div className="text-xs text-warm-500 mt-1">{r.analysisDurationMs}ms · {r.startupTimeReduction}% faster · {r.memoryReduction}% less memory</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${r.status === 'completed' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
              {r.status}
            </span>
            <button onClick={async () => { await api.deleteUpgrade(r.id); setItems(prev => prev.filter(x => x.id !== r.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('dotnet10.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function FeaturesTab() {
  const { t } = useTranslation()
  const [features, setFeatures] = useState<api.DotnetFeature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getFeatures().then(setFeatures).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('dotnet10.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('dotnet10.featuresTitle', '.NET 10 Key Features')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(f => (
            <div key={f.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: f.color }} />
                  <h4 className="text-white font-medium">{f.name}</h4>
                </div>
                <span className="text-xs text-warm-400 bg-warm-600 px-2 py-0.5 rounded">{f.category}</span>
              </div>
              <p className="text-sm text-warm-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('dotnet10.whyUpgrade', 'Why Upgrade to .NET 10?')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: t('dotnet10.why.lts', '3-Year LTS Support'), desc: t('dotnet10.why.ltsDesc', '.NET 10 is supported until November 2028 — no more annual upgrades'), stat: 'Nov 2028' },
            { name: t('dotnet10.why.perf', 'AVX10.2 Acceleration'), desc: t('dotnet10.why.perfDesc', 'Hardware-accelerated vector operations and improved JIT inlining'), stat: '30%+ faster' },
            { name: t('dotnet10.why.ai', 'AI-Native Runtime'), desc: t('dotnet10.why.aiDesc', 'Built-in MCP support, vector search, and AI service abstractions'), stat: 'MCP ready' },
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
  const [stats, setStats] = useState<api.UpgradeStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getUpgradeStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('dotnet10.loading', 'Loading...')}</div>
  if (!stats || stats.totalAnalyses === 0) return <div className="text-warm-400">{t('dotnet10.noStats', 'No upgrade statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: stats.totalAnalyses, label: t('dotnet10.stats.analyses', 'Total Analyses') },
          { value: `${stats.avgStartupReduction}%`, label: t('dotnet10.stats.avgStartup', 'Avg Startup Gain'), color: 'text-green-400' },
          { value: `${stats.avgMemoryReduction}%`, label: t('dotnet10.stats.avgMemory', 'Avg Memory Saved'), color: 'text-blue-400' },
          { value: stats.totalCSharp14Adoptions, label: t('dotnet10.stats.csharp14', 'C# 14 Adoptions'), color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-warm-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-3">{t('dotnet10.stats.byVersion', 'By Source Version')}</h4>
        <div className="space-y-2">
          {stats.byVersion?.map(v => (
            <div key={v.version} className="flex justify-between p-2 bg-warm-700 rounded">
              <span className="text-white text-sm">{v.version}</span>
              <span className="text-warm-400 text-sm">{v.count} analyses · +{v.avgImprovement}% throughput</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
