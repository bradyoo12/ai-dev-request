import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listConfigs,
  createConfig,
  runQuery,
  deleteConfig,
  getVectorStats,
  getProviders,
  type VectorSearchConfig,
  type VectorProvider,
  type SearchResponse,
  type VectorStats,
} from '../api/vectorsearch'

type VsTab = 'search' | 'indexes' | 'configure' | 'stats'

const MODE_COLORS: Record<string, string> = {
  hybrid: 'bg-purple-600 text-white',
  'vector-only': 'bg-blue-600 text-white',
  'keyword-only': 'bg-green-600 text-white',
}

export default function VectorSearchPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<VsTab>('search')
  const [configs, setConfigs] = useState<VectorSearchConfig[]>([])
  const [providers, setProviders] = useState<VectorProvider[]>([])
  const [stats, setStats] = useState<VectorStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Search
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('hybrid')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)

  // Configure
  const [indexName, setIndexName] = useState('')
  const [provider, setProvider] = useState('qdrant')
  const [configMode, setConfigMode] = useState('hybrid')
  const [fusionAlg, setFusionAlg] = useState('rrf')
  const [vectorWeight, setVectorWeight] = useState(70)
  const [topK, setTopK] = useState(10)
  const [queryExpansion, setQueryExpansion] = useState(true)
  const [metadataFilter, setMetadataFilter] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadProviders() }, [])

  useEffect(() => {
    if (tab === 'indexes') loadConfigs()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadProviders() {
    try { setProviders(await getProviders()) } catch { /* ignore */ }
  }

  async function loadConfigs() {
    setLoading(true)
    try { setConfigs(await listConfigs()) } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try { setStats(await getVectorStats()) } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    setSearchResult(null)
    try { setSearchResult(await runQuery(query, searchMode)) } catch { /* ignore */ }
    setSearching(false)
  }

  async function handleCreate() {
    if (!indexName.trim()) return
    setCreating(true)
    try {
      await createConfig({ indexName, provider, searchMode: configMode, fusionAlgorithm: fusionAlg, vectorWeight: vectorWeight / 100, keywordWeight: (100 - vectorWeight) / 100, topK, queryExpansion, metadataFiltering: metadataFilter })
      setIndexName('')
      if (tab === 'indexes') loadConfigs()
    } catch { /* ignore */ }
    setCreating(false)
  }

  async function handleDelete(id: string) {
    try { await deleteConfig(id); setConfigs(prev => prev.filter(c => c.id !== id)) } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('vs.title', 'Hybrid Vector Search')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('vs.subtitle', 'Combine vector similarity with keyword search for accurate memory retrieval')}</p>
      </div>

      <div className="flex gap-2">
        {(['search', 'indexes', 'configure', 'stats'] as VsTab[]).map(tabId => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'}`}
          >
            {t(`vs.tabs.${tabId}`, tabId === 'search' ? 'Search' : tabId === 'indexes' ? 'Indexes' : tabId === 'configure' ? 'Configure' : 'Stats')}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('vs.queryTitle', 'Search Organizational Memory')}</h4>
            <div className="flex gap-3">
              <input value={query} onChange={e => setQuery(e.target.value)} className="flex-1 bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm" placeholder={t('vs.queryPlaceholder', 'Search memories...')} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <select value={searchMode} onChange={e => setSearchMode(e.target.value)} className="bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm">
                <option value="hybrid">{t('vs.modeHybrid', 'Hybrid')}</option>
                <option value="vector-only">{t('vs.modeVector', 'Vector Only')}</option>
                <option value="keyword-only">{t('vs.modeKeyword', 'Keyword Only')}</option>
              </select>
              <button onClick={handleSearch} disabled={searching || !query.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
                {searching ? t('vs.searching', 'Searching...') : t('vs.searchBtn', 'Search')}
              </button>
            </div>
          </div>

          {searchResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">{t('vs.results', 'Results')} ({searchResult.totalResults})</h4>
                <span className="text-xs text-warm-500">{searchResult.avgLatencyMs}ms {t('vs.avgLatency', 'avg latency')} · {searchResult.mode}</span>
              </div>
              {searchResult.results.map(r => (
                <div key={r.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{r.title}</p>
                      <p className="text-warm-400 text-xs mt-1">{r.content}</p>
                      <div className="flex gap-3 mt-2 text-xs text-warm-500">
                        <span className="bg-warm-700 px-2 py-0.5 rounded">{r.source}</span>
                        <span>{r.latencyMs}ms</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-lg font-bold text-white">{(r.fusedScore * 100).toFixed(0)}%</p>
                      <div className="text-xs text-warm-500 space-y-0.5 mt-1">
                        <p>V: {(r.vectorScore * 100).toFixed(0)}%</p>
                        <p>K: {(r.keywordScore * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'indexes' && (
        <div className="space-y-4">
          {loading ? <p className="text-warm-400 text-sm">{t('vs.loading', 'Loading...')}</p> : configs.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center"><p className="text-warm-400">{t('vs.noIndexes', 'No search indexes configured yet.')}</p></div>
          ) : configs.map(c => (
            <div key={c.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium">{c.indexName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${MODE_COLORS[c.searchMode] || 'bg-warm-700'}`}>{c.searchMode}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-warm-500">
                    <span>{providers.find(p => p.id === c.provider)?.name || c.provider}</span>
                    <span>{c.fusionAlgorithm.toUpperCase()}</span>
                    <span>V:{(c.vectorWeight * 100).toFixed(0)}% K:{(c.keywordWeight * 100).toFixed(0)}%</span>
                    <span>{c.totalQueries} {t('vs.queries', 'queries')}</span>
                    {c.avgQueryLatencyMs > 0 && <span>{c.avgQueryLatencyMs}ms {t('vs.avgLatency', 'avg')}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600">{t('vs.delete', 'Delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'configure' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('vs.newIndex', 'New Search Index')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('vs.indexName', 'Index Name')}</label>
                <input value={indexName} onChange={e => setIndexName(e.target.value)} className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm" placeholder="e.g., org-memories" />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('vs.provider', 'Provider')}</label>
                <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm">
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('vs.searchMode', 'Search Mode')}</label>
                <select value={configMode} onChange={e => setConfigMode(e.target.value)} className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm">
                  <option value="hybrid">{t('vs.modeHybrid', 'Hybrid')}</option>
                  <option value="vector-only">{t('vs.modeVector', 'Vector Only')}</option>
                  <option value="keyword-only">{t('vs.modeKeyword', 'Keyword Only')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('vs.fusion', 'Fusion Algorithm')}</label>
                <select value={fusionAlg} onChange={e => setFusionAlg(e.target.value)} className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm">
                  <option value="rrf">RRF (Reciprocal Rank Fusion)</option>
                  <option value="linear">Linear Combination</option>
                  <option value="weighted">Weighted Sum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('vs.topK', 'Top-K Results')} ({topK})</label>
                <input type="range" min={1} max={50} value={topK} onChange={e => setTopK(Number(e.target.value))} className="w-full mt-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('vs.vectorWeight', 'Vector Weight')} ({vectorWeight}%) / {t('vs.keywordWeight', 'Keyword')} ({100 - vectorWeight}%)</label>
              <input type="range" min={0} max={100} value={vectorWeight} onChange={e => setVectorWeight(Number(e.target.value))} className="w-full" />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-warm-300">
                <input type="checkbox" checked={queryExpansion} onChange={e => setQueryExpansion(e.target.checked)} className="rounded" />
                {t('vs.queryExpansion', 'Query Expansion (AI)')}
              </label>
              <label className="flex items-center gap-2 text-sm text-warm-300">
                <input type="checkbox" checked={metadataFilter} onChange={e => setMetadataFilter(e.target.checked)} className="rounded" />
                {t('vs.metadataFilter', 'Metadata Filtering')}
              </label>
            </div>
            <button onClick={handleCreate} disabled={creating || !indexName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {creating ? t('vs.creating', 'Creating...') : t('vs.createBtn', 'Create Index')}
            </button>
          </div>
          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{t('vs.providersTitle', 'Supported Providers')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {providers.map(p => (
                <div key={p.id} className="bg-warm-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-white font-medium">{p.name}</span>
                  </div>
                  <p className="text-xs text-warm-400">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-4">
          {loading ? <p className="text-warm-400 text-sm">{t('vs.loading', 'Loading...')}</p> : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center"><p className="text-warm-400">{t('vs.noStats', 'No search statistics yet.')}</p></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('vs.stats.indexes', 'Indexes'), value: stats.totalIndexes },
                  { label: t('vs.stats.vectors', 'Vectors'), value: stats.totalVectors },
                  { label: t('vs.stats.queries', 'Queries'), value: stats.totalQueries },
                  { label: t('vs.stats.latency', 'Avg Latency'), value: `${stats.avgLatency}ms` },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {stats.byProvider.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('vs.stats.byProvider', 'By Provider')}</h4>
                  <div className="space-y-2">
                    {stats.byProvider.map(p => (
                      <div key={p.provider} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                        <span className="text-sm text-white">{providers.find(pr => pr.id === p.provider)?.name || p.provider}</span>
                        <span className="text-xs text-warm-500">{p.count} {t('vs.indexesLabel', 'indexes')} · {p.queries} {t('vs.queries', 'queries')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats.byMode.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('vs.stats.byMode', 'By Search Mode')}</h4>
                  <div className="space-y-2">
                    {stats.byMode.map(m => (
                      <div key={m.mode} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded ${MODE_COLORS[m.mode] || 'bg-warm-700 text-white'}`}>{m.mode}</span>
                        <span className="text-xs text-warm-500">{m.count}</span>
                      </div>
                    ))}
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
