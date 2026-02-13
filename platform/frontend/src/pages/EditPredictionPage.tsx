import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listPredictions, analyze, deletePrediction, getPredictionStats, getChangeTypes } from '../api/editprediction'
import type { EditPrediction, AnalyzeResponse, ChangeType, EditPredictionStats } from '../api/editprediction'

type Tab = 'analyze' | 'history' | 'changeTypes' | 'stats'

export default function EditPredictionPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('analyze')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{t('editpred.title', 'Next Edit Predictions')}</h2>
        <p className="text-warm-400 text-sm mt-1">{t('editpred.subtitle', 'Predict ripple effects of code changes and suggest related edits proactively')}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['analyze', 'history', 'changeTypes', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'}`}>
            {t(`editpred.tab.${tb}`, tb === 'changeTypes' ? 'Change Types' : tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'analyze' && <AnalyzeTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'changeTypes' && <ChangeTypesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function AnalyzeTab() {
  const { t } = useTranslation()
  const [projectName, setProjectName] = useState('')
  const [sourceFile, setSourceFile] = useState('')
  const [changeType, setChangeType] = useState('rename')
  const [changeDescription, setChangeDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)

  const handleAnalyze = async () => {
    if (!projectName || !sourceFile) return
    setLoading(true)
    try {
      const res = await analyze(projectName, sourceFile, changeType, changeDescription)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-warm-800 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('editpred.projectName', 'Project Name')}</label>
            <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="my-project" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('editpred.sourceFile', 'Source File')}</label>
            <input value={sourceFile} onChange={e => setSourceFile(e.target.value)} placeholder="src/components/UserProfile.tsx" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('editpred.changeType', 'Change Type')}</label>
            <select value={changeType} onChange={e => setChangeType(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
              <option value="rename">Rename Symbol</option>
              <option value="delete">Delete Symbol</option>
              <option value="modify-signature">Modify Signature</option>
              <option value="add-parameter">Add Parameter</option>
              <option value="change-type">Change Type</option>
              <option value="move">Move Symbol</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('editpred.description', 'Change Description')}</label>
            <input value={changeDescription} onChange={e => setChangeDescription(e.target.value)} placeholder="Rename getUserData to fetchUserProfile" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
          </div>
        </div>
        <button onClick={handleAnalyze} disabled={loading || !projectName || !sourceFile} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('editpred.analyzing', 'Analyzing...') : t('editpred.analyze', 'Analyze Ripple Effects')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('editpred.rippleAnalysis', 'Ripple Effect Analysis')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('editpred.affectedFiles', 'Affected Files')}</div>
                <div className="text-white text-lg font-bold">{result.prediction.affectedFiles}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('editpred.predictedEdits', 'Predicted Edits')}</div>
                <div className="text-blue-400 text-lg font-bold">{result.prediction.predictedEdits}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('editpred.confidence', 'Confidence')}</div>
                <div className="text-green-400 text-lg font-bold">{result.prediction.confidence}%</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('editpred.analysisTime', 'Analysis Time')}</div>
                <div className="text-white text-lg font-bold">{result.prediction.analysisTimeMs}ms</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('editpred.depGraph', 'Dependency Graph')}</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-warm-700 rounded p-2 text-center">
                <div className="text-white text-sm font-bold">{result.dependencyGraph.nodes}</div>
                <div className="text-warm-400 text-xs">{t('editpred.nodes', 'Nodes')}</div>
              </div>
              <div className="bg-warm-700 rounded p-2 text-center">
                <div className="text-white text-sm font-bold">{result.dependencyGraph.edges}</div>
                <div className="text-warm-400 text-xs">{t('editpred.edges', 'Edges')}</div>
              </div>
              <div className="bg-warm-700 rounded p-2 text-center">
                <div className="text-blue-400 text-sm font-bold">{result.dependencyGraph.maxDepth}</div>
                <div className="text-warm-400 text-xs">{t('editpred.depth', 'Max Depth')}</div>
              </div>
              <div className="bg-warm-700 rounded p-2 text-center">
                <div className="text-orange-400 text-sm font-bold">{result.dependencyGraph.hotspots}</div>
                <div className="text-warm-400 text-xs">{t('editpred.hotspots', 'Hotspots')}</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('editpred.suggestedEdits', 'Suggested Edits')}</h3>
            <div className="space-y-2">
              {result.predictions.map((p, i) => (
                <div key={i} className="bg-warm-700 rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-mono text-sm">{p.file}</span>
                    <span className={`text-xs px-2 py-1 rounded ${p.confidence >= 80 ? 'bg-green-900/30 text-green-400' : p.confidence >= 60 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-warm-600 text-warm-300'}`}>{p.confidence}%</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-warm-400">
                    <span className="bg-warm-600 px-2 py-0.5 rounded">{p.editType}</span>
                    <span>{p.description}</span>
                    <span className="ml-auto text-warm-500">L{p.lineRange.start}-{p.lineRange.end}</span>
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
  const [predictions, setPredictions] = useState<EditPrediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listPredictions().then(setPredictions).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!predictions.length) return <div className="text-warm-400 text-sm">{t('editpred.noHistory', 'No predictions yet.')}</div>

  return (
    <div className="space-y-2">
      {predictions.map(p => (
        <div key={p.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium">{p.sourceFile} <span className="text-warm-500">({p.changeType})</span></div>
            <div className="text-warm-500 text-xs mt-1">
              {p.affectedFiles} files | {p.predictedEdits} edits | {p.confidence}% confidence | depth {p.rippleDepth} | {p.analysisTimeMs}ms
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-warm-500 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
            <button onClick={async () => { await deletePrediction(p.id); setPredictions(prev => prev.filter(x => x.id !== p.id)) }} className="text-red-400 hover:text-red-300 text-xs">{t('common.delete', 'Delete')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ChangeTypesTab() {
  const { t } = useTranslation()
  const [types, setTypes] = useState<ChangeType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getChangeTypes().then(setTypes).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>

  const features = [
    { name: t('editpred.feat.ast', 'AST Analysis'), desc: t('editpred.feat.astDesc', 'Parse TypeScript AST to understand code structure, symbol references, and type relationships') },
    { name: t('editpred.feat.depGraph', 'Dependency Graph'), desc: t('editpred.feat.depGraphDesc', 'Build import/export dependency graph to trace ripple effects across modules') },
    { name: t('editpred.feat.testImpact', 'Test Impact Analysis'), desc: t('editpred.feat.testImpactDesc', 'Identify test files affected by changes to ensure comprehensive test coverage') }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {types.map(ct => (
          <div key={ct.id} className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{ct.name}</span>
              <span className={`text-xs px-2 py-1 rounded ${ct.impact === 'high' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{ct.impact}</span>
            </div>
            <p className="text-warm-400 text-sm">{ct.description}</p>
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
  const [stats, setStats] = useState<EditPredictionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getPredictionStats().then(setStats).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!stats || stats.totalAnalyses === 0) return <div className="text-warm-400 text-sm">{t('editpred.noStats', 'No prediction statistics yet.')}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('editpred.stats.analyses', 'Total Analyses')}</div>
          <div className="text-white text-xl font-bold">{stats.totalAnalyses}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('editpred.stats.confidence', 'Avg Confidence')}</div>
          <div className="text-green-400 text-xl font-bold">{stats.avgConfidence}%</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('editpred.stats.rippleDepth', 'Avg Ripple Depth')}</div>
          <div className="text-blue-400 text-xl font-bold">{stats.avgRippleDepth}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('editpred.stats.edits', 'Total Predicted Edits')}</div>
          <div className="text-white text-xl font-bold">{stats.totalPredictedEdits}</div>
        </div>
      </div>
      {stats.byChangeType && stats.byChangeType.length > 0 && (
        <div className="bg-warm-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('editpred.stats.byType', 'By Change Type')}</h3>
          <div className="space-y-2">
            {stats.byChangeType.map((ct, i) => (
              <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                <span className="text-white text-sm">{ct.changeType}</span>
                <div className="flex gap-4">
                  <span className="text-warm-400 text-sm">{ct.count} analyses</span>
                  <span className="text-green-400 text-sm">{ct.avgConfidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
