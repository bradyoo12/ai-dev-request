import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getSites, getSiteDetail, deleteSite, redeploySite } from '../api/sites'
import type { SiteResponse, SiteDetailResponse } from '../api/sites'
import { searchDomains, getSiteDomain, purchaseDomain, removeSiteDomain } from '../api/domains'
import type { DomainSearchResult, DomainResponse } from '../api/domains'

export default function MySitesPage() {
  const { t } = useTranslation()
  const [sites, setSites] = useState<SiteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSite, setSelectedSite] = useState<SiteDetailResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Domain state
  const [siteDomain, setSiteDomain] = useState<DomainResponse | null>(null)
  const [domainQuery, setDomainQuery] = useState('')
  const [domainResults, setDomainResults] = useState<DomainSearchResult[]>([])
  const [domainSearching, setDomainSearching] = useState(false)
  const [domainPurchasing, setDomainPurchasing] = useState(false)
  const [purchaseConfirm, setPurchaseConfirm] = useState<DomainSearchResult | null>(null)
  const [domainError, setDomainError] = useState('')
  const [domainRemoving, setDomainRemoving] = useState(false)

  const loadSites = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getSites()
      setSites(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadSites()
  }, [loadSites])

  // Poll for status updates on deploying sites
  useEffect(() => {
    const hasDeploying = sites.some(s =>
      s.status === 'Pending' || s.status === 'Provisioning' || s.status === 'Building' || s.status === 'Deploying'
    )
    if (!hasDeploying) return

    const interval = setInterval(loadSites, 5000)
    return () => clearInterval(interval)
  }, [sites, loadSites])

  // Poll domain status when domain is pending/registering
  useEffect(() => {
    if (!selectedSite || !siteDomain) return
    const isPending = siteDomain.status === 'Pending' || siteDomain.status === 'Registering'
    const isDnsPending = siteDomain.dnsStatus === 'Pending' || siteDomain.dnsStatus === 'Configuring'
    const isSslPending = siteDomain.sslStatus === 'Pending' || siteDomain.sslStatus === 'Provisioning'
    if (!isPending && !isDnsPending && !isSslPending) return

    const interval = setInterval(async () => {
      const updated = await getSiteDomain(selectedSite.id)
      if (updated) setSiteDomain(updated)
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedSite, siteDomain])

  const handleViewDetails = async (id: string) => {
    try {
      const detail = await getSiteDetail(id)
      setSelectedSite(detail)
      setDomainQuery('')
      setDomainResults([])
      setDomainError('')
      // Load domain info
      const domain = await getSiteDomain(id)
      setSiteDomain(domain)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSite(id)
      setSites(prev => prev.filter(s => s.id !== id))
      setDeleteConfirm(null)
      if (selectedSite?.id === id) setSelectedSite(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    }
  }

  const handleRedeploy = async (id: string) => {
    try {
      await redeploySite(id)
      await loadSites()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.requestFailed'))
    }
  }

  const handleDomainSearch = async () => {
    if (!domainQuery.trim()) return
    setDomainSearching(true)
    setDomainError('')
    try {
      const results = await searchDomains(domainQuery.trim())
      setDomainResults(results)
    } catch (err) {
      setDomainError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setDomainSearching(false)
    }
  }

  const handleDomainPurchase = async (result: DomainSearchResult) => {
    if (!selectedSite || !result.priceUsd) return
    setDomainPurchasing(true)
    setDomainError('')
    try {
      const domain = await purchaseDomain(
        selectedSite.id, result.domainName, result.tld, result.priceUsd, 'Card'
      )
      setSiteDomain(domain)
      setPurchaseConfirm(null)
      setDomainResults([])
      setDomainQuery('')
    } catch (err) {
      setDomainError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setDomainPurchasing(false)
    }
  }

  const handleDomainRemove = async () => {
    if (!selectedSite) return
    setDomainRemoving(true)
    try {
      await removeSiteDomain(selectedSite.id)
      setSiteDomain(null)
    } catch (err) {
      setDomainError(err instanceof Error ? err.message : t('error.requestFailed'))
    } finally {
      setDomainRemoving(false)
    }
  }

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'Running': return { color: 'bg-green-500', label: t('sites.status.running') }
      case 'Pending': return { color: 'bg-warm-500', label: t('sites.status.pending') }
      case 'Provisioning': return { color: 'bg-blue-500 animate-pulse', label: t('sites.status.provisioning') }
      case 'Building': return { color: 'bg-blue-500 animate-pulse', label: t('sites.status.building') }
      case 'Deploying': return { color: 'bg-blue-500 animate-pulse', label: t('sites.status.deploying') }
      case 'Failed': return { color: 'bg-red-500', label: t('sites.status.failed') }
      default: return { color: 'bg-warm-500', label: status }
    }
  }

  const isDeploying = (status: string) =>
    status === 'Pending' || status === 'Provisioning' || status === 'Building' || status === 'Deploying'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const getDomainStatusBadge = (domain: DomainResponse) => {
    const isSetup = domain.status === 'Pending' || domain.status === 'Registering'
    if (isSetup) return { bg: 'bg-blue-900/50 text-blue-400', label: t('domain.status.setting_up') }
    if (domain.status === 'Active') return { bg: 'bg-green-900/50 text-green-400', label: t('domain.status.active') }
    if (domain.status === 'Expired') return { bg: 'bg-red-900/50 text-red-400', label: t('domain.status.expired') }
    return { bg: 'bg-warm-700 text-warm-400', label: domain.status }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-warm-400">{t('sites.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('sites.title')}</h2>
        <span className="text-warm-400 text-sm">{t('sites.count', { count: sites.length })}</span>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {sites.length === 0 ? (
        <div className="text-center py-16 bg-warm-800 rounded-2xl">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-bold mb-2">{t('sites.empty.title')}</h3>
          <p className="text-warm-400">{t('sites.empty.description')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map(site => {
            const status = getStatusIndicator(site.status)
            return (
              <div key={site.id} className="bg-warm-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                    <h3 className="text-lg font-bold">{site.siteName}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    site.status === 'Running' ? 'bg-green-900/50 text-green-400' :
                    site.status === 'Failed' ? 'bg-red-900/50 text-red-400' :
                    isDeploying(site.status) ? 'bg-blue-900/50 text-blue-400' :
                    'bg-warm-700 text-warm-400'
                  }`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-warm-500">{t('sites.created')}</div>
                    <div>{formatDate(site.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-warm-500">{t('sites.resourceGroup')}</div>
                    <div className="font-mono text-xs truncate">{site.resourceGroupName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-warm-500">{t('sites.region')}</div>
                    <div>{site.region}</div>
                  </div>
                  <div>
                    <div className="text-warm-500">{t('sites.projectType')}</div>
                    <div>{site.projectType || '—'}</div>
                  </div>
                </div>

                {site.previewUrl && (
                  <div className="bg-warm-900 rounded-lg p-3 mb-4">
                    <div className="text-warm-500 text-xs mb-1">URL</div>
                    <a
                      href={site.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm break-all"
                    >
                      {site.previewUrl}
                    </a>
                  </div>
                )}

                {isDeploying(site.status) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      {status.label}...
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {site.previewUrl && site.status === 'Running' && (
                    <a
                      href={site.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                    >
                      {t('sites.openSite')}
                    </a>
                  )}
                  <button
                    onClick={() => handleViewDetails(site.id)}
                    className="px-3 py-1.5 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
                  >
                    {t('sites.details')}
                  </button>
                  {site.status === 'Failed' && (
                    <button
                      onClick={() => handleRedeploy(site.id)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm transition-colors"
                    >
                      {t('sites.retryDeploy')}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(site.id)}
                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    {t('sites.delete')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Site Details Modal */}
      {selectedSite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{t('sites.detailTitle')}: {selectedSite.siteName}</h3>
              <button
                onClick={() => { setSelectedSite(null); setSiteDomain(null) }}
                className="text-warm-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-warm-900 rounded-xl p-4">
                <h4 className="font-bold mb-3">{t('sites.generalInfo')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-warm-500">{t('sites.siteName')}</div>
                    <div>{selectedSite.siteName}</div>
                  </div>
                  <div>
                    <div className="text-warm-500">{t('sites.status.label')}</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusIndicator(selectedSite.status).color}`}></div>
                      {getStatusIndicator(selectedSite.status).label}
                    </div>
                  </div>
                  <div>
                    <div className="text-warm-500">{t('sites.created')}</div>
                    <div>{formatDate(selectedSite.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-warm-500">{t('sites.projectType')}</div>
                    <div>{selectedSite.projectType || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Custom Domain Section */}
              <div className="bg-warm-900 rounded-xl p-4">
                <h4 className="font-bold mb-3">{t('domain.title')}</h4>

                {siteDomain ? (
                  <div className="space-y-3">
                    {/* Domain info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">https://{siteDomain.domainName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getDomainStatusBadge(siteDomain).bg}`}>
                          {getDomainStatusBadge(siteDomain).label}
                        </span>
                      </div>
                    </div>

                    {/* Domain setup progress */}
                    {(siteDomain.status === 'Pending' || siteDomain.status === 'Registering') && (
                      <div className="bg-warm-800 rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-blue-400">{t('domain.setup.inProgress')}</span>
                        </div>
                        <div className="space-y-1 ml-6">
                          <div className={siteDomain.status !== 'Pending' ? 'text-green-400' : 'text-warm-500'}>
                            {siteDomain.status !== 'Pending' ? '\u2713' : '\u25CB'} {t('domain.setup.registration')}
                          </div>
                          <div className={siteDomain.dnsStatus === 'Propagated' ? 'text-green-400' : 'text-warm-500'}>
                            {siteDomain.dnsStatus === 'Propagated' ? '\u2713' : '\u25CB'} {t('domain.setup.dns')}
                          </div>
                          <div className={siteDomain.sslStatus === 'Active' ? 'text-green-400' : 'text-warm-500'}>
                            {siteDomain.sslStatus === 'Active' ? '\u2713' : '\u25CB'} {t('domain.setup.ssl')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Active domain details */}
                    {siteDomain.status === 'Active' && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-warm-500">{t('domain.registered')}</div>
                          <div>{siteDomain.registeredAt ? formatDate(siteDomain.registeredAt) : '—'}</div>
                        </div>
                        <div>
                          <div className="text-warm-500">{t('domain.expires')}</div>
                          <div>{siteDomain.expiresAt ? formatDate(siteDomain.expiresAt) : '—'}</div>
                        </div>
                        <div>
                          <div className="text-warm-500">{t('domain.autoRenew')}</div>
                          <div>{siteDomain.autoRenew ? t('domain.enabled') : t('domain.disabled')}</div>
                        </div>
                        <div>
                          <div className="text-warm-500">{t('domain.annualCost')}</div>
                          <div>${siteDomain.annualCostUsd.toFixed(2)}/{t('domain.year')}</div>
                        </div>
                        <div>
                          <div className="text-warm-500">SSL</div>
                          <div className={siteDomain.sslStatus === 'Active' ? 'text-green-400' : 'text-yellow-400'}>
                            {siteDomain.sslStatus === 'Active' ? t('domain.sslActive') : siteDomain.sslStatus}
                          </div>
                        </div>
                        <div>
                          <div className="text-warm-500">DNS</div>
                          <div className={siteDomain.dnsStatus === 'Propagated' ? 'text-green-400' : 'text-yellow-400'}>
                            {siteDomain.dnsStatus === 'Propagated' ? t('domain.dnsPropagated') : siteDomain.dnsStatus}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-warm-500 mt-2">{t('domain.managedNotice')}</div>

                    <button
                      onClick={handleDomainRemove}
                      disabled={domainRemoving}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      {domainRemoving ? t('auth.processing') : t('domain.remove')}
                    </button>
                  </div>
                ) : selectedSite.status === 'Running' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-warm-400">{t('domain.searchDescription')}</p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={domainQuery}
                        onChange={(e) => setDomainQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDomainSearch()}
                        placeholder={t('domain.searchPlaceholder')}
                        className="flex-1 px-3 py-2 bg-warm-800 border border-warm-700 rounded-lg text-sm text-white placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleDomainSearch}
                        disabled={domainSearching || !domainQuery.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                      >
                        {domainSearching ? t('auth.processing') : t('domain.search')}
                      </button>
                    </div>

                    {domainError && (
                      <div className="text-sm text-red-400">{domainError}</div>
                    )}

                    {domainResults.length > 0 && (
                      <div className="bg-warm-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-warm-700">
                              <th className="text-left py-2 px-3 text-warm-500 font-medium">{t('domain.columnDomain')}</th>
                              <th className="text-center py-2 px-3 text-warm-500 font-medium">{t('domain.columnStatus')}</th>
                              <th className="text-right py-2 px-3 text-warm-500 font-medium">{t('domain.columnPrice')}</th>
                              <th className="text-right py-2 px-3 text-warm-500 font-medium"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {domainResults.map((result) => (
                              <tr key={result.domainName} className="border-b border-warm-700/50">
                                <td className="py-2 px-3 font-mono text-xs">{result.domainName}</td>
                                <td className="py-2 px-3 text-center">
                                  {result.available ? (
                                    <span className="text-green-400 text-xs">{t('domain.available')}</span>
                                  ) : (
                                    <span className="text-red-400 text-xs">{t('domain.taken')}</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {result.priceUsd != null ? `$${result.priceUsd.toFixed(2)}/${t('domain.year')}` : '—'}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {result.available && result.priceUsd != null && (
                                    <button
                                      onClick={() => setPurchaseConfirm(result)}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                                    >
                                      {t('domain.buy')}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-warm-500">{t('domain.siteNotRunning')}</p>
                )}
              </div>

              <div className="bg-warm-900 rounded-xl p-4">
                <h4 className="font-bold mb-3">{t('sites.azureResources')}</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-warm-500">{t('sites.resourceGroup')}</span>
                    <span className="font-mono text-xs">{selectedSite.resourceGroupName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">{t('sites.containerApp')}</span>
                    <span className="font-mono text-xs">{selectedSite.containerAppName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">{t('sites.containerImage')}</span>
                    <span className="font-mono text-xs">{selectedSite.containerImageTag || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">{t('sites.region')}</span>
                    <span>{selectedSite.region}</span>
                  </div>
                </div>
              </div>

              {selectedSite.previewUrl && (
                <div className="bg-warm-900 rounded-xl p-4">
                  <h4 className="font-bold mb-3">{t('sites.urls')}</h4>
                  <div className="text-sm space-y-2">
                    {siteDomain?.status === 'Active' && (
                      <div>
                        <div className="text-warm-500 mb-1">{t('domain.customDomain')}</div>
                        <a
                          href={`https://${siteDomain.domainName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 break-all"
                        >
                          https://{siteDomain.domainName}
                        </a>
                      </div>
                    )}
                    <div>
                      <div className="text-warm-500 mb-1">{t('sites.previewUrl')}</div>
                      <a
                        href={selectedSite.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 break-all"
                      >
                        {selectedSite.previewUrl}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {selectedSite.logs.length > 0 && (
                <div className="bg-warm-900 rounded-xl p-4">
                  <h4 className="font-bold mb-3">{t('sites.deploymentLog')}</h4>
                  <div className="bg-black rounded-lg p-3 font-mono text-xs overflow-y-auto max-h-64 space-y-1">
                    {selectedSite.logs.map((log, i) => (
                      <div key={i} className={`${
                        log.level === 'error' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        <span className="text-warm-600">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {' '}{log.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {selectedSite.previewUrl && selectedSite.status === 'Running' && (
                <a
                  href={selectedSite.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-center font-medium transition-colors"
                >
                  {t('sites.openSite')}
                </a>
              )}
              <button
                onClick={() => { setSelectedSite(null); setSiteDomain(null) }}
                className="flex-1 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg font-medium transition-colors"
              >
                {t('sites.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Purchase Confirmation */}
      {purchaseConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-warm-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{t('domain.purchaseTitle')}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('domain.columnDomain')}</span>
                <span className="font-mono">{purchaseConfirm.domainName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warm-400">{t('domain.columnPrice')}</span>
                <span>${purchaseConfirm.priceUsd?.toFixed(2)}/{t('domain.year')}</span>
              </div>
              <div className="border-t border-warm-700 pt-3 text-sm text-warm-400 space-y-1">
                <div>{t('domain.includesRegistration')}</div>
                <div>{t('domain.includesDns')}</div>
                <div>{t('domain.includesSsl')}</div>
                <div>{t('domain.includesAutoRenew')}</div>
              </div>
            </div>
            {domainError && (
              <div className="text-sm text-red-400 mb-4">{domainError}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setPurchaseConfirm(null); setDomainError('') }}
                disabled={domainPurchasing}
                className="flex-1 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg transition-colors"
              >
                {t('tokens.confirm.cancel')}
              </button>
              <button
                onClick={() => handleDomainPurchase(purchaseConfirm)}
                disabled={domainPurchasing}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                {domainPurchasing ? t('auth.processing') : `${t('domain.purchaseButton')} $${purchaseConfirm.priceUsd?.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-400">{t('sites.deleteConfirm.title')}</h3>
            <p className="text-warm-400 mb-6">{t('sites.deleteConfirm.description')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg transition-colors"
              >
                {t('tokens.confirm.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                {t('sites.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
