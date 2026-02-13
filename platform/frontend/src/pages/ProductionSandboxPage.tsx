import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listSandboxes,
  createSandbox,
  stopSandbox,
  deleteSandbox,
  getSandboxStats,
  getProviders,
  type ProductionSandbox,
  type ProviderInfo,
  type SandboxStats,
} from '../api/productionsandbox'

type SandboxTab = 'create' | 'sandboxes' | 'stats'

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-green-600 text-white',
  provisioning: 'bg-blue-600 text-white',
  stopped: 'bg-warm-600 text-warm-300',
  error: 'bg-red-600 text-white',
  pending: 'bg-yellow-700 text-yellow-200',
}

export default function ProductionSandboxPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<SandboxTab>('create')
  const [sandboxes, setSandboxes] = useState<ProductionSandbox[]>([])
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [stats, setStats] = useState<SandboxStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Create form
  const [sandboxName, setSandboxName] = useState('')
  const [provider, setProvider] = useState('azure')
  const [region, setRegion] = useState('')
  const [creating, setCreating] = useState(false)
  const [lastSandbox, setLastSandbox] = useState<ProductionSandbox | null>(null)

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    if (tab === 'sandboxes') loadSandboxes()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadProviders() {
    try {
      const data = await getProviders()
      setProviders(data)
    } catch { /* ignore */ }
  }

  async function loadSandboxes() {
    setLoading(true)
    try {
      const data = await listSandboxes()
      setSandboxes(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getSandboxStats()
      setStats(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleCreate() {
    if (!sandboxName.trim()) return
    setCreating(true)
    setLastSandbox(null)
    try {
      const sb = await createSandbox({ sandboxName, provider, region: region || undefined })
      setLastSandbox(sb)
    } catch { /* ignore */ }
    setCreating(false)
  }

  async function handleStop(id: string) {
    try {
      const updated = await stopSandbox(id)
      setSandboxes(prev => prev.map(s => s.id === id ? updated : s))
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSandbox(id)
      setSandboxes(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
  }

  function parseJson(json: string): string[] {
    try { return JSON.parse(json) } catch { return [] }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('prodSandbox.title', 'Production Sandboxes')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('prodSandbox.subtitle', 'Production-connected sandboxes with environment variable import')}</p>
      </div>

      <div className="flex gap-2">
        {(['create', 'sandboxes', 'stats'] as SandboxTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`prodSandbox.tabs.${tabId}`, tabId === 'create' ? 'Create' : tabId === 'sandboxes' ? 'Sandboxes' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Create Tab */}
      {tab === 'create' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('prodSandbox.createSandbox', 'Create Sandbox')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('prodSandbox.name', 'Sandbox Name')}</label>
                <input
                  value={sandboxName}
                  onChange={e => setSandboxName(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., my-ecommerce-staging"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('prodSandbox.provider', 'Cloud Provider')}</label>
                <select
                  value={provider}
                  onChange={e => setProvider(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  {providers.length === 0 && (
                    <>
                      <option value="azure">Microsoft Azure</option>
                      <option value="aws">Amazon Web Services</option>
                      <option value="vercel">Vercel</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('prodSandbox.region', 'Region (optional)')}</label>
              <input
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                placeholder="e.g., eastus, us-east-1, iad1"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !sandboxName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? t('prodSandbox.creating', 'Creating...') : t('prodSandbox.createBtn', 'Create Sandbox')}
            </button>
          </div>

          {/* Created Sandbox Result */}
          {lastSandbox && (
            <div className="bg-warm-800 rounded-lg p-5 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{t('prodSandbox.created', 'Sandbox Created')}</h4>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[lastSandbox.status] || 'bg-warm-700 text-warm-300'}`}>
                  {lastSandbox.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{lastSandbox.envVarCount}</p>
                  <p className="text-xs text-warm-500">{t('prodSandbox.envVars', 'Env Vars')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{lastSandbox.serviceCount}</p>
                  <p className="text-xs text-warm-500">{t('prodSandbox.services', 'Services')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{lastSandbox.region}</p>
                  <p className="text-xs text-warm-500">{t('prodSandbox.region', 'Region')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{lastSandbox.oauthConnected ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-warm-500">{t('prodSandbox.oauth', 'OAuth')}</p>
                </div>
              </div>
              {parseJson(lastSandbox.envVarsJson).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-warm-500 mb-1">{t('prodSandbox.importedEnvVars', 'Imported Env Vars')}</p>
                  <div className="flex flex-wrap gap-1">
                    {parseJson(lastSandbox.envVarsJson).map((v, i) => (
                      <span key={i} className="text-xs bg-warm-900 text-green-400 font-mono rounded px-2 py-0.5">{v}</span>
                    ))}
                  </div>
                </div>
              )}
              {parseJson(lastSandbox.servicesJson).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-warm-500 mb-1">{t('prodSandbox.connectedServices', 'Connected Services')}</p>
                  <div className="flex flex-wrap gap-1">
                    {parseJson(lastSandbox.servicesJson).map((s, i) => (
                      <span key={i} className="text-xs bg-warm-900 text-blue-400 rounded px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Providers */}
          <div className="bg-warm-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{t('prodSandbox.providers', 'Supported Providers')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

      {/* Sandboxes Tab */}
      {tab === 'sandboxes' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('prodSandbox.loading', 'Loading...')}</p>
          ) : sandboxes.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('prodSandbox.noSandboxes', 'No sandboxes yet. Create one from the Create tab!')}</p>
            </div>
          ) : (
            sandboxes.map(s => (
              <div key={s.id} className="bg-warm-800 rounded-lg p-4 border border-warm-700">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{s.sandboxName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[s.status] || 'bg-warm-700 text-warm-300'}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-warm-500">
                      <span>{providers.find(p => p.id === s.provider)?.name || s.provider}</span>
                      <span>{s.region}</span>
                      <span>{s.envVarCount} {t('prodSandbox.envVars', 'env vars')}</span>
                      <span>{s.serviceCount} {t('prodSandbox.services', 'services')}</span>
                      <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {s.status === 'running' && (
                      <button
                        onClick={() => handleStop(s.id)}
                        className="px-3 py-1 bg-yellow-700 text-white rounded text-xs hover:bg-yellow-600"
                      >
                        {t('prodSandbox.stop', 'Stop')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600"
                    >
                      {t('prodSandbox.delete', 'Delete')}
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
            <p className="text-warm-400 text-sm">{t('prodSandbox.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('prodSandbox.noStats', 'No sandbox statistics yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: t('prodSandbox.stats.total', 'Total Sandboxes'), value: stats.totalSandboxes },
                  { label: t('prodSandbox.stats.active', 'Active'), value: stats.activeSandboxes },
                  { label: t('prodSandbox.stats.envVars', 'Total Env Vars'), value: stats.totalEnvVars },
                  { label: t('prodSandbox.stats.services', 'Total Services'), value: stats.totalServices },
                  { label: t('prodSandbox.stats.uptime', 'Uptime (min)'), value: stats.totalUptimeMinutes },
                  { label: t('prodSandbox.stats.cost', 'Total Cost'), value: `$${stats.totalCostUsd}` },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats.byProvider.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('prodSandbox.stats.byProvider', 'By Provider')}</h4>
                  <div className="space-y-2">
                    {stats.byProvider.map(p => {
                      const info = providers.find(pr => pr.id === p.provider)
                      return (
                        <div key={p.provider} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info?.color || '#6b7280' }} />
                            <span className="text-sm text-white">{info?.name || p.provider}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-warm-500">
                            <span>{p.count} {t('prodSandbox.sandboxes', 'sandboxes')}</span>
                            <span>{p.envVars} {t('prodSandbox.envVars', 'env vars')}</span>
                            <span>{p.services} {t('prodSandbox.services', 'services')}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {stats.byStatus.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('prodSandbox.stats.byStatus', 'By Status')}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {stats.byStatus.map(s => (
                      <div key={s.status} className="bg-warm-700 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-white">{s.count}</p>
                        <p className="text-xs text-warm-400 mt-1 capitalize">{s.status}</p>
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
