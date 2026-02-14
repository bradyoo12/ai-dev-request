import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getManagedBackends,
  provisionManagedBackend,
  deprovisionManagedBackend,
  getManagedBackendStats,
  healthCheckManagedBackend,
  updateManagedBackendTier,
  type ManagedBackend,
  type ManagedBackendStats,
} from '../api/managed-backend'

type Tab = 'backends' | 'provision' | 'health' | 'stats'

export default function ManagedBackendPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('backends')
  const [backends, setBackends] = useState<ManagedBackend[]>([])
  const [stats, setStats] = useState<ManagedBackendStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Provision form
  const [projectId, setProjectId] = useState('')
  const [tier, setTier] = useState('Free')
  const [provisioning, setProvisioning] = useState(false)

  // Health check
  const [healthCheckLoading, setHealthCheckLoading] = useState<string | null>(null)

  useEffect(() => {
    if (tab === 'backends' || tab === 'health') loadBackends()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadBackends() {
    setLoading(true)
    setError('')
    try {
      const data = await getManagedBackends()
      setBackends(data)
    } catch {
      setBackends([])
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    setLoading(true)
    try {
      const data = await getManagedBackendStats()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleProvision() {
    if (!projectId.trim()) return
    setProvisioning(true)
    setError('')
    try {
      await provisionManagedBackend(projectId.trim(), tier)
      setProjectId('')
      setTier('Free')
      setTab('backends')
      await loadBackends()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('managedBackend.error.provisionFailed'))
    } finally {
      setProvisioning(false)
    }
  }

  async function handleDeprovision(id: string) {
    setError('')
    try {
      await deprovisionManagedBackend(id)
      await loadBackends()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('managedBackend.error.deprovisionFailed'))
    }
  }

  async function handleHealthCheck(id: string) {
    setHealthCheckLoading(id)
    setError('')
    try {
      const updated = await healthCheckManagedBackend(id)
      setBackends(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('managedBackend.error.healthCheckFailed'))
    } finally {
      setHealthCheckLoading(null)
    }
  }

  async function handleUpdateTier(id: string, newTier: string) {
    setError('')
    try {
      const updated = await updateManagedBackendTier(id, newTier)
      setBackends(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('managedBackend.error.updateTierFailed'))
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-900/50 text-green-300'
      case 'Provisioning': return 'bg-blue-900/50 text-blue-300'
      case 'Suspended': return 'bg-yellow-900/50 text-yellow-300'
      case 'Deprovisioning': return 'bg-red-900/50 text-red-300'
      case 'Deleted': return 'bg-warm-700 text-warm-400'
      default: return 'bg-warm-700 text-warm-300'
    }
  }

  const tierBadge = (tierVal: string) => {
    switch (tierVal) {
      case 'Pro': return 'bg-purple-900/50 text-purple-300'
      case 'Basic': return 'bg-blue-900/50 text-blue-300'
      default: return 'bg-warm-700 text-warm-300'
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'backends', label: t('managedBackend.tabs.backends', 'Backends') },
    { key: 'provision', label: t('managedBackend.tabs.provision', 'Provision') },
    { key: 'health', label: t('managedBackend.tabs.health', 'Health') },
    { key: 'stats', label: t('managedBackend.tabs.stats', 'Stats') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold">{t('managedBackend.title', 'Managed Backend')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('managedBackend.subtitle', 'Auto-provisioned database, auth, storage, and hosting for generated projects')}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Backends Tab */}
      {!loading && tab === 'backends' && (
        <>
          {backends.length === 0 ? (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <p className="text-warm-400 mb-2">{t('managedBackend.empty', 'No managed backends provisioned yet.')}</p>
              <p className="text-warm-500 text-sm">{t('managedBackend.emptyHint', 'Go to the Provision tab to create a new managed backend for a project.')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backends.map((backend) => (
                <div key={backend.id} className="bg-warm-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(backend.status)}`}>
                        {backend.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierBadge(backend.tier)}`}>
                        {backend.tier}
                      </span>
                      <span className="text-sm text-warm-400 font-mono">{backend.id.substring(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {backend.status === 'Active' && (
                        <>
                          <select
                            value={backend.tier}
                            onChange={(e) => handleUpdateTier(backend.id, e.target.value)}
                            className="bg-warm-700 border border-warm-600 rounded px-2 py-1 text-xs"
                          >
                            <option value="Free">Free</option>
                            <option value="Basic">Basic</option>
                            <option value="Pro">Pro</option>
                          </select>
                          <button
                            onClick={() => handleDeprovision(backend.id)}
                            className="px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded text-xs transition-colors"
                          >
                            {t('managedBackend.deprovision', 'Deprovision')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Preview URL */}
                  {backend.previewUrl && (
                    <div className="mb-3">
                      <span className="text-xs text-warm-500">{t('managedBackend.previewUrl', 'Preview URL')}:</span>
                      <a href={backend.previewUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm text-blue-400 hover:text-blue-300 font-mono">
                        {backend.previewUrl}
                      </a>
                    </div>
                  )}

                  {/* Details grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-warm-500">{t('managedBackend.projectId', 'Project ID')}:</span>
                      <span className="ml-1 text-warm-300 font-mono">{backend.projectId.substring(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="text-warm-500">{t('managedBackend.database', 'Database')}:</span>
                      <span className="ml-1 text-warm-300">{backend.databaseType}</span>
                    </div>
                    <div>
                      <span className="text-warm-500">{t('managedBackend.auth', 'Auth')}:</span>
                      <span className="ml-1 text-warm-300">{backend.authProvider}</span>
                    </div>
                    <div>
                      <span className="text-warm-500">{t('managedBackend.storage', 'Storage')}:</span>
                      <span className="ml-1 text-warm-300">{backend.storageProvider}</span>
                    </div>
                    <div>
                      <span className="text-warm-500">{t('managedBackend.region', 'Region')}:</span>
                      <span className="ml-1 text-warm-300">{backend.region}</span>
                    </div>
                    <div>
                      <span className="text-warm-500">{t('managedBackend.cpu', 'CPU')}:</span>
                      <span className="ml-1 text-warm-300">{backend.cpuCores} {t('managedBackend.cores', 'cores')}</span>
                    </div>
                    <div>
                      <span className="text-warm-500">{t('managedBackend.memory', 'Memory')}:</span>
                      <span className="ml-1 text-warm-300">{backend.memoryGb} GB</span>
                    </div>
                    <div>
                      <span className="text-warm-500">{t('managedBackend.storageLimitLabel', 'Storage Limit')}:</span>
                      <span className="ml-1 text-warm-300">{backend.storageLimitGb} GB</span>
                    </div>
                  </div>

                  {/* Cost & Timestamps */}
                  <div className="mt-3 flex items-center gap-6 text-xs text-warm-500">
                    <span>{t('managedBackend.cost', 'Cost')}: ${backend.currentMonthCost.toFixed(2)} / ${backend.monthlyBudget.toFixed(2)}</span>
                    {backend.provisionedAt && <span>{t('managedBackend.provisioned', 'Provisioned')}: {new Date(backend.provisionedAt).toLocaleString()}</span>}
                    {backend.lastHealthCheck && <span>{t('managedBackend.lastCheck', 'Last Check')}: {new Date(backend.lastHealthCheck).toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Provision Tab */}
      {!loading && tab === 'provision' && (
        <div className="bg-warm-800 rounded-xl p-6">
          <h4 className="font-semibold mb-4">{t('managedBackend.provisionTitle', 'Provision New Backend')}</h4>
          <p className="text-warm-400 text-sm mb-6">{t('managedBackend.provisionDescription', 'Auto-provision a managed backend with database, authentication, storage, and hosting for your project.')}</p>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('managedBackend.projectId', 'Project ID')}</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder={t('managedBackend.projectIdPlaceholder', 'Enter project GUID')}
                className="w-full bg-warm-700 border border-warm-600 rounded-lg px-4 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('managedBackend.tierLabel', 'Tier')}</label>
              <div className="grid grid-cols-3 gap-3">
                {['Free', 'Basic', 'Pro'].map((t_val) => (
                  <button
                    key={t_val}
                    onClick={() => setTier(t_val)}
                    className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                      tier === t_val
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-warm-600 bg-warm-700 hover:border-warm-500'
                    }`}
                  >
                    <div className="font-semibold">{t_val}</div>
                    <div className="text-xs text-warm-400 mt-1">
                      {t_val === 'Free' && t('managedBackend.tierFreeDesc', '0.25 CPU, 0.5GB RAM, 1GB Storage')}
                      {t_val === 'Basic' && t('managedBackend.tierBasicDesc', '0.5 CPU, 1GB RAM, 5GB Storage')}
                      {t_val === 'Pro' && t('managedBackend.tierProDesc', '1.0 CPU, 2GB RAM, 20GB Storage')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* What gets provisioned */}
            <div className="bg-warm-700/50 rounded-lg p-4">
              <div className="text-sm font-medium mb-2">{t('managedBackend.included', 'What gets provisioned:')}</div>
              <ul className="space-y-1 text-xs text-warm-400">
                <li>- PostgreSQL {t('managedBackend.includedDb', 'database with dedicated schema')}</li>
                <li>- BradYoo.Core {t('managedBackend.includedAuth', 'authentication (JWT + Social)')}</li>
                <li>- Azure Blob {t('managedBackend.includedStorage', 'storage for file uploads')}</li>
                <li>- Azure Container Apps {t('managedBackend.includedHosting', 'hosting with preview URL')}</li>
              </ul>
            </div>

            <button
              onClick={handleProvision}
              disabled={provisioning || !projectId.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
            >
              {provisioning
                ? t('managedBackend.provisioning', 'Provisioning...')
                : t('managedBackend.provisionBtn', 'Provision Backend')}
            </button>
          </div>
        </div>
      )}

      {/* Health Tab */}
      {!loading && tab === 'health' && (
        <>
          {backends.length === 0 ? (
            <div className="bg-warm-800 rounded-xl p-12 text-center">
              <p className="text-warm-400">{t('managedBackend.noBackendsHealth', 'No backends to monitor. Provision one first.')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backends.filter(b => b.status !== 'Deleted').map((backend) => (
                <div key={backend.id} className="bg-warm-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        backend.status === 'Active' ? 'bg-green-400 animate-pulse' :
                        backend.status === 'Provisioning' ? 'bg-blue-400 animate-pulse' :
                        backend.status === 'Suspended' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`} />
                      <span className="font-medium text-sm">{backend.containerAppId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(backend.status)}`}>
                        {backend.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleHealthCheck(backend.id)}
                      disabled={healthCheckLoading === backend.id}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded text-xs font-medium transition-colors"
                    >
                      {healthCheckLoading === backend.id
                        ? t('managedBackend.checking', 'Checking...')
                        : t('managedBackend.runCheck', 'Run Health Check')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-warm-700/50 rounded-lg p-3">
                      <div className="text-xs text-warm-500 mb-1">{t('managedBackend.database', 'Database')}</div>
                      <div className="text-sm font-medium text-green-400">{t('managedBackend.healthOk', 'OK')}</div>
                    </div>
                    <div className="bg-warm-700/50 rounded-lg p-3">
                      <div className="text-xs text-warm-500 mb-1">{t('managedBackend.auth', 'Auth')}</div>
                      <div className="text-sm font-medium text-green-400">{t('managedBackend.healthOk', 'OK')}</div>
                    </div>
                    <div className="bg-warm-700/50 rounded-lg p-3">
                      <div className="text-xs text-warm-500 mb-1">{t('managedBackend.storage', 'Storage')}</div>
                      <div className="text-sm font-medium text-green-400">{t('managedBackend.healthOk', 'OK')}</div>
                    </div>
                    <div className="bg-warm-700/50 rounded-lg p-3">
                      <div className="text-xs text-warm-500 mb-1">{t('managedBackend.hosting', 'Hosting')}</div>
                      <div className="text-sm font-medium text-green-400">{t('managedBackend.healthOk', 'OK')}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-6 text-xs text-warm-500">
                    <span>{t('managedBackend.cpu', 'CPU')}: {backend.cpuCores} {t('managedBackend.cores', 'cores')}</span>
                    <span>{t('managedBackend.memory', 'Memory')}: {backend.memoryGb} GB</span>
                    <span>{t('managedBackend.cost', 'Cost')}: ${backend.currentMonthCost.toFixed(2)}</span>
                    {backend.lastHealthCheck && <span>{t('managedBackend.lastCheck', 'Last Check')}: {new Date(backend.lastHealthCheck).toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Stats Tab */}
      {!loading && tab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Status Distribution */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-4">{t('managedBackend.statsStatus', 'Status Distribution')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: t('managedBackend.statsTotal', 'Total'), value: stats.total, color: 'text-white' },
                { label: t('managedBackend.statsActive', 'Active'), value: stats.active, color: 'text-green-400' },
                { label: t('managedBackend.statsProvisioning', 'Provisioning'), value: stats.provisioning, color: 'text-blue-400' },
                { label: t('managedBackend.statsSuspended', 'Suspended'), value: stats.suspended, color: 'text-yellow-400' },
                { label: t('managedBackend.statsDeprovisioning', 'Deprovisioning'), value: stats.deprovisioning, color: 'text-red-400' },
                { label: t('managedBackend.statsDeleted', 'Deleted'), value: stats.deleted, color: 'text-warm-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-warm-700/50 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-warm-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-4">{t('managedBackend.statsTier', 'Tier Distribution')}</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Free', value: stats.freeTier, color: 'text-warm-300' },
                { label: 'Basic', value: stats.basicTier, color: 'text-blue-400' },
                { label: 'Pro', value: stats.proTier, color: 'text-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-warm-700/50 rounded-lg p-4 text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-warm-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Cost */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="font-semibold mb-4">{t('managedBackend.statsCost', 'Monthly Cost')}</h4>
            <div className="bg-warm-700/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">${stats.totalMonthlyCost.toFixed(2)}</div>
              <div className="text-xs text-warm-500 mt-1">{t('managedBackend.totalActiveCost', 'Total cost across all active backends this month')}</div>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'stats' && !stats && (
        <div className="bg-warm-800 rounded-xl p-12 text-center">
          <p className="text-warm-400">{t('managedBackend.statsUnavailable', 'Statistics are not available at this time.')}</p>
        </div>
      )}
    </div>
  )
}
