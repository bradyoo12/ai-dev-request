import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listAgents,
  getAgent,
  spawnAgent,
  stopAgent,
  getAgentStats,
  getAgentTypes,
  type AgentSummary,
  type AgentDetail,
  type AgentStats,
  type AgentType,
} from '../api/backgroundagent'

export default function BackgroundAgentPage() {
  const { t } = useTranslation()
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null)
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [agentTypes, setAgentTypes] = useState<AgentType[]>([])
  const [loading, setLoading] = useState(false)
  const [spawning, setSpawning] = useState(false)
  const [tab, setTab] = useState<'dashboard' | 'agents' | 'spawn' | 'logs'>('dashboard')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [spawnForm, setSpawnForm] = useState({
    devRequestId: '',
    agentName: '',
    taskDescription: '',
    agentType: 'general',
    priority: 'normal',
  })

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [agentList, agentStats, types] = await Promise.all([
        listAgents(),
        getAgentStats(),
        getAgentTypes(),
      ])
      setAgents(agentList)
      setStats(agentStats)
      setAgentTypes(types)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const loadAgents = async () => {
    setLoading(true)
    try {
      const list = await listAgents(filterStatus || undefined)
      setAgents(list)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleSelectAgent = async (agentId: string) => {
    try {
      const detail = await getAgent(agentId)
      setSelectedAgent(detail)
    } catch { /* ignore */ }
  }

  const handleSpawn = async () => {
    if (!spawnForm.devRequestId) return
    setSpawning(true)
    try {
      await spawnAgent({
        devRequestId: spawnForm.devRequestId,
        agentName: spawnForm.agentName || undefined,
        taskDescription: spawnForm.taskDescription || undefined,
        agentType: spawnForm.agentType,
        priority: spawnForm.priority,
      })
      setSpawnForm({ devRequestId: '', agentName: '', taskDescription: '', agentType: 'general', priority: 'normal' })
      setTab('agents')
      await loadAgents()
    } catch { /* ignore */ }
    setSpawning(false)
  }

  const handleStop = async (agentId: string) => {
    try {
      await stopAgent(agentId)
      await loadAgents()
      if (selectedAgent?.id === agentId) {
        const detail = await getAgent(agentId)
        setSelectedAgent(detail)
      }
    } catch { /* ignore */ }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-600 text-white'
      case 'starting': return 'bg-blue-600 text-white'
      case 'completed': return 'bg-warm-600 text-white'
      case 'failed': return 'bg-red-600 text-white'
      case 'stopped': return 'bg-yellow-700 text-yellow-200'
      default: return 'bg-warm-700 text-warm-400'
    }
  }

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400'
      case 'normal': return 'text-blue-400'
      case 'low': return 'text-warm-500'
      default: return 'text-warm-500'
    }
  }

  const formatSeconds = (s: number) => {
    if (s < 60) return `${s}s`
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('bgAgent.title', 'Background Agents')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('bgAgent.subtitle', 'Async agents for testing, monitoring, and code analysis')}</p>
      </div>

      <div className="flex gap-2">
        {(['dashboard', 'agents', 'spawn', 'logs'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => {
              setTab(tb)
              if (tb === 'dashboard') loadDashboard()
              if (tb === 'agents') loadAgents()
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`bgAgent.tabs.${tb}`, tb === 'dashboard' ? 'Dashboard' : tb === 'agents' ? 'Agents' : tb === 'spawn' ? 'Spawn' : 'Logs')}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-4">
          {!stats ? (
            <button onClick={loadDashboard} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              {loading ? t('bgAgent.loading', 'Loading...') : t('bgAgent.loadDashboard', 'Load Dashboard')}
            </button>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('bgAgent.stats.total', 'Total Agents'), value: stats.totalAgents },
                  { label: t('bgAgent.stats.active', 'Active'), value: stats.activeAgents, color: 'text-green-400' },
                  { label: t('bgAgent.stats.completed', 'Completed'), value: stats.completedAgents, color: 'text-blue-400' },
                  { label: t('bgAgent.stats.failed', 'Failed'), value: stats.failedAgents, color: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('bgAgent.stats.tokens', 'Tokens Used'), value: stats.totalTokensUsed.toLocaleString() },
                  { label: t('bgAgent.stats.cost', 'Est. Cost'), value: `$${stats.totalEstimatedCost.toFixed(2)}` },
                  { label: t('bgAgent.stats.pullRequests', 'Pull Requests'), value: stats.totalPullRequests },
                  { label: t('bgAgent.stats.avgTime', 'Avg Time'), value: formatSeconds(Math.round(stats.avgCompletionSeconds)) },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-lg font-semibold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {agentTypes.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('bgAgent.agentTypes', 'Agent Types')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {agentTypes.map((at) => (
                      <div key={at.type} className="bg-warm-700 rounded-lg p-3">
                        <span className="text-sm text-white font-medium">{at.name}</span>
                        <p className="text-xs text-warm-400 mt-1">{at.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'agents' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">{t('bgAgent.filterAll', 'All Statuses')}</option>
              <option value="running">{t('bgAgent.filterRunning', 'Running')}</option>
              <option value="completed">{t('bgAgent.filterCompleted', 'Completed')}</option>
              <option value="failed">{t('bgAgent.filterFailed', 'Failed')}</option>
              <option value="stopped">{t('bgAgent.filterStopped', 'Stopped')}</option>
            </select>
            <button onClick={loadAgents} className="px-3 py-2 bg-warm-700 text-warm-300 rounded-md text-sm hover:text-white">
              {t('bgAgent.refresh', 'Refresh')}
            </button>
          </div>

          {loading ? (
            <p className="text-warm-400 text-sm">{t('bgAgent.loading', 'Loading...')}</p>
          ) : agents.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('bgAgent.noAgents', 'No agents yet. Spawn one from the Spawn tab!')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent.id)}
                  className="bg-warm-800 rounded-lg p-4 cursor-pointer hover:border-blue-500 border border-warm-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{agent.agentName}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                      <span className={`text-xs ${priorityColor(agent.priority)}`}>{agent.priority}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(agent.status === 'running' || agent.status === 'starting') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStop(agent.id) }}
                          className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600"
                        >
                          {t('bgAgent.stop', 'Stop')}
                        </button>
                      )}
                      {agent.pullRequestUrl && (
                        <a href={agent.pullRequestUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                          PR
                        </a>
                      )}
                    </div>
                  </div>
                  {agent.taskDescription && (
                    <div className="text-sm text-warm-400 mt-1 truncate">{agent.taskDescription}</div>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-warm-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${agent.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-warm-400">{agent.progressPercent}%</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-warm-500">
                      <span>{agent.completedSteps}/{agent.totalSteps} {t('bgAgent.steps', 'steps')}</span>
                      {agent.branchName && <span className="font-mono">{agent.branchName}</span>}
                      <span>{formatSeconds(agent.elapsedSeconds)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedAgent && (
            <div className="bg-warm-800 rounded-lg p-6 border border-warm-700 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{selectedAgent.agentName}</h4>
                <button onClick={() => setSelectedAgent(null)} className="text-warm-400 hover:text-white">x</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: t('bgAgent.detail.filesCreated', 'Files Created'), value: selectedAgent.filesCreated },
                  { label: t('bgAgent.detail.filesModified', 'Files Modified'), value: selectedAgent.filesModified },
                  { label: t('bgAgent.detail.testsPassed', 'Tests Passed'), value: selectedAgent.testsPassed, color: 'text-green-400' },
                  { label: t('bgAgent.detail.testsFailed', 'Tests Failed'), value: selectedAgent.testsFailed, color: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-lg font-bold ${s.color || 'text-white'}`}>{s.value}</p>
                    <p className="text-xs text-warm-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: t('bgAgent.detail.cpu', 'CPU'), value: `${selectedAgent.cpuUsagePercent.toFixed(0)}%` },
                  { label: t('bgAgent.detail.memory', 'Memory'), value: `${selectedAgent.memoryUsageMb.toFixed(0)} MB` },
                  { label: t('bgAgent.detail.tokens', 'Tokens'), value: selectedAgent.tokensUsed.toLocaleString() },
                  { label: t('bgAgent.detail.cost', 'Cost'), value: `$${selectedAgent.estimatedCost.toFixed(3)}` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-sm font-semibold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {selectedAgent.steps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">{t('bgAgent.detail.stepsTitle', 'Execution Steps')}</h4>
                  <div className="space-y-1">
                    {selectedAgent.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${step.status === 'completed' ? 'bg-green-500' : step.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-warm-600'}`} />
                        <span className={step.status === 'completed' ? 'text-warm-300' : step.status === 'running' ? 'text-blue-400 font-medium' : 'text-warm-500'}>
                          {step.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'spawn' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('bgAgent.spawn.title', 'Spawn Background Agent')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('bgAgent.spawn.projectId', 'Project ID')}</label>
                <input
                  type="text"
                  value={spawnForm.devRequestId}
                  onChange={(e) => setSpawnForm({ ...spawnForm, devRequestId: e.target.value })}
                  placeholder="e.g., 12345"
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('bgAgent.spawn.name', 'Agent Name')}</label>
                <input
                  type="text"
                  value={spawnForm.agentName}
                  onChange={(e) => setSpawnForm({ ...spawnForm, agentName: e.target.value })}
                  placeholder="e.g., Test Runner"
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('bgAgent.spawn.task', 'Task Description')}</label>
              <textarea
                value={spawnForm.taskDescription}
                onChange={(e) => setSpawnForm({ ...spawnForm, taskDescription: e.target.value })}
                placeholder="Describe what the agent should do..."
                rows={3}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('bgAgent.spawn.type', 'Agent Type')}</label>
                <select
                  value={spawnForm.agentType}
                  onChange={(e) => setSpawnForm({ ...spawnForm, agentType: e.target.value })}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="general">General Purpose</option>
                  <option value="frontend">Frontend Specialist</option>
                  <option value="backend">Backend Specialist</option>
                  <option value="testing">Testing Agent</option>
                  <option value="refactor">Refactoring Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('bgAgent.spawn.priority', 'Priority')}</label>
                <select
                  value={spawnForm.priority}
                  onChange={(e) => setSpawnForm({ ...spawnForm, priority: e.target.value })}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="low">{t('bgAgent.priorityLow', 'Low')}</option>
                  <option value="normal">{t('bgAgent.priorityNormal', 'Normal')}</option>
                  <option value="high">{t('bgAgent.priorityHigh', 'High')}</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSpawn}
              disabled={spawning || !spawnForm.devRequestId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {spawning ? t('bgAgent.spawning', 'Spawning...') : t('bgAgent.spawnButton', 'Spawn Agent')}
            </button>
          </div>
        </div>
      )}

      {tab === 'logs' && selectedAgent && (
        <div className="space-y-2">
          <h4 className="text-white font-medium">{t('bgAgent.logsTitle', 'Agent Logs')} — {selectedAgent.agentName}</h4>
          {selectedAgent.logEntries.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('bgAgent.noLogs', 'No log entries yet.')}</p>
            </div>
          ) : (
            <div className="bg-warm-900 rounded-lg p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
              {selectedAgent.logEntries.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-warm-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'}>
                    [{log.level}]
                  </span>
                  <span className="text-warm-300">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && !selectedAgent && (
        <div className="bg-warm-800 rounded-lg p-8 text-center">
          <p className="text-warm-400">{t('bgAgent.selectAgentForLogs', 'Select an agent from the Agents tab to view logs.')}</p>
        </div>
      )}
    </div>
  )
}
