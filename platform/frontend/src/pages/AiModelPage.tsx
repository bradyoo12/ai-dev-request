import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAiModelConfig, updateAiModelConfig, getAvailableModels, getAiModelStats } from '../api/aiModel'
import type { AiModelConfig, AvailableModel, AiModelStats } from '../api/aiModel'

type SubTab = 'models' | 'configure' | 'stats'

export default function AiModelPage() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<AiModelConfig | null>(null)
  const [models, setModels] = useState<AvailableModel[]>([])
  const [stats, setStats] = useState<AiModelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subTab, setSubTab] = useState<SubTab>('models')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [configRes, modelsRes, statsRes] = await Promise.all([
        getAiModelConfig(),
        getAvailableModels(),
        getAiModelStats(),
      ])
      setConfig(configRes)
      setModels(modelsRes)
      setStats(statsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiModel.errorLoading', 'Failed to load AI model settings'))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfigChange(updates: Partial<AiModelConfig>) {
    try {
      const updated = await updateAiModelConfig(updates)
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiModel.errorSaving', 'Failed to save settings'))
    }
  }

  function formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
    return String(tokens)
  }

  if (loading) {
    return <div className="text-center py-12 text-warm-400">{t('aiModel.loading', 'Loading AI model settings...')}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('aiModel.title', 'AI Engine')}</h3>
        <p className="text-sm text-warm-400 mt-1">{t('aiModel.description', 'Configure Claude model selection, extended thinking, and monitor usage')}</p>
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
          onClick={() => setSubTab('models')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'models' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('aiModel.tabs.models', 'Models')}
        </button>
        <button
          onClick={() => setSubTab('configure')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'configure' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('aiModel.tabs.configure', 'Configure')}
        </button>
        <button
          onClick={() => setSubTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            subTab === 'stats' ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
          }`}
        >
          {t('aiModel.tabs.stats', 'Stats')}
        </button>
      </div>

      {/* Models Tab */}
      {subTab === 'models' && (
        <div className="space-y-4">
          <p className="text-sm text-warm-400">{t('aiModel.modelsDescription', 'Choose between speed and capability for your AI engine')}</p>
          <div className="grid grid-cols-2 gap-4">
            {models.map(model => {
              const isSelected = config?.selectedModel === model.id
              const isOpus = model.tier === 'powerful'
              return (
                <div
                  key={model.id}
                  onClick={() => handleConfigChange({ selectedModel: model.id })}
                  className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                    isSelected
                      ? isOpus
                        ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-blue-500/60 bg-blue-500/5 ring-1 ring-blue-500/30'
                      : 'border-warm-700 bg-warm-800 hover:border-warm-600'
                  }`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isOpus
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {model.badge}
                    </span>
                    {isSelected && (
                      <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Model Name */}
                  <h4 className="text-lg font-semibold text-white mb-1">{model.name}</h4>
                  <p className="text-sm text-warm-400 mb-4">{model.description}</p>

                  {/* Pricing */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-500">Input</span>
                      <span className="text-warm-300">${model.inputCostPer1k}/1K tokens</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-500">Output</span>
                      <span className="text-warm-300">${model.outputCostPer1k}/1K tokens</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-500">Latency</span>
                      <span className="text-warm-300">~{(model.avgLatencyMs / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-500">Max Output</span>
                      <span className="text-warm-300">{formatTokens(model.maxOutputTokens)} tokens</span>
                    </div>
                    {model.supportsExtendedThinking && (
                      <div className="flex justify-between text-sm">
                        <span className="text-warm-500">Extended Thinking</span>
                        <span className="text-amber-400">Supported</span>
                      </div>
                    )}
                  </div>

                  {/* Capabilities */}
                  <div>
                    <p className="text-xs text-warm-500 mb-2 uppercase tracking-wide">Capabilities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {model.capabilities.map(cap => (
                        <span
                          key={cap}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isOpus
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Configure Tab */}
      {subTab === 'configure' && config && (
        <div className="space-y-6">
          {/* Model Selection */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('aiModel.configure.modelSelection', 'Model Selection')}</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-warm-300">Active Model</label>
                  <p className="text-xs text-warm-500">Choose which Claude model to use for requests</p>
                </div>
                <select
                  value={config.selectedModel}
                  onChange={(e) => handleConfigChange({ selectedModel: e.target.value })}
                  className="bg-warm-700 border border-warm-600 rounded px-3 py-1.5 text-sm text-white"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-warm-300">Auto Model Selection</label>
                  <p className="text-xs text-warm-500">Automatically choose model based on task complexity</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ autoModelSelection: !config.autoModelSelection })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.autoModelSelection ? 'bg-amber-500' : 'bg-warm-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    config.autoModelSelection ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Extended Thinking */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">{t('aiModel.configure.extendedThinking', 'Extended Thinking')}</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-warm-300">Enable Extended Thinking</label>
                  <p className="text-xs text-warm-500">Allow the model to think deeply before responding (Opus 4.6 only)</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ extendedThinkingEnabled: !config.extendedThinkingEnabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.extendedThinkingEnabled ? 'bg-amber-500' : 'bg-warm-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    config.extendedThinkingEnabled ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              {/* Thinking Budget Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-warm-300">Thinking Budget</label>
                  <span className="text-sm text-amber-400 font-mono">{formatTokens(config.thinkingBudgetTokens)} tokens</span>
                </div>
                <p className="text-xs text-warm-500 mb-3">Maximum tokens the model can use for thinking (1K - 50K)</p>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={1000}
                  value={config.thinkingBudgetTokens}
                  onChange={(e) => handleConfigChange({ thinkingBudgetTokens: parseInt(e.target.value) })}
                  className="w-full h-2 bg-warm-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  disabled={!config.extendedThinkingEnabled}
                />
                <div className="flex justify-between text-xs text-warm-600 mt-1">
                  <span>1K</span>
                  <span>10K</span>
                  <span>25K</span>
                  <span>50K</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-warm-300">Stream Thinking Indicator</label>
                  <p className="text-xs text-warm-500">Show a thinking animation while the model reasons</p>
                </div>
                <button
                  onClick={() => handleConfigChange({ streamThinkingEnabled: !config.streamThinkingEnabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    config.streamThinkingEnabled ? 'bg-amber-500' : 'bg-warm-600'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    config.streamThinkingEnabled ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Cost Preview */}
          <div className="bg-warm-800 rounded-lg p-6">
            <h4 className="font-medium text-white mb-4">Cost Preview</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-warm-900 rounded-lg p-4">
                <div className="text-sm text-warm-400 mb-1">Opus 4.6 (1K in / 1K out)</div>
                <div className="text-lg font-bold text-amber-400">$0.090</div>
                <div className="text-xs text-warm-500">+ thinking tokens if enabled</div>
              </div>
              <div className="bg-warm-900 rounded-lg p-4">
                <div className="text-sm text-warm-400 mb-1">Sonnet 4.5 (1K in / 1K out)</div>
                <div className="text-lg font-bold text-blue-400">$0.018</div>
                <div className="text-xs text-warm-500">5x more cost-efficient</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {subTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{stats.totalRequests}</div>
              <div className="text-sm text-warm-400">Total Requests</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-400">{stats.totalRequestsOpus}</div>
              <div className="text-sm text-warm-400">Opus 4.6 Requests</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.totalRequestsSonnet}</div>
              <div className="text-sm text-warm-400">Sonnet 4.5 Requests</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{formatTokens(stats.totalThinkingTokens)}</div>
              <div className="text-sm text-warm-400">Thinking Tokens</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{formatTokens(stats.totalOutputTokens)}</div>
              <div className="text-sm text-warm-400">Output Tokens</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">${stats.estimatedCost.toFixed(4)}</div>
              <div className="text-sm text-warm-400">Estimated Cost</div>
            </div>
          </div>

          {/* Model Distribution */}
          {stats.totalRequests > 0 && (
            <div className="bg-warm-800 rounded-lg p-6">
              <h4 className="font-medium text-white mb-4">Model Distribution</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-amber-400">Opus 4.6</span>
                    <span className="text-warm-400">{stats.totalRequests > 0 ? Math.round((stats.totalRequestsOpus / stats.totalRequests) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-warm-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${stats.totalRequests > 0 ? (stats.totalRequestsOpus / stats.totalRequests) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-400">Sonnet 4.5</span>
                    <span className="text-warm-400">{stats.totalRequests > 0 ? Math.round((stats.totalRequestsSonnet / stats.totalRequests) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-warm-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${stats.totalRequests > 0 ? (stats.totalRequestsSonnet / stats.totalRequests) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
