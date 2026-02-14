import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getTestConfigs,
  generateTests,
  healFailedTest,
  runTest,
  getHealingHistory,
  type PlaywrightMcpTestConfig,
  type TestHealingRecord,
} from '../api/playwright-mcp'

type Tab = 'generate' | 'configs' | 'healing'

export default function PlaywrightMcpPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('generate')
  const [scenario, setScenario] = useState('')
  const [configs, setConfigs] = useState<PlaywrightMcpTestConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<PlaywrightMcpTestConfig | null>(null)
  const [healingRecords, setHealingRecords] = useState<TestHealingRecord[]>([])
  const [generatedResult, setGeneratedResult] = useState<PlaywrightMcpTestConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [healing, setHealing] = useState(false)
  const [error, setError] = useState('')
  const [healInput, setHealInput] = useState('')
  const [healConfigId, setHealConfigId] = useState('')
  const [runningId, setRunningId] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'configs') loadConfigs()
  }, [activeTab])

  async function loadConfigs() {
    setLoading(true)
    setError('')
    try {
      const data = await getTestConfigs()
      setConfigs(data)
    } catch {
      setError(t('playwrightMcp.error.loadFailed', 'Failed to load test configs'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!scenario.trim()) return
    setGenerating(true)
    setError('')
    try {
      const result = await generateTests(scenario)
      setGeneratedResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('playwrightMcp.error.generateFailed', 'Test generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  async function handleHeal() {
    if (!healConfigId || !healInput.trim()) return
    setHealing(true)
    setError('')
    try {
      await healFailedTest(healConfigId, healInput)
      // Reload healing history
      const records = await getHealingHistory(healConfigId)
      setHealingRecords(records)
      setHealInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('playwrightMcp.error.healFailed', 'Test healing failed'))
    } finally {
      setHealing(false)
    }
  }

  async function loadHealingHistory(configId: string) {
    setLoading(true)
    setError('')
    try {
      const records = await getHealingHistory(configId)
      setHealingRecords(records)
      setHealConfigId(configId)
      setActiveTab('healing')
    } catch {
      setError(t('playwrightMcp.error.historyFailed', 'Failed to load healing history'))
    } finally {
      setLoading(false)
    }
  }

  async function handleRunTest(configId: string) {
    setRunningId(configId)
    setError('')
    try {
      await runTest(configId)
      await loadConfigs()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('playwrightMcp.error.runFailed', 'Test execution failed'))
    } finally {
      setRunningId(null)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'generate', label: t('playwrightMcp.tabs.generate', 'Generate Tests') },
    { key: 'configs', label: t('playwrightMcp.tabs.configs', 'Test Configs') },
    { key: 'healing', label: t('playwrightMcp.tabs.healing', 'Healing History') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold">{t('playwrightMcp.title', 'Playwright MCP Integration')}</h3>
        <p className="text-warm-400 text-sm mt-1">
          {t('playwrightMcp.subtitle', 'AI-powered Playwright test generation with self-healing capabilities')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-warm-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-warm-800 text-warm-400 hover:text-white hover:bg-warm-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Generate Tests Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              {t('playwrightMcp.scenarioLabel', 'Test Scenario')}
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder={t('playwrightMcp.scenarioPlaceholder', 'Describe the test scenario you want to generate...\n\nExample: Test the login flow - user enters email and password, clicks sign in, and is redirected to the dashboard.')}
              className="w-full h-40 bg-warm-700 border border-warm-600 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !scenario.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {generating
                  ? t('playwrightMcp.generating', 'Generating...')
                  : t('playwrightMcp.generate', 'Generate Tests')}
              </button>
            </div>
          </div>

          {/* Generated Result */}
          {generatedResult && (
            <div className="bg-warm-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">{t('playwrightMcp.generatedResult', 'Generated Test')}</h4>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      generatedResult.status === 'completed'
                        ? 'bg-green-900/50 text-green-300'
                        : generatedResult.status === 'generating'
                          ? 'bg-blue-900/50 text-blue-300'
                          : generatedResult.status === 'failed'
                            ? 'bg-red-900/50 text-red-300'
                            : 'bg-warm-700 text-warm-300'
                    }`}
                  >
                    {generatedResult.status}
                  </span>
                  <span className="text-xs text-warm-500">
                    {t('playwrightMcp.successRate', 'Success Rate')}: {generatedResult.successRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              {generatedResult.generatedTestCode && (
                <pre className="bg-warm-900 rounded-lg p-4 text-xs text-warm-300 overflow-x-auto max-h-96">
                  {generatedResult.generatedTestCode}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Test Configs Tab */}
      {activeTab === 'configs' && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && configs.length === 0 && (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <p className="text-warm-400">
                {t('playwrightMcp.noConfigs', 'No test configurations yet. Generate tests to get started.')}
              </p>
            </div>
          )}

          {!loading &&
            configs.map((config) => (
              <div key={config.id} className="bg-warm-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        config.status === 'completed'
                          ? 'bg-green-900/50 text-green-300'
                          : config.status === 'generating'
                            ? 'bg-blue-900/50 text-blue-300'
                            : config.status === 'failed'
                              ? 'bg-red-900/50 text-red-300'
                              : 'bg-warm-700 text-warm-300'
                      }`}
                    >
                      {config.status}
                    </span>
                    <span className="text-xs text-warm-400">
                      {t('playwrightMcp.successRate', 'Success Rate')}: {config.successRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunTest(config.id)}
                      disabled={runningId === config.id}
                      className="px-3 py-1 bg-green-700 hover:bg-green-600 disabled:bg-warm-600 rounded text-xs transition-colors"
                    >
                      {runningId === config.id
                        ? t('playwrightMcp.running', 'Running...')
                        : t('playwrightMcp.run', 'Run')}
                    </button>
                    <button
                      onClick={() => loadHealingHistory(config.id)}
                      className="px-3 py-1 bg-warm-700 hover:bg-warm-600 rounded text-xs transition-colors"
                    >
                      {t('playwrightMcp.viewHealing', 'Healing History')}
                    </button>
                    <button
                      onClick={() =>
                        setSelectedConfig(selectedConfig?.id === config.id ? null : config)
                      }
                      className="px-3 py-1 bg-warm-700 hover:bg-warm-600 rounded text-xs transition-colors"
                    >
                      {selectedConfig?.id === config.id
                        ? t('playwrightMcp.hideCode', 'Hide Code')
                        : t('playwrightMcp.showCode', 'Show Code')}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-warm-300 line-clamp-2">{config.testScenario}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-warm-500">
                  <span>{new Date(config.createdAt).toLocaleString()}</span>
                  {config.projectId && <span>Project: {config.projectId}</span>}
                </div>
                {selectedConfig?.id === config.id && config.generatedTestCode && (
                  <pre className="mt-3 bg-warm-900 rounded-lg p-4 text-xs text-warm-300 overflow-x-auto max-h-80">
                    {config.generatedTestCode}
                  </pre>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Healing History Tab */}
      {activeTab === 'healing' && (
        <div className="space-y-4">
          {/* Heal Input */}
          <div className="bg-warm-800 rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              {t('playwrightMcp.healLabel', 'Heal a Failed Test')}
            </label>
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={healConfigId}
                onChange={(e) => setHealConfigId(e.target.value)}
                placeholder={t('playwrightMcp.configIdPlaceholder', 'Test Config ID')}
                className="flex-1 bg-warm-700 border border-warm-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              value={healInput}
              onChange={(e) => setHealInput(e.target.value)}
              placeholder={t('playwrightMcp.failurePlaceholder', 'Describe the test failure reason...')}
              className="w-full h-24 bg-warm-700 border border-warm-600 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleHeal}
                disabled={healing || !healConfigId || !healInput.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-warm-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {healing
                  ? t('playwrightMcp.healing', 'Healing...')
                  : t('playwrightMcp.heal', 'Heal Test')}
              </button>
            </div>
          </div>

          {/* Healing Records Table */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && healingRecords.length === 0 && (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <p className="text-warm-400">
                {t('playwrightMcp.noHealingRecords', 'No healing records. Select a test config to view its healing history.')}
              </p>
            </div>
          )}

          {!loading && healingRecords.length > 0 && (
            <div className="bg-warm-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-warm-700">
                      <th className="text-left px-4 py-3 text-warm-400 font-medium">
                        {t('playwrightMcp.table.strategy', 'Strategy')}
                      </th>
                      <th className="text-left px-4 py-3 text-warm-400 font-medium">
                        {t('playwrightMcp.table.originalLocator', 'Original Locator')}
                      </th>
                      <th className="text-left px-4 py-3 text-warm-400 font-medium">
                        {t('playwrightMcp.table.updatedLocator', 'Updated Locator')}
                      </th>
                      <th className="text-left px-4 py-3 text-warm-400 font-medium">
                        {t('playwrightMcp.table.result', 'Result')}
                      </th>
                      <th className="text-left px-4 py-3 text-warm-400 font-medium">
                        {t('playwrightMcp.table.date', 'Date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {healingRecords.map((record) => (
                      <tr key={record.id} className="border-b border-warm-700/50 hover:bg-warm-700/30">
                        <td className="px-4 py-3">
                          <span className="text-xs bg-warm-700 px-2 py-1 rounded">
                            {record.healingStrategy}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-warm-400">{record.originalLocator}</td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-400">{record.updatedLocator}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              record.success
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-red-900/50 text-red-300'
                            }`}
                          >
                            {record.success
                              ? t('playwrightMcp.table.success', 'Success')
                              : t('playwrightMcp.table.failed', 'Failed')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-warm-500">
                          {new Date(record.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
