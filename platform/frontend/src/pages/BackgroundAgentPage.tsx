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
    } catch {
      alert(t('backgroundAgent.error.loadAgents'))
    } finally {
      setLoading(false)
    }
  }

  const loadAgents = async () => {
    setLoading(true)
    try {
      const list = await listAgents(filterStatus || undefined)
      setAgents(list)
    } catch {
      alert(t('backgroundAgent.error.loadAgents'))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAgent = async (agentId: string) => {
    try {
      const detail = await getAgent(agentId)
      setSelectedAgent(detail)
    } catch {
      alert(t('backgroundAgent.error.loadAgent'))
    }
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
    } catch {
      alert(t('backgroundAgent.error.spawn'))
    } finally {
      setSpawning(false)
    }
  }

  const handleStop = async (agentId: string) => {
    try {
      await stopAgent(agentId)
      await loadAgents()
      if (selectedAgent?.id === agentId) {
        const detail = await getAgent(agentId)
        setSelectedAgent(detail)
      }
    } catch {
      alert(t('backgroundAgent.error.stop'))
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'starting': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'stopped': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'normal': return 'text-blue-600'
      case 'low': return 'text-gray-500'
      default: return 'text-gray-600'
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
        <h2 className="text-xl font-bold">{t('backgroundAgent.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('backgroundAgent.description')}</p>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(['dashboard', 'agents', 'spawn', 'logs'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => {
              setTab(tb)
              if (tb === 'dashboard') loadDashboard()
              if (tb === 'agents') loadAgents()
            }}
            className={`px-4 py-2 text-sm rounded-t-lg ${tab === tb ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t(`backgroundAgent.tab.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          {!stats ? (
            <button onClick={loadDashboard} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
              {loading ? t('backgroundAgent.loading') : t('backgroundAgent.loadDashboard')}
            </button>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-2xl font-bold">{stats.totalAgents}</div>
                  <div className="text-sm text-gray-500">{t('backgroundAgent.stats.total')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.activeAgents}</div>
                  <div className="text-sm text-gray-500">{t('backgroundAgent.stats.active')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.completedAgents}</div>
                  <div className="text-sm text-gray-500">{t('backgroundAgent.stats.completed')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.failedAgents}</div>
                  <div className="text-sm text-gray-500">{t('backgroundAgent.stats.failed')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-lg font-semibold">{stats.totalTokensUsed.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{t('backgroundAgent.stats.tokens')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-lg font-semibold">${stats.totalEstimatedCost.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{t('backgroundAgent.stats.cost')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-lg font-semibold">{stats.totalPullRequests}</div>
                  <div className="text-sm text-gray-500">{t('backgroundAgent.stats.pullRequests')}</div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-lg font-semibold">{formatSeconds(Math.round(stats.avgCompletionSeconds))}</div>
                  <div className="text-sm text-gray-500">{t('backgroundAgent.stats.avgTime')}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">{t('backgroundAgent.agentTypesTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {agentTypes.map((at) => (
                    <div key={at.type} className="bg-white border rounded-lg p-4">
                      <div className="font-medium">{at.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{at.description}</div>
                    </div>
                  ))}
                </div>
              </div>
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
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="">{t('backgroundAgent.filterAll')}</option>
              <option value="running">{t('backgroundAgent.filterRunning')}</option>
              <option value="completed">{t('backgroundAgent.filterCompleted')}</option>
              <option value="failed">{t('backgroundAgent.filterFailed')}</option>
              <option value="stopped">{t('backgroundAgent.filterStopped')}</option>
            </select>
            <button onClick={loadAgents} className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200">
              {t('backgroundAgent.refresh')}
            </button>
          </div>

          {loading ? (
            <div className="text-gray-500 text-sm">{t('backgroundAgent.loading')}</div>
          ) : agents.length === 0 ? (
            <div className="text-gray-400 text-sm py-8 text-center">{t('backgroundAgent.noAgents')}</div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent.id)}
                  className="bg-white border rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{agent.agentName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                      <span className={`text-xs ${priorityColor(agent.priority)}`}>{agent.priority}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(agent.status === 'running' || agent.status === 'starting') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStop(agent.id) }}
                          className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          {t('backgroundAgent.stop')}
                        </button>
                      )}
                      {agent.pullRequestUrl && (
                        <a href={agent.pullRequestUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          PR
                        </a>
                      )}
                    </div>
                  </div>
                  {agent.taskDescription && (
                    <div className="text-sm text-gray-500 mt-1 truncate">{agent.taskDescription}</div>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${agent.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{agent.progressPercent}%</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>{agent.completedSteps}/{agent.totalSteps} {t('backgroundAgent.steps')}</span>
                      {agent.branchName && <span className="font-mono">{agent.branchName}</span>}
                      <span>{formatSeconds(agent.elapsedSeconds)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedAgent && (
            <div className="bg-white border rounded-lg p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedAgent.agentName}</h3>
                <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600">x</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{selectedAgent.filesCreated}</div>
                  <div className="text-xs text-gray-500">{t('backgroundAgent.detail.filesCreated')}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{selectedAgent.filesModified}</div>
                  <div className="text-xs text-gray-500">{t('backgroundAgent.detail.filesModified')}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{selectedAgent.testsPassed}</div>
                  <div className="text-xs text-gray-500">{t('backgroundAgent.detail.testsPassed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{selectedAgent.testsFailed}</div>
                  <div className="text-xs text-gray-500">{t('backgroundAgent.detail.testsFailed')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-sm font-semibold">{selectedAgent.cpuUsagePercent.toFixed(0)}%</div>
                  <div className="text-xs text-gray-500">{t('backgroundAgent.detail.cpu')}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{selectedAgent.memoryUsageMb.toFixed(0)} MB</div>
                  <div className="text-xs text-gray-500">{t('backgroundAgent.detail.memory')}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{selectedAgent.tokensUsed.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{t('backgroundAgent.detail.tokens')}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">${selectedAgent.estimatedCost.toFixed(3)}</div>
                  <div className="text-xs text-gray-500">{t('backgroundAgent.detail.cost')}</div>
                </div>
              </div>

              {selectedAgent.steps.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">{t('backgroundAgent.detail.stepsTitle')}</h4>
                  <div className="space-y-1">
                    {selectedAgent.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${step.status === 'completed' ? 'bg-green-500' : step.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className={step.status === 'completed' ? 'text-gray-600' : step.status === 'running' ? 'text-blue-700 font-medium' : 'text-gray-400'}>
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
        <div className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('backgroundAgent.spawn.projectId')}</label>
            <input
              type="text"
              value={spawnForm.devRequestId}
              onChange={(e) => setSpawnForm({ ...spawnForm, devRequestId: e.target.value })}
              placeholder={t('backgroundAgent.spawn.projectIdPlaceholder')}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('backgroundAgent.spawn.name')}</label>
            <input
              type="text"
              value={spawnForm.agentName}
              onChange={(e) => setSpawnForm({ ...spawnForm, agentName: e.target.value })}
              placeholder={t('backgroundAgent.spawn.namePlaceholder')}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('backgroundAgent.spawn.task')}</label>
            <textarea
              value={spawnForm.taskDescription}
              onChange={(e) => setSpawnForm({ ...spawnForm, taskDescription: e.target.value })}
              placeholder={t('backgroundAgent.spawn.taskPlaceholder')}
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('backgroundAgent.spawn.type')}</label>
              <select
                value={spawnForm.agentType}
                onChange={(e) => setSpawnForm({ ...spawnForm, agentType: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="general">General Purpose</option>
                <option value="frontend">Frontend Specialist</option>
                <option value="backend">Backend Specialist</option>
                <option value="testing">Testing Agent</option>
                <option value="refactor">Refactoring Agent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('backgroundAgent.spawn.priority')}</label>
              <select
                value={spawnForm.priority}
                onChange={(e) => setSpawnForm({ ...spawnForm, priority: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="low">{t('backgroundAgent.priorityLow')}</option>
                <option value="normal">{t('backgroundAgent.priorityNormal')}</option>
                <option value="high">{t('backgroundAgent.priorityHigh')}</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleSpawn}
            disabled={spawning || !spawnForm.devRequestId}
            className="px-6 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {spawning ? t('backgroundAgent.spawning') : t('backgroundAgent.spawnButton')}
          </button>
        </div>
      )}

      {tab === 'logs' && selectedAgent && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('backgroundAgent.logsTitle')} — {selectedAgent.agentName}</h3>
          {selectedAgent.logEntries.length === 0 ? (
            <div className="text-gray-400 text-sm">{t('backgroundAgent.noLogs')}</div>
          ) : (
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
              {selectedAgent.logEntries.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'}>
                    [{log.level}]
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && !selectedAgent && (
        <div className="text-gray-400 text-sm py-8 text-center">{t('backgroundAgent.selectAgentForLogs')}</div>
      )}
    </div>
  )
}
