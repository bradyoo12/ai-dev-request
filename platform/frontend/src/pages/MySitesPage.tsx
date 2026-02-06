import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getSites, getSiteDetail, deleteSite, redeploySite } from '../api/sites'
import type { SiteResponse, SiteDetailResponse } from '../api/sites'

export default function MySitesPage() {
  const { t } = useTranslation()
  const [sites, setSites] = useState<SiteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSite, setSelectedSite] = useState<SiteDetailResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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

  const handleViewDetails = async (id: string) => {
    try {
      const detail = await getSiteDetail(id)
      setSelectedSite(detail)
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

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'Running': return { color: 'bg-green-500', label: t('sites.status.running') }
      case 'Pending': return { color: 'bg-gray-500', label: t('sites.status.pending') }
      case 'Provisioning': return { color: 'bg-blue-500 animate-pulse', label: t('sites.status.provisioning') }
      case 'Building': return { color: 'bg-blue-500 animate-pulse', label: t('sites.status.building') }
      case 'Deploying': return { color: 'bg-blue-500 animate-pulse', label: t('sites.status.deploying') }
      case 'Failed': return { color: 'bg-red-500', label: t('sites.status.failed') }
      default: return { color: 'bg-gray-500', label: status }
    }
  }

  const isDeploying = (status: string) =>
    status === 'Pending' || status === 'Provisioning' || status === 'Building' || status === 'Deploying'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('sites.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('sites.title')}</h2>
        <span className="text-gray-400 text-sm">{t('sites.count', { count: sites.length })}</span>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {sites.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-2xl">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-bold mb-2">{t('sites.empty.title')}</h3>
          <p className="text-gray-400">{t('sites.empty.description')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map(site => {
            const status = getStatusIndicator(site.status)
            return (
              <div key={site.id} className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                    <h3 className="text-lg font-bold">{site.siteName}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    site.status === 'Running' ? 'bg-green-900/50 text-green-400' :
                    site.status === 'Failed' ? 'bg-red-900/50 text-red-400' :
                    isDeploying(site.status) ? 'bg-blue-900/50 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-gray-500">{t('sites.created')}</div>
                    <div>{formatDate(site.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('sites.resourceGroup')}</div>
                    <div className="font-mono text-xs truncate">{site.resourceGroupName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('sites.region')}</div>
                    <div>{site.region}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('sites.projectType')}</div>
                    <div>{site.projectType || '—'}</div>
                  </div>
                </div>

                {site.previewUrl && (
                  <div className="bg-gray-900 rounded-lg p-3 mb-4">
                    <div className="text-gray-500 text-xs mb-1">URL</div>
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
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
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
          <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{t('sites.detailTitle')}: {selectedSite.siteName}</h3>
              <button
                onClick={() => setSelectedSite(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-4">
                <h4 className="font-bold mb-3">{t('sites.generalInfo')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">{t('sites.siteName')}</div>
                    <div>{selectedSite.siteName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('sites.status.label')}</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusIndicator(selectedSite.status).color}`}></div>
                      {getStatusIndicator(selectedSite.status).label}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('sites.created')}</div>
                    <div>{formatDate(selectedSite.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('sites.projectType')}</div>
                    <div>{selectedSite.projectType || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4">
                <h4 className="font-bold mb-3">{t('sites.azureResources')}</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('sites.resourceGroup')}</span>
                    <span className="font-mono text-xs">{selectedSite.resourceGroupName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('sites.containerApp')}</span>
                    <span className="font-mono text-xs">{selectedSite.containerAppName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('sites.containerImage')}</span>
                    <span className="font-mono text-xs">{selectedSite.containerImageTag || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('sites.region')}</span>
                    <span>{selectedSite.region}</span>
                  </div>
                </div>
              </div>

              {selectedSite.previewUrl && (
                <div className="bg-gray-900 rounded-xl p-4">
                  <h4 className="font-bold mb-3">{t('sites.urls')}</h4>
                  <div className="text-sm">
                    <div className="text-gray-500 mb-1">{t('sites.previewUrl')}</div>
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
              )}

              {selectedSite.logs.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4">
                  <h4 className="font-bold mb-3">{t('sites.deploymentLog')}</h4>
                  <div className="bg-black rounded-lg p-3 font-mono text-xs overflow-y-auto max-h-64 space-y-1">
                    {selectedSite.logs.map((log, i) => (
                      <div key={i} className={`${
                        log.level === 'error' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        <span className="text-gray-600">
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
                onClick={() => setSelectedSite(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                {t('sites.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-red-400">{t('sites.deleteConfirm.title')}</h3>
            <p className="text-gray-400 mb-6">{t('sites.deleteConfirm.description')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
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
