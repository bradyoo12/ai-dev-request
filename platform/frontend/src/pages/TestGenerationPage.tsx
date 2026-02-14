import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  triggerTestGeneration,
  getTestResults,
  getTestHistory,
  generateFromNaturalLanguage,
  getMcpStatus,
  configureMcp,
  analyzeCoverage,
  type TestGenerationRecord,
  type TestFileInfo,
  type McpConnectionStatus,
  type CoverageAnalysis,
} from '../api/test-generation'

type ActiveTab = 'generate' | 'nl-generate' | 'mcp-config' | 'coverage'

export default function TestGenerationPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState(1)
  const [record, setRecord] = useState<TestGenerationRecord | null>(null)
  const [history, setHistory] = useState<TestGenerationRecord[]>([])
  const [testFiles, setTestFiles] = useState<TestFileInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [selectedFile, setSelectedFile] = useState<TestFileInfo | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate')

  // MCP Config state
  const [mcpStatus, setMcpStatus] = useState<McpConnectionStatus | null>(null)
  const [mcpServerUrl, setMcpServerUrl] = useState('')
  const [mcpTransport, setMcpTransport] = useState('sse')
  const [mcpConnecting, setMcpConnecting] = useState(false)
  const [mcpCapabilities, setMcpCapabilities] = useState<string[]>([])

  // NL generation state
  const [nlScenario, setNlScenario] = useState('')
  const [nlTestType, setNlTestType] = useState('e2e')
  const [nlGenerating, setNlGenerating] = useState(false)

  // Coverage state
  const [coverage, setCoverage] = useState<CoverageAnalysis | null>(null)
  const [coverageLoading, setCoverageLoading] = useState(false)

  useEffect(() => {
    loadResults()
    loadMcpStatus()
  }, [projectId])

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const result = await getTestResults(projectId)
      setRecord(result)
      if (result?.testFilesJson) {
        try {
          const parsed = JSON.parse(result.testFilesJson)
          setTestFiles(Array.isArray(parsed) ? parsed : [])
        } catch {
          setTestFiles([])
        }
      } else {
        setTestFiles([])
      }
    } catch {
      setError(t('testGeneration.error.loadFailed', 'Failed to load test results'))
    } finally {
      setLoading(false)
    }
  }

  async function loadMcpStatus() {
    try {
      const status = await getMcpStatus(projectId)
      setMcpStatus(status)
      if (status.serverUrl) setMcpServerUrl(status.serverUrl)
      if (status.transport) setMcpTransport(status.transport)
      if (status.capabilitiesJson) {
        try {
          const caps = JSON.parse(status.capabilitiesJson)
          setMcpCapabilities(Array.isArray(caps) ? caps : [])
        } catch {
          setMcpCapabilities([])
        }
      }
    } catch { /* ignore */ }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const result = await triggerTestGeneration(projectId)
      setRecord(result)
      if (result?.testFilesJson) {
        try {
          const parsed = JSON.parse(result.testFilesJson)
          setTestFiles(Array.isArray(parsed) ? parsed : [])
        } catch {
          setTestFiles([])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('testGeneration.error.generateFailed', 'Test generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  async function handleNlGenerate() {
    if (!nlScenario.trim()) return
    setNlGenerating(true)
    setError('')
    try {
      const result = await generateFromNaturalLanguage(projectId, nlScenario, nlTestType)
      setRecord(result)
      if (result?.testFilesJson) {
        try {
          const parsed = JSON.parse(result.testFilesJson)
          setTestFiles(Array.isArray(parsed) ? parsed : [])
        } catch {
          setTestFiles([])
        }
      }
      setActiveTab('generate')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('testGeneration.error.nlGenerateFailed', 'NL test generation failed'))
    } finally {
      setNlGenerating(false)
    }
  }

  async function handleMcpConnect() {
    if (!mcpServerUrl.trim()) return
    setMcpConnecting(true)
    setError('')
    try {
      const config = await configureMcp(projectId, mcpServerUrl, mcpTransport)
      setMcpStatus({
        isConfigured: true,
        status: config.status,
        serverUrl: config.serverUrl,
        transport: config.transport,
        autoHealEnabled: config.autoHealEnabled,
        healingConfidenceThreshold: config.healingConfidenceThreshold,
        lastConnectedAt: config.lastConnectedAt,
        capabilitiesJson: config.capabilitiesJson,
      })
      if (config.capabilitiesJson) {
        try {
          const caps = JSON.parse(config.capabilitiesJson)
          setMcpCapabilities(Array.isArray(caps) ? caps : [])
        } catch {
          setMcpCapabilities([])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('testGeneration.error.mcpConnectFailed', 'MCP connection failed'))
    } finally {
      setMcpConnecting(false)
    }
  }

  async function handleMcpDisconnect() {
    setMcpConnecting(true)
    try {
      await configureMcp(projectId, '', mcpTransport)
      setMcpStatus({ isConfigured: false, status: 'disconnected', autoHealEnabled: false, healingConfidenceThreshold: 70 })
      setMcpCapabilities([])
      setMcpServerUrl('')
    } catch { /* ignore */ }
    setMcpConnecting(false)
  }

  async function handleCoverageAnalysis() {
    setCoverageLoading(true)
    setError('')
    try {
      const result = await analyzeCoverage(projectId)
      setCoverage(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('testGeneration.error.coverageFailed', 'Coverage analysis failed'))
    } finally {
      setCoverageLoading(false)
    }
  }

  async function loadHistory() {
    try {
      const h = await getTestHistory(projectId)
      setHistory(h)
      setShowHistory(true)
    } catch {
      setError(t('testGeneration.error.historyFailed', 'Failed to load history'))
    }
  }

  const filteredFiles = typeFilter === 'all'
    ? testFiles
    : testFiles.filter(f => f.type === typeFilter)

  const unitCount = testFiles.filter(f => f.type === 'unit').length
  const integrationCount = testFiles.filter(f => f.type === 'integration').length
  const e2eCount = testFiles.filter(f => f.type === 'e2e').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('testGeneration.title', 'AI Test Generation')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('testGeneration.subtitle', 'Auto-generate unit, integration, and E2E tests with Playwright MCP')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-warm-400">{t('testGeneration.projectId', 'Project ID')}:</label>
          <input
            type="number"
            min={1}
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="w-20 bg-warm-700 border border-warm-600 rounded px-2 py-1 text-sm"
          />
          {mcpStatus?.status === 'connected' && (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {t('testGeneration.mcpConnected', 'MCP Connected')}
            </span>
          )}
          <button
            onClick={loadHistory}
            className="px-3 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
          >
            {t('testGeneration.history', 'History')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {([
          { id: 'generate' as ActiveTab, label: t('testGeneration.tabs.generate', 'Generate Tests') },
          { id: 'nl-generate' as ActiveTab, label: t('testGeneration.tabs.nlGenerate', 'Natural Language') },
          { id: 'mcp-config' as ActiveTab, label: t('testGeneration.tabs.mcpConfig', 'MCP Config') },
          { id: 'coverage' as ActiveTab, label: t('testGeneration.tabs.coverage', 'Coverage Analysis') },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Standard Generation Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
            >
              {generating ? t('testGeneration.generating', 'Generating...') : t('testGeneration.generate', 'Generate Tests')}
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && record && (
            <>
              {/* Summary Card */}
              <div className="bg-warm-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                      record.status === 'generating' ? 'bg-blue-900/50 text-blue-300' :
                      record.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                      'bg-warm-700 text-warm-300'
                    }`}>
                      {record.status}
                    </span>
                    <span className="text-sm text-warm-400">v{record.generationVersion}</span>
                  </div>
                  {record.completedAt && (
                    <span className="text-xs text-warm-500">{new Date(record.completedAt).toLocaleString()}</span>
                  )}
                </div>

                {record.summary && (
                  <p className="text-warm-300 text-sm mb-4">{record.summary}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{record.testFilesGenerated}</div>
                    <div className="text-xs text-warm-400 mt-1">{t('testGeneration.stats.files', 'Test Files')}</div>
                  </div>
                  <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{record.totalTestCount}</div>
                    <div className="text-xs text-warm-400 mt-1">{t('testGeneration.stats.tests', 'Total Tests')}</div>
                  </div>
                  <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{record.coverageEstimate}%</div>
                    <div className="text-xs text-warm-400 mt-1">{t('testGeneration.stats.coverage', 'Est. Coverage')}</div>
                  </div>
                  <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium text-yellow-400 truncate">{record.testFramework || '-'}</div>
                    <div className="text-xs text-warm-400 mt-1">{t('testGeneration.stats.framework', 'Framework')}</div>
                  </div>
                </div>
              </div>

              {/* Coverage Bar */}
              {record.status === 'completed' && (
                <div className="bg-warm-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('testGeneration.coverageBar', 'Estimated Coverage')}</span>
                    <span className="text-sm text-warm-400">{record.coverageEstimate}%</span>
                  </div>
                  <div className="w-full bg-warm-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        record.coverageEstimate >= 80 ? 'bg-green-500' :
                        record.coverageEstimate >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(record.coverageEstimate, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Test Files List */}
              {testFiles.length > 0 && (
                <div className="bg-warm-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{t('testGeneration.files', 'Generated Test Files')}</h4>
                    <div className="flex gap-2">
                      {['all', 'unit', 'integration', 'e2e'].map(type => (
                        <button
                          key={type}
                          onClick={() => setTypeFilter(type)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            typeFilter === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-warm-700 text-warm-400 hover:text-white'
                          }`}
                        >
                          {type === 'all' ? `All (${testFiles.length})` :
                           type === 'unit' ? `Unit (${unitCount})` :
                           type === 'integration' ? `Integration (${integrationCount})` :
                           `E2E (${e2eCount})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredFiles.map((file, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedFile(selectedFile?.path === file.path ? null : file)}
                        className="bg-warm-700/50 rounded-lg p-3 cursor-pointer hover:bg-warm-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              file.type === 'unit' ? 'bg-blue-900/50 text-blue-300' :
                              file.type === 'integration' ? 'bg-purple-900/50 text-purple-300' :
                              'bg-green-900/50 text-green-300'
                            }`}>
                              {file.type}
                            </span>
                            <span className="text-sm font-mono">{file.path}</span>
                          </div>
                          <span className="text-xs text-warm-400">{file.testCount} {t('testGeneration.testsLabel', 'tests')}</span>
                        </div>
                        {selectedFile?.path === file.path && file.content && (
                          <pre className="mt-3 p-3 bg-warm-900 rounded text-xs text-warm-300 overflow-x-auto max-h-80">
                            {file.content}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !record && (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <div className="text-warm-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="m9 15 2 2 4-4"/>
                </svg>
              </div>
              <p className="text-warm-400">{t('testGeneration.empty', 'No test generation results yet. Click "Generate Tests" to start.')}</p>
            </div>
          )}
        </div>
      )}

      {/* Natural Language Generation Tab */}
      {activeTab === 'nl-generate' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-xl p-6 space-y-4">
            <h4 className="font-semibold">{t('testGeneration.nl.title', 'Generate Tests from Natural Language')}</h4>
            <p className="text-warm-400 text-sm">{t('testGeneration.nl.description', 'Describe test scenarios in plain language and AI will generate Playwright E2E tests via MCP.')}</p>

            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('testGeneration.nl.testType', 'Test Type')}</label>
              <div className="flex gap-2">
                {['e2e', 'unit', 'integration'].map(type => (
                  <button
                    key={type}
                    onClick={() => setNlTestType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      nlTestType === type ? 'bg-blue-600 text-white' : 'bg-warm-700 text-warm-400 hover:text-white'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('testGeneration.nl.scenario', 'Test Scenario')}</label>
              <textarea
                value={nlScenario}
                onChange={(e) => setNlScenario(e.target.value)}
                rows={5}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm resize-none"
                placeholder={t('testGeneration.nl.placeholder', 'e.g., User visits homepage, clicks login, enters credentials, and gets redirected to dashboard. Verify the dashboard shows user name and recent activity.')}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleNlGenerate}
                disabled={nlGenerating || !nlScenario.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
              >
                {nlGenerating ? t('testGeneration.nl.generating', 'Generating from scenario...') : t('testGeneration.nl.generate', 'Generate from Scenario')}
              </button>
              {mcpStatus?.status === 'connected' && (
                <span className="text-xs text-green-400">{t('testGeneration.nl.mcpActive', 'MCP-enhanced generation active')}</span>
              )}
            </div>
          </div>

          {/* Example Scenarios */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-3">{t('testGeneration.nl.examples', 'Example Scenarios')}</h4>
            <div className="space-y-2">
              {[
                'User logs in with valid credentials and sees the dashboard with their profile',
                'Shopping cart: add item, update quantity, remove item, verify total price',
                'Form validation: submit empty form, check error messages, fill required fields, submit successfully',
                'Navigation: visit each main page, verify page title and key content loads',
              ].map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setNlScenario(example)}
                  className="w-full text-left bg-warm-700/50 hover:bg-warm-700 rounded-lg p-3 text-sm text-warm-300 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MCP Configuration Tab */}
      {activeTab === 'mcp-config' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{t('testGeneration.mcp.title', 'Playwright MCP Server')}</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                mcpStatus?.status === 'connected' ? 'bg-green-900/50 text-green-300' :
                mcpStatus?.status === 'connecting' ? 'bg-blue-900/50 text-blue-300' :
                mcpStatus?.status === 'error' ? 'bg-red-900/50 text-red-300' :
                'bg-warm-700 text-warm-300'
              }`}>
                {mcpStatus?.status || 'disconnected'}
              </span>
            </div>
            <p className="text-warm-400 text-sm">{t('testGeneration.mcp.description', 'Connect to a Playwright MCP server for AI-powered browser automation, intelligent locators, and accessibility tree access.')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('testGeneration.mcp.serverUrl', 'Server URL')}</label>
                <input
                  type="text"
                  value={mcpServerUrl}
                  onChange={(e) => setMcpServerUrl(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm font-mono"
                  placeholder="e.g., http://localhost:3100/mcp"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('testGeneration.mcp.transport', 'Transport')}</label>
                <select
                  value={mcpTransport}
                  onChange={(e) => setMcpTransport(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="sse">SSE (Server-Sent Events)</option>
                  <option value="stdio">stdio</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              {mcpStatus?.status !== 'connected' ? (
                <button
                  onClick={handleMcpConnect}
                  disabled={mcpConnecting || !mcpServerUrl.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
                >
                  {mcpConnecting ? t('testGeneration.mcp.connecting', 'Connecting...') : t('testGeneration.mcp.connect', 'Connect')}
                </button>
              ) : (
                <button
                  onClick={handleMcpDisconnect}
                  disabled={mcpConnecting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
                >
                  {t('testGeneration.mcp.disconnect', 'Disconnect')}
                </button>
              )}
            </div>

            {mcpStatus?.lastConnectedAt && (
              <p className="text-xs text-warm-500">
                {t('testGeneration.mcp.lastConnected', 'Last connected')}: {new Date(mcpStatus.lastConnectedAt).toLocaleString()}
              </p>
            )}
            {mcpStatus?.errorMessage && (
              <p className="text-xs text-red-400">{mcpStatus.errorMessage}</p>
            )}
          </div>

          {/* MCP Capabilities */}
          {mcpCapabilities.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-3">{t('testGeneration.mcp.capabilities', 'Available Capabilities')}</h4>
              <div className="flex flex-wrap gap-2">
                {mcpCapabilities.map(cap => (
                  <span key={cap} className="px-3 py-1 bg-warm-700 rounded-full text-xs text-warm-300 font-mono">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* MCP Info */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-3">{t('testGeneration.mcp.howItWorks', 'How Playwright MCP Works')}</h4>
            <div className="space-y-3 text-sm text-warm-400">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center text-xs font-bold">1</span>
                <p>{t('testGeneration.mcp.step1', 'MCP server launches a Playwright browser instance and exposes tools for navigation, clicking, typing, and screenshots.')}</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center text-xs font-bold">2</span>
                <p>{t('testGeneration.mcp.step2', 'AI uses the accessibility tree to understand page structure and select resilient locators (roles, labels, test IDs).')}</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/50 text-blue-300 flex items-center justify-center text-xs font-bold">3</span>
                <p>{t('testGeneration.mcp.step3', 'Generated tests automatically use MCP-aware locators that survive UI changes, enabling self-healing capability.')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coverage Analysis Tab */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">{t('testGeneration.coverage.title', 'AI Coverage Analysis')}</h4>
              <button
                onClick={handleCoverageAnalysis}
                disabled={coverageLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
              >
                {coverageLoading ? t('testGeneration.coverage.analyzing', 'Analyzing...') : t('testGeneration.coverage.analyze', 'Analyze Coverage')}
              </button>
            </div>
            <p className="text-warm-400 text-sm">{t('testGeneration.coverage.description', 'AI analyzes your source code and test files to estimate test coverage and identify gaps.')}</p>
          </div>

          {coverageLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!coverageLoading && coverage && (
            <>
              {/* Coverage Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-warm-800 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${coverage.overallCoverage >= 80 ? 'text-green-400' : coverage.overallCoverage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {coverage.overallCoverage}%
                  </div>
                  <div className="text-xs text-warm-400 mt-1">{t('testGeneration.coverage.overall', 'Overall')}</div>
                </div>
                <div className="bg-warm-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{coverage.lineCoverage}%</div>
                  <div className="text-xs text-warm-400 mt-1">{t('testGeneration.coverage.line', 'Line')}</div>
                </div>
                <div className="bg-warm-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{coverage.branchCoverage}%</div>
                  <div className="text-xs text-warm-400 mt-1">{t('testGeneration.coverage.branch', 'Branch')}</div>
                </div>
                <div className="bg-warm-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{coverage.functionCoverage}%</div>
                  <div className="text-xs text-warm-400 mt-1">{t('testGeneration.coverage.function', 'Function')}</div>
                </div>
              </div>

              {coverage.summary && (
                <div className="bg-warm-800 rounded-xl p-4">
                  <p className="text-warm-300 text-sm">{coverage.summary}</p>
                </div>
              )}

              {/* Uncovered Areas */}
              {coverage.uncoveredAreas.length > 0 && (
                <div className="bg-warm-800 rounded-xl p-6">
                  <h4 className="font-semibold mb-3">{t('testGeneration.coverage.uncovered', 'Uncovered Areas')}</h4>
                  <div className="space-y-2">
                    {coverage.uncoveredAreas.map((area, idx) => (
                      <div key={idx} className="bg-warm-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              area.priority === 1 ? 'bg-red-900/50 text-red-300' :
                              area.priority === 2 ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-warm-600 text-warm-300'
                            }`}>
                              P{area.priority}
                            </span>
                            <span className="text-sm font-mono">{area.filePath}</span>
                          </div>
                          <span className="text-xs text-warm-400">{area.functionName}</span>
                        </div>
                        <p className="text-xs text-warm-400 mt-1">{area.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {coverage.recommendations.length > 0 && (
                <div className="bg-warm-800 rounded-xl p-6">
                  <h4 className="font-semibold mb-3">{t('testGeneration.coverage.recommendations', 'Recommendations')}</h4>
                  <ul className="space-y-2">
                    {coverage.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-warm-300">
                        <span className="text-blue-400 mt-0.5">-</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!coverageLoading && !coverage && (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <p className="text-warm-400">{t('testGeneration.coverage.empty', 'Click "Analyze Coverage" to get an AI-powered coverage analysis of your project.')}</p>
            </div>
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="bg-warm-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">{t('testGeneration.historyTitle', 'Generation History')}</h4>
            <button onClick={() => setShowHistory(false)} className="text-warm-400 hover:text-white text-sm">
              {t('testGeneration.close', 'Close')}
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-warm-400 text-sm">{t('testGeneration.noHistory', 'No generation history.')}</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-warm-700/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      h.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                      h.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                      'bg-warm-600 text-warm-300'
                    }`}>
                      {h.status}
                    </span>
                    <span className="text-sm">v{h.generationVersion}</span>
                    <span className="text-xs text-warm-400">{h.testFilesGenerated} files, {h.totalTestCount} tests</span>
                  </div>
                  <span className="text-xs text-warm-500">{new Date(h.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
