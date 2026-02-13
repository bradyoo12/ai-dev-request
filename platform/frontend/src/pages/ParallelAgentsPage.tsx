import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import * as api from '../api/parallelagents'

type Tab = 'execute' | 'history' | 'modes' | 'stats'

export default function ParallelAgentsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('execute')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('parallel.title', 'Parallel Agents')}</h2>
        <p className="text-warm-400 mt-1">{t('parallel.subtitle', 'Run multiple AI agents simultaneously with git worktree isolation')}</p>
      </div>
      <div className="flex gap-2">
        {(['execute', 'history', 'modes', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-300 hover:bg-warm-600'}`}>
            {t(`parallel.tabs.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'execute' && <ExecuteTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'modes' && <ModesTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function ExecuteTab() {
  const { t } = useTranslation()
  const [project, setProject] = useState('')
  const [task, setTask] = useState('')
  const [agentCount, setAgentCount] = useState(4)
  const [isolation, setIsolation] = useState('worktree')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<api.ExecuteResponse | null>(null)

  const handleExecute = async () => {
    if (!project.trim() || !task.trim()) return
    setRunning(true)
    try {
      const res = await api.execute(project, task, agentCount, isolation)
      setResult(res)
    } catch { /* ignore */ }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">{t('parallel.executeTitle', 'Launch Parallel Agents')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('parallel.projectName', 'Project Name')}</label>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="my-react-app" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('parallel.agentCount', 'Agent Count')}</label>
            <select value={agentCount} onChange={e => setAgentCount(Number(e.target.value))} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} agents</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-warm-400 mb-1">{t('parallel.taskDesc', 'Task Description')}</label>
            <input value={task} onChange={e => setTask(e.target.value)} placeholder="Refactor auth module, add tests, update docs" className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('parallel.isolation', 'Isolation Mode')}</label>
            <select value={isolation} onChange={e => setIsolation(e.target.value)} className="w-full px-3 py-2 bg-warm-700 border border-warm-600 rounded-lg text-white">
              <option value="worktree">{t('parallel.modeWorktree', 'Git Worktree (Recommended)')}</option>
              <option value="branch">{t('parallel.modeBranch', 'Branch Per Agent')}</option>
              <option value="fork">{t('parallel.modeFork', 'Fork Isolation')}</option>
            </select>
          </div>
        </div>
        <button onClick={handleExecute} disabled={running || !project.trim() || !task.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {running ? t('parallel.running', 'Executing...') : t('parallel.executeBtn', 'Launch Agents')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.run.speedupFactor}x</div>
              <div className="text-sm text-warm-400">{t('parallel.speedup', 'Speedup')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.run.agentCount}</div>
              <div className="text-sm text-warm-400">{t('parallel.agents', 'Agents')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{result.run.subtasksCompleted}/{result.run.subtasksTotal}</div>
              <div className="text-sm text-warm-400">{t('parallel.subtasks', 'Subtasks')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{result.run.mergeConflicts}</div>
              <div className="text-sm text-warm-400">{t('parallel.conflicts', 'Conflicts')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">{t('parallel.speedComparison', 'Speed Comparison')}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-warm-900 rounded-lg text-center">
                  <div className="text-sm text-warm-400 mb-1">{t('parallel.sequential', 'Sequential')}</div>
                  <div className="text-xl font-bold text-red-400">{Math.round(result.comparison.sequential.durationMs / 1000)}s</div>
                  <div className="text-xs text-warm-500">1 agent</div>
                </div>
                <div className="p-3 bg-warm-900 rounded-lg text-center">
                  <div className="text-sm text-warm-400 mb-1">{t('parallel.parallelExec', 'Parallel')}</div>
                  <div className="text-xl font-bold text-green-400">{Math.round(result.comparison.parallel.durationMs / 1000)}s</div>
                  <div className="text-xs text-warm-500">{result.comparison.parallel.agents} agents</div>
                </div>
              </div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">{t('parallel.mergeTimeline', 'Merge Timeline')}</h4>
              <div className="space-y-2">
                {result.mergeTimeline.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-warm-900 rounded text-sm">
                    <span className="text-warm-300">{m.phase}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-warm-400">{m.durationMs}ms</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${m.status === 'completed' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>{m.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('parallel.agentDetails', 'Agent Details')}</h4>
            <div className="space-y-2">
              {result.agentDetails.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warm-900 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white">{a.name}</span>
                    <span className="text-warm-400 font-mono text-xs">{a.branch}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-warm-400">{a.filesModified} files</span>
                    <span className="text-warm-400">{a.linesChanged} lines</span>
                    <span className="text-green-400">{Math.round(a.durationMs / 1000)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{t('parallel.subtaskDetails', 'Subtask Breakdown')}</h4>
            <div className="space-y-2">
              {result.subtaskDetails.map(s => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-warm-900 rounded text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-warm-500 w-6">#{s.id}</span>
                    <span className="text-white">{s.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 text-xs">{s.assignedTo}</span>
                    <span className="text-warm-400">{s.filesChanged} files</span>
                    <span className="px-1.5 py-0.5 text-xs rounded bg-green-600 text-white">{s.status}</span>
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
  const [items, setItems] = useState<api.ParallelAgentRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.listRuns().then(setItems).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('parallel.loading', 'Loading...')}</div>
  if (items.length === 0) return <div className="text-warm-400">{t('parallel.noHistory', 'No parallel agent runs yet.')}</div>

  return (
    <div className="space-y-3">
      {items.map(r => (
        <div key={r.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">{r.projectName}</div>
            <div className="text-sm text-warm-400">{r.agentCount} agents · {r.isolationMode} · {r.subtasksCompleted}/{r.subtasksTotal} subtasks · {r.filesModified} files</div>
            <div className="text-xs text-warm-500 mt-1">{Math.round(r.durationMs / 1000)}s · {r.speedupFactor}x speedup · {r.mergeConflicts} conflicts ({r.autoResolved} auto-resolved)</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded ${r.status === 'completed' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
              {r.status}
            </span>
            <button onClick={async () => { await api.deleteRun(r.id); setItems(prev => prev.filter(x => x.id !== r.id)) }} className="text-red-400 hover:text-red-300 text-sm">
              {t('parallel.delete', 'Delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ModesTab() {
  const { t } = useTranslation()
  const [modes, setModes] = useState<api.IsolationMode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getModes().then(setModes).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('parallel.loading', 'Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('parallel.modesTitle', 'Isolation Modes')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map(m => (
            <div key={m.id} className="p-4 bg-warm-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: m.color }} />
                  <h4 className="text-white font-medium">{m.name}</h4>
                </div>
                {m.recommended && <span className="text-xs text-green-400 bg-green-900 px-2 py-0.5 rounded">Recommended</span>}
              </div>
              <p className="text-sm text-warm-400">{m.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('parallel.featuresTitle', 'Parallel Agent Features')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: t('parallel.feat.decomposition', 'Task Decomposition'), desc: t('parallel.feat.decompositionDesc', 'AI breaks complex requests into parallelizable sub-tasks automatically'), stat: 'Auto-split' },
            { name: t('parallel.feat.autoMerge', 'Auto-Merge'), desc: t('parallel.feat.autoMergeDesc', 'AI-powered merge conflict resolution when agent changes overlap'), stat: '95% auto' },
            { name: t('parallel.feat.worktree', 'Worktree Isolation'), desc: t('parallel.feat.worktreeDesc', 'Each agent works in its own git worktree — zero conflicts during execution'), stat: '0 conflicts' },
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
  const [stats, setStats] = useState<api.AgentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getAgentStats().then(setStats).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400">{t('parallel.loading', 'Loading...')}</div>
  if (!stats || stats.totalRuns === 0) return <div className="text-warm-400">{t('parallel.noStats', 'No parallel agent statistics yet.')}</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: stats.totalRuns, label: t('parallel.stats.runs', 'Total Runs') },
          { value: `${stats.avgSpeedup}x`, label: t('parallel.stats.avgSpeedup', 'Avg Speedup'), color: 'text-green-400' },
          { value: stats.totalSubtasks, label: t('parallel.stats.subtasks', 'Total Subtasks'), color: 'text-blue-400' },
          { value: stats.totalAutoResolved, label: t('parallel.stats.autoResolved', 'Auto-Resolved'), color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            <div className="text-sm text-warm-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-warm-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-3">{t('parallel.stats.byIsolation', 'By Isolation Mode')}</h4>
        <div className="space-y-2">
          {stats.byIsolation?.map(m => (
            <div key={m.mode} className="flex justify-between p-2 bg-warm-700 rounded">
              <span className="text-white text-sm">{m.mode}</span>
              <span className="text-warm-400 text-sm">{m.count} runs · {m.avgSpeedup}x avg speedup</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
