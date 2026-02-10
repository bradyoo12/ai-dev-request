import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getPlatformTools,
  callPlatformTool,
  listServers,
  registerServer,
  unregisterServer,
  getServerStatus,
  discoverTools,
  callExternalTool,
} from '../api/mcp-integration'
import type {
  McpTool,
  McpConnection,
  McpServerStatus,
  ToolCallResult,
} from '../api/mcp-integration'

export default function McpIntegrationPage() {
  const { t } = useTranslation()

  const [tools, setTools] = useState<McpTool[]>([])
  const [servers, setServers] = useState<McpConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add Server form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newTransport, setNewTransport] = useState('sse')
  const [newAuthType, setNewAuthType] = useState('none')
  const [newAuthToken, setNewAuthToken] = useState('')
  const [registering, setRegistering] = useState(false)

  // Tool test state
  const [testingTool, setTestingTool] = useState<string | null>(null)
  const [toolResult, setToolResult] = useState<ToolCallResult | null>(null)

  // Server detail state
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [serverStatus, setServerStatus] = useState<McpServerStatus | null>(null)
  const [discovering, setDiscovering] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [toolData, serverData] = await Promise.all([
        getPlatformTools(),
        listServers(),
      ])
      setTools(toolData)
      setServers(serverData)
    } catch {
      setError(t('mcp.loadError', 'Failed to load MCP data'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  const handleTestTool = async (toolName: string) => {
    setTestingTool(toolName)
    setToolResult(null)
    try {
      const result = await callPlatformTool({ toolName, arguments: '{}' })
      setToolResult(result)
    } catch (err) {
      setToolResult({ success: false, result: null, error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setTestingTool(null)
    }
  }

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistering(true)
    setError('')
    try {
      await registerServer({
        name: newName,
        serverUrl: newUrl,
        transport: newTransport,
        authType: newAuthType === 'none' ? null : newAuthType,
        authToken: newAuthToken || null,
      })
      setNewName('')
      setNewUrl('')
      setNewTransport('sse')
      setNewAuthType('none')
      setNewAuthToken('')
      setShowAddForm(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mcp.registerFailed', 'Failed to register server'))
    } finally {
      setRegistering(false)
    }
  }

  const handleRemoveServer = async (id: string) => {
    setError('')
    try {
      await unregisterServer(id)
      if (selectedServer === id) {
        setSelectedServer(null)
        setServerStatus(null)
      }
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mcp.unregisterFailed', 'Failed to unregister server'))
    }
  }

  const handleCheckStatus = async (id: string) => {
    setSelectedServer(id)
    const status = await getServerStatus(id)
    setServerStatus(status)
  }

  const handleDiscover = async (id: string) => {
    setDiscovering(true)
    try {
      await discoverTools(id)
      await loadData()
      if (selectedServer === id) {
        const status = await getServerStatus(id)
        setServerStatus(status)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mcp.discoverFailed', 'Failed to discover tools'))
    } finally {
      setDiscovering(false)
    }
  }

  const handleCallExternalTool = async (serverId: string, toolName: string) => {
    setTestingTool(toolName)
    setToolResult(null)
    try {
      const result = await callExternalTool(serverId, { toolName, arguments: '{}' })
      setToolResult(result)
    } catch (err) {
      setToolResult({ success: false, result: null, error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setTestingTool(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnected': return 'bg-gray-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-900/50 text-green-400'
      case 'connecting': return 'bg-yellow-900/50 text-yellow-400'
      case 'disconnected': return 'bg-gray-700 text-gray-400'
      case 'error': return 'bg-red-900/50 text-red-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const parseJsonTools = (json: string | null): McpTool[] => {
    if (!json) return []
    try { return JSON.parse(json) } catch { return [] }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        {t('mcp.loading', 'Loading MCP integration...')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Platform Tools Section */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            {t('mcp.platformTools', 'Platform MCP Tools')}
          </span>
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {t('mcp.platformToolsDesc', 'Built-in tools exposed by the AI Dev Request platform via MCP protocol.')}
        </p>

        <div className="space-y-3">
          {tools.map((tool) => (
            <div key={tool.name} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-sm text-blue-400">{tool.name}</span>
                </div>
                <button
                  onClick={() => handleTestTool(tool.name)}
                  disabled={testingTool === tool.name}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {testingTool === tool.name ? t('mcp.testing', 'Testing...') : t('mcp.testTool', 'Test Tool')}
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-2">{tool.description}</p>
              <details className="text-xs">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
                  {t('mcp.inputSchema', 'Input Schema')}
                </summary>
                <pre className="mt-2 bg-gray-900 rounded p-2 text-gray-400 overflow-x-auto">
                  {JSON.stringify(JSON.parse(tool.inputSchema), null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>

        {/* Tool call result */}
        {toolResult && (
          <div className={`mt-4 rounded-lg p-4 ${toolResult.success ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
            <div className="text-sm font-medium mb-1">
              {toolResult.success ? t('mcp.toolSuccess', 'Tool executed successfully') : t('mcp.toolError', 'Tool execution failed')}
            </div>
            <pre className="text-xs text-gray-400 overflow-x-auto">
              {toolResult.success ? toolResult.result : toolResult.error}
            </pre>
          </div>
        )}
      </div>

      {/* External Servers Section */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/><path d="M12 17v5"/></svg>
              {t('mcp.externalServers', 'External MCP Servers')}
            </span>
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {showAddForm ? t('mcp.cancel', 'Cancel') : t('mcp.addServer', 'Add Server')}
          </button>
        </div>

        {/* Add Server Form */}
        {showAddForm && (
          <form onSubmit={handleAddServer} className="bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('mcp.serverName', 'Server Name')}</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                placeholder="My MCP Server"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('mcp.serverUrl', 'Server URL')}</label>
              <input
                type="url"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                required
                placeholder="https://mcp-server.example.com"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('mcp.transport', 'Transport')}</label>
                <select
                  value={newTransport}
                  onChange={e => setNewTransport(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600"
                >
                  <option value="sse">SSE</option>
                  <option value="stdio">stdio</option>
                  <option value="grpc">gRPC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('mcp.authType', 'Auth Type')}</label>
                <select
                  value={newAuthType}
                  onChange={e => setNewAuthType(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600"
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="api-key">API Key</option>
                </select>
              </div>
            </div>
            {newAuthType !== 'none' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('mcp.authToken', 'Auth Token')}</label>
                <input
                  type="password"
                  value={newAuthToken}
                  onChange={e => setNewAuthToken(e.target.value)}
                  placeholder="Enter token or API key"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={registering || !newName || !newUrl}
              className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {registering ? t('mcp.registering', 'Registering...') : t('mcp.registerServer', 'Register Server')}
            </button>
          </form>
        )}

        {/* Servers List */}
        {servers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>{t('mcp.noServers', 'No external MCP servers registered.')}</p>
            <p className="text-sm mt-1">{t('mcp.noServersHint', 'Click "Add Server" to connect an external MCP server.')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div key={server.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(server.status)}`} />
                    <span className="font-medium">{server.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(server.status)}`}>
                      {server.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCheckStatus(server.id)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                    >
                      {t('mcp.status', 'Status')}
                    </button>
                    <button
                      onClick={() => handleDiscover(server.id)}
                      disabled={discovering}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors disabled:opacity-50"
                    >
                      {t('mcp.discover', 'Discover Tools')}
                    </button>
                    <button
                      onClick={() => handleRemoveServer(server.id)}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-xs transition-colors"
                    >
                      {t('mcp.remove', 'Remove')}
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="font-mono text-xs">{server.serverUrl}</span>
                  <span className="mx-2">|</span>
                  <span className="text-xs">{server.transport.toUpperCase()}</span>
                  {server.toolCallCount > 0 && (
                    <>
                      <span className="mx-2">|</span>
                      <span className="text-xs">{server.toolCallCount} {t('mcp.calls', 'calls')}</span>
                    </>
                  )}
                </div>

                {/* Available tools from this server */}
                {server.availableTools && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">{t('mcp.availableTools', 'Available Tools')}:</div>
                    <div className="flex flex-wrap gap-2">
                      {parseJsonTools(server.availableTools).map((tool) => (
                        <button
                          key={tool.name}
                          onClick={() => handleCallExternalTool(server.id, tool.name)}
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
                          title={tool.description}
                        >
                          {tool.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Server status details */}
                {selectedServer === server.id && serverStatus && (
                  <div className="mt-3 bg-gray-900/50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-300 mb-2">{t('mcp.serverDetails', 'Server Details')}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">{t('mcp.toolCount', 'Tools')}:</span>
                        <span className="ml-1 text-gray-300">{serverStatus.toolCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('mcp.resourceCount', 'Resources')}:</span>
                        <span className="ml-1 text-gray-300">{serverStatus.resourceCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('mcp.totalCalls', 'Total Calls')}:</span>
                        <span className="ml-1 text-gray-300">{serverStatus.toolCallCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('mcp.lastConnected', 'Last Connected')}:</span>
                        <span className="ml-1 text-gray-300">
                          {serverStatus.lastConnectedAt
                            ? new Date(serverStatus.lastConnectedAt).toLocaleString()
                            : t('mcp.never', 'Never')}
                        </span>
                      </div>
                    </div>
                    {serverStatus.errorMessage && (
                      <div className="mt-2 text-xs text-red-400">
                        {t('mcp.error', 'Error')}: {serverStatus.errorMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
