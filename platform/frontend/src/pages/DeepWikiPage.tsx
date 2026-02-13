import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/codebasegraph'

type Tab = 'analyze' | 'impact' | 'history' | 'stats'

export default function DeepWikiPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('analyze')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('deepwiki.title', 'DeepWiki Codebase')}</h2>
        <p className="text-warm-400 mt-1">{t('deepwiki.subtitle', 'Semantic codebase awareness — dependency mapping, impact analysis, and architecture health')}</p>
      </div>
      <div className="flex gap-2">
        {(['analyze', 'impact', 'history', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`deepwiki.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'analyze' && <AnalyzeTab />}
      {tab === 'impact' && <ImpactTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function AnalyzeTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [mode, setMode] = useState('full')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.AnalyzeResponse | null>(null)

  const handleAnalyze = async () => {
    if (!project.trim()) return
    setRunning(true)
    try {
      const res = await api.analyzeCodebase(project, mode)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('deepwiki.analyzeTitle', 'Analyze Codebase')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('deepwiki.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-app" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('deepwiki.mode', 'Analysis Mode')}</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="full">{t('deepwiki.modeFull', 'Full Analysis')}</option>
              <option value="dependencies-only">{t('deepwiki.modeDeps', 'Dependencies Only')}</option>
              <option value="impact-only">{t('deepwiki.modeImpact', 'Impact Analysis')}</option>
            </select>
          </div>
        </div>
        <button onClick={handleAnalyze} disabled={running || !project.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('deepwiki.analyzing', 'Analyzing...') : t('deepwiki.analyzeBtn', 'Analyze Codebase')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.graph.totalNodes}</div>
              <div className="text-sm text-warm-400">{t('deepwiki.totalNodes', 'Total Nodes')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.graph.totalEdges}</div>
              <div className="text-sm text-warm-400">{t('deepwiki.totalEdges', 'Total Edges')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{result.graph.maxDepth}</div>
              <div className="text-sm text-warm-400">{t('deepwiki.maxDepth', 'Max Depth')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{result.graph.circularDeps}</div>
              <div className="text-sm text-warm-400">{t('deepwiki.circularDeps', 'Circular Deps')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">{t('deepwiki.nodeBreakdown', 'Node Breakdown')}</h4>
              <div className="space-y-2">
                {result.nodeTypes.map(n => (
                  <div key={n.type} className="flex items-center justify-between p-2 bg-warm-700 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: n.color }} />
                      <span className="text-white text-sm">{n.type}</span>
                    </div>
                    <span className="text-warm-400 text-sm font-medium">{n.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">{t('deepwiki.healthMetrics', 'Architecture Health')}</h4>
              <div className="space-y-2">
                {result.healthMetrics.map(m => (
                  <div key={m.metric} className="flex items-center justify-between p-2 bg-warm-700 rounded">
                    <span className="text-white text-sm">{m.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-warm-400 text-sm">{m.value}</span>
                      <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: m.color, color: 'white' }}>{m.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('deepwiki.highImpactFiles', 'High-Impact Files')}</h4>
            <div className="space-y-2">
              {result.impactFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg text-sm">
                  <span className="text-warm-300 font-mono">{f.file}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-warm-400">{f.connections} {t('deepwiki.connections', 'connections')}</span>
                    <span className="text-warm-400">{f.ripple} {t('deepwiki.ripple', 'ripple')}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${f.impact === 'high' ? 'bg-red-600 text-white' : f.impact === 'medium' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`}>
                      {f.impact}
                    </span>
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

function ImpactTab() {
  const { t } = useTranslation()
  const [filePath, setFilePath] = useState('')
  const [changeType, setChangeType] = useState('modify')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.ImpactResponse | null>(null)

  const handleAnalyze = async () => {
    if (!filePath.trim()) return
    setRunning(true)
    try {
      const res = await api.analyzeImpact(filePath, changeType)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('deepwiki.impactTitle', 'Ripple Effect Analysis')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('deepwiki.filePath', 'File Path')}</label>
            <input value={filePath} onChange={e => setFilePath(e.target.value)} placeholder="src/components/Layout.tsx" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('deepwiki.changeType', 'Change Type')}</label>
            <select value={changeType} onChange={e => setChangeType(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="modify">{t('deepwiki.modify', 'Modify')}</option>
              <option value="delete">{t('deepwiki.deleteChange', 'Delete')}</option>
              <option value="rename">{t('deepwiki.rename', 'Rename')}</option>
            </select>
          </div>
        </div>
        <button onClick={handleAnalyze} disabled={running || !filePath.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('deepwiki.analyzing', 'Analyzing...') : t('deepwiki.impactBtn', 'Analyze Impact')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{result.directImpact}</div>
              <div className="text-sm text-warm-400">{t('deepwiki.directImpact', 'Direct Impact')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{result.indirectImpact}</div>
              <div className="text-sm text-warm-400">{t('deepwiki.indirectImpact', 'Indirect Impact')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.totalAffected}</div>
              <div className="text-sm text-warm-400">{t('deepwiki.totalAffected', 'Total Affected')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${result.riskLevel === 'high' ? 'text-red-400' : result.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                {result.riskLevel.toUpperCase()}
              </div>
              <div className="text-sm text-warm-400">{t('deepwiki.riskLevel', 'Risk Level')}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <p className="text-sm text-warm-300">{result.suggestion}</p>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('deepwiki.affectedFiles', 'Affected Files')}</h4>
            <div className="space-y-2">
              {result.affectedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg text-sm">
                  <div>
                    <span className="text-warm-300 font-mono">{f.file}</span>
                    <div className="text-xs text-warm-500 mt-0.5">{f.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${f.impact === 'direct' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}`}>
                      {f.impact}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded ${f.severity === 'high' ? 'bg-red-600 text-white' : f.severity === 'medium' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`}>
                      {f.severity}
                    </span>
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
  const [items, setItems] = useState<api.CodebaseGraph[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listGraphs().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('deepwiki.loading', 'Loading...')}</div>
  if (items.length === 0) return <div className="text-warm-400">{t('deepwiki.noHistory', 'No analysis history yet.')}</div>

  return (
    <div className="space-y-3">
      {items.map(g => (
        <div key={g.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{g.projectName}</div>
            <div className="text-sm text-warm-400">{g.analysisMode} · {g.totalNodes} nodes · {g.totalEdges} edges · depth {g.maxDepth}</div>
            <div className="text-xs text-warm-500 mt-1">coupling {g.couplingScore} · cohesion {g.cohesionScore} · {g.circularDeps} circular deps</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${g.status === 'completed' ? 'bg-green-600 text-white' : g.status === 'failed' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {g.status}
            </span>
            <button onClick={async () => { await api.deleteGraph(g.id); setItems(prev => prev.filter(x => x.id !== g.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('deepwiki.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<api.GraphStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getGraphStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('deepwiki.loading', 'Loading...')}</div>
  if (!stats || stats.totalAnalyses === 0) return <div className="text-warm-400">{t('deepwiki.noStats', 'No analysis statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: stats.totalAnalyses, label: t('deepwiki.stats.analyses', 'Analyses') },
          { value: stats.avgCoupling, label: t('deepwiki.stats.avgCoupling', 'Avg Coupling'), color: 'text-yellow-400' },
          { value: stats.avgCohesion, label: t('deepwiki.stats.avgCohesion', 'Avg Cohesion'), color: 'text-green-400' },
          { value: stats.totalCircularDeps, label: t('deepwiki.stats.circularDeps', 'Circular Deps'), color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('deepwiki.stats.byMode', 'By Analysis Mode')}</h4>
          <div className="space-y-2">
            {stats.byMode?.map(m => (
              <div key={m.mode} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{m.mode}</span>
                <span className="text-warm-400 text-sm">{m.count} analyses · {m.avgNodes} avg nodes</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('deepwiki.stats.byStatus', 'By Status')}</h4>
          <div className="space-y-2">
            {stats.byStatus?.map(s => (
              <div key={s.status} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{s.status}</span>
                <span className="text-warm-400 text-sm">{s.count} analyses</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
