import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listIndexedItems,
  indexItem,
  semanticQuery,
  deleteIndexedItem,
  getSemanticSearchStats,
  type SemanticIndexItem,
  type SemanticSearchResult,
  type SemanticSearchStats,
} from '../api/semantic-search'

type SearchTab = 'index' | 'search' | 'stats'

const SOURCE_TYPES = ['template', 'project', 'request'] as const

export default function SemanticSearchPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<SearchTab>('index')
  const [loading, setLoading] = useState(false)

  // Index tab state
  const [indexItems, setIndexItems] = useState<SemanticIndexItem[]>([])
  const [filterSourceType, setFilterSourceType] = useState<string>('template')
  const [newSourceType, setNewSourceType] = useState<string>('template')
  const [newSourceId, setNewSourceId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [indexing, setIndexing] = useState(false)

  // Search tab state
  const [queryText, setQueryText] = useState('')
  const [searchSourceType, setSearchSourceType] = useState<string>('')
  const [topK, setTopK] = useState(5)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([])

  // Stats tab state
  const [stats, setStats] = useState<SemanticSearchStats | null>(null)

  useEffect(() => {
    if (tab === 'index') loadIndexItems()
    if (tab === 'stats') loadStats()
  }, [tab, filterSourceType])

  async function loadIndexItems() {
    setLoading(true)
    try {
      const data = await listIndexedItems(filterSourceType)
      setIndexItems(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getSemanticSearchStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleIndex() {
    if (!newTitle.trim() || !newContent.trim()) return
    setIndexing(true)
    try {
      await indexItem({
        sourceType: newSourceType,
        sourceId: newSourceId || crypto.randomUUID(),
        title: newTitle,
        content: newContent,
      })
      setNewTitle('')
      setNewContent('')
      setNewSourceId('')
      await loadIndexItems()
    } catch { /* ignore */ }
    setIndexing(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteIndexedItem(id)
      setIndexItems(prev => prev.filter(item => item.id !== id))
    } catch { /* ignore */ }
  }

  async function handleSearch() {
    if (!queryText.trim()) return
    setSearching(true)
    try {
      const results = await semanticQuery({
        query: queryText,
        sourceType: searchSourceType || undefined,
        topK,
      })
      setSearchResults(results)
    } catch { /* ignore */ }
    setSearching(false)
  }

  function getSimilarityColor(score: number): string {
    if (score >= 0.8) return 'bg-green-500'
    if (score >= 0.6) return 'bg-yellow-500'
    if (score >= 0.4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  function getSimilarityLabel(score: number): string {
    if (score >= 0.8) return 'High'
    if (score >= 0.6) return 'Medium'
    if (score >= 0.4) return 'Low'
    return 'Minimal'
  }

  const SOURCE_TYPE_COLORS: Record<string, string> = {
    template: 'bg-purple-900 text-purple-300',
    project: 'bg-blue-900 text-blue-300',
    request: 'bg-green-900 text-green-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('semanticSearch.title', 'Semantic Search')}</h3>
        <p className="text-gray-400 text-sm mt-1">{t('semanticSearch.subtitle', 'pgvector-powered semantic search for template matching and project recommendations')}</p>
      </div>

      <div className="flex gap-2">
        {(['index', 'search', 'stats'] as SearchTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`semanticSearch.tabs.${tabId}`, tabId === 'index' ? 'Index' : tabId === 'search' ? 'Search' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Index Tab */}
      {tab === 'index' && (
        <div className="space-y-4">
          {/* Index New Item Form */}
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('semanticSearch.indexNew', 'Index New Item')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('semanticSearch.sourceType', 'Source Type')}</label>
                <select
                  value={newSourceType}
                  onChange={e => setNewSourceType(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  {SOURCE_TYPES.map(st => (
                    <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('semanticSearch.sourceId', 'Source ID (optional)')}</label>
                <input
                  type="text"
                  value={newSourceId}
                  onChange={e => setNewSourceId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder={t('semanticSearch.sourceIdPlaceholder', 'Auto-generated if empty')}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('semanticSearch.itemTitle', 'Title')}</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm"
                placeholder={t('semanticSearch.titlePlaceholder', 'e.g., React Dashboard Template')}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('semanticSearch.content', 'Content')}</label>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm resize-y"
                placeholder={t('semanticSearch.contentPlaceholder', 'Enter the text content to be embedded...')}
              />
            </div>
            <button
              onClick={handleIndex}
              disabled={indexing || !newTitle.trim() || !newContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {indexing ? t('semanticSearch.indexing', 'Indexing...') : t('semanticSearch.indexButton', 'Index Item')}
            </button>
          </div>

          {/* Source Type Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">{t('semanticSearch.filterBy', 'Filter by:')}</label>
            <div className="flex gap-2">
              {SOURCE_TYPES.map(st => (
                <button
                  key={st}
                  onClick={() => setFilterSourceType(st)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    filterSourceType === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Indexed Items List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : indexItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('semanticSearch.noItems', 'No indexed items for this source type')}
            </div>
          ) : (
            <div className="space-y-2">
              {indexItems.map(item => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${SOURCE_TYPE_COLORS[item.sourceType] || 'bg-gray-700 text-gray-300'}`}>
                        {item.sourceType}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {t('semanticSearch.indexed', 'Indexed')}: {new Date(item.indexedAt).toLocaleString()} | {t('semanticSearch.dims', 'Dims')}: {item.dimensions}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                  >
                    {t('semanticSearch.delete', 'Delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('semanticSearch.queryTitle', 'Semantic Query')}</h4>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('semanticSearch.queryText', 'Query Text')}</label>
              <textarea
                value={queryText}
                onChange={e => setQueryText(e.target.value)}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm resize-y"
                placeholder={t('semanticSearch.queryPlaceholder', 'Describe what you are looking for...')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('semanticSearch.sourceTypeFilter', 'Source Type Filter')}</label>
                <select
                  value={searchSourceType}
                  onChange={e => setSearchSourceType(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="">{t('semanticSearch.allTypes', 'All Types')}</option>
                  {SOURCE_TYPES.map(st => (
                    <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t('semanticSearch.topK', 'Top K Results')}: {topK}
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={topK}
                  onChange={e => setTopK(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !queryText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? t('semanticSearch.searching', 'Searching...') : t('semanticSearch.searchButton', 'Search')}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">{t('semanticSearch.results', 'Results')} ({searchResults.length})</h4>
              {searchResults.map((result, idx) => (
                <div key={result.id} className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs font-mono">#{idx + 1}</span>
                      <span className="text-white font-medium text-sm">{result.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${SOURCE_TYPE_COLORS[result.sourceType] || 'bg-gray-700 text-gray-300'}`}>
                        {result.sourceType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{getSimilarityLabel(result.similarity)}</span>
                      <span className="text-xs font-mono text-white">{(result.similarity * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  {/* Relevance bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getSimilarityColor(result.similarity)}`}
                      style={{ width: `${Math.max(result.similarity * 100, 2)}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-2">{result.content}</p>
                  <div className="text-gray-500 text-xs">
                    {t('semanticSearch.indexed', 'Indexed')}: {new Date(result.indexedAt).toLocaleString()}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('semanticSearch.totalIndexed', 'Total Indexed')}</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats.totalIndexed}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('semanticSearch.dimensions', 'Dimensions')}</div>
                  <div className="text-2xl font-bold text-white mt-1">{stats.dimensions}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('semanticSearch.contentSize', 'Content Size')}</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {stats.totalContentSize > 1024 ? `${(stats.totalContentSize / 1024).toFixed(1)} KB` : `${stats.totalContentSize} B`}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider">{t('semanticSearch.lastIndexed', 'Last Indexed')}</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {stats.lastIndexed ? new Date(stats.lastIndexed).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Source Type Breakdown */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-white font-medium mb-4">{t('semanticSearch.breakdown', 'By Source Type')}</h4>
                {stats.bySourceType.length === 0 ? (
                  <p className="text-gray-500 text-sm">{t('semanticSearch.noData', 'No data yet')}</p>
                ) : (
                  <div className="space-y-3">
                    {stats.bySourceType.map(entry => (
                      <div key={entry.sourceType} className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs min-w-[80px] text-center ${SOURCE_TYPE_COLORS[entry.sourceType] || 'bg-gray-700 text-gray-300'}`}>
                          {entry.sourceType}
                        </span>
                        <div className="flex-1 bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all"
                            style={{ width: `${stats.totalIndexed > 0 ? (entry.count / stats.totalIndexed) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-white text-sm font-mono min-w-[40px] text-right">{entry.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('semanticSearch.noStats', 'No statistics available')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
