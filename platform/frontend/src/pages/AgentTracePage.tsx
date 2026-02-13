import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listTraces, analyzeProject, deleteTrace, getTraceStats, getTraceFormats } from '../api/agenttrace'
import type { AgentTrace, AnalyzeResponse, TraceFormat, TraceStats } from '../api/agenttrace'

type Tab = 'analyze' | 'history' | 'formats' | 'stats'

export default function AgentTracePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('analyze')
  const [project, setProject] = useState('')
  const [fileName, setFileName] = useState('')
  const [model, setModel] = useState('claude-opus-4-6')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AgentTrace[]>([])
  const [formats, setFormats] = useState<TraceFormat[]>([])
  const [stats, setStats] = useState<TraceStats>({ total: 0, byAuthor: [] })

  useEffect(() => {
    if (tab === 'history') listTraces().then(setHistory)
    if (tab === 'formats') getTraceFormats().then(setFormats)
    if (tab === 'stats') getTraceStats().then(setStats)
  }, [tab])

  const handleAnalyze = async () => {
    if (!project || !fileName) return
    setLoading(true)
    try {
      const r = await analyzeProject(project, fileName, model)
      setResult(r)
    } finally {
      setLoading(false)
    }
  }

  const authorColor = (a: string) => {
    switch (a) {
      case 'ai': return 'text-blue-400'
      case 'human': return 'text-green-400'
      case 'mixed': return 'text-yellow-400'
      default: return 'text-warm-400'
    }
  }

  const complianceColor = (c: string) => {
    switch (c) {
      case 'compliant': return 'bg-green-600'
      case 'review-needed': return 'bg-yellow-600'
      case 'non-compliant': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const pctBar = (pct: number) => (
    <div className="w-full bg-warm-700 rounded-full h-2">
      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('trace.title', 'Agent Trace — AI Code Attribution')}</h3>
      <div className="flex gap-2 mb-6">
        {(['analyze', 'history', 'formats', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-400 hover:text-white'}`}
          >{t(`trace.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}</button>
        ))}
      </div>

      {tab === 'analyze' && (
        <div className="bg-warm-800 rounded-lg p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('trace.project', 'Project Name')}</label>
              <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-app"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('trace.fileName', 'File Name')}</label>
              <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="App.tsx"
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('trace.model', 'AI Model')}</label>
              <select value={model} onChange={e => setModel(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-white">
                <option value="claude-opus-4-6">Claude Opus 4.6</option>
                <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>
            </div>
          </div>
          <button onClick={handleAnalyze} disabled={loading || !project || !fileName}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('trace.analyzing', 'Analyzing...') : t('trace.analyze', 'Analyze Attribution')}
          </button>

          {result && (
            <div className="mt-6 bg-warm-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{t('trace.result', 'Attribution Analysis')}</h4>
                <span className={`${complianceColor(result.complianceStatus)} text-white text-xs px-2 py-1 rounded`}>
                  {result.complianceStatus.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('trace.totalLines', 'Total Lines')}</div>
                  <div className="text-xl font-bold text-white">{result.totalLines}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('trace.aiLines', 'AI Generated')}</div>
                  <div className="text-xl font-bold text-blue-400">{result.aiGeneratedLines}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('trace.humanLines', 'Human Edited')}</div>
                  <div className="text-xl font-bold text-green-400">{result.humanEditedLines}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('trace.aiPct', 'AI %')}</div>
                  <div className="text-xl font-bold text-white">{result.aiPercentage}%</div>
                  {pctBar(result.aiPercentage)}
                </div>
              </div>

              {result.files.length > 0 && (
                <div className="mb-4">
                  <div className="text-warm-400 text-sm mb-2">{t('trace.fileBreakdown', 'File-Level Attribution')}</div>
                  <div className="space-y-2">
                    {result.files.map((f, i) => (
                      <div key={i} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium ${authorColor(f.authorType)}`}>{f.authorType.toUpperCase()}</span>
                          <span className="text-white text-sm font-mono">{f.fileName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-warm-400 text-xs">{f.totalLines} lines</span>
                          <div className="w-24">{pctBar(f.aiPercentage)}</div>
                          <span className="text-white text-sm w-12 text-right">{f.aiPercentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('trace.traceFormat', 'Trace Format')}</div>
                  <div className="text-white text-sm font-mono">{result.traceFormat}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3">
                  <div className="text-warm-400 text-xs">{t('trace.conversationId', 'Conversation ID')}</div>
                  <div className="text-white text-sm font-mono">{result.conversationId}</div>
                </div>
              </div>

              <div className="bg-warm-800 rounded-lg p-3">
                <div className="text-warm-400 text-sm mb-1">{t('trace.recommendation', 'Recommendation')}</div>
                <div className="text-white text-sm">{result.summary.recommendation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 && <div className="text-warm-400 text-center py-8">{t('trace.noHistory', 'No traces recorded yet')}</div>}
          {history.map(tr => (
            <div key={tr.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{tr.fileName}</span>
                  <span className={`text-xs font-medium ${authorColor(tr.authorType)}`}>{tr.authorType}</span>
                  <span className={`${complianceColor(tr.complianceStatus)} text-white text-xs px-2 py-0.5 rounded`}>{tr.complianceStatus}</span>
                </div>
                <div className="text-warm-400 text-sm mt-1">
                  {tr.projectName} | {tr.aiPercentage}% AI | {tr.totalLines} lines | {tr.modelUsed} | {new Date(tr.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={async () => { await deleteTrace(tr.id); setHistory(h => h.filter(x => x.id !== tr.id)) }}
                className="text-red-400 hover:text-red-300 text-sm">{t('common.delete', 'Delete')}</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'formats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formats.map(f => (
            <div key={f.id} className="bg-warm-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">{f.name}</h4>
                <span className="text-warm-400 text-xs font-mono">{f.spec}</span>
              </div>
              <p className="text-warm-400 text-sm mb-3">{f.description}</p>
              <div className="mb-3">
                <div className="text-warm-300 text-xs mb-1">{t('trace.supporters', 'Backed by')}:</div>
                <div className="flex flex-wrap gap-1">
                  {f.supporters.map(s => (
                    <span key={s} className="bg-warm-700 text-warm-300 px-2 py-0.5 rounded text-xs">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-warm-300 text-xs mb-1">{t('trace.fields', 'Schema Fields')}:</div>
                <div className="flex flex-wrap gap-1">
                  {f.fields.map(field => (
                    <span key={field} className="bg-blue-900/30 text-blue-400 border border-blue-700 px-2 py-0.5 rounded text-xs font-mono">{field}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="bg-warm-800 rounded-lg p-6 mb-4">
            <div className="text-warm-400 text-sm">{t('trace.totalTraces', 'Total Traces')}</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.byAuthor.map(s => (
              <div key={s.authorType} className="bg-warm-800 rounded-lg p-4">
                <div className={`font-medium ${authorColor(s.authorType)}`}>{s.authorType.toUpperCase()}</div>
                <div className="text-warm-400 text-sm mt-1">
                  {t('trace.stats.count', 'Count')}: {s.count} | {t('trace.stats.avgAi', 'Avg AI')}: {s.avgAiPercentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
