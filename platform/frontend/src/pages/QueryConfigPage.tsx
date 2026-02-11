import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { QueryConfig, QueryPreset, QueryPattern, QueryStats } from '../api/queryconfig'
import { getQueryConfig, updateQueryConfig, getQueryPresets, getQueryPatterns, getQueryStats } from '../api/queryconfig'

type Tab = 'configure' | 'presets' | 'patterns' | 'stats'

export default function QueryConfigPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('configure')
  const [config, setConfig] = useState<QueryConfig | null>(null)
  const [presets, setPresets] = useState<QueryPreset[]>([])
  const [patterns, setPatterns] = useState<QueryPattern[]>([])
  const [stats, setStats] = useState<QueryStats | null>(null)

  useEffect(() => {
    if (tab === 'configure') getQueryConfig().then(setConfig).catch(() => {})
    if (tab === 'presets') getQueryPresets().then(setPresets).catch(() => {})
    if (tab === 'patterns') getQueryPatterns().then(setPatterns).catch(() => {})
    if (tab === 'stats') getQueryStats().then(setStats).catch(() => {})
  }, [tab])

  const handleToggle = async (field: keyof QueryConfig, value: boolean) => {
    if (!config) return
    try {
      const result = await updateQueryConfig({ [field]: value })
      setConfig(result)
    } catch { /* ignore */ }
  }

  const handleNumberChange = async (field: keyof QueryConfig, value: number) => {
    if (!config) return
    try {
      const result = await updateQueryConfig({ [field]: value })
      setConfig(result)
    } catch { /* ignore */ }
  }

  const applyPreset = async (preset: QueryPreset) => {
    try {
      const result = await updateQueryConfig({
        staleTimeMs: preset.staleTimeMs,
        cacheTimeMs: preset.cacheTimeMs,
        retryCount: preset.retryCount,
        refetchOnWindowFocus: preset.refetchOnWindowFocus,
      })
      setConfig(result)
    } catch { /* ignore */ }
  }

  const formatMs = (ms: number): string => {
    if (ms >= 3600000) return `${(ms / 3600000).toFixed(0)}h`
    if (ms >= 60000) return `${(ms / 60000).toFixed(0)}m`
    if (ms >= 1000) return `${(ms / 1000).toFixed(0)}s`
    return `${ms}ms`
  }

  const categories = [...new Set(patterns.map(p => p.category))]

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('queryConfig.title', 'TanStack Query')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('queryConfig.subtitle', 'Configure server state management, caching, and data fetching patterns')}</p>

      <div className="flex gap-2 mb-6">
        {(['configure', 'presets', 'patterns', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`queryConfig.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'configure' && config && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">{t('queryConfig.timing', 'Timing')}</h4>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('queryConfig.staleTime', 'Stale Time')}</span>
                    <span className="text-blue-400">{formatMs(config.staleTimeMs)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={3600000}
                    step={30000}
                    value={config.staleTimeMs}
                    onChange={(e) => handleNumberChange('staleTimeMs', Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('queryConfig.staleTimeDesc', 'How long before data is considered stale')}</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('queryConfig.cacheTime', 'Cache Time')}</span>
                    <span className="text-blue-400">{formatMs(config.cacheTimeMs)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={86400000}
                    step={60000}
                    value={config.cacheTimeMs}
                    onChange={(e) => handleNumberChange('cacheTimeMs', Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('queryConfig.cacheTimeDesc', 'How long unused data stays in cache')}</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('queryConfig.retryCount', 'Retry Count')}</span>
                    <span className="text-blue-400">{config.retryCount}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={config.retryCount}
                    onChange={(e) => handleNumberChange('retryCount', Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('queryConfig.retryDelay', 'Retry Delay')}</span>
                    <span className="text-blue-400">{formatMs(config.retryDelayMs)}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={10000}
                    step={100}
                    value={config.retryDelayMs}
                    onChange={(e) => handleNumberChange('retryDelayMs', Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">{t('queryConfig.behavior', 'Behavior')}</h4>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
                {([
                  { key: 'refetchOnWindowFocus' as const, label: t('queryConfig.refetchOnFocus', 'Refetch on Window Focus'), desc: t('queryConfig.refetchOnFocusDesc', 'Re-fetch stale data when user returns to tab') },
                  { key: 'refetchOnReconnect' as const, label: t('queryConfig.refetchOnReconnect', 'Refetch on Reconnect'), desc: t('queryConfig.refetchOnReconnectDesc', 'Re-fetch when network connection is restored') },
                  { key: 'refetchOnMount' as const, label: t('queryConfig.refetchOnMount', 'Refetch on Mount'), desc: t('queryConfig.refetchOnMountDesc', 'Re-fetch stale data when component mounts') },
                  { key: 'enableDevtools' as const, label: t('queryConfig.devtools', 'Enable Devtools'), desc: t('queryConfig.devtoolsDesc', 'Show TanStack Query devtools in development') },
                  { key: 'enableGarbageCollection' as const, label: t('queryConfig.gc', 'Garbage Collection'), desc: t('queryConfig.gcDesc', 'Automatically remove unused cache entries') },
                  { key: 'enableOptimisticUpdates' as const, label: t('queryConfig.optimistic', 'Optimistic Updates'), desc: t('queryConfig.optimisticDesc', 'Apply changes instantly before server confirmation') },
                ]).map((toggle) => (
                  <div key={toggle.key} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm">{toggle.label}</div>
                      <div className="text-xs text-gray-500">{toggle.desc}</div>
                    </div>
                    <button
                      onClick={() => handleToggle(toggle.key, !config[toggle.key])}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        config[toggle.key] ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        config[toggle.key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((preset) => (
            <div key={preset.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{preset.name}</span>
                <button
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                >
                  {t('queryConfig.apply', 'Apply')}
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">{preset.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-900 rounded p-2">
                  <div className="text-gray-500">{t('queryConfig.staleTime', 'Stale Time')}</div>
                  <div className="text-blue-400 font-medium">{formatMs(preset.staleTimeMs)}</div>
                </div>
                <div className="bg-gray-900 rounded p-2">
                  <div className="text-gray-500">{t('queryConfig.cacheTime', 'Cache Time')}</div>
                  <div className="text-blue-400 font-medium">{formatMs(preset.cacheTimeMs)}</div>
                </div>
                <div className="bg-gray-900 rounded p-2">
                  <div className="text-gray-500">{t('queryConfig.retries', 'Retries')}</div>
                  <div className="text-blue-400 font-medium">{preset.retryCount}</div>
                </div>
                <div className="bg-gray-900 rounded p-2">
                  <div className="text-gray-500">{t('queryConfig.windowFocus', 'Window Focus')}</div>
                  <div className={preset.refetchOnWindowFocus ? 'text-green-400 font-medium' : 'text-gray-500 font-medium'}>
                    {preset.refetchOnWindowFocus ? 'On' : 'Off'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'patterns' && (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h4 className="font-medium text-sm text-gray-400 mb-3">{cat}</h4>
              <div className="space-y-3">
                {patterns.filter(p => p.category === cat).map((pattern) => (
                  <div key={pattern.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{pattern.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{pattern.description}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-900">
                      <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{pattern.code}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalQueries}</div>
              <div className="text-sm text-gray-400">{t('queryConfig.stats.queries', 'Total Queries')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalMutations}</div>
              <div className="text-sm text-gray-400">{t('queryConfig.stats.mutations', 'Mutations')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.cacheHitRate}%</div>
              <div className="text-sm text-gray-400">{t('queryConfig.stats.hitRate', 'Cache Hit Rate')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.cacheHits}</div>
              <div className="text-sm text-gray-400">{t('queryConfig.stats.hits', 'Cache Hits')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.cacheMisses}</div>
              <div className="text-sm text-gray-400">{t('queryConfig.stats.misses', 'Cache Misses')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.activePreset}</div>
              <div className="text-sm text-gray-400">{t('queryConfig.stats.preset', 'Active Preset')}</div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h4 className="font-medium mb-3">{t('queryConfig.stats.currentConfig', 'Current Configuration')}</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">{t('queryConfig.staleTime', 'Stale Time')}</div>
                <div className="text-blue-400 font-medium">{formatMs(stats.staleTimeMs)}</div>
              </div>
              <div>
                <div className="text-gray-500">{t('queryConfig.cacheTime', 'Cache Time')}</div>
                <div className="text-blue-400 font-medium">{formatMs(stats.cacheTimeMs)}</div>
              </div>
              <div>
                <div className="text-gray-500">{t('queryConfig.retries', 'Retries')}</div>
                <div className="text-blue-400 font-medium">{stats.retryCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
