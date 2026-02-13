import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listSessions, executeCode, deleteSession, getIdeStats, getRuntimes } from '../api/browseride'
import type { BrowserIdeSession, ExecuteResponse, IdeRuntime, IdeStats } from '../api/browseride'

type Tab = 'execute' | 'history' | 'runtimes' | 'stats'

export default function BrowserIdePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('execute')
  const [sessions, setSessions] = useState<BrowserIdeSession[]>([])
  const [runtimes, setRuntimes] = useState<IdeRuntime[]>([])
  const [stats, setStats] = useState<IdeStats | null>(null)
  const [projectName, setProjectName] = useState('')
  const [runtime, setRuntime] = useState('react')
  const [code, setCode] = useState('')
  const [result, setResult] = useState<ExecuteResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tab === 'history') listSessions().then(setSessions).catch(() => {})
    if (tab === 'runtimes') getRuntimes().then(setRuntimes).catch(() => {})
    if (tab === 'stats') getIdeStats().then(setStats).catch(() => {})
  }, [tab])

  const handleExecute = async () => {
    if (!projectName.trim() || !code.trim()) return
    setLoading(true)
    try {
      const res = await executeCode(projectName, code, runtime)
      setResult(res)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'execute', label: t('browseride.tab.execute', 'Execute') },
    { key: 'history', label: t('browseride.tab.history', 'History') },
    { key: 'runtimes', label: t('browseride.tab.runtimes', 'Runtimes') },
    { key: 'stats', label: t('browseride.tab.stats', 'Stats') },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">{t('browseride.title', 'Browser IDE')}</h2>
      <p className="text-warm-400 text-sm mb-4">{t('browseride.subtitle', 'Instant code execution with live preview, console output, and sharing')}</p>

      <div className="flex gap-2 mb-4">
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              tab === tb.key ? 'bg-blue-600 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'execute' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('browseride.projectName', 'Project Name')}</label>
              <input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm"
                placeholder="my-app"
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('browseride.runtime', 'Runtime')}</label>
              <select
                value={runtime}
                onChange={e => setRuntime(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm"
              >
                <option value="react">React 19</option>
                <option value="node">Node.js 22</option>
                <option value="vanilla">Vanilla JS</option>
                <option value="typescript">TypeScript 5.7</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('browseride.code', 'Code')}</label>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm font-mono h-48"
              placeholder={runtime === 'react' ? "export default function App() {\n  return <h1>Hello World</h1>\n}" : "console.log('Hello World')"}
            />
          </div>
          <button
            onClick={handleExecute}
            disabled={loading || !projectName.trim() || !code.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('browseride.running', 'Executing...') : t('browseride.execute', 'Run Code')}
          </button>

          {result && (
            <div className="bg-warm-800 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-medium">{t('browseride.result', 'Execution Result')}</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('browseride.execTime', 'Exec Time')}</div>
                  <div className="text-white font-medium">{result.executionTimeMs}ms</div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('browseride.memory', 'Memory')}</div>
                  <div className="text-white font-medium">{result.memoryUsageMb}MB</div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('browseride.lines', 'Lines')}</div>
                  <div className="text-white font-medium">{result.session.linesOfCode}</div>
                </div>
                <div className="text-center">
                  <div className="text-warm-400 text-xs">{t('browseride.status', 'Status')}</div>
                  <div className={`font-medium ${result.session.hasErrors ? 'text-red-400' : 'text-green-400'}`}>
                    {result.session.status}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-warm-400 text-xs mb-1">{t('browseride.consoleOutput', 'Console Output')}</div>
                <div className="bg-warm-900 rounded p-3 font-mono text-sm text-green-400 space-y-0.5">
                  {result.consoleOutput.map((line, i) => (
                    <div key={i} className={line.startsWith('Error') ? 'text-red-400' : ''}>{line}</div>
                  ))}
                </div>
              </div>
              {result.livePreviewUrl && (
                <div className="text-sm text-blue-400">
                  {t('browseride.livePreview', 'Live Preview')}: {result.livePreviewUrl}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {sessions.length === 0 && <p className="text-warm-400 text-sm">{t('browseride.noHistory', 'No IDE sessions yet.')}</p>}
          {sessions.map(s => (
            <div key={s.id} className="bg-warm-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{s.projectName}</div>
                <div className="text-warm-400 text-xs mt-0.5">
                  {s.runtime} &middot; {s.linesOfCode} {t('browseride.linesLabel', 'lines')} &middot; {s.executionTimeMs}ms &middot; {s.memoryUsageMb}MB
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded ${s.hasErrors ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                  {s.status}
                </span>
                <button onClick={() => handleDelete(s.id)} className="text-warm-500 hover:text-red-400 text-xs">
                  {t('common.delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'runtimes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {runtimes.map(r => (
              <div key={r.id} className="bg-warm-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{r.icon}</span>
                  <span className="text-white font-medium">{r.name}</span>
                </div>
                <p className="text-warm-400 text-sm mb-2">{r.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {r.extensions.map(ext => (
                    <span key={ext} className="text-xs bg-warm-700 text-warm-300 px-2 py-0.5 rounded">{ext}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">{t('browseride.features', 'Features')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-white text-sm font-medium">{t('browseride.feat.livePreview', 'Live Preview')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('browseride.feat.livePreviewDesc', 'See changes instantly with hot module replacement and real-time rendering')}</div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">{t('browseride.feat.console', 'Console Output')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('browseride.feat.consoleDesc', 'Full console capture with error highlighting, stack traces, and output filtering')}</div>
              </div>
              <div>
                <div className="text-white text-sm font-medium">{t('browseride.feat.sharing', 'Share & Fork')}</div>
                <div className="text-warm-400 text-xs mt-1">{t('browseride.feat.sharingDesc', 'Generate shareable links and allow others to fork your code for collaboration')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          {!stats || stats.totalSessions === 0 ? (
            <p className="text-warm-400 text-sm">{t('browseride.noStats', 'No IDE session statistics yet.')}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('browseride.stats.sessions', 'Total Sessions')}</div>
                  <div className="text-white text-lg font-bold">{stats.totalSessions}</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('browseride.stats.execTime', 'Avg Exec Time')}</div>
                  <div className="text-white text-lg font-bold">{stats.avgExecutionTimeMs}ms</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('browseride.stats.memory', 'Avg Memory')}</div>
                  <div className="text-white text-lg font-bold">{stats.avgMemoryUsageMb}MB</div>
                </div>
                <div className="bg-warm-800 rounded-lg p-3 text-center">
                  <div className="text-warm-400 text-xs">{t('browseride.stats.errorRate', 'Error Rate')}</div>
                  <div className="text-white text-lg font-bold">{stats.errorRate}%</div>
                </div>
              </div>
              {stats.byRuntime.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">{t('browseride.stats.byRuntime', 'By Runtime')}</h3>
                  <div className="space-y-2">
                    {stats.byRuntime.map(r => (
                      <div key={r.runtime} className="flex justify-between text-sm">
                        <span className="text-warm-300">{r.runtime}</span>
                        <span className="text-warm-400">{r.count} sessions &middot; {r.avgExecutionTimeMs}ms avg &middot; {r.errorRate}% errors</span>
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
