import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listMemories,
  addMemory,
  deleteMemory,
  reinforceMemory,
  contradictMemory,
  getMemoryStats,
  type ProjectMemory,
  type MemoryStats,
} from '../api/projectmemory'

type MemoryTab = 'memories' | 'add' | 'stats'

const CATEGORIES = ['general', 'naming', 'architecture', 'style', 'review', 'testing', 'deployment']
const MEMORY_TYPES = ['convention', 'pattern', 'preference', 'feedback']

export default function CodebaseMemoryPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<MemoryTab>('memories')
  const [memories, setMemories] = useState<ProjectMemory[]>([])
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [loading, setLoading] = useState(false)

  // Add form
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('general')
  const [memoryType, setMemoryType] = useState('convention')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (tab === 'memories') loadMemories()
    if (tab === 'stats') loadStats()
  }, [tab, filterCategory])

  async function loadMemories() {
    setLoading(true)
    try {
      const data = await listMemories(undefined, filterCategory || undefined)
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

  async function handleAdd() {
    if (!content.trim()) return
    setAdding(true)
    try {
      await addMemory({ content, summary, category, memoryType })
      setContent('')
      setSummary('')
      setTab('memories')
      loadMemories()
    } catch { /* ignore */ }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteMemory(id)
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch { /* ignore */ }
  }

  async function handleReinforce(id: string) {
    try {
      const updated = await reinforceMemory(id)
      setMemories(prev => prev.map(m => m.id === id ? updated : m))
    } catch { /* ignore */ }
  }

  async function handleContradict(id: string) {
    try {
      const updated = await contradictMemory(id)
      setMemories(prev => prev.map(m => m.id === id ? updated : m))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('codebaseMemory.title', 'Codebase Memory')}</h3>
        <p className="text-gray-400 text-sm mt-1">{t('codebaseMemory.subtitle', 'Persistent learning from your codebase patterns and preferences')}</p>
      </div>

      <div className="flex gap-2">
        {(['memories', 'add', 'stats'] as MemoryTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`codebaseMemory.tabs.${tabId}`, tabId === 'memories' ? 'Memories' : tabId === 'add' ? 'Add Memory' : 'Stats')}
          </button>
        ))}
      </div>

      {tab === 'memories' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">{t('codebaseMemory.allCategories', 'All Categories')}</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="text-gray-400 text-sm">{memories.length} {t('codebaseMemory.memoriesFound', 'memories')}</span>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">{t('codebaseMemory.loading', 'Loading...')}</p>
          ) : memories.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">{t('codebaseMemory.noMemories', 'No memories yet. Add patterns and conventions the AI should remember.')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map(m => (
                <div key={m.id} className={`bg-gray-800 rounded-lg p-4 border ${m.isActive ? 'border-gray-700' : 'border-red-900 opacity-60'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-900 text-blue-300 rounded">{m.memoryType}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">{m.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${m.confidence >= 0.7 ? 'bg-green-900 text-green-300' : m.confidence >= 0.4 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>
                          {Math.round(m.confidence * 100)}% {t('codebaseMemory.confidence', 'confidence')}
                        </span>
                        {!m.isActive && <span className="text-xs px-2 py-0.5 bg-red-900 text-red-300 rounded">{t('codebaseMemory.inactive', 'Inactive')}</span>}
                      </div>
                      {m.summary && <p className="text-white text-sm font-medium">{m.summary}</p>}
                      <p className="text-gray-300 text-sm mt-1 whitespace-pre-wrap">{m.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{t('codebaseMemory.reinforced', 'Reinforced')}: {m.reinforcements}</span>
                        <span>{t('codebaseMemory.contradicted', 'Contradicted')}: {m.contradictions}</span>
                        <span>{t('codebaseMemory.source', 'Source')}: {m.sourceType}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleReinforce(m.id)} className="p-1.5 bg-green-900 text-green-300 rounded hover:bg-green-800 text-xs" title={t('codebaseMemory.reinforce', 'Reinforce')}>+</button>
                      <button onClick={() => handleContradict(m.id)} className="p-1.5 bg-yellow-900 text-yellow-300 rounded hover:bg-yellow-800 text-xs" title={t('codebaseMemory.contradict', 'Contradict')}>-</button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 bg-red-900 text-red-300 rounded hover:bg-red-800 text-xs" title={t('codebaseMemory.delete', 'Delete')}>x</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'add' && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h4 className="text-white font-medium">{t('codebaseMemory.addNew', 'Add New Memory')}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('codebaseMemory.memoryType', 'Memory Type')}</label>
              <select value={memoryType} onChange={e => setMemoryType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm">
                {MEMORY_TYPES.map(mt => <option key={mt} value={mt}>{mt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('codebaseMemory.category', 'Category')}</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t('codebaseMemory.summaryLabel', 'Summary')}</label>
            <input value={summary} onChange={e => setSummary(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm" placeholder={t('codebaseMemory.summaryPlaceholder', 'Brief description of this memory')} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t('codebaseMemory.contentLabel', 'Content')}</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm" placeholder={t('codebaseMemory.contentPlaceholder', 'e.g., Use camelCase for variables, PascalCase for components...')} />
          </div>
          <button onClick={handleAdd} disabled={adding || !content.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            {adding ? t('codebaseMemory.adding', 'Adding...') : t('codebaseMemory.addBtn', 'Add Memory')}
          </button>
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalMemories}</p>
              <p className="text-gray-400 text-sm">{t('codebaseMemory.stats.total', 'Total Memories')}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.activeMemories}</p>
              <p className="text-gray-400 text-sm">{t('codebaseMemory.stats.active', 'Active')}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.avgConfidence}%</p>
              <p className="text-gray-400 text-sm">{t('codebaseMemory.stats.avgConfidence', 'Avg Confidence')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.totalReinforcements}</p>
              <p className="text-gray-400 text-sm">{t('codebaseMemory.stats.reinforcements', 'Reinforcements')}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.totalContradictions}</p>
              <p className="text-gray-400 text-sm">{t('codebaseMemory.stats.contradictions', 'Contradictions')}</p>
            </div>
          </div>

          {stats.byCategory.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">{t('codebaseMemory.stats.byCategory', 'By Category')}</h4>
              <div className="space-y-2">
                {stats.byCategory.map(c => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{c.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{c.count} memories</span>
                      <span className="text-blue-400">{c.avgConfidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.recentMemories.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">{t('codebaseMemory.stats.recent', 'Recent Memories')}</h4>
              <div className="space-y-2">
                {stats.recentMemories.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 truncate flex-1">{m.summary || 'Unnamed'}</span>
                    <span className="text-gray-400 ml-2">{m.category}</span>
                    <span className="text-blue-400 ml-2">{Math.round(m.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
