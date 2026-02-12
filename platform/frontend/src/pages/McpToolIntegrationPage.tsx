import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getMcpToolConfig,
  updateMcpToolConfig,
  listMcpTools,
  executeMcpTool,
  getMcpToolHistory,
  getMcpToolStats,
  type McpToolConfig,
  type McpTool,
  type ToolExecutionResult,
  type ToolExecutionEntry,
  type McpToolStats,
} from '../api/mcp-tools'

type McpToolTab = 'tools' | 'history' | 'stats'

const TOOL_ICONS: Record<string, string> = {
  'file-text': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z',
  'file-plus': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z',
  'search': 'M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  'package': 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  'database': 'M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3z',
  'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14',
  'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  'globe': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
}

const CATEGORY_COLORS: Record<string, string> = {
  filesystem: 'bg-blue-900 text-blue-300',
  knowledge: 'bg-purple-900 text-purple-300',
  data: 'bg-green-900 text-green-300',
  quality: 'bg-yellow-900 text-yellow-300',
  external: 'bg-orange-900 text-orange-300',
}

const DEPTH_LEVELS = ['shallow', 'standard', 'deep'] as const

export default function McpToolIntegrationPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<McpToolTab>('tools')
  const [loading, setLoading] = useState(false)

  // Config state
  const [config, setConfig] = useState<McpToolConfig | null>(null)
  const [tools, setTools] = useState<McpTool[]>([])

  // Tool execution state
  const [executingTool, setExecutingTool] = useState<string | null>(null)
  const [toolInputs, setToolInputs] = useState<Record<string, string>>({})
  const [toolResults, setToolResults] = useState<Record<string, ToolExecutionResult>>({})

  // History state
  const [history, setHistory] = useState<ToolExecutionEntry[]>([])

  // Stats state
  const [stats, setStats] = useState<McpToolStats | null>(null)

  useEffect(() => {
    loadConfig()
    loadTools()
  }, [])

  useEffect(() => {
    if (tab === 'history') loadHistory()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadConfig() {
    try {
      const data = await getMcpToolConfig()
      setConfig(data)
    } catch { /* ignore */ }
  }

  async function loadTools() {
    try {
      const data = await listMcpTools()
      setTools(data)
    } catch { /* ignore */ }
  }

  async function loadHistory() {
    setLoading(true)
    try {
      const data = await getMcpToolHistory()
      setHistory(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getMcpToolStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleToggleTool(field: string, value: boolean) {
    if (!config) return
    try {
      const updated = await updateMcpToolConfig({ [field]: value })
      setConfig(updated)
    } catch { /* ignore */ }
  }

  async function handleToggleMcp(value: boolean) {
    if (!config) return
    try {
      const updated = await updateMcpToolConfig({ mcpEnabled: value })
      setConfig(updated)
    } catch { /* ignore */ }
  }

  async function handleToggleAutoAttach(value: boolean) {
    if (!config) return
    try {
      const updated = await updateMcpToolConfig({ autoAttachTools: value })
      setConfig(updated)
    } catch { /* ignore */ }
  }

  async function handleDepthChange(level: string) {
    if (!config) return
    try {
      const updated = await updateMcpToolConfig({ contextDepthLevel: level })
      setConfig(updated)
    } catch { /* ignore */ }
  }

  async function handleExecute(toolId: string) {
    setExecutingTool(toolId)
    try {
      const result = await executeMcpTool(toolId, toolInputs[toolId])
      setToolResults(prev => ({ ...prev, [toolId]: result }))
      await loadConfig() // Refresh config for updated stats
    } catch { /* ignore */ }
    setExecutingTool(null)
  }

  function getToolEnabledField(toolId: string): string {
    const map: Record<string, string> = {
      file_read: 'fileReadEnabled',
      file_write: 'fileWriteEnabled',
      search_docs: 'searchDocsEnabled',
      resolve_deps: 'resolveDepsEnabled',
      query_db: 'queryDbEnabled',
      run_tests: 'runTestsEnabled',
      lint_code: 'lintCodeEnabled',
      browse_web: 'browseWebEnabled',
    }
    return map[toolId] || toolId
  }

  function isToolEnabled(toolId: string): boolean {
    if (!config) return false
    const field = getToolEnabledField(toolId) as keyof McpToolConfig
    return config[field] as boolean
  }

  function getToolPlaceholder(toolId: string): string {
    const placeholders: Record<string, string> = {
      file_read: 'src/components/App.tsx',
      file_write: 'src/utils/helper.ts',
      search_docs: 'React hooks best practices',
      resolve_deps: 'package.json',
      query_db: 'SELECT * FROM users LIMIT 10',
      run_tests: 'src/__tests__/',
      lint_code: 'src/components/',
      browse_web: 'https://docs.example.com/api',
    }
    return placeholders[toolId] || 'Enter input...'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('mcpTools.title', 'MCP Tool Integration')}</h3>
        <p className="text-gray-400 text-sm mt-1">{t('mcpTools.subtitle', 'Model Context Protocol tools for AI-augmented code generation')}</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(['tools', 'history', 'stats'] as McpToolTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`mcpTools.tabs.${tabId}`, tabId === 'tools' ? 'Tools' : tabId === 'history' ? 'History' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Tools Tab */}
      {tab === 'tools' && (
        <div className="space-y-4">
          {/* Global Controls */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">{t('mcpTools.mcpEnabled', 'MCP Protocol')}</h4>
                <p className="text-gray-400 text-xs mt-1">{t('mcpTools.mcpEnabledDesc', 'Enable Model Context Protocol for tool-augmented AI generation')}</p>
              </div>
              <button
                onClick={() => handleToggleMcp(!config?.mcpEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config?.mcpEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config?.mcpEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">{t('mcpTools.autoAttach', 'Auto-Attach Tools')}</h4>
                <p className="text-gray-400 text-xs mt-1">{t('mcpTools.autoAttachDesc', 'Automatically attach enabled tools to every generation request')}</p>
              </div>
              <button
                onClick={() => handleToggleAutoAttach(!config?.autoAttachTools)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config?.autoAttachTools ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config?.autoAttachTools ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div>
              <h4 className="text-white font-medium mb-2">{t('mcpTools.contextDepth', 'Context Depth')}</h4>
              <div className="flex gap-2">
                {DEPTH_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => handleDepthChange(level)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      config?.contextDepthLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-2">
                {config?.contextDepthLevel === 'shallow' && t('mcpTools.depthShallow', 'Minimal context: file names and structure only')}
                {config?.contextDepthLevel === 'standard' && t('mcpTools.depthStandard', 'Standard context: file contents and relevant dependencies')}
                {config?.contextDepthLevel === 'deep' && t('mcpTools.depthDeep', 'Deep context: full project analysis including tests and docs')}
              </p>
            </div>
          </div>

          {/* Tool Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map(tool => {
              const enabled = isToolEnabled(tool.id)
              const result = toolResults[tool.id]
              const isExecuting = executingTool === tool.id

              return (
                <div key={tool.id} className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                          <path d={TOOL_ICONS[tool.icon] || TOOL_ICONS['globe']} />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-white font-medium text-sm">{tool.name}</h5>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${CATEGORY_COLORS[tool.category] || 'bg-gray-700 text-gray-300'}`}>
                          {tool.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleTool(getToolEnabledField(tool.id), !enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <p className="text-gray-400 text-xs">{tool.description}</p>

                  {enabled && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={toolInputs[tool.id] || ''}
                        onChange={e => setToolInputs(prev => ({ ...prev, [tool.id]: e.target.value }))}
                        placeholder={getToolPlaceholder(tool.id)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleExecute(tool.id)}
                        disabled={isExecuting || !config?.mcpEnabled}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isExecuting ? t('mcpTools.executing', 'Executing...') : t('mcpTools.execute', 'Execute')}
                      </button>
                    </div>
                  )}

                  {result && (
                    <div className={`rounded-md p-3 text-xs font-mono whitespace-pre-wrap ${
                      result.success ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-red-900/30 text-red-300 border border-red-800'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                        <span className="text-gray-400">{result.latencyMs}ms | {result.tokensSaved} tokens saved</span>
                      </div>
                      {result.output}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('mcpTools.noHistory', 'No execution history yet. Execute a tool to see results here.')}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${entry.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-white font-medium text-sm">{entry.toolName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${entry.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {entry.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{entry.latencyMs}ms</span>
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  {entry.input && (
                    <div className="text-xs text-gray-400">
                      <span className="text-gray-500">{t('mcpTools.input', 'Input')}:</span> {entry.input}
                    </div>
                  )}
                  <div className="bg-gray-900 rounded-md p-2 text-xs font-mono text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {entry.output}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : stats ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('mcpTools.totalExecs', 'Total Executions')}</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats.totalExecutions}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('mcpTools.successRate', 'Success Rate')}</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats.successRate}%</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('mcpTools.avgLatency', 'Avg Latency')}</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats.avgLatencyMs}ms</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('mcpTools.tokensSaved', 'Tokens Saved')}</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {stats.tokensSaved > 1000 ? `${(stats.tokensSaved / 1000).toFixed(1)}K` : stats.tokensSaved}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('mcpTools.mostUsed', 'Most Used Tool')}</div>
                  <div className="text-lg font-bold text-white mt-1">{stats.mostUsedTool || 'N/A'}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('mcpTools.customServers', 'Custom Servers')}</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats.customServers}</div>
                </div>
              </div>

              {/* By Tool Type Breakdown */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-white font-medium mb-4">{t('mcpTools.byToolType', 'By Tool Type')}</h4>
                {stats.byToolType.length === 0 ? (
                  <p className="text-gray-500 text-sm">{t('mcpTools.noToolData', 'No execution data yet')}</p>
                ) : (
                  <div className="space-y-3">
                    {stats.byToolType.map(entry => (
                      <div key={entry.toolName} className="flex items-center gap-3">
                        <span className="text-white text-sm min-w-[120px]">{entry.toolName}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all"
                            style={{ width: `${stats.totalExecutions > 0 ? (entry.count / stats.totalExecutions) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs min-w-[60px] text-right">{entry.count} calls</span>
                        <span className="text-gray-400 text-xs min-w-[60px] text-right">{entry.avgLatency}ms</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('mcpTools.noStats', 'No statistics available')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
