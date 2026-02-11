import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { McpGatewayServer, CatalogEntry, McpGatewayStats, ExecutionResult } from '../api/mcpgateway'
import { listServers, addServer, healthCheck, executeTool, getCatalog, getMcpGatewayStats } from '../api/mcpgateway'

type Tab = 'servers' | 'catalog' | 'stats'

export default function McpGatewayPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('servers')
  const [servers, setServers] = useState<McpGatewayServer[]>([])
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [stats, setStats] = useState<McpGatewayStats | null>(null)
  const [serverName, setServerName] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [transport, setTransport] = useState('stdio')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('custom')
  const [adding, setAdding] = useState(false)
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null)

  useEffect(() => {
    if (tab === 'servers') listServers().then(setServers).catch(() => {})
    if (tab === 'catalog') getCatalog().then(setCatalog).catch(() => {})
    if (tab === 'stats') getMcpGatewayStats().then(setStats).catch(() => {})
  }, [tab])

  const handleAdd = async () => {
    if (!serverName.trim() || !serverUrl.trim()) return
    setAdding(true)
    try {
      const s = await addServer(serverName, serverUrl, transport, description, category)
      setServers(prev => [s, ...prev])
      setServerName('')
      setServerUrl('')
      setDescription('')
    } catch { /* ignore */ }
    setAdding(false)
  }

  const handleHealthCheck = async (id: string) => {
    try {
      const updated = await healthCheck(id)
      setServers(prev => prev.map(s => s.id === id ? updated : s))
    } catch { /* ignore */ }
  }

  const handleExecute = async (serverId: string, toolName: string) => {
    try {
      const result = await executeTool(serverId, toolName)
      setExecResult(result)
    } catch { /* ignore */ }
  }

  const handleInstallCatalog = async (entry: CatalogEntry) => {
    setAdding(true)
    try {
      const s = await addServer(entry.name, entry.serverUrl, 'stdio', entry.description, entry.category)
      setServers(prev => [s, ...prev])
      setTab('servers')
    } catch { /* ignore */ }
    setAdding(false)
  }

  const statusColor = (status: string) => {
    if (status === 'connected') return 'bg-green-900/30 text-green-400'
    if (status === 'error') return 'bg-red-900/30 text-red-400'
    return 'bg-gray-900/30 text-gray-400'
  }

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      database: 'bg-blue-900/30 text-blue-400',
      api: 'bg-purple-900/30 text-purple-400',
      design: 'bg-pink-900/30 text-pink-400',
      devops: 'bg-yellow-900/30 text-yellow-400',
      ai: 'bg-cyan-900/30 text-cyan-400',
      custom: 'bg-gray-900/30 text-gray-400',
    }
    return map[cat] || map.custom
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('mcpGateway.title', 'MCP Gateway')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('mcpGateway.subtitle', 'Orchestrate multiple MCP servers for rich AI-powered code generation')}</p>

      <div className="flex gap-2 mb-6">
        {(['servers', 'catalog', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`mcpGateway.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'servers' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
            <h4 className="font-medium">{t('mcpGateway.addServer', 'Add MCP Server')}</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('mcpGateway.serverName', 'Server Name')}</label>
                <input
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="My MCP Server"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('mcpGateway.serverUrl', 'Server URL / Command')}</label>
                <input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="npx @modelcontextprotocol/server-github"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('mcpGateway.transport', 'Transport')}</label>
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="stdio">stdio</option>
                  <option value="sse">SSE (Server-Sent Events)</option>
                  <option value="http">HTTP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('mcpGateway.category', 'Category')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="custom">Custom</option>
                  <option value="database">Database</option>
                  <option value="api">API</option>
                  <option value="design">Design</option>
                  <option value="devops">DevOps</option>
                  <option value="ai">AI</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('mcpGateway.description', 'Description')}</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !serverName.trim() || !serverUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? t('mcpGateway.adding', 'Adding...') : t('mcpGateway.addBtn', 'Add Server')}
            </button>
          </div>

          {servers.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t('mcpGateway.noServers', 'No MCP servers configured. Add one above or browse the catalog!')}</div>
          )}

          {servers.map((s) => (
            <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{s.serverName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColor(s.status)}`}>{s.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${categoryColor(s.category)}`}>{s.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHealthCheck(s.id)}
                    className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                  >
                    {t('mcpGateway.healthCheck', 'Health Check')}
                  </button>
                </div>
              </div>
              {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
              <div className="text-xs text-gray-500">{s.serverUrl}</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-900 border border-gray-700 rounded p-2 text-center">
                  <div className="text-sm font-bold">{s.toolCount}</div>
                  <div className="text-xs text-gray-400">{t('mcpGateway.tools', 'Tools')}</div>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded p-2 text-center">
                  <div className="text-sm font-bold">{s.totalExecutions}</div>
                  <div className="text-xs text-gray-400">{t('mcpGateway.executions', 'Executions')}</div>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded p-2 text-center">
                  <div className="text-sm font-bold">{s.avgLatencyMs}ms</div>
                  <div className="text-xs text-gray-400">{t('mcpGateway.latency', 'Latency')}</div>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded p-2 text-center">
                  <div className="text-sm font-bold text-green-400">{s.successfulExecutions}</div>
                  <div className="text-xs text-gray-400">{t('mcpGateway.success', 'Success')}</div>
                </div>
              </div>
              {s.toolCount > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {JSON.parse(s.toolsJson).map((tool: { name: string; desc: string }, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleExecute(s.id, tool.name)}
                      className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-blue-600 hover:text-white transition-colors"
                      title={tool.desc}
                    >
                      {tool.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {execResult && (
            <div className={`border rounded-lg p-4 ${execResult.success ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{execResult.toolName}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${execResult.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {execResult.success ? t('mcpGateway.execSuccess', 'Success') : t('mcpGateway.execFailed', 'Failed')}
                </span>
              </div>
              <div className="text-sm text-gray-300">{execResult.result}</div>
              <div className="text-xs text-gray-500 mt-1">{execResult.latencyMs}ms</div>
            </div>
          )}
        </div>
      )}

      {tab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.map((entry) => (
            <div key={entry.name} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{entry.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${categoryColor(entry.category)}`}>{entry.category}</span>
                </div>
                <span className="text-xs text-gray-500">{entry.toolCount} {t('mcpGateway.tools', 'tools')}</span>
              </div>
              <p className="text-sm text-gray-400">{entry.description}</p>
              <div className="text-xs text-gray-500 font-mono">{entry.serverUrl}</div>
              <button
                onClick={() => handleInstallCatalog(entry)}
                disabled={adding}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {t('mcpGateway.install', 'Install')}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalServers}</div>
              <div className="text-sm text-gray-400">{t('mcpGateway.stats.servers', 'Total Servers')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.connectedServers}</div>
              <div className="text-sm text-gray-400">{t('mcpGateway.stats.connected', 'Connected')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTools}</div>
              <div className="text-sm text-gray-400">{t('mcpGateway.stats.tools', 'Total Tools')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalExecutions}</div>
              <div className="text-sm text-gray-400">{t('mcpGateway.stats.executions', 'Executions')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.successRate}%</div>
              <div className="text-sm text-gray-400">{t('mcpGateway.stats.successRate', 'Success Rate')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.avgLatency}ms</div>
              <div className="text-sm text-gray-400">{t('mcpGateway.stats.avgLatency', 'Avg Latency')}</div>
            </div>
          </div>
          {stats.recentServers.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">{t('mcpGateway.stats.recent', 'Recent Servers')}</h4>
              <div className="space-y-2">
                {stats.recentServers.map((s, i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{s.serverName}</span>
                      <span className="text-xs text-gray-400 ml-2">{s.toolCount} tools</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{s.totalExecutions} exec</span>
                      <span className="text-xs text-gray-400">{s.avgLatencyMs}ms</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColor(s.status)}`}>{s.status}</span>
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
