import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getMcpServers, getMcpServerStats, createMcpServer, deleteMcpServer, testMcpServerConnection } from '../api/mcpserver'
import type { McpServer, McpServerStats } from '../api/mcpserver'

type SubTab = 'overview' | 'management' | 'tools'

const SERVER_TYPES = ['project_context', 'database_schema', 'deployment_config'] as const

export default function McpServerPage() {
  const { t } = useTranslation()
  const [servers, setServers] = useState<McpServer[]>([])
  const [stats, setStats] = useState<McpServerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subTab, setSubTab] = useState<SubTab>('overview')

  // Create form state
  const [showCreate, setShowCreate] = useState(false)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<string>('project_context')
  const [formEndpoint, setFormEndpoint] = useState('')
  const [creating, setCreating] = useState(false)

  // Testing state
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latencyMs: number } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [serversRes, statsRes] = await Promise.all([
        getMcpServers(),
        getMcpServerStats(),
      ])
      setServers(serversRes)
      setStats(statsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mcpServer.errorLoading', 'Failed to load MCP server settings'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!formName.trim() || !formEndpoint.trim()) return
    try {
      setCreating(true)
      await createMcpServer({ name: formName, serverType: formType, endpoint: formEndpoint })
      setFormName('')
      setFormEndpoint('')
      setShowCreate(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mcpServer.errorCreating', 'Failed to create MCP server'))
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMcpServer(id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mcpServer.errorDeleting', 'Failed to delete MCP server'))
    }
  }

  async function handleTest(id: string) {
    try {
      setTestingId(id)
      setTestResult(null)
      const result = await testMcpServerConnection(id)
      setTestResult({ id, success: result.success, latencyMs: result.latencyMs })
      await loadData()
    } catch {
      setTestResult({ id, success: false, latencyMs: 0 })
    } finally {
      setTestingId(null)
    }
  }

  function serverTypeLabel(type: string): string {
    switch (type) {
      case 'project_context': return t('mcpServer.type.projectContext', 'Project Context')
      case 'database_schema': return t('mcpServer.type.databaseSchema', 'Database Schema')
      case 'deployment_config': return t('mcpServer.type.deploymentConfig', 'Deployment Config')
      default: return type
    }
  }

  function statusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-400'
      case 'inactive': return 'bg-warm-500'
      case 'error': return 'bg-red-400'
      default: return 'bg-warm-500'
    }
  }

  function statusBadgeClasses(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'inactive': return 'bg-warm-500/20 text-warm-400 border-warm-500/30'
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-warm-500/20 text-warm-400 border-warm-500/30'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-warm-400">{t('mcpServer.loading', 'Loading MCP server settings...')}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('mcpServer.title', 'MCP Agentic Pipeline')}</h3>
        <p className="text-sm text-warm-400 mt-1">{t('mcpServer.description', 'Expose code generation via Model Context Protocol servers for Claude and LLM access')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        <button
          onClick={() => setSubTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'overview' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('mcpServer.tabs.overview', 'Overview')}
        </button>
        <button
          onClick={() => setSubTab('management')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'management' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('mcpServer.tabs.management', 'Server Management')}
        </button>
        <button
          onClick={() => setSubTab('tools')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'tools' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('mcpServer.tabs.tools', 'Tools & Resources')}
        </button>
      </div>

      {/* Overview Tab */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${(stats?.activeServers ?? 0) > 0 ? 'bg-green-400' : 'bg-warm-500'}`} />
                <span className="text-sm text-warm-300">{t('mcpServer.activeServers', 'Active Servers')}</span>
              </div>
              <div className="text-lg font-bold text-white">{stats?.activeServers ?? 0}</div>
              <p className="text-xs text-warm-500 mt-1">{t('mcpServer.activeServersDesc', 'MCP servers currently accepting connections')}</p>
            </div>

            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${(stats?.totalServers ?? 0) > 0 ? 'bg-blue-400' : 'bg-warm-500'}`} />
                <span className="text-sm text-warm-300">{t('mcpServer.totalServers', 'Total Servers')}</span>
              </div>
              <div className="text-lg font-bold text-white">{stats?.totalServers ?? 0}</div>
              <p className="text-xs text-warm-500 mt-1">{t('mcpServer.totalServersDesc', 'All configured MCP server instances')}</p>
            </div>

            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${(stats?.totalConnections ?? 0) > 0 ? 'bg-purple-400' : 'bg-warm-500'}`} />
                <span className="text-sm text-warm-300">{t('mcpServer.connectedClients', 'Connected Clients')}</span>
              </div>
              <div className="text-lg font-bold text-white">{stats?.totalConnections ?? 0}</div>
              <p className="text-xs text-warm-500 mt-1">{t('mcpServer.connectedClientsDesc', 'Active LLM client connections')}</p>
            </div>

            <div className="bg-warm-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${((stats?.serversByType.projectContext ?? 0) + (stats?.serversByType.databaseSchema ?? 0) + (stats?.serversByType.deploymentConfig ?? 0)) > 0 ? 'bg-amber-400' : 'bg-warm-500'}`} />
                <span className="text-sm text-warm-300">{t('mcpServer.serverTypes', 'Server Types')}</span>
              </div>
              <div className="text-lg font-bold text-white">
                {[stats?.serversByType.projectContext, stats?.serversByType.databaseSchema, stats?.serversByType.deploymentConfig].filter(n => (n ?? 0) > 0).length} / 3
              </div>
              <p className="text-xs text-warm-500 mt-1">{t('mcpServer.serverTypesDesc', 'Context, Schema, and Deployment types configured')}</p>
            </div>
          </div>

          {/* Server List */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('mcpServer.serverList', 'Server List')}</h4>
            {servers.length === 0 ? (
              <p className="text-sm text-warm-500">{t('mcpServer.noServers', 'No MCP servers configured. Go to Server Management to create one.')}</p>
            ) : (
              <div className="space-y-3">
                {servers.map(server => (
                  <div key={server.id} className="bg-warm-900 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusColor(server.status)}`} />
                      <div>
                        <div className="text-sm font-medium text-white">{server.name}</div>
                        <div className="text-xs text-warm-500">{serverTypeLabel(server.serverType)} &middot; {server.endpoint || t('mcpServer.noEndpoint', 'No endpoint')}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClasses(server.status)}`}>
                      {server.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MCP Protocol Info */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('mcpServer.protocolInfo', 'MCP Protocol')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('mcpServer.protocol', 'Protocol')}</span>
                <span className="text-white font-mono">Model Context Protocol (MCP)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('mcpServer.compatibility', 'Compatibility')}</span>
                <span className="text-white font-mono">Claude, GPT-4, Gemini</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('mcpServer.contextReduction', 'Context Reduction')}</span>
                <span className="text-white font-mono">85% via Tool Search</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('mcpServer.transport', 'Transport')}</span>
                <span className="text-white font-mono">stdio / HTTP+SSE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Management Tab */}
      {subTab === 'management' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-warm-400">{t('mcpServer.managementDesc', 'Create and manage MCP servers for your projects')}</p>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/80 transition-colors"
            >
              {showCreate ? t('mcpServer.cancel', 'Cancel') : t('mcpServer.createServer', 'Create Server')}
            </button>
          </div>

          {/* Create Form */}
          {showCreate && (
            <div className="bg-warm-800 rounded-lg p-6">
              <h4 className="font-medium text-white mb-4">{t('mcpServer.newServer', 'New MCP Server')}</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-warm-300 mb-1">{t('mcpServer.serverName', 'Server Name')}</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder={t('mcpServer.serverNamePlaceholder', 'e.g., My Project Context Server')}
                    className="w-full px-3 py-2 bg-warm-900 border border-warm-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-warm-300 mb-1">{t('mcpServer.serverType', 'Server Type')}</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-warm-900 border border-warm-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue"
                  >
                    {SERVER_TYPES.map(type => (
                      <option key={type} value={type}>{serverTypeLabel(type)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-warm-300 mb-1">{t('mcpServer.endpoint', 'Endpoint')}</label>
                  <input
                    type="text"
                    value={formEndpoint}
                    onChange={e => setFormEndpoint(e.target.value)}
                    placeholder={t('mcpServer.endpointPlaceholder', 'e.g., http://localhost:3001/mcp')}
                    className="w-full px-3 py-2 bg-warm-900 border border-warm-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !formName.trim() || !formEndpoint.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? t('mcpServer.creating', 'Creating...') : t('mcpServer.create', 'Create')}
                </button>
              </div>
            </div>
          )}

          {/* Server Cards */}
          {servers.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-6 text-center">
              <p className="text-warm-500">{t('mcpServer.noServersYet', 'No MCP servers yet. Click "Create Server" to get started.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {servers.map(server => (
                <div key={server.id} className="bg-warm-800 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusColor(server.status)}`} />
                      <div>
                        <h4 className="font-medium text-white">{server.name}</h4>
                        <span className="text-xs text-warm-500">{serverTypeLabel(server.serverType)}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClasses(server.status)}`}>
                      {server.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-400">{t('mcpServer.endpoint', 'Endpoint')}</span>
                      <span className="text-white font-mono text-xs">{server.endpoint || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-400">{t('mcpServer.connections', 'Connections')}</span>
                      <span className="text-white">{server.connectionCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-400">{t('mcpServer.lastActive', 'Last Active')}</span>
                      <span className="text-white">{server.lastActiveAt ? new Date(server.lastActiveAt).toLocaleString() : '—'}</span>
                    </div>
                  </div>

                  {/* Test result */}
                  {testResult?.id === server.id && (
                    <div className={`mb-3 p-2 rounded-lg text-sm ${testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {testResult.success
                        ? t('mcpServer.testSuccess', 'Connection successful ({{ms}}ms)', { ms: testResult.latencyMs })
                        : t('mcpServer.testFailed', 'Connection failed')}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTest(server.id)}
                      disabled={testingId === server.id}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                      {testingId === server.id ? t('mcpServer.testing', 'Testing...') : t('mcpServer.testConnection', 'Test Connection')}
                    </button>
                    <button
                      onClick={() => handleDelete(server.id)}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-md text-xs font-medium hover:bg-red-600/30 transition-colors"
                    >
                      {t('mcpServer.delete', 'Delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tools & Resources Tab */}
      {subTab === 'tools' && (
        <div className="space-y-6">
          <p className="text-sm text-warm-400">{t('mcpServer.toolsDesc', 'Browse available MCP tools and resources by server type')}</p>

          {/* Tool Categories */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('mcpServer.toolsByType', 'Tools by Server Type')}</h4>

            {/* Project Context Tools */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {t('mcpServer.type.projectContext', 'Project Context')}
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'get_file_tree', desc: t('mcpServer.tool.getFileTree', 'Retrieve project file tree structure') },
                  { name: 'get_dependencies', desc: t('mcpServer.tool.getDependencies', 'List project dependencies and versions') },
                  { name: 'get_config', desc: t('mcpServer.tool.getConfig', 'Read project configuration files') },
                  { name: 'search_code', desc: t('mcpServer.tool.searchCode', 'Search code across the project codebase') },
                ].map(tool => (
                  <div key={tool.name} className="bg-warm-900 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-mono text-white">{tool.name}</span>
                      <p className="text-xs text-warm-500 mt-0.5">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Schema Tools */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {t('mcpServer.type.databaseSchema', 'Database Schema')}
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'get_tables', desc: t('mcpServer.tool.getTables', 'List database tables and columns') },
                  { name: 'get_relationships', desc: t('mcpServer.tool.getRelationships', 'Discover foreign key relationships') },
                  { name: 'get_migrations', desc: t('mcpServer.tool.getMigrations', 'View pending and applied migrations') },
                  { name: 'get_indexes', desc: t('mcpServer.tool.getIndexes', 'List database indexes and constraints') },
                ].map(tool => (
                  <div key={tool.name} className="bg-warm-900 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-mono text-white">{tool.name}</span>
                      <p className="text-xs text-warm-500 mt-0.5">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deployment Config Tools */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {t('mcpServer.type.deploymentConfig', 'Deployment Config')}
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'get_azure_resources', desc: t('mcpServer.tool.getAzureResources', 'List Azure Container Apps and resources') },
                  { name: 'get_env_vars', desc: t('mcpServer.tool.getEnvVars', 'Retrieve environment variable configuration') },
                  { name: 'get_ci_pipelines', desc: t('mcpServer.tool.getCiPipelines', 'View GitHub Actions CI/CD pipelines') },
                  { name: 'get_domains', desc: t('mcpServer.tool.getDomains', 'List custom domains and DNS settings') },
                ].map(tool => (
                  <div key={tool.name} className="bg-warm-900 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-mono text-white">{tool.name}</span>
                      <p className="text-xs text-warm-500 mt-0.5">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Capability Matrix */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('mcpServer.capabilityMatrix', 'Capability Matrix')}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">4</div>
                <div className="text-sm text-warm-400 mt-1">{t('mcpServer.contextTools', 'Context Tools')}</div>
              </div>
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">4</div>
                <div className="text-sm text-warm-400 mt-1">{t('mcpServer.schemaTools', 'Schema Tools')}</div>
              </div>
              <div className="bg-warm-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">4</div>
                <div className="text-sm text-warm-400 mt-1">{t('mcpServer.deployTools', 'Deploy Tools')}</div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              <strong>{t('mcpServer.note', 'Note')}:</strong>{' '}
              {t('mcpServer.noteDesc', 'MCP servers expose structured tools that Claude and other LLMs can invoke for live project context. Compatible with Anthropic Tool Search Tool for 85% context reduction.')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
