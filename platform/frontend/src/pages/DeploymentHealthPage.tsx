import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHealthConfig, updateHealthConfig, getHealthStats, getHealthEvents, getIncidents } from '../api/deploymenthealth'
import type { DeploymentHealthConfig, HealthStats, HealthEvent, IncidentRecord } from '../api/deploymenthealth'

const STATUS_COLORS: Record<string, string> = {
  up: 'text-green-400 bg-green-500/10 border-green-500/30',
  degraded: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  down: 'text-red-400 bg-red-500/10 border-red-500/30',
  unknown: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

const STATUS_DOT: Record<string, string> = {
  up: 'bg-green-400',
  degraded: 'bg-yellow-400',
  down: 'bg-red-400',
  unknown: 'bg-gray-400',
}

export default function DeploymentHealthPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('')
  const [config, setConfig] = useState<DeploymentHealthConfig | null>(null)
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [incidents, setIncidents] = useState<IncidentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'overview' | 'events' | 'incidents' | 'settings'>('overview')

  async function loadHealth() {
    if (!projectId.trim()) return
    try {
      setLoading(true)
      setError('')
      const [configRes, statsRes, eventsRes, incidentsRes] = await Promise.all([
        getHealthConfig(projectId),
        getHealthStats(projectId).catch(() => null),
        getHealthEvents(projectId).catch(() => []),
        getIncidents(projectId).catch(() => []),
      ])
      setConfig(configRes)
      setStats(statsRes)
      setEvents(eventsRes)
      setIncidents(incidentsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deploymentHealth.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveConfig() {
    if (!config) return
    try {
      setLoading(true)
      setError('')
      const updated = await updateHealthConfig(projectId, {
        deploymentUrl: config.deploymentUrl,
        monitoringEnabled: config.monitoringEnabled,
        checkIntervalSeconds: config.checkIntervalSeconds,
        errorRateThreshold: config.errorRateThreshold,
        latencyThresholdMs: config.latencyThresholdMs,
        autoRollbackEnabled: config.autoRollbackEnabled,
      })
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deploymentHealth.error.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  function formatMs(ms: number): string {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.round(ms)}ms`
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('deploymentHealth.title')}</h3>
        <p className="text-sm text-gray-400 mt-1">{t('deploymentHealth.description')}</p>
      </div>

      {/* Project ID Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder={t('deploymentHealth.projectIdPlaceholder')}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
        />
        <button
          onClick={loadHealth}
          disabled={loading || !projectId.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {loading ? t('deploymentHealth.loading') : t('deploymentHealth.load')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Status Banner */}
      {config && stats && (
        <div className={`rounded-lg p-4 border ${STATUS_COLORS[stats.status] || STATUS_COLORS.unknown}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${STATUS_DOT[stats.status] || STATUS_DOT.unknown} animate-pulse`}></span>
              <span className="text-lg font-semibold">{t(`deploymentHealth.status.${stats.status}`)}</span>
            </div>
            <div className="text-sm opacity-80">
              {stats.lastCheckAt ? `${t('deploymentHealth.lastCheck')}: ${new Date(stats.lastCheckAt).toLocaleTimeString()}` : t('deploymentHealth.noChecksYet')}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.uptimePercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">{t('deploymentHealth.stats.uptime')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{formatMs(stats.avgResponseTimeMs)}</div>
            <div className="text-sm text-gray-400">{t('deploymentHealth.stats.avgResponse')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{(stats.currentErrorRate * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-400">{t('deploymentHealth.stats.errorRate')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.totalChecks}</div>
            <div className="text-sm text-gray-400">{t('deploymentHealth.stats.totalChecks')}</div>
          </div>
        </div>
      )}

      {/* Latency Breakdown */}
      {stats && stats.totalChecks > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-white mb-3">{t('deploymentHealth.latencyBreakdown')}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-400">P50</div>
              <div className="text-lg font-semibold text-white">{formatMs(stats.avgResponseTimeMs)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">P95</div>
              <div className="text-lg font-semibold text-yellow-400">{formatMs(stats.p95ResponseTimeMs)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">P99</div>
              <div className="text-lg font-semibold text-red-400">{formatMs(stats.p99ResponseTimeMs)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {config && (
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['overview', 'events', 'incidents', 'settings'] as const).map(t2 => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                tab === t2 ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t(`deploymentHealth.tab.${t2}`)}
              {t2 === 'events' && events.length > 0 && ` (${events.length})`}
              {t2 === 'incidents' && incidents.length > 0 && ` (${incidents.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {tab === 'overview' && config && stats && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">{t('deploymentHealth.overviewTitle')}</h4>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">{t('deploymentHealth.monitoring')}</span>
              <span className={config.monitoringEnabled ? 'text-green-400' : 'text-gray-500'}>
                {config.monitoringEnabled ? t('deploymentHealth.enabled') : t('deploymentHealth.disabled')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">{t('deploymentHealth.autoRollback')}</span>
              <span className={config.autoRollbackEnabled ? 'text-green-400' : 'text-gray-500'}>
                {config.autoRollbackEnabled ? t('deploymentHealth.enabled') : t('deploymentHealth.disabled')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">{t('deploymentHealth.checkInterval')}</span>
              <span className="text-white">{config.checkIntervalSeconds}s</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">{t('deploymentHealth.rollbacks')}</span>
              <span className="text-white">{stats.rollbackCount}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">{t('deploymentHealth.checksRatio')}</span>
              <span className="text-white">{stats.successfulChecks}/{stats.totalChecks}</span>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {tab === 'events' && config && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">{t('deploymentHealth.eventsTitle')}</h4>
          {events.length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {events.slice().reverse().map((event, i) => (
                <div key={i} className="flex items-center gap-3 py-2 text-xs border-b border-gray-700 last:border-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[event.status] || STATUS_DOT.unknown}`}></span>
                  <span className="text-gray-500 w-20">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  <span className="text-white">{formatMs(event.responseTimeMs)}</span>
                  {event.error && <span className="text-red-400 truncate">{event.error}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">{t('deploymentHealth.noEvents')}</div>
          )}
        </div>
      )}

      {/* Incidents Tab */}
      {tab === 'incidents' && config && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">{t('deploymentHealth.incidentsTitle')}</h4>
          {incidents.length > 0 ? (
            <div className="space-y-2">
              {incidents.slice().reverse().map((incident, i) => (
                <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-red-400">{incident.type}</span>
                    <span className="text-xs text-gray-500">{new Date(incident.startedAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-400">{incident.description}</div>
                  {incident.resolvedAt && (
                    <div className="text-xs text-green-400 mt-1">
                      {t('deploymentHealth.resolved')}: {new Date(incident.resolvedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">{t('deploymentHealth.noIncidents')}</div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && config && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h4 className="font-medium text-white mb-4">{t('deploymentHealth.settingsTitle')}</h4>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t('deploymentHealth.deploymentUrl')}</label>
            <input
              type="text"
              value={config.deploymentUrl}
              onChange={(e) => setConfig({ ...config, deploymentUrl: e.target.value })}
              placeholder="https://..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">{t('deploymentHealth.enableMonitoring')}</div>
              <div className="text-xs text-gray-500">{t('deploymentHealth.enableMonitoringDesc')}</div>
            </div>
            <button
              onClick={() => setConfig({ ...config, monitoringEnabled: !config.monitoringEnabled })}
              className={`w-12 h-6 rounded-full transition-colors ${config.monitoringEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${config.monitoringEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">{t('deploymentHealth.enableAutoRollback')}</div>
              <div className="text-xs text-gray-500">{t('deploymentHealth.enableAutoRollbackDesc')}</div>
            </div>
            <button
              onClick={() => setConfig({ ...config, autoRollbackEnabled: !config.autoRollbackEnabled })}
              className={`w-12 h-6 rounded-full transition-colors ${config.autoRollbackEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${config.autoRollbackEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('deploymentHealth.checkIntervalLabel')}</label>
              <input
                type="number"
                value={config.checkIntervalSeconds}
                onChange={(e) => setConfig({ ...config, checkIntervalSeconds: parseInt(e.target.value) || 60 })}
                min={30} max={3600}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('deploymentHealth.errorThresholdLabel')}</label>
              <input
                type="number"
                value={config.errorRateThreshold}
                onChange={(e) => setConfig({ ...config, errorRateThreshold: parseFloat(e.target.value) || 0.1 })}
                min={0.01} max={1} step={0.01}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('deploymentHealth.latencyThresholdLabel')}</label>
              <input
                type="number"
                value={config.latencyThresholdMs}
                onChange={(e) => setConfig({ ...config, latencyThresholdMs: parseInt(e.target.value) || 5000 })}
                min={100} max={30000}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {t('deploymentHealth.saveSettings')}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!config && !loading && !error && (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-500 text-sm">{t('deploymentHealth.emptyState')}</div>
        </div>
      )}
    </div>
  )
}
