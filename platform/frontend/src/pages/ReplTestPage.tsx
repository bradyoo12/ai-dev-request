import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/repltest'

type Tab = 'run' | 'sessions' | 'compare' | 'stats'

export default function ReplTestPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('run')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('repl.title', 'REPL-Based Testing')}</h2>
        <p className="text-warm-400 mt-1">{t('repl.subtitle', 'Fast verification via runtime interaction — 3x faster, 10x cheaper than browser automation')}</p>
      </div>
      <div className="flex gap-2">
        {(['run', 'sessions', 'compare', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`repl.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'run' && <RunTab />}
      {tab === 'sessions' && <SessionsTab />}
      {tab === 'compare' && <CompareTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function RunTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [mode, setMode] = useState('repl')
  const [runtime, setRuntime] = useState('node')
  const [runtimes, setRuntimes] = useState<api.ReplRuntime[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.RunTestResponse | null>(null)

  useEffect(() => { api.getRuntimes().then(setRuntimes).catch(() => {}) }, [])

  const handleRun = async () => {
    if (!project.trim()) return
    setRunning(true)
    try {
      const res = await api.runTests(project, mode, runtime)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('repl.runTests', 'Run REPL Tests')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('repl.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-app" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('repl.testMode', 'Test Mode')}</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="repl">{t('repl.modeRepl', 'REPL')}</option>
              <option value="browser">{t('repl.modeBrowser', 'Browser')}</option>
              <option value="hybrid">{t('repl.modeHybrid', 'Hybrid')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('repl.runtime', 'Runtime')}</label>
            <select value={runtime} onChange={e => setRuntime(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              {runtimes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleRun} disabled={running || !project.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('repl.running', 'Running...') : t('repl.runBtn', 'Run Tests')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.session.passedTests}</div>
              <div className="text-sm text-warm-400">{t('repl.passed', 'Passed')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{result.session.failedTests}</div>
              <div className="text-sm text-warm-400">{t('repl.failed', 'Failed')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{result.session.potemkinDetections}</div>
              <div className="text-sm text-warm-400">{t('repl.potemkin', 'Potemkin')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.session.avgLatencyMs}ms</div>
              <div className="text-sm text-warm-400">{t('repl.avgLatency', 'Avg Latency')}</div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('repl.testResults', 'Test Results')}</h4>
            <div className="space-y-2">
              {result.results.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-warm-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${r.status === 'passed' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-white">{r.name}</span>
                    {r.potemkin && <span className="px-2 py-0.5 text-xs bg-yellow-600 text-white rounded">{t('repl.potemkinTag', 'Potemkin')}</span>}
                    {r.dbVerified && <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded">{t('repl.dbVerified', 'DB Verified')}</span>}
                  </div>
                  <span className="text-sm text-warm-400">{r.latencyMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionsTab() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<api.ReplTestSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listSessions().then(setSessions).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('repl.loading', 'Loading...')}</div>
  if (sessions.length === 0) return <div className="text-warm-400">{t('repl.noSessions', 'No test sessions yet. Run your first test!')}</div>

  return (
    <div className="space-y-3">
      {sessions.map(s => (
        <div key={s.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{s.projectName}</div>
            <div className="text-sm text-warm-400">{s.runtime} · {s.testMode} · {s.totalTests} {t('repl.tests', 'tests')} · {s.passedTests} {t('repl.passed', 'passed')}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${s.status === 'completed' ? 'bg-green-600 text-white' : s.status === 'failed' ? 'bg-red-600 text-white' : 'bg-warm-600 text-warm-300'}`}>
              {s.status}
            </span>
            <button onClick={async () => { await api.deleteSession(s.id); setSessions(p => p.filter(x => x.id !== s.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('repl.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function CompareTab() {
  const { t } = useTranslation()

  const comparisons = [
    { metric: t('repl.compare.startup', 'Startup Time'), repl: '~50ms', browser: '~2,000ms', savings: '40x' },
    { metric: t('repl.compare.testExec', 'Test Execution'), repl: '~20ms/test', browser: '~200ms/test', savings: '10x' },
    { metric: t('repl.compare.cost', 'Cost per Run'), repl: '$0.005', browser: '$0.05', savings: '10x' },
    { metric: t('repl.compare.memory', 'Memory Usage'), repl: '~50MB', browser: '~500MB', savings: '10x' },
    { metric: t('repl.compare.parallel', 'Parallel Runs'), repl: '100+', browser: '~10', savings: '10x' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('repl.compareTitle', 'REPL vs Browser Testing')}</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-warm-400 text-sm border-b border-warm-700">
              <th className="pb-2">{t('repl.compare.metric', 'Metric')}</th>
              <th className="pb-2">{t('repl.compare.replCol', 'REPL Mode')}</th>
              <th className="pb-2">{t('repl.compare.browserCol', 'Browser Mode')}</th>
              <th className="pb-2">{t('repl.compare.savingsCol', 'Savings')}</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map(c => (
              <tr key={c.metric} className="border-b border-warm-700/50">
                <td className="py-3 text-white">{c.metric}</td>
                <td className="py-3 text-green-400">{c.repl}</td>
                <td className="py-3 text-warm-400">{c.browser}</td>
                <td className="py-3 text-blue-400 font-medium">{c.savings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">{t('repl.runtimesTitle', 'Supported Runtimes')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Node.js', desc: 'JavaScript/TypeScript with REPL and V8 inspector', color: '#339933' },
            { name: 'Deno', desc: 'Secure by default with built-in TypeScript', color: '#000000' },
            { name: 'Bun', desc: 'Ultra-fast with native test runner', color: '#FBF0DF' },
            { name: 'Python', desc: 'Interactive REPL with debugging tools', color: '#3776AB' },
          ].map(rt => (
            <div key={rt.name} className="flex items-center gap-3 p-3 bg-warm-700 rounded-lg">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rt.color }} />
              <div>
                <div className="text-white text-sm font-medium">{rt.name}</div>
                <div className="text-warm-400 text-xs">{rt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsTab() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<api.ReplStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getReplStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('repl.loading', 'Loading...')}</div>
  if (!stats || stats.totalSessions === 0) return <div className="text-warm-400">{t('repl.noStats', 'No testing statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalSessions}</div>
          <div className="text-sm text-warm-400">{t('repl.stats.sessions', 'Sessions')}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalTests}</div>
          <div className="text-sm text-warm-400">{t('repl.stats.tests', 'Total Tests')}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.passRate}%</div>
          <div className="text-sm text-warm-400">{t('repl.stats.passRate', 'Pass Rate')}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.avgSpeedup}x</div>
          <div className="text-sm text-warm-400">{t('repl.stats.speedup', 'Avg Speedup')}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.avgCostReduction}x</div>
          <div className="text-sm text-warm-400">{t('repl.stats.costReduction', 'Cost Reduction')}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.potemkinDetected}</div>
          <div className="text-sm text-warm-400">{t('repl.stats.potemkin', 'Potemkin Detected')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('repl.stats.byMode', 'By Test Mode')}</h4>
          <div className="space-y-2">
            {stats.byMode.map(m => (
              <div key={m.mode} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{m.mode}</span>
                <span className="text-warm-400 text-sm">{m.count} {t('repl.sessionsLabel', 'sessions')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3">{t('repl.stats.byRuntime', 'By Runtime')}</h4>
          <div className="space-y-2">
            {stats.byRuntime.map(r => (
              <div key={r.runtime} className="flex justify-between p-2 bg-warm-700 rounded">
                <span className="text-white text-sm">{r.runtime}</span>
                <span className="text-warm-400 text-sm">{r.count} {t('repl.sessionsLabel', 'sessions')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
