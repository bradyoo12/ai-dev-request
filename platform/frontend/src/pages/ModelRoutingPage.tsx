import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getModelRoutingConfig, updateModelRoutingConfig, getRoutingStats, getModelTiers, getTaskTypes } from '../api/modelrouting'
import type { ModelRoutingConfig, RoutingStats, ModelTier, TaskType } from '../api/modelrouting'

const TIER_COLORS: Record<string, string> = {
  fast: 'text-green-400 bg-green-500/10 border-green-500/30',
  standard: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  premium: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
}

const TIER_DOT_COLORS: Record<string, string> = {
  fast: 'bg-green-400',
  standard: 'bg-blue-400',
  premium: 'bg-purple-400',
}

export default function ModelRoutingPage() {
  const { t } = useTranslation()
  const [config, setConfig] = useState<ModelRoutingConfig | null>(null)
  const [stats, setStats] = useState<RoutingStats | null>(null)
  const [tiers, setTiers] = useState<ModelTier[]>([])
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [taskRouting, setTaskRouting] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [configRes, statsRes, tiersRes, taskTypesRes] = await Promise.all([
        getModelRoutingConfig(),
        getRoutingStats(),
        getModelTiers(),
        getTaskTypes(),
      ])
      setConfig(configRes)
      setStats(statsRes)
      setTiers(tiersRes)
      setTaskTypes(taskTypesRes)
      if (configRes.taskRoutingJson) {
        try { setTaskRouting(JSON.parse(configRes.taskRoutingJson)) } catch { /* ignore */ }
      } else {
        const defaults: Record<string, string> = {}
        taskTypesRes.forEach(tt => { defaults[tt.id] = tt.defaultTier })
        setTaskRouting(defaults)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('modelRouting.errorLoading'))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfigChange(updates: Partial<ModelRoutingConfig>) {
    try {
      const updated = await updateModelRoutingConfig(updates)
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('modelRouting.errorSaving'))
    }
  }

  async function handleTaskTierChange(taskId: string, tier: string) {
    const newRouting = { ...taskRouting, [taskId]: tier }
    setTaskRouting(newRouting)
    await handleConfigChange({ taskRoutingJson: JSON.stringify(newRouting) })
  }

  function formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
    return String(tokens)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">{t('modelRouting.loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{t('modelRouting.title')}</h3>
          <p className="text-sm text-gray-400 mt-1">{t('modelRouting.description')}</p>
        </div>
        {config && (
          <button
            onClick={() => handleConfigChange({ enabled: !config.enabled })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              config.enabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {config.enabled ? t('modelRouting.enabled') : t('modelRouting.disabled')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.totalRoutingDecisions}</div>
            <div className="text-sm text-gray-400">{t('modelRouting.stats.decisions')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">${stats.estimatedSavings.toFixed(2)}</div>
            <div className="text-sm text-gray-400">{t('modelRouting.stats.savings')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">${stats.currentMonthCost.toFixed(2)}</div>
            <div className="text-sm text-gray-400">{t('modelRouting.stats.monthCost')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {stats.monthlyBudget > 0 ? `$${stats.monthlyBudget.toFixed(0)}` : '\u221E'}
            </div>
            <div className="text-sm text-gray-400">{t('modelRouting.stats.budget')}</div>
          </div>
        </div>
      )}

      {/* Token Distribution */}
      {stats && (stats.fastTierTokens > 0 || stats.standardTierTokens > 0 || stats.premiumTierTokens > 0) && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-white mb-3">{t('modelRouting.tokenDistribution')}</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span className="text-sm text-gray-300">Fast: {formatTokens(stats.fastTierTokens)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <span className="text-sm text-gray-300">Standard: {formatTokens(stats.standardTierTokens)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              <span className="text-sm text-gray-300">Premium: {formatTokens(stats.premiumTierTokens)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Tiers */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="font-medium text-white mb-4">{t('modelRouting.tiersTitle')}</h4>
        <div className="grid grid-cols-3 gap-4">
          {tiers.map(tier => (
            <div key={tier.id} className={`border rounded-lg p-4 ${TIER_COLORS[tier.id] || 'border-gray-600'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${TIER_DOT_COLORS[tier.id] || 'bg-gray-400'}`}></span>
                <span className="font-medium">{tier.name}</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{tier.model}</p>
              <p className="text-xs text-gray-500 mb-3">{tier.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('modelRouting.cost')}</span>
                  <span className="text-gray-300">${tier.costPer1kTokens}/1K tokens</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('modelRouting.latency')}</span>
                  <span className="text-gray-300">{tier.avgLatencyMs}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Routing Configuration */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="font-medium text-white mb-4">{t('modelRouting.taskRoutingTitle')}</h4>
        <div className="space-y-3">
          {taskTypes.map(taskType => (
            <div key={taskType.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
              <span className="text-sm text-gray-300">{taskType.name}</span>
              <div className="flex gap-1">
                {tiers.map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => handleTaskTierChange(taskType.id, tier.id)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      (taskRouting[taskType.id] || taskType.defaultTier) === tier.id
                        ? `${TIER_COLORS[tier.id]} border`
                        : 'bg-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tier.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Settings */}
      {config && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">{t('modelRouting.budgetTitle')}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-300">{t('modelRouting.defaultTier')}</label>
                <p className="text-xs text-gray-500">{t('modelRouting.defaultTierDesc')}</p>
              </div>
              <select
                value={config.defaultTier}
                onChange={(e) => handleConfigChange({ defaultTier: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
              >
                {tiers.map(tier => (
                  <option key={tier.id} value={tier.id}>{tier.name} ({tier.model})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-300">{t('modelRouting.monthlyBudget')}</label>
                <p className="text-xs text-gray-500">{t('modelRouting.monthlyBudgetDesc')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={config.monthlyBudget}
                  onChange={(e) => handleConfigChange({ monthlyBudget: parseFloat(e.target.value) || 0 })}
                  className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white text-right"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
