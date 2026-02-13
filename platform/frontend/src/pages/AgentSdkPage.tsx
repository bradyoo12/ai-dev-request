import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listSessions, execute, deleteSession, getSdkStats, getModels } from '../api/agentsdk'
import type { AgentSdkSession, ExecuteResponse, AgentModel, SdkStats } from '../api/agentsdk'

type Tab = 'execute' | 'history' | 'models' | 'stats'

export default function AgentSdkPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('execute')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{t('agentsdk.title', 'Claude Agent SDK')}</h2>
        <p className="text-warm-400 text-sm mt-1">{t('agentsdk.subtitle', 'Structured autonomous development with agent loops, tools, and subagents')}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['execute', 'history', 'models', 'stats'] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'}`}>
            {t(`agentsdk.tab.${tb}`, tb.charAt(0).toUpperCase() + tb.slice(1))}
          </button>
        ))}
      </div>
      {tab === 'execute' && <ExecuteTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'models' && <ModelsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}

function ExecuteTab() {
  const { t } = useTranslation()
  const [projectName, setProjectName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [agentModel, setAgentModel] = useState('claude-opus-4-6')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExecuteResponse | null>(null)

  const handleExecute = async () => {
    if (!projectName || !taskDescription) return
    setLoading(true)
    try {
      const res = await execute(projectName, taskDescription, agentModel)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-warm-800 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('agentsdk.projectName', 'Project Name')}</label>
          <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="my-project" className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('agentsdk.taskDescription', 'Task Description')}</label>
          <textarea value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="Add user authentication with OAuth..." rows={3} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('agentsdk.model', 'Agent Model')}</label>
          <select value={agentModel} onChange={e => setAgentModel(e.target.value)} className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-white text-sm">
            <option value="claude-opus-4-6">Claude Opus 4.6</option>
            <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
            <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
          </select>
        </div>
        <button onClick={handleExecute} disabled={loading || !projectName || !taskDescription} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('agentsdk.running', 'Running Agent...') : t('agentsdk.execute', 'Execute Agent')}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('agentsdk.agentLoop', 'Agent Loop')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('agentsdk.turns', 'Turns')}</div>
                <div className="text-white text-lg font-bold">{result.agentLoop.totalTurns}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('agentsdk.toolCalls', 'Tool Calls')}</div>
                <div className="text-white text-lg font-bold">{result.session.toolCallsTotal}</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('agentsdk.successRate', 'Success Rate')}</div>
                <div className="text-green-400 text-lg font-bold">{result.session.successRate}%</div>
              </div>
              <div className="bg-warm-700 rounded p-3">
                <div className="text-warm-400 text-xs">{t('agentsdk.contextUsage', 'Context Usage')}</div>
                <div className="text-blue-400 text-lg font-bold">{result.agentLoop.contextWindowUsage}%</div>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">{t('agentsdk.toolBreakdown', 'Tool Breakdown')}</h3>
            <div className="space-y-1">
              {result.toolBreakdown.map((tb, i) => (
                <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                  <span className="text-blue-400 font-mono text-sm">{tb.tool}</span>
                  <div className="flex gap-4">
                    <span className="text-warm-400 text-sm">{tb.calls} calls</span>
                    <span className="text-warm-500 text-sm">{tb.avgDurationMs}ms avg</span>
                    <span className="text-green-400 text-sm">{tb.successRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.subagentDetails.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">{t('agentsdk.subagents', 'Subagents')}</h3>
              <div className="space-y-2">
                {result.subagentDetails.map(sa => (
                  <div key={sa.id} className="bg-warm-700 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{sa.name}</span>
                      <span className="text-warm-500 text-xs">{sa.model}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-warm-400">
                      <span>{sa.toolCalls} tools</span>
                      <span>{(sa.tokensUsed / 1000).toFixed(0)}K tokens</span>
                      <span>{(sa.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.skillDetails.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">{t('agentsdk.skills', 'Skills Invoked')}</h3>
              <div className="space-y-1">
                {result.skillDetails.map((sk, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={sk.success ? 'text-green-400' : 'text-red-400'}>{sk.success ? '\u2713' : '\u2717'}</span>
                    <span className="text-white">{sk.name}</span>
                    <span className="text-warm-500 ml-auto">{(sk.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.mcpDetails.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">{t('agentsdk.mcpServers', 'MCP Servers')}</h3>
              <div className="space-y-1">
                {result.mcpDetails.map((mcp, i) => (
                  <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                    <span className="text-purple-400 font-mono text-sm">{mcp.server}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-warm-400">{mcp.toolsAvailable} tools</span>
                      <span className="text-warm-400">{mcp.callsMade} calls</span>
                      <span className="text-warm-500">{mcp.latencyMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<AgentSdkSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listSessions().then(setSessions).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!sessions.length) return <div className="text-warm-400 text-sm">{t('agentsdk.noHistory', 'No agent sessions yet.')}</div>

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div key={s.id} className="bg-warm-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-medium">{s.projectName}: {s.taskDescription.slice(0, 60)}{s.taskDescription.length > 60 ? '...' : ''}</div>
            <div className="text-warm-500 text-xs mt-1">
              {s.agentModel} | {s.toolCallsTotal} tools | {s.subagentsSpawned} subagents | {s.successRate}% success | {(s.durationMs / 1000).toFixed(1)}s
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-warm-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</span>
            <button onClick={async () => { await deleteSession(s.id); setSessions(p => p.filter(x => x.id !== s.id)) }} className="text-red-400 hover:text-red-300 text-xs">{t('common.delete', 'Delete')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ModelsTab() {
  const { t } = useTranslation()
  const [models, setModels] = useState<AgentModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getModels().then(setModels).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>

  const features = [
    { name: t('agentsdk.feat.agentLoop', 'Structured Agent Loop'), desc: t('agentsdk.feat.agentLoopDesc', 'Built-in tool execution cycle with automatic error handling and retries') },
    { name: t('agentsdk.feat.subagents', 'Subagent Orchestration'), desc: t('agentsdk.feat.subagentsDesc', 'Spawn child agents for parallel work with isolated context windows') },
    { name: t('agentsdk.feat.mcp', 'MCP Extensibility'), desc: t('agentsdk.feat.mcpDesc', 'Connect external tools and data sources via Model Context Protocol') }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {models.map(m => (
          <div key={m.id} className="bg-warm-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-white font-medium">{m.name}</span>
              {m.recommended && <span className="text-green-400 text-xs ml-auto">{t('agentsdk.recommended', 'Recommended')}</span>}
            </div>
            <p className="text-warm-400 text-sm">{m.description}</p>
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
  const [stats, setStats] = useState<SdkStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getSdkStats().then(setStats).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="text-warm-400 text-sm">{t('common.loading', 'Loading...')}</div>
  if (!stats || stats.totalSessions === 0) return <div className="text-warm-400 text-sm">{t('agentsdk.noStats', 'No agent SDK statistics yet.')}</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('agentsdk.stats.sessions', 'Total Sessions')}</div>
          <div className="text-white text-xl font-bold">{stats.totalSessions}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('agentsdk.stats.successRate', 'Avg Success')}</div>
          <div className="text-green-400 text-xl font-bold">{stats.avgSuccessRate}%</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('agentsdk.stats.toolCalls', 'Total Tools')}</div>
          <div className="text-white text-xl font-bold">{stats.totalToolCalls}</div>
        </div>
        <div className="bg-warm-800 rounded-lg p-4">
          <div className="text-warm-400 text-xs">{t('agentsdk.stats.subagents', 'Total Subagents')}</div>
          <div className="text-white text-xl font-bold">{stats.totalSubagents}</div>
        </div>
      </div>
      {stats.byModel && stats.byModel.length > 0 && (
        <div className="bg-warm-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('agentsdk.stats.byModel', 'By Model')}</h3>
          <div className="space-y-2">
            {stats.byModel.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-warm-700 rounded p-2">
                <span className="text-white text-sm">{m.model}</span>
                <div className="flex gap-4">
                  <span className="text-warm-400 text-sm">{m.count} sessions</span>
                  <span className="text-green-400 text-sm">{m.avgSuccessRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
