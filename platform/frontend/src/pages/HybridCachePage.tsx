import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listCacheEntries,
  invalidateEntry,
  invalidateAll,
  getCacheStats,
  getCacheCategories,
  type HybridCacheEntry,
  type CacheCategory,
  type CacheStats,
} from '../api/hybridcache'

type CacheTab = 'overview' | 'entries' | 'stats'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-600 text-white',
  expired: 'bg-yellow-700 text-yellow-200',
  evicted: 'bg-slate-700 text-slate-300',
}

const LAYER_LABELS: Record<string, string> = {
  L1: 'In-Memory',
  L2: 'Distributed',
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function HybridCachePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<CacheTab>('overview')
  const [entries, setEntries] = useState<HybridCacheEntry[]>([])
  const [categories, setCategories] = useState<CacheCategory[]>([])
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (tab === 'entries') loadEntries()
    if (tab === 'stats' || tab === 'overview') loadStats()
  }, [tab, filterCategory])

  async function loadCategories() {
    try {
      const data = await getCacheCategories()
      setCategories(data)
    } catch { /* ignore */ }
  }

  async function loadEntries() {
    setLoading(true)
    try {
      const data = await listCacheEntries(filterCategory || undefined)
      setEntries(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getCacheStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleInvalidate(id: string) {
    try {
      const updated = await invalidateEntry(id)
      setEntries(prev => prev.map(e => e.id === id ? updated : e))
    } catch { /* ignore */ }
  }

  async function handleInvalidateAll() {
    try {
      const result = await invalidateAll(filterCategory || undefined)
      if (result.evicted > 0) loadEntries()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('hybridCache.title', 'HybridCache')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('hybridCache.subtitle', 'L1/L2 caching with stampede protection for multi-tenant performance optimization')}</p>
      </div>

      <div className="flex gap-2">
        {(['overview', 'entries', 'stats'] as CacheTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`hybridCache.tabs.${tabId}`, tabId === 'overview' ? 'Overview' : tabId === 'entries' ? 'Entries' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t('hybridCache.stats.hitRate', 'Hit Rate'), value: `${stats.hitRate}%`, color: stats.hitRate >= 80 ? 'text-green-400' : stats.hitRate >= 50 ? 'text-yellow-400' : 'text-red-400' },
                { label: t('hybridCache.stats.activeEntries', 'Active Entries'), value: stats.activeEntries, color: 'text-white' },
                { label: t('hybridCache.stats.costSaved', 'Cost Saved'), value: `$${stats.totalCostSaved}`, color: 'text-green-400' },
                { label: t('hybridCache.stats.stampedeBlocked', 'Stampede Blocked'), value: stats.stampedeBlocked, color: 'text-blue-400' },
              ].map(s => (
                <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(cat => {
              const catStats = stats?.byCategory.find(c => c.category === cat.id)
              return (
                <div key={cat.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <h4 className="text-white font-medium text-sm">{cat.name}</h4>
                  </div>
                  <p className="text-warm-400 text-xs mb-3">{cat.description}</p>
                  {catStats ? (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-sm text-white font-medium">{catStats.count}</p>
                        <p className="text-xs text-warm-500">{t('hybridCache.entries', 'entries')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{catStats.hits}</p>
                        <p className="text-xs text-warm-500">{t('hybridCache.hits', 'hits')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-green-400 font-medium">${catStats.costSaved}</p>
                        <p className="text-xs text-warm-500">{t('hybridCache.saved', 'saved')}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-warm-500">{t('hybridCache.noData', 'No cache data')}</p>
                  )}
                </div>
              )
            })}
          </div>

          {stats && stats.byLayer.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">{t('hybridCache.layerBreakdown', 'Cache Layers')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.byLayer.map(layer => (
                  <div key={layer.layer} className="bg-warm-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium">{LAYER_LABELS[layer.layer] || layer.layer}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${layer.layer === 'L1' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                        {layer.layer}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-white font-medium">{layer.count}</p>
                        <p className="text-warm-500">{t('hybridCache.entries', 'entries')}</p>
                      </div>
                      <div>
                        <p className="text-white font-medium">{formatBytes(layer.sizeBytes)}</p>
                        <p className="text-warm-500">{t('hybridCache.size', 'size')}</p>
                      </div>
                      <div>
                        <p className="text-white font-medium">{layer.avgLatencyMs}ms</p>
                        <p className="text-warm-500">{t('hybridCache.latency', 'latency')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entries Tab */}
      {tab === 'entries' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">{t('hybridCache.allCategories', 'All Categories')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={handleInvalidateAll}
              className="px-3 py-2 bg-red-700 text-white rounded-md text-sm hover:bg-red-600"
            >
              {t('hybridCache.invalidateAll', 'Invalidate All')}
            </button>
          </div>

          {loading ? (
            <p className="text-warm-400 text-sm">{t('hybridCache.loading', 'Loading...')}</p>
          ) : entries.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('hybridCache.noEntries', 'No cache entries yet.')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-mono truncate">{entry.cacheKey}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[entry.status] || 'bg-warm-700 text-warm-300'}`}>
                          {entry.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${entry.cacheLayer === 'L1' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                          {entry.cacheLayer}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-warm-500">
                        <span>{entry.category}</span>
                        <span>{formatBytes(entry.sizeBytes)}</span>
                        <span>{entry.hitCount} {t('hybridCache.hits', 'hits')} / {entry.missCount} {t('hybridCache.misses', 'misses')}</span>
                        <span>{entry.avgLatencyMs}ms</span>
                        {entry.stampedeProtected && (
                          <span className="text-blue-400">{entry.stampedeBlockedCount} {t('hybridCache.blocked', 'blocked')}</span>
                        )}
                        <span>{new Date(entry.expiresAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {entry.status === 'active' && (
                      <button
                        onClick={() => handleInvalidate(entry.id)}
                        className="px-3 py-1 bg-warm-700 text-warm-300 rounded text-xs hover:bg-red-700 hover:text-white"
                      >
                        {t('hybridCache.invalidate', 'Invalidate')}
                      </button>
                    )}
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
            <p className="text-warm-400 text-sm">{t('hybridCache.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('hybridCache.noStats', 'No cache statistics available yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { label: t('hybridCache.stats.totalEntries', 'Total Entries'), value: stats.totalEntries },
                  { label: t('hybridCache.stats.activeEntries', 'Active'), value: stats.activeEntries },
                  { label: t('hybridCache.stats.hitRate', 'Hit Rate'), value: `${stats.hitRate}%` },
                  { label: t('hybridCache.stats.totalHits', 'Total Hits'), value: stats.totalHits },
                  { label: t('hybridCache.stats.avgLatency', 'Avg Latency'), value: `${stats.avgLatencyMs}ms` },
                  { label: t('hybridCache.stats.costSaved', 'Cost Saved'), value: `$${stats.totalCostSaved}` },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats.byCategory.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('hybridCache.categoryBreakdown', 'By Category')}</h4>
                  <div className="space-y-2">
                    {stats.byCategory.map(cat => {
                      const catInfo = categories.find(c => c.id === cat.category)
                      const hitRate = cat.hits + cat.misses > 0 ? Math.round(cat.hits * 100 / (cat.hits + cat.misses)) : 0
                      return (
                        <div key={cat.category} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catInfo?.color || '#6b7280' }} />
                            <span className="text-sm text-white">{catInfo?.name || cat.category}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-warm-500">
                            <span>{cat.count} {t('hybridCache.entries', 'entries')}</span>
                            <span>{hitRate}% {t('hybridCache.hitRateLabel', 'hit rate')}</span>
                            <span className="text-green-400">${cat.costSaved} {t('hybridCache.saved', 'saved')}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
