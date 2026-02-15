import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getFrameworkStatus,
  listNativeAgents,
  registerAgent,
  unregisterAgent,
  getFrameworkConfig,
  updateFrameworkConfig,
  getFrameworkMetrics,
  type AgentFrameworkStatus,
  type NativeAgent,
  type AgentFrameworkConfig,
  type AgentFrameworkMetrics,
} from '../api/agent-framework'
import { getStatusColors } from '../components/StatusBadge'

export default function AgentFrameworkPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'status' | 'agents' | 'config' | 'metrics'>('status')
  const [loading, setLoading] = useState(false)

  // Status tab state
  const [status, setStatus] = useState<AgentFrameworkStatus | null>(null)

  // Agents tab state
  const [agents, setAgents] = useState<NativeAgent[]>([])
  const [registerForm, setRegisterForm] = useState({
    name: '',
    description: '',
    agentType: 'general',
    model: '',
    capabilities: '',
    middleware: '',
  })

  // Config tab state
  const [config, setConfig] = useState<AgentFrameworkConfig | null>(null)
  const [configForm, setConfigForm] = useState({
    frameworkEnabled: false,
    maxConcurrentAgents: 5,
    defaultModel: 'claude-sonnet-4-20250514',
    middlewarePipeline: '',
  })

  // Metrics tab state
  const [metrics, setMetrics] = useState<AgentFrameworkMetrics | null>(null)

  const loadStatus = async () => {
    setLoading(true)
    try {
      const data = await getFrameworkStatus()
      setStatus(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const loadAgents = async () => {
    setLoading(true)
    try {
      const data = await listNativeAgents()
      setAgents(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!registerForm.name) return
    setLoading(true)
    try {
      await registerAgent({
        name: registerForm.name,
        description: registerForm.description,
        agentType: registerForm.agentType,
        model: registerForm.model || undefined,
        capabilities: registerForm.capabilities ? registerForm.capabilities.split(',').map(s => s.trim()) : undefined,
        middleware: registerForm.middleware ? registerForm.middleware.split(',').map(s => s.trim()) : undefined,
      })
      setRegisterForm({ name: '', description: '', agentType: 'general', model: '', capabilities: '', middleware: '' })
      await loadAgents()
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleUnregister = async (agentId: string) => {
    try {
      await unregisterAgent(agentId)
      await loadAgents()
    } catch { /* ignore */ }
  }

  const loadConfig = async () => {
    setLoading(true)
    try {
      const data = await getFrameworkConfig()
      setConfig(data)
      setConfigForm({
        frameworkEnabled: data.frameworkEnabled,
        maxConcurrentAgents: data.maxConcurrentAgents,
        defaultModel: data.defaultModel,
        middlewarePipeline: data.middlewarePipeline.join(', '),
      })
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleUpdateConfig = async () => {
    setLoading(true)
    try {
      const data = await updateFrameworkConfig({
        frameworkEnabled: configForm.frameworkEnabled,
        maxConcurrentAgents: configForm.maxConcurrentAgents,
        defaultModel: configForm.defaultModel,
        middlewarePipeline: configForm.middlewarePipeline.split(',').map(s => s.trim()).filter(Boolean),
      })
      setConfig(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const data = await getFrameworkMetrics()
      setMetrics(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const healthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400'
      case 'degraded': return 'text-yellow-400'
      case 'disabled': return 'text-warm-500'
      default: return 'text-red-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('agentFramework.title', 'Microsoft Agent Framework')}</h3>
        <p className="text-warm-400 text-sm mt-1">
          {t('agentFramework.subtitle', 'Native .NET 10 agent orchestration with IChatClient middleware pipeline')}
        </p>
      </div>

      <div className="flex gap-2">
        {(['status', 'agents', 'config', 'metrics'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => {
              setTab(tb)
              if (tb === 'status') loadStatus()
              if (tb === 'agents') loadAgents()
              if (tb === 'config') loadConfig()
              if (tb === 'metrics') loadMetrics()
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tb ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`agentFramework.tabs.${tb}`,
              tb === 'status' ? 'Status' : tb === 'agents' ? 'Agents' : tb === 'config' ? 'Configuration' : 'Metrics'
            )}
          </button>
        ))}
      </div>

      {/* Status Tab */}
      {tab === 'status' && (
        <div className="space-y-4">
          {!status ? (
            <button onClick={loadStatus} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              {loading ? t('agentFramework.loading', 'Loading...') : t('agentFramework.loadStatus', 'Load Status')}
            </button>
          ) : (
            <>
              <div className="bg-warm-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">{t('agentFramework.status.health', 'Framework Health')}</h4>
                  <span className={`text-sm font-medium ${healthColor(status.healthStatus)}`}>
                    {status.healthStatus.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: t('agentFramework.status.version', 'Framework'), value: `v${status.frameworkVersion}` },
                    { label: t('agentFramework.status.runtime', 'Runtime'), value: status.runtimeVersion.split(' ').pop() || status.runtimeVersion },
                    { label: t('agentFramework.status.active', 'Active Agents'), value: status.activeAgents, color: 'text-green-400' },
                    { label: t('agentFramework.status.maxAgents', 'Max Agents'), value: status.maxConcurrentAgents },
                  ].map(s => (
                    <div key={s.label} className="bg-warm-700 rounded-lg p-3 text-center">
                      <p className={`text-lg font-bold ${s.color || 'text-white'}`}>{s.value}</p>
                      <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-warm-400">{t('agentFramework.status.enabled', 'Framework Enabled')}:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${status.frameworkEnabled ? 'bg-green-900/50 text-green-400' : 'bg-warm-700 text-warm-400'}`}>
                    {status.frameworkEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-warm-400">{t('agentFramework.status.model', 'Default Model')}:</span>
                  <span className="text-sm text-white font-mono">{status.defaultModel}</span>
                </div>
              </div>

              {/* Middleware Pipeline */}
              <div className="bg-warm-800 rounded-lg p-6">
                <h4 className="text-white font-medium mb-3">{t('agentFramework.status.pipeline', 'Middleware Pipeline')}</h4>
                <div className="flex flex-wrap gap-2">
                  {status.middlewarePipeline.map((mw, i) => (
                    <div key={mw} className="flex items-center gap-1">
                      <span className="px-3 py-1 bg-blue-900/40 text-blue-400 rounded-md text-sm border border-blue-800">
                        {mw}
                      </span>
                      {i < status.middlewarePipeline.length - 1 && (
                        <span className="text-warm-500 mx-1">&rarr;</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="bg-warm-800 rounded-lg p-6">
                <h4 className="text-white font-medium mb-3">{t('agentFramework.status.features', 'Framework Features')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {status.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-warm-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Agents Tab */}
      {tab === 'agents' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={loadAgents} className="px-3 py-2 bg-warm-700 text-warm-300 rounded-md text-sm hover:text-white">
              {t('agentFramework.refresh', 'Refresh')}
            </button>
          </div>

          {/* Register Form */}
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('agentFramework.agents.register', 'Register Native Agent')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentFramework.agents.name', 'Agent Name')}</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="e.g., Code Generator"
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentFramework.agents.type', 'Agent Type')}</label>
                <select
                  value={registerForm.agentType}
                  onChange={(e) => setRegisterForm({ ...registerForm, agentType: e.target.value })}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="general">General Purpose</option>
                  <option value="frontend">Frontend Specialist</option>
                  <option value="backend">Backend Specialist</option>
                  <option value="testing">Testing Agent</option>
                  <option value="refactor">Refactoring Agent</option>
                  <option value="orchestrator">Orchestrator</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('agentFramework.agents.description', 'Description')}</label>
              <textarea
                value={registerForm.description}
                onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                placeholder="Describe the agent's purpose..."
                rows={2}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentFramework.agents.capabilities', 'Capabilities (comma-separated)')}</label>
                <input
                  type="text"
                  value={registerForm.capabilities}
                  onChange={(e) => setRegisterForm({ ...registerForm, capabilities: e.target.value })}
                  placeholder="code-gen, testing, review"
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentFramework.agents.model', 'Model Override')}</label>
                <input
                  type="text"
                  value={registerForm.model}
                  onChange={(e) => setRegisterForm({ ...registerForm, model: e.target.value })}
                  placeholder="Leave empty for default"
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleRegister}
              disabled={loading || !registerForm.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('agentFramework.registering', 'Registering...') : t('agentFramework.registerButton', 'Register Agent')}
            </button>
          </div>

          {/* Agents List */}
          {agents.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('agentFramework.agents.empty', 'No native agents registered yet.')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{agent.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColors(agent.status)}`}>{agent.status}</span>
                      <span className="px-2 py-0.5 bg-warm-700 rounded text-xs text-warm-400">{agent.agentType}</span>
                    </div>
                    <button
                      onClick={() => handleUnregister(agent.id)}
                      className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600"
                    >
                      {t('agentFramework.agents.unregister', 'Unregister')}
                    </button>
                  </div>
                  {agent.description && (
                    <p className="text-sm text-warm-400 mb-2">{agent.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs text-warm-500">
                      {t('agentFramework.agents.modelLabel', 'Model')}: <span className="font-mono text-warm-300">{agent.model}</span>
                    </span>
                  </div>
                  {agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map(cap => (
                        <span key={cap} className="px-2 py-0.5 bg-warm-700 rounded text-xs text-warm-300">{cap}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
      {tab === 'config' && (
        <div className="space-y-4">
          {!config ? (
            <button onClick={loadConfig} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              {loading ? t('agentFramework.loading', 'Loading...') : t('agentFramework.loadConfig', 'Load Configuration')}
            </button>
          ) : (
            <div className="bg-warm-800 rounded-lg p-6 space-y-4">
              <h4 className="text-white font-medium">{t('agentFramework.config.title', 'Framework Configuration')}</h4>

              <div className="flex items-center gap-3">
                <label className="text-sm text-warm-400">{t('agentFramework.config.enabled', 'Enable Agent Framework')}</label>
                <button
                  onClick={() => setConfigForm({ ...configForm, frameworkEnabled: !configForm.frameworkEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    configForm.frameworkEnabled ? 'bg-blue-600' : 'bg-warm-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      configForm.frameworkEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-warm-400 mb-1">{t('agentFramework.config.maxAgents', 'Max Concurrent Agents')}</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={configForm.maxConcurrentAgents}
                    onChange={(e) => setConfigForm({ ...configForm, maxConcurrentAgents: parseInt(e.target.value) || 5 })}
                    className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-warm-400 mb-1">{t('agentFramework.config.defaultModel', 'Default Model')}</label>
                  <select
                    value={configForm.defaultModel}
                    onChange={(e) => setConfigForm({ ...configForm, defaultModel: e.target.value })}
                    className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-opus-4-20250514">Claude Opus 4</option>
                    <option value="claude-haiku-3-20250514">Claude Haiku 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentFramework.config.middleware', 'Middleware Pipeline (comma-separated)')}</label>
                <input
                  type="text"
                  value={configForm.middlewarePipeline}
                  onChange={(e) => setConfigForm({ ...configForm, middlewarePipeline: e.target.value })}
                  placeholder="logging, rate-limiting, function-calling, telemetry"
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>

              <button
                onClick={handleUpdateConfig}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t('agentFramework.saving', 'Saving...') : t('agentFramework.saveConfig', 'Save Configuration')}
              </button>

              <div className="text-xs text-warm-500 mt-2">
                {t('agentFramework.config.lastUpdated', 'Last updated')}: {new Date(config.updatedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {tab === 'metrics' && (
        <div className="space-y-4">
          {!metrics ? (
            <button onClick={loadMetrics} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              {loading ? t('agentFramework.loading', 'Loading...') : t('agentFramework.loadMetrics', 'Load Metrics')}
            </button>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('agentFramework.metrics.total', 'Total Agents'), value: metrics.totalAgents },
                  { label: t('agentFramework.metrics.active', 'Active'), value: metrics.activeAgents, color: 'text-green-400' },
                  { label: t('agentFramework.metrics.idle', 'Idle'), value: metrics.idleAgents, color: 'text-warm-400' },
                  { label: t('agentFramework.metrics.maxConcurrent', 'Max Concurrent'), value: metrics.maxConcurrentAgents },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('agentFramework.metrics.executions', 'Total Executions'), value: metrics.totalExecutions },
                  { label: t('agentFramework.metrics.successful', 'Successful'), value: metrics.successfulExecutions, color: 'text-green-400' },
                  { label: t('agentFramework.metrics.failed', 'Failed'), value: metrics.failedExecutions, color: 'text-red-400' },
                  { label: t('agentFramework.metrics.throughput', 'Success Rate'), value: `${metrics.throughput.toFixed(1)}%` },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className={`text-lg font-semibold ${s.color || 'text-white'}`}>{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-warm-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">
                  {t('agentFramework.metrics.latency', 'Average Latency')}
                </h4>
                <p className="text-2xl font-bold text-blue-400">
                  {metrics.averageLatencyMs.toFixed(1)} ms
                </p>
              </div>

              {/* Agents by Type */}
              {Object.keys(metrics.agentsByType).length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('agentFramework.metrics.byType', 'Agents by Type')}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(metrics.agentsByType).map(([type, count]) => (
                      <div key={type} className="bg-warm-700 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-sm text-warm-300 capitalize">{type}</span>
                        <span className="text-sm font-bold text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Middleware Pipeline */}
              {metrics.middlewarePipeline.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('agentFramework.metrics.pipelineLabel', 'Active Middleware')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {metrics.middlewarePipeline.map((mw) => (
                      <span key={mw} className="px-3 py-1 bg-blue-900/40 text-blue-400 rounded-md text-sm border border-blue-800">
                        {mw}
                      </span>
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
