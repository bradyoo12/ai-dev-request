import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAiModelConfig, updateAiModelConfig, getAvailableModels,
  testModel, getAiModelUsage, getThinkingModes
} from '../api/aimodelconfig'
import type {
  AiModelConfig, AvailableModel, TestModelResponse,
  AiModelUsage, ThinkingMode
} from '../api/aimodelconfig'

type SubTab = 'configure' | 'models' | 'usage'

const MODEL_COLORS: Record<string, string> = {
  'claude-opus-4-6': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  'claude-sonnet-4-5-20250929': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'claude-haiku-4-5-20251001': 'text-green-400 bg-green-500/10 border-green-500/30',
}

const MODEL_DOT_COLORS: Record<string, string> = {
  'claude-opus-4-6': 'bg-purple-400',
  'claude-sonnet-4-5-20250929': 'bg-blue-400',
  'claude-haiku-4-5-20251001': 'bg-green-400',
}

export default function AiModelConfigPage() {
  const { t } = useTranslation()
  const [subTab, setSubTab] = useState<SubTab>('configure')
  const [config, setConfig] = useState<AiModelConfig | null>(null)
  const [models, setModels] = useState<AvailableModel[]>([])
  const [thinkingModes, setThinkingModes] = useState<ThinkingMode[]>([])
  const [usage, setUsage] = useState<AiModelUsage | null>(null)
  const [testResult, setTestResult] = useState<TestModelResponse | null>(null)
  const [testPrompt, setTestPrompt] = useState('')
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [configRes, modelsRes, thinkingModesRes, usageRes] = await Promise.all([
        getAiModelConfig(),
        getAvailableModels(),
        getThinkingModes(),
        getAiModelUsage(),
      ])
      setConfig(configRes)
      setModels(modelsRes)
      setThinkingModes(thinkingModesRes)
      setUsage(usageRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiModelConfig.errorLoading', 'Failed to load AI model configuration'))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfigChange(updates: Partial<AiModelConfig>) {
    try {
      const updated = await updateAiModelConfig(updates)
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiModelConfig.errorSaving', 'Failed to save configuration'))
    }
  }

  async function handleTest() {
    try {
      setTesting(true)
      setTestResult(null)
      const result = await testModel({
        modelId: config?.selectedModel,
        thinkingMode: config?.thinkingMode,
        prompt: testPrompt || 'Explain the benefits of extended thinking in AI models.',
      })
      setTestResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiModelConfig.errorTesting', 'Test failed'))
    } finally {
      setTesting(false)
    }
  }

  function formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
    return String(tokens)
  }

  function formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">{t('aiModelConfig.loading', 'Loading AI model configuration...')}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('aiModelConfig.title', 'AI Model Configuration')}</h3>
        <p className="text-sm text-gray-400 mt-1">{t('aiModelConfig.description', 'Configure Claude Opus 4.6 with extended thinking capabilities')}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Sub-tab navigation */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setSubTab('configure')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'configure' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('aiModelConfig.tabs.configure', 'Configure')}
        </button>
        <button
          onClick={() => setSubTab('models')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'models' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('aiModelConfig.tabs.models', 'Models')}
        </button>
        <button
          onClick={() => setSubTab('usage')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'usage' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('aiModelConfig.tabs.usage', 'Usage')}
        </button>
      </div>

      {/* Configure Tab */}
      {subTab === 'configure' && config && (
        <div className="space-y-6">
          {/* Model Selector Cards */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('aiModelConfig.selectModel', 'Select Model')}</h4>
            <div className="grid grid-cols-3 gap-4">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => handleConfigChange({ selectedModel: model.id })}
                  className={`border rounded-lg p-4 text-left transition-all ${
                    config.selectedModel === model.id
                      ? `${MODEL_COLORS[model.id] || 'border-blue-500'} ring-2 ring-offset-2 ring-offset-gray-900 ${model.id === 'claude-opus-4-6' ? 'ring-purple-500' : model.id === 'claude-sonnet-4-5-20250929' ? 'ring-blue-500' : 'ring-green-500'}`
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${MODEL_DOT_COLORS[model.id] || 'bg-gray-400'}`}></span>
                    <span className="font-medium text-white">{model.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{model.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{model.tier === 'premium' ? 'Most Capable' : model.tier === 'standard' ? 'Balanced' : 'Fastest'}</span>
                    <span>|</span>
                    <span>{model.avgLatencyMs}ms</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Thinking Mode */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('aiModelConfig.thinkingConfig', 'Thinking Configuration')}</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">{t('aiModelConfig.thinkingMode', 'Thinking Mode')}</label>
                  <p className="text-xs text-gray-500">{t('aiModelConfig.thinkingModeDesc', 'Control the depth of reasoning before generating responses')}</p>
                </div>
                <select
                  value={config.thinkingMode}
                  onChange={(e) => handleConfigChange({ thinkingMode: e.target.value })}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
                >
                  {thinkingModes.map(mode => (
                    <option key={mode.id} value={mode.id}>{mode.name} - {mode.description}</option>
                  ))}
                </select>
              </div>

              {/* Thinking Budget Slider */}
              {config.thinkingMode !== 'none' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-300">{t('aiModelConfig.thinkingBudget', 'Thinking Budget')}</label>
                    <span className="text-sm text-gray-400">{formatTokens(config.thinkingBudgetTokens)} tokens</span>
                  </div>
                  <input
                    type="range"
                    min={thinkingModes.find(m => m.id === config.thinkingMode)?.minBudgetTokens || 512}
                    max={thinkingModes.find(m => m.id === config.thinkingMode)?.maxBudgetTokens || 128000}
                    step={512}
                    value={config.thinkingBudgetTokens}
                    onChange={(e) => handleConfigChange({ thinkingBudgetTokens: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTokens(thinkingModes.find(m => m.id === config.thinkingMode)?.minBudgetTokens || 512)}</span>
                    <span>{formatTokens(thinkingModes.find(m => m.id === config.thinkingMode)?.maxBudgetTokens || 128000)}</span>
                  </div>
                </div>
              )}

              {/* Streaming Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">{t('aiModelConfig.streaming', 'Streaming')}</label>
                  <p className="text-xs text-gray-500">{t('aiModelConfig.streamingDesc', 'Stream responses as they are generated')}</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ streamingEnabled: !config.streamingEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.streamingEnabled ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.streamingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Show Thinking Process Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">{t('aiModelConfig.showThinking', 'Show Thinking Process')}</label>
                  <p className="text-xs text-gray-500">{t('aiModelConfig.showThinkingDesc', 'Display the AI reasoning steps to the user')}</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ showThinkingProcess: !config.showThinkingProcess })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.showThinkingProcess ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.showThinkingProcess ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-sm text-gray-300">{t('aiModelConfig.temperature', 'Temperature')}</label>
                    <p className="text-xs text-gray-500">{t('aiModelConfig.temperatureDesc', 'Controls randomness in responses (0 = deterministic, 1 = creative)')}</p>
                  </div>
                  <span className="text-sm text-gray-400">{config.defaultTemperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.defaultTemperature}
                  onChange={(e) => handleConfigChange({ defaultTemperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Deterministic</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Output Tokens */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-300">{t('aiModelConfig.maxTokens', 'Max Output Tokens')}</label>
                  <p className="text-xs text-gray-500">{t('aiModelConfig.maxTokensDesc', 'Maximum number of tokens in the response')}</p>
                </div>
                <input
                  type="number"
                  min={256}
                  max={128000}
                  step={256}
                  value={config.maxOutputTokens}
                  onChange={(e) => handleConfigChange({ maxOutputTokens: parseInt(e.target.value) || 4096 })}
                  className="w-28 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white text-right"
                />
              </div>
            </div>
          </div>

          {/* Test Model */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('aiModelConfig.testModel', 'Test Model')}</h4>
            <div className="space-y-3">
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder={t('aiModelConfig.testPromptPlaceholder', 'Enter a prompt to test the model... (leave empty for default)')}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none"
                rows={3}
              />
              <button
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {testing ? t('aiModelConfig.testing', 'Testing...') : t('aiModelConfig.runTest', 'Run Test')}
              </button>

              {testResult && (
                <div className="mt-4 space-y-3">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${MODEL_DOT_COLORS[testResult.modelId] || 'bg-gray-400'}`}></span>
                      <span className="text-sm font-medium text-gray-300">{testResult.modelId}</span>
                      <span className="text-xs text-gray-500">| {testResult.thinkingMode} thinking</span>
                    </div>

                    {testResult.thinkingSteps.length > 0 && (
                      <div className="mb-3 border-l-2 border-purple-500/30 pl-3">
                        <p className="text-xs text-purple-400 mb-1 font-medium">Thinking Steps:</p>
                        {testResult.thinkingSteps.map((step, i) => (
                          <p key={i} className="text-xs text-gray-400 mb-1">
                            <span className="text-purple-400/60">{i + 1}.</span> {step}
                          </p>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-300">{testResult.response}</p>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="bg-gray-900 rounded p-2 text-center">
                      <div className="text-sm font-bold text-blue-400">{testResult.inputTokens}</div>
                      <div className="text-xs text-gray-500">Input</div>
                    </div>
                    <div className="bg-gray-900 rounded p-2 text-center">
                      <div className="text-sm font-bold text-green-400">{testResult.outputTokens}</div>
                      <div className="text-xs text-gray-500">Output</div>
                    </div>
                    <div className="bg-gray-900 rounded p-2 text-center">
                      <div className="text-sm font-bold text-purple-400">{testResult.thinkingTokens}</div>
                      <div className="text-xs text-gray-500">Thinking</div>
                    </div>
                    <div className="bg-gray-900 rounded p-2 text-center">
                      <div className="text-sm font-bold text-yellow-400">{testResult.latencyMs}ms</div>
                      <div className="text-xs text-gray-500">Latency</div>
                    </div>
                    <div className="bg-gray-900 rounded p-2 text-center">
                      <div className="text-sm font-bold text-red-400">{formatCost(testResult.estimatedCost)}</div>
                      <div className="text-xs text-gray-500">Cost</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Models Tab */}
      {subTab === 'models' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">{t('aiModelConfig.modelComparison', 'Model Comparison')}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Model</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Provider</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Input Cost / 1K</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Output Cost / 1K</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Thinking Cost / 1K</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Latency</th>
                  <th className="text-right py-3 px-2 text-gray-400 font-medium">Context</th>
                  <th className="text-left py-3 px-2 text-gray-400 font-medium">Best For</th>
                </tr>
              </thead>
              <tbody>
                {models.map(model => (
                  <tr key={model.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${MODEL_DOT_COLORS[model.id] || 'bg-gray-400'}`}></span>
                        <div>
                          <div className="text-white font-medium">{model.name}</div>
                          <div className="text-xs text-gray-500">{model.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-300">{model.provider}</td>
                    <td className="py-3 px-2 text-right text-gray-300">${model.costPerInputToken.toFixed(4)}</td>
                    <td className="py-3 px-2 text-right text-gray-300">${model.costPerOutputToken.toFixed(4)}</td>
                    <td className="py-3 px-2 text-right text-gray-300">${model.costPerThinkingToken.toFixed(4)}</td>
                    <td className="py-3 px-2 text-right text-gray-300">{model.avgLatencyMs}ms</td>
                    <td className="py-3 px-2 text-right text-gray-300">{formatTokens(model.contextWindow)}</td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1">
                        {model.bestFor.slice(0, 3).map(tag => (
                          <span key={tag} className={`px-2 py-0.5 rounded text-xs ${MODEL_COLORS[model.id] || 'bg-gray-600 text-gray-300'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Model Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {models.map(model => (
              <div key={model.id} className={`border rounded-lg p-4 ${MODEL_COLORS[model.id] || 'border-gray-600'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${MODEL_DOT_COLORS[model.id] || 'bg-gray-400'}`}></span>
                  <span className="font-medium text-white">{model.name}</span>
                  {model.supportsThinking && (
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Thinking</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-3">{model.description}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Max Output</span>
                    <span className="text-gray-300">{formatTokens(model.maxOutputTokens)} tokens</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Context Window</span>
                    <span className="text-gray-300">{formatTokens(model.contextWindow)} tokens</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Avg Latency</span>
                    <span className="text-gray-300">{model.avgLatencyMs}ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tier</span>
                    <span className="text-gray-300 capitalize">{model.tier}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {subTab === 'usage' && usage && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{usage.totalRequests}</div>
              <div className="text-sm text-gray-400">{t('aiModelConfig.usage.totalRequests', 'Total Requests')}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{formatTokens(usage.totalTokensUsed)}</div>
              <div className="text-sm text-gray-400">{t('aiModelConfig.usage.totalTokens', 'Total Tokens')}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{formatTokens(usage.totalThinkingTokensUsed)}</div>
              <div className="text-sm text-gray-400">{t('aiModelConfig.usage.thinkingTokens', 'Thinking Tokens')}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">${usage.totalCost.toFixed(2)}</div>
              <div className="text-sm text-gray-400">{t('aiModelConfig.usage.totalCost', 'Total Cost')}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{usage.avgResponseTimeMs.toFixed(0)}ms</div>
              <div className="text-sm text-gray-400">{t('aiModelConfig.usage.avgResponseTime', 'Avg Response Time')}</div>
            </div>
          </div>

          {/* Per-Model Breakdown */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('aiModelConfig.usage.perModelBreakdown', 'Per-Model Breakdown')}</h4>
            {(() => {
              let modelHistory: Record<string, { requests: number; tokens: number; thinkingTokens: number; cost: number }> = {}
              try {
                modelHistory = JSON.parse(usage.modelUsageHistoryJson)
              } catch { /* ignore */ }

              const modelEntries = Object.entries(modelHistory)
              if (modelEntries.length === 0) {
                return (
                  <p className="text-sm text-gray-500">{t('aiModelConfig.usage.noData', 'No usage data yet. Start using AI models to see per-model statistics.')}</p>
                )
              }

              return (
                <div className="space-y-3">
                  {modelEntries.map(([modelId, data]) => (
                    <div key={modelId} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${MODEL_DOT_COLORS[modelId] || 'bg-gray-400'}`}></span>
                        <span className="text-sm text-gray-300">{modelId}</span>
                      </div>
                      <div className="flex gap-6 text-xs text-gray-400">
                        <span>{data.requests} requests</span>
                        <span>{formatTokens(data.tokens)} tokens</span>
                        <span>{formatTokens(data.thinkingTokens)} thinking</span>
                        <span>${data.cost.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
