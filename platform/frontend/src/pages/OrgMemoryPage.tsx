import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listMemories,
  createMemory,
  deleteMemory,
  searchMemories,
  getMemoryStats,
  getCategories,
  type OrgMemory,
  type MemoryCategory,
  type OrgMemoryStats,
} from '../api/orgmemory'

type MemoryTab = 'create' | 'browse' | 'search' | 'stats'

const SCOPE_COLORS: Record<string, string> = {
  user: 'bg-blue-600 text-white',
  org: 'bg-purple-600 text-white',
}

const EMBEDDING_COLORS: Record<string, string> = {
  indexed: 'bg-green-600 text-white',
  pending: 'bg-yellow-700 text-yellow-200',
  failed: 'bg-red-600 text-white',
}

export default function OrgMemoryPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<MemoryTab>('create')
  const [memories, setMemories] = useState<OrgMemory[]>([])
  const [searchResults, setSearchResults] = useState<OrgMemory[]>([])
  const [categories, setCategories] = useState<MemoryCategory[]>([])
  const [stats, setStats] = useState<OrgMemoryStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Create form
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scope, setScope] = useState('user')
  const [category, setCategory] = useState('preference')
  const [sourceProject, setSourceProject] = useState('')
  const [creating, setCreating] = useState(false)
  const [lastMemory, setLastMemory] = useState<OrgMemory | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchScope, setSearchScope] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (tab === 'browse') loadMemories()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadCategories() {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch { /* ignore */ }
  }

  async function loadMemories() {
    setLoading(true)
    try {
      const data = await listMemories()
      setMemories(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getMemoryStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleCreate() {
    if (!title.trim()) return
    setCreating(true)
    setLastMemory(null)
    try {
      const mem = await createMemory({ title, content, scope, category, sourceProject: sourceProject || undefined })
      setLastMemory(mem)
    } catch { /* ignore */ }
    setCreating(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteMemory(id)
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch { /* ignore */ }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await searchMemories(searchQuery, searchScope || undefined)
      setSearchResults(results)
    } catch { /* ignore */ }
    setSearching(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('orgMemory.title', 'Org Memory')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('orgMemory.subtitle', 'Persistent organizational memory across sessions with vector DB')}</p>
      </div>

      <div className="flex gap-2">
        {(['create', 'browse', 'search', 'stats'] as MemoryTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`orgMemory.tabs.${tabId}`, tabId === 'create' ? 'Create' : tabId === 'browse' ? 'Browse' : tabId === 'search' ? 'Search' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Create Tab */}
      {tab === 'create' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('orgMemory.createMemory', 'Create Memory')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('orgMemory.memTitle', 'Title')}</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., Always use TypeScript strict mode"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('orgMemory.sourceProject', 'Source Project')}</label>
                <input
                  value={sourceProject}
                  onChange={e => setSourceProject(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., my-ecommerce-app"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('orgMemory.content', 'Content')}</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                placeholder="Describe the memory, decision, or pattern..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('orgMemory.scope', 'Scope')}</label>
                <select
                  value={scope}
                  onChange={e => setScope(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="user">{t('orgMemory.userScope', 'User')}</option>
                  <option value="org">{t('orgMemory.orgScope', 'Organization')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('orgMemory.category', 'Category')}</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? t('orgMemory.creating', 'Creating...') : t('orgMemory.createBtn', 'Create Memory')}
            </button>
          </div>

          {lastMemory && (
            <div className="bg-warm-800 rounded-lg p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">{lastMemory.title}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${SCOPE_COLORS[lastMemory.scope] || 'bg-warm-700'}`}>{lastMemory.scope}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${EMBEDDING_COLORS[lastMemory.embeddingStatus] || 'bg-warm-700'}`}>{lastMemory.embeddingStatus}</span>
                </div>
              </div>
              <p className="text-sm text-warm-300">{lastMemory.content}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                <span>{lastMemory.category}</span>
                <span>{Math.round(lastMemory.relevance * 100)}% {t('orgMemory.relevance', 'relevance')}</span>
              </div>
            </div>
          )}

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{t('orgMemory.categories', 'Memory Categories')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {categories.map(c => (
                <div key={c.id} className="bg-warm-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-sm text-white font-medium">{c.name}</span>
                  </div>
                  <p className="text-xs text-warm-400">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Browse Tab */}
      {tab === 'browse' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('orgMemory.loading', 'Loading...')}</p>
          ) : memories.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('orgMemory.noMemories', 'No memories yet. Create one from the Create tab!')}</p>
            </div>
          ) : (
            memories.map(m => (
              <div key={m.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{m.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${SCOPE_COLORS[m.scope] || 'bg-warm-700'}`}>{m.scope}</span>
                    </div>
                    <p className="text-warm-400 text-xs mt-1 line-clamp-2">{m.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                      <span>{categories.find(c => c.id === m.category)?.name || m.category}</span>
                      <span>{Math.round(m.relevance * 100)}%</span>
                      <span>{m.usageCount}x {t('orgMemory.used', 'used')}</span>
                      {m.sourceProject && <span>{m.sourceProject}</span>}
                      <span>{new Date(m.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600 flex-shrink-0"
                  >
                    {t('orgMemory.delete', 'Delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-4">
            <div className="flex gap-3">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                placeholder={t('orgMemory.searchPlaceholder', 'Search memories...')}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <select
                value={searchScope}
                onChange={e => setSearchScope(e.target.value)}
                className="bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="">{t('orgMemory.allScopes', 'All Scopes')}</option>
                <option value="user">{t('orgMemory.userScope', 'User')}</option>
                <option value="org">{t('orgMemory.orgScope', 'Organization')}</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {searching ? '...' : t('orgMemory.searchBtn', 'Search')}
              </button>
            </div>
          </div>

          {searchResults.length > 0 ? (
            searchResults.map(m => (
              <div key={m.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-sm font-medium">{m.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${SCOPE_COLORS[m.scope] || 'bg-warm-700'}`}>{m.scope}</span>
                </div>
                <p className="text-warm-400 text-xs mt-1">{m.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                  <span>{categories.find(c => c.id === m.category)?.name || m.category}</span>
                  <span>{Math.round(m.relevance * 100)}% {t('orgMemory.relevance', 'relevance')}</span>
                </div>
              </div>
            ))
          ) : searchQuery && !searching ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('orgMemory.noResults', 'No matching memories found.')}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('orgMemory.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('orgMemory.noStats', 'No memory statistics yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: t('orgMemory.stats.total', 'Total Memories'), value: stats.totalMemories },
                  { label: t('orgMemory.stats.user', 'User Memories'), value: stats.userMemories },
                  { label: t('orgMemory.stats.org', 'Org Memories'), value: stats.orgMemories },
                  { label: t('orgMemory.stats.indexed', 'Indexed'), value: stats.indexedCount },
                  { label: t('orgMemory.stats.avgRelevance', 'Avg Relevance'), value: `${stats.avgRelevance}%` },
                  { label: t('orgMemory.stats.totalUsages', 'Total Usages'), value: stats.totalUsages },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats.byCategory.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('orgMemory.stats.byCategory', 'By Category')}</h4>
                  <div className="space-y-2">
                    {stats.byCategory.map(c => {
                      const info = categories.find(cat => cat.id === c.category)
                      return (
                        <div key={c.category} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info?.color || '#6b7280' }} />
                            <span className="text-sm text-white">{info?.name || c.category}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-warm-500">
                            <span>{c.count} {t('orgMemory.memories', 'memories')}</span>
                            <span>{c.avgRelevance}% {t('orgMemory.relevance', 'relevance')}</span>
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
