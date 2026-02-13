import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listRules,
  createRule,
  toggleRule,
  deleteRule,
  getRuleStats,
  getCategories,
  type AiAgentRule,
  type RuleCategory,
  type RuleStats,
} from '../api/agentrule'

type RuleTab = 'create' | 'rules' | 'stats'

const SCOPE_COLORS: Record<string, string> = {
  project: 'bg-blue-600 text-white',
  user: 'bg-purple-600 text-white',
  org: 'bg-green-600 text-white',
}

export default function AgentRulesPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<RuleTab>('create')
  const [rules, setRules] = useState<AiAgentRule[]>([])
  const [categories, setCategories] = useState<RuleCategory[]>([])
  const [stats, setStats] = useState<RuleStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Create form
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scope, setScope] = useState('user')
  const [category, setCategory] = useState('coding-standards')
  const [projectName, setProjectName] = useState('')
  const [priority, setPriority] = useState(50)
  const [creating, setCreating] = useState(false)
  const [lastRule, setLastRule] = useState<AiAgentRule | null>(null)

  // Filters
  const [filterScope, setFilterScope] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (tab === 'rules') loadRules()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadCategories() {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch { /* ignore */ }
  }

  async function loadRules() {
    setLoading(true)
    try {
      const data = await listRules(filterScope || undefined, filterCategory || undefined)
      setRules(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getRuleStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleCreate() {
    if (!title.trim() || !content.trim()) return
    setCreating(true)
    setLastRule(null)
    try {
      const rule = await createRule({ title, content, scope, category, projectName: projectName || undefined, priority })
      setLastRule(rule)
      setTitle('')
      setContent('')
    } catch { /* ignore */ }
    setCreating(false)
  }

  async function handleToggle(id: string) {
    try {
      const updated = await toggleRule(id)
      setRules(prev => prev.map(r => r.id === id ? updated : r))
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRule(id)
      setRules(prev => prev.filter(r => r.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('agentRules.title', 'Agent Rules')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('agentRules.subtitle', 'Configure AI agent behavior with project, user, and org-level rules')}</p>
      </div>

      <div className="flex gap-2">
        {(['create', 'rules', 'stats'] as RuleTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`agentRules.tabs.${tabId}`, tabId === 'create' ? 'Create' : tabId === 'rules' ? 'Rules' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Create Tab */}
      {tab === 'create' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('agentRules.createRule', 'Create Rule')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentRules.ruleTitle', 'Title')}</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., Always use TypeScript strict mode"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentRules.projectName', 'Project (optional)')}</label>
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., my-ecommerce-app"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('agentRules.content', 'Rule Content')}</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm font-mono"
                placeholder="Describe the rule in natural language or markdown..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentRules.scope', 'Scope')}</label>
                <select
                  value={scope}
                  onChange={e => setScope(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="project">{t('agentRules.scopeProject', 'Project')}</option>
                  <option value="user">{t('agentRules.scopeUser', 'User')}</option>
                  <option value="org">{t('agentRules.scopeOrg', 'Organization')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentRules.category', 'Category')}</label>
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
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('agentRules.priority', 'Priority')} ({priority})</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={priority}
                  onChange={e => setPriority(Number(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? t('agentRules.creating', 'Creating...') : t('agentRules.createBtn', 'Create Rule')}
            </button>
          </div>

          {lastRule && (
            <div className="bg-warm-800 rounded-lg p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">{lastRule.title}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${SCOPE_COLORS[lastRule.scope] || 'bg-warm-700'}`}>{lastRule.scope}</span>
                  <span className="text-xs text-warm-400">P{lastRule.priority}</span>
                </div>
              </div>
              <p className="text-sm text-warm-300 font-mono whitespace-pre-wrap">{lastRule.content}</p>
            </div>
          )}

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{t('agentRules.categoriesTitle', 'Rule Categories')}</h4>
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

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <select
              value={filterScope}
              onChange={e => { setFilterScope(e.target.value); setTimeout(loadRules, 0) }}
              className="bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">{t('agentRules.allScopes', 'All Scopes')}</option>
              <option value="project">{t('agentRules.scopeProject', 'Project')}</option>
              <option value="user">{t('agentRules.scopeUser', 'User')}</option>
              <option value="org">{t('agentRules.scopeOrg', 'Organization')}</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setTimeout(loadRules, 0) }}
              className="bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">{t('agentRules.allCategories', 'All Categories')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-warm-400 text-sm">{t('agentRules.loading', 'Loading...')}</p>
          ) : rules.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('agentRules.noRules', 'No rules yet. Create one from the Create tab!')}</p>
            </div>
          ) : (
            rules.map(r => (
              <div key={r.id} className={`bg-warm-800 rounded-lg p-4 border ${r.isActive ? 'border-warm-700' : 'border-warm-800 opacity-60'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{r.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${SCOPE_COLORS[r.scope] || 'bg-warm-700'}`}>{r.scope}</span>
                      {!r.isActive && <span className="text-xs text-warm-500">({t('agentRules.disabled', 'disabled')})</span>}
                    </div>
                    <p className="text-warm-400 text-xs mt-1 line-clamp-2 font-mono">{r.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                      <span>{categories.find(c => c.id === r.category)?.name || r.category}</span>
                      <span>P{r.priority}</span>
                      <span>{r.timesApplied}x {t('agentRules.applied', 'applied')}</span>
                      {r.projectName && <span>{r.projectName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(r.id)}
                      className={`px-3 py-1 rounded text-xs ${r.isActive ? 'bg-yellow-700 text-yellow-200 hover:bg-yellow-600' : 'bg-green-700 text-white hover:bg-green-600'}`}
                    >
                      {r.isActive ? t('agentRules.disable', 'Disable') : t('agentRules.enable', 'Enable')}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600"
                    >
                      {t('agentRules.delete', 'Delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('agentRules.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('agentRules.noStats', 'No rule statistics yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('agentRules.stats.total', 'Total Rules'), value: stats.totalRules },
                  { label: t('agentRules.stats.active', 'Active'), value: stats.activeRules },
                  { label: t('agentRules.stats.applied', 'Times Applied'), value: stats.totalApplied },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats.byScope.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('agentRules.stats.byScope', 'By Scope')}</h4>
                  <div className="space-y-2">
                    {stats.byScope.map(s => (
                      <div key={s.scope} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded ${SCOPE_COLORS[s.scope] || 'bg-warm-700'}`}>{s.scope}</span>
                        <span className="text-sm text-warm-300">{s.count} {t('agentRules.rulesLabel', 'rules')} ({s.active} {t('agentRules.stats.active', 'active')})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.byCategory.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('agentRules.stats.byCategory', 'By Category')}</h4>
                  <div className="space-y-2">
                    {stats.byCategory.map(c => {
                      const info = categories.find(cat => cat.id === c.category)
                      return (
                        <div key={c.category} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info?.color || '#6b7280' }} />
                            <span className="text-sm text-white">{info?.name || c.category}</span>
                          </div>
                          <span className="text-xs text-warm-500">{c.count} {t('agentRules.rulesLabel', 'rules')} · {c.totalApplied}x {t('agentRules.applied', 'applied')}</span>
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
