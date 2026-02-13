import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listConfigs,
  createConfig,
  analyzeProject,
  deleteConfig,
  getRscStats,
  getFrameworks,
  getPatterns,
  type ServerComponentConfig,
  type RscFramework,
  type RscPattern,
  type RscStats,
} from '../api/servercomponent'

type RscTab = 'configure' | 'projects' | 'patterns' | 'stats'

const STATUS_COLORS: Record<string, string> = {
  configured: 'bg-blue-600 text-white',
  migrating: 'bg-yellow-600 text-white',
  optimized: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
}

export default function ServerComponentsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<RscTab>('configure')
  const [configs, setConfigs] = useState<ServerComponentConfig[]>([])
  const [frameworks, setFrameworks] = useState<RscFramework[]>([])
  const [rscPatterns, setRscPatterns] = useState<RscPattern[]>([])
  const [stats, setStats] = useState<RscStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Create form
  const [projectName, setProjectName] = useState('')
  const [framework, setFramework] = useState('nextjs')
  const [renderStrategy, setRenderStrategy] = useState('hybrid')
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  const [metadataHoisting, setMetadataHoisting] = useState(true)
  const [directDbAccess, setDirectDbAccess] = useState(false)
  const [dataFetchingPattern, setDataFetchingPattern] = useState('server-fetch')
  const [creating, setCreating] = useState(false)
  const [lastConfig, setLastConfig] = useState<ServerComponentConfig | null>(null)

  useEffect(() => {
    loadFrameworks()
  }, [])

  useEffect(() => {
    if (tab === 'projects') loadConfigs()
    if (tab === 'patterns') loadPatterns()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadFrameworks() {
    try {
      const data = await getFrameworks()
      setFrameworks(data)
    } catch { /* ignore */ }
  }

  async function loadConfigs() {
    setLoading(true)
    try {
      const data = await listConfigs()
      setConfigs(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadPatterns() {
    setLoading(true)
    try {
      const data = await getPatterns()
      setRscPatterns(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getRscStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleCreate() {
    if (!projectName.trim()) return
    setCreating(true)
    setLastConfig(null)
    try {
      const config = await createConfig({ projectName, framework, renderStrategy, streamingEnabled, metadataHoisting, directDbAccess, dataFetchingPattern })
      setLastConfig(config)
      setProjectName('')
    } catch { /* ignore */ }
    setCreating(false)
  }

  async function handleAnalyze(id: string) {
    try {
      const updated = await analyzeProject(id)
      setConfigs(prev => prev.map(c => c.id === id ? updated : c))
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    try {
      await deleteConfig(id)
      setConfigs(prev => prev.filter(c => c.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('rsc.title', 'React Server Components')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('rsc.subtitle', 'Configure RSC for generated projects to reduce bundle size and improve performance')}</p>
      </div>

      <div className="flex gap-2">
        {(['configure', 'projects', 'patterns', 'stats'] as RscTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`rsc.tabs.${tabId}`, tabId === 'configure' ? 'Configure' : tabId === 'projects' ? 'Projects' : tabId === 'patterns' ? 'Patterns' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Configure Tab */}
      {tab === 'configure' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('rsc.newProject', 'New RSC Project')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('rsc.projectName', 'Project Name')}</label>
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., my-ecommerce-app"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('rsc.framework', 'Framework')}</label>
                <select
                  value={framework}
                  onChange={e => setFramework(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  {frameworks.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('rsc.renderStrategy', 'Render Strategy')}</label>
                <select
                  value={renderStrategy}
                  onChange={e => setRenderStrategy(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="hybrid">{t('rsc.strategyHybrid', 'Hybrid (Recommended)')}</option>
                  <option value="ssc">{t('rsc.strategySSC', 'Server-Side Only')}</option>
                  <option value="ssr">{t('rsc.strategySSR', 'SSR + Client Hydration')}</option>
                  <option value="client-only">{t('rsc.strategyClient', 'Client Only (SPA)')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('rsc.dataFetching', 'Data Fetching Pattern')}</label>
                <select
                  value={dataFetchingPattern}
                  onChange={e => setDataFetchingPattern(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="server-fetch">{t('rsc.fetchServer', 'Server Fetch')}</option>
                  <option value="use-server">{t('rsc.fetchUseServer', "'use server' Actions")}</option>
                  <option value="api-route">{t('rsc.fetchApiRoute', 'API Routes')}</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-warm-300">
                <input type="checkbox" checked={streamingEnabled} onChange={e => setStreamingEnabled(e.target.checked)} className="rounded" />
                {t('rsc.streaming', 'Streaming SSR')}
              </label>
              <label className="flex items-center gap-2 text-sm text-warm-300">
                <input type="checkbox" checked={metadataHoisting} onChange={e => setMetadataHoisting(e.target.checked)} className="rounded" />
                {t('rsc.metadata', 'Metadata Hoisting')}
              </label>
              <label className="flex items-center gap-2 text-sm text-warm-300">
                <input type="checkbox" checked={directDbAccess} onChange={e => setDirectDbAccess(e.target.checked)} className="rounded" />
                {t('rsc.directDb', 'Direct DB Access')}
              </label>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !projectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? t('rsc.creating', 'Creating...') : t('rsc.createBtn', 'Create Configuration')}
            </button>
          </div>

          {lastConfig && (
            <div className="bg-warm-800 rounded-lg p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">{lastConfig.projectName}</h4>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[lastConfig.status] || 'bg-warm-700'}`}>{lastConfig.status}</span>
              </div>
              <div className="flex gap-3 text-xs text-warm-400">
                <span>{frameworks.find(f => f.id === lastConfig.framework)?.name || lastConfig.framework}</span>
                <span>{lastConfig.renderStrategy}</span>
                {lastConfig.streamingEnabled && <span>Streaming</span>}
              </div>
            </div>
          )}

          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{t('rsc.frameworksTitle', 'Supported Frameworks')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {frameworks.map(f => (
                <div key={f.id} className="bg-warm-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                    <span className="text-sm text-white font-medium">{f.name}</span>
                  </div>
                  <p className="text-xs text-warm-400">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {tab === 'projects' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('rsc.loading', 'Loading...')}</p>
          ) : configs.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('rsc.noProjects', 'No RSC projects configured yet.')}</p>
            </div>
          ) : (
            configs.map(c => (
              <div key={c.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{c.projectName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[c.status] || 'bg-warm-700'}`}>{c.status}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                      <span>{frameworks.find(f => f.id === c.framework)?.name || c.framework}</span>
                      <span>{c.renderStrategy}</span>
                      {c.serverComponentCount > 0 && <span>{c.serverComponentCount} {t('rsc.serverComps', 'server')} / {c.clientComponentCount} {t('rsc.clientComps', 'client')}</span>}
                      {c.bundleSizeReductionPercent > 0 && <span className="text-green-400">-{c.bundleSizeReductionPercent}% {t('rsc.bundle', 'bundle')}</span>}
                      {c.initialLoadMs > 0 && <span>{c.initialLoadMs}ms {t('rsc.loadTime', 'load')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAnalyze(c.id)}
                      className="px-3 py-1 bg-blue-700 text-white rounded text-xs hover:bg-blue-600"
                    >
                      {t('rsc.analyze', 'Analyze')}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600"
                    >
                      {t('rsc.delete', 'Delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Patterns Tab */}
      {tab === 'patterns' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('rsc.loading', 'Loading...')}</p>
          ) : (
            rscPatterns.map(p => (
              <div key={p.id} className="bg-warm-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-1">{p.title}</h4>
                <p className="text-warm-400 text-sm mb-3">{p.description}</p>
                <pre className="bg-warm-900 rounded p-3 text-sm text-warm-300 font-mono overflow-x-auto whitespace-pre-wrap">{p.code}</pre>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('rsc.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('rsc.noStats', 'No project statistics yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('rsc.stats.total', 'Total Projects'), value: stats.totalProjects },
                  { label: t('rsc.stats.avgReduction', 'Avg Bundle Reduction'), value: `${stats.avgBundleReduction}%` },
                  { label: t('rsc.stats.avgLoad', 'Avg Initial Load'), value: `${stats.avgInitialLoad}ms` },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats.byFramework.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('rsc.stats.byFramework', 'By Framework')}</h4>
                  <div className="space-y-2">
                    {stats.byFramework.map(f => (
                      <div key={f.framework} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                        <span className="text-sm text-white">{frameworks.find(fw => fw.id === f.framework)?.name || f.framework}</span>
                        <span className="text-xs text-warm-500">{f.count} {t('rsc.projectsLabel', 'projects')} · -{f.avgReduction}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.byStrategy.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('rsc.stats.byStrategy', 'By Strategy')}</h4>
                  <div className="space-y-2">
                    {stats.byStrategy.map(s => (
                      <div key={s.strategy} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                        <span className="text-sm text-white">{s.strategy}</span>
                        <span className="text-xs text-warm-500">{s.count} {t('rsc.projectsLabel', 'projects')}</span>
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
