import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { OAuthConnector, ProviderMetadata, OAuthConnectorStats } from '../api/oauthConnectors'
import { listConnectors, connectProvider, disconnectConnector, listProviders, refreshConnector, getConnectorStats } from '../api/oauthConnectors'

type Tab = 'connectors' | 'connected' | 'stats'

export default function OAuthConnectorsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('connectors')
  const [connectors, setConnectors] = useState<OAuthConnector[]>([])
  const [providers, setProviders] = useState<ProviderMetadata[]>([])
  const [stats, setStats] = useState<OAuthConnectorStats | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  useEffect(() => {
    if (tab === 'connectors') {
      listProviders().then(setProviders).catch(() => {})
      listConnectors().then(setConnectors).catch(() => {})
    }
    if (tab === 'connected') listConnectors().then(setConnectors).catch(() => {})
    if (tab === 'stats') getConnectorStats().then(setStats).catch(() => {})
  }, [tab])

  const handleConnect = async (providerName: string) => {
    setConnecting(providerName)
    try {
      const newConnector = await connectProvider(providerName)
      setConnectors(prev => [newConnector, ...prev])
    } catch { /* ignore */ }
    setConnecting(null)
  }

  const handleDisconnect = async (id: string) => {
    setDisconnecting(id)
    try {
      await disconnectConnector(id)
      setConnectors(prev => prev.filter(c => c.id !== id))
    } catch { /* ignore */ }
    setDisconnecting(null)
  }

  const handleRefresh = async (id: string) => {
    setRefreshing(id)
    try {
      const updated = await refreshConnector(id)
      setConnectors(prev => prev.map(c => c.id === id ? updated : c))
    } catch { /* ignore */ }
    setRefreshing(null)
  }

  const isProviderConnected = (providerName: string) =>
    connectors.some(c => c.provider === providerName && c.status === 'connected')

  const getConnectorForProvider = (providerName: string) =>
    connectors.find(c => c.provider === providerName && c.status === 'connected')

  const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
      payments: 'bg-amber-900/30 text-amber-400 border-amber-800/50',
      productivity: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
      communication: 'bg-purple-900/30 text-purple-400 border-purple-800/50',
      development: 'bg-green-900/30 text-green-400 border-green-800/50',
      database: 'bg-cyan-900/30 text-cyan-400 border-cyan-800/50',
    }
    return map[cat] || 'bg-warm-900/30 text-warm-400 border-warm-800/50'
  }

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      payments: 'Payments',
      productivity: 'Productivity',
      communication: 'Communication',
      development: 'Development',
      database: 'Database',
    }
    return map[cat] || cat
  }

  const providerIcon = (name: string) => {
    const icons: Record<string, string> = {
      stripe: 'S',
      google: 'G',
      notion: 'N',
      slack: '#',
      github: 'GH',
      supabase: 'SB',
    }
    return icons[name] || name.charAt(0).toUpperCase()
  }

  const providerColor = (name: string) => {
    const colors: Record<string, string> = {
      stripe: 'from-violet-600 to-indigo-700',
      google: 'from-red-500 to-yellow-500',
      notion: 'from-warm-700 to-warm-900',
      slack: 'from-green-500 to-teal-600',
      github: 'from-warm-600 to-warm-800',
      supabase: 'from-emerald-500 to-green-700',
    }
    return colors[name] || 'from-warm-600 to-warm-800'
  }

  const connectedConnectors = connectors.filter(c => c.status === 'connected')

  // Group providers by category
  const categories = ['payments', 'productivity', 'communication', 'development', 'database']
  const groupedProviders = categories
    .map(cat => ({
      category: cat,
      providers: providers.filter(p => p.category === cat)
    }))
    .filter(g => g.providers.length > 0)

  return (
    <div>
      <h3 className="text-xl font-bold mb-1">{t('oauthConnectors.title', 'OAuth Connectors')}</h3>
      <p className="text-warm-400 text-sm mb-6">{t('oauthConnectors.subtitle', 'One-click third-party integrations with platform-managed credentials')}</p>

      <div className="flex gap-2 mb-6">
        {(['connectors', 'connected', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-orange-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t2 === 'connectors' ? t('oauthConnectors.tabs.connectors', 'Connectors')
              : t2 === 'connected' ? t('oauthConnectors.tabs.connected', 'Connected')
              : t('oauthConnectors.tabs.stats', 'Stats')}
            {t2 === 'connected' && connectedConnectors.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">{connectedConnectors.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Connectors Tab */}
      {tab === 'connectors' && (
        <div className="space-y-8">
          {groupedProviders.map(group => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${categoryColor(group.category)}`}>
                  {categoryLabel(group.category)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.providers.map(provider => {
                  const connected = isProviderConnected(provider.name)
                  const connector = getConnectorForProvider(provider.name)
                  return (
                    <div key={provider.name} className={`bg-warm-800/50 rounded-xl p-5 border transition-all ${
                      connected ? 'border-green-800/60 shadow-green-900/10 shadow-lg' : 'border-warm-700/50 hover:border-warm-600'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${providerColor(provider.name)} flex items-center justify-center text-white font-bold text-sm`}>
                            {providerIcon(provider.name)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{provider.displayName}</h4>
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${categoryColor(provider.category)}`}>
                              {categoryLabel(provider.category)}
                            </span>
                          </div>
                        </div>
                        {connected && (
                          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-warm-400 text-sm mb-3 leading-relaxed">{provider.description}</p>
                      <div className="mb-4">
                        <p className="text-xs text-warm-500 mb-1">Scopes:</p>
                        <div className="flex flex-wrap gap-1">
                          {provider.scopes.map(scope => (
                            <span key={scope} className="text-xs px-1.5 py-0.5 bg-warm-700/50 text-warm-300 rounded">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                      {connected ? (
                        <button
                          onClick={() => connector && handleDisconnect(connector.id)}
                          disabled={disconnecting === connector?.id}
                          className="w-full py-2 rounded-lg text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50 transition-colors disabled:opacity-50"
                        >
                          {disconnecting === connector?.id ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(provider.name)}
                          disabled={connecting === provider.name}
                          className="w-full py-2 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
                        >
                          {connecting === provider.name ? 'Connecting...' : 'Connect with OAuth'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {providers.length === 0 && (
            <div className="text-center py-12 text-warm-500">
              <p className="text-lg mb-1">Loading providers...</p>
              <p className="text-sm">Fetching available OAuth connectors</p>
            </div>
          )}
        </div>
      )}

      {/* Connected Tab */}
      {tab === 'connected' && (
        <div>
          {connectedConnectors.length === 0 ? (
            <div className="text-center py-12 text-warm-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warm-800 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
              </div>
              <p className="text-lg mb-1">No connected services</p>
              <p className="text-sm">Go to the Connectors tab to connect a service</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedConnectors.map(connector => (
                <div key={connector.id} className="bg-warm-800/50 rounded-xl p-5 border border-warm-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${providerColor(connector.provider)} flex items-center justify-center text-white font-bold text-sm`}>
                      {providerIcon(connector.provider)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{connector.displayName}</h4>
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          {connector.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-warm-500">
                          Connected: {connector.connectedAt ? new Date(connector.connectedAt).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="text-xs text-warm-500">
                          Last used: {connector.lastUsedAt ? new Date(connector.lastUsedAt).toLocaleDateString() : 'Never'}
                        </span>
                        <span className="text-xs text-warm-500">
                          API calls: {connector.totalApiCalls}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${categoryColor(connector.category)}`}>
                          {categoryLabel(connector.category)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRefresh(connector.id)}
                      disabled={refreshing === connector.id}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-warm-700 text-warm-300 hover:bg-warm-600 transition-colors disabled:opacity-50"
                    >
                      {refreshing === connector.id ? 'Refreshing...' : 'Refresh Token'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(connector.id)}
                      disabled={disconnecting === connector.id}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50 transition-colors disabled:opacity-50"
                    >
                      {disconnecting === connector.id ? 'Removing...' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div>
          {stats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-warm-800/50 rounded-xl p-5 border border-warm-700/50">
                  <p className="text-xs text-warm-500 uppercase tracking-wide mb-1">Total Connected</p>
                  <p className="text-3xl font-bold text-orange-400">{stats.totalConnected}</p>
                  <p className="text-xs text-warm-500 mt-1">active integrations</p>
                </div>
                <div className="bg-warm-800/50 rounded-xl p-5 border border-warm-700/50">
                  <p className="text-xs text-warm-500 uppercase tracking-wide mb-1">Total API Calls</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.totalApiCalls.toLocaleString()}</p>
                  <p className="text-xs text-warm-500 mt-1">across all connectors</p>
                </div>
                <div className="bg-warm-800/50 rounded-xl p-5 border border-warm-700/50">
                  <p className="text-xs text-warm-500 uppercase tracking-wide mb-1">Failed Calls</p>
                  <p className="text-3xl font-bold text-red-400">{stats.failedApiCalls.toLocaleString()}</p>
                  <p className="text-xs text-warm-500 mt-1">errors encountered</p>
                </div>
                <div className="bg-warm-800/50 rounded-xl p-5 border border-warm-700/50">
                  <p className="text-xs text-warm-500 uppercase tracking-wide mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-green-400">
                    {stats.totalApiCalls > 0
                      ? `${((1 - stats.failedApiCalls / stats.totalApiCalls) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-warm-500 mt-1">reliability score</p>
                </div>
                <div className="bg-warm-800/50 rounded-xl p-5 border border-warm-700/50">
                  <p className="text-xs text-warm-500 uppercase tracking-wide mb-1">Categories</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.byCategory.length}</p>
                  <p className="text-xs text-warm-500 mt-1">integration types</p>
                </div>
              </div>

              {stats.byCategory.length > 0 && (
                <div className="bg-warm-800/50 rounded-xl p-5 border border-warm-700/50">
                  <h4 className="font-semibold text-white mb-4">Connections by Category</h4>
                  <div className="space-y-3">
                    {stats.byCategory.map(cat => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <span className={`text-sm px-2 py-0.5 rounded border ${categoryColor(cat.category)}`}>
                          {categoryLabel(cat.category)}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-warm-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${stats.totalConnected > 0 ? (cat.count / stats.totalConnected) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-warm-400 w-8 text-right">{cat.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.connectors.length > 0 && (
                <div className="bg-warm-800/50 rounded-xl p-5 border border-warm-700/50">
                  <h4 className="font-semibold text-white mb-4">All Connectors</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-warm-500 border-b border-warm-700">
                          <th className="pb-2 pr-4">Provider</th>
                          <th className="pb-2 pr-4">Status</th>
                          <th className="pb-2 pr-4">Category</th>
                          <th className="pb-2 pr-4">API Calls</th>
                          <th className="pb-2 pr-4">Failed</th>
                          <th className="pb-2">Connected</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.connectors.map((c, i) => (
                          <tr key={i} className="border-b border-warm-800 text-warm-300">
                            <td className="py-2 pr-4 font-medium text-white">{c.displayName}</td>
                            <td className="py-2 pr-4">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                c.status === 'connected' ? 'bg-green-900/30 text-green-400'
                                  : c.status === 'expired' ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-warm-900/30 text-warm-400'
                              }`}>{c.status}</span>
                            </td>
                            <td className="py-2 pr-4">
                              <span className={`text-xs px-1.5 py-0.5 rounded border ${categoryColor(c.category)}`}>
                                {categoryLabel(c.category)}
                              </span>
                            </td>
                            <td className="py-2 pr-4">{c.totalApiCalls.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-red-400">{c.failedApiCalls}</td>
                            <td className="py-2 text-warm-500">{c.connectedAt ? new Date(c.connectedAt).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-warm-500">
              <p>Loading statistics...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
