import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAspireDashboardInfo,
  getHealthStatus,
  getLivenessStatus,
  type AspireDashboardInfo,
  type HealthCheckResult,
} from '../api/aspireDashboard'

type DashboardView = 'overview' | 'health' | 'tracing'

export default function AspireDashboardPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<DashboardView>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardInfo, setDashboardInfo] = useState<AspireDashboardInfo | null>(null)
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null)
  const [livenessResult, setLivenessResult] = useState<HealthCheckResult | null>(null)

  async function loadOverview() {
    try {
      setLoading(true)
      setError('')
      const info = await getAspireDashboardInfo()
      setDashboardInfo(info)
    } catch {
      setError(t('aspireDashboard.loadError', 'Failed to load Aspire dashboard data'))
    } finally {
      setLoading(false)
    }
  }

  async function loadHealth() {
    try {
      setLoading(true)
      setError('')
      const [health, liveness] = await Promise.all([
        getHealthStatus().catch(() => null),
        getLivenessStatus().catch(() => null),
      ])
      setHealthResult(health)
      setLivenessResult(liveness)
    } catch {
      setError(t('aspireDashboard.healthError', 'Failed to load health check data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'overview') loadOverview()
    else if (view === 'health') loadHealth()
    else setLoading(false)
  }, [view])

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return 'text-green-400 bg-green-900/30'
      case 'degraded':
        return 'text-yellow-400 bg-yellow-900/30'
      case 'unhealthy':
      case 'error':
        return 'text-red-400 bg-red-900/30'
      default:
        return 'text-warm-400 bg-warm-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t('aspireDashboard.title', '.NET Aspire Dashboard')}</h3>
        <p className="text-sm text-warm-400 mt-1">
          {t('aspireDashboard.description', 'Monitor services, distributed tracing, and health checks powered by .NET Aspire.')}
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 bg-warm-800 rounded-lg p-1">
        {(['overview', 'health', 'tracing'] as DashboardView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              view === v ? 'bg-warm-700 text-white' : 'text-warm-400 hover:text-white'
            }`}
          >
            {t(`aspireDashboard.tab.${v}`, v.charAt(0).toUpperCase() + v.slice(1))}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-warm-400 text-sm">{t('aspireDashboard.loading', 'Loading...')}</p>
        </div>
      )}

      {/* Overview view */}
      {!loading && view === 'overview' && dashboardInfo && (
        <div className="space-y-4">
          {/* Info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('aspireDashboard.environment', 'Environment')}</div>
              <div className="text-lg font-bold mt-1">{dashboardInfo.environment}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('aspireDashboard.aspireVersion', 'Aspire Version')}</div>
              <div className="text-lg font-bold mt-1 text-blue-400">{dashboardInfo.aspireVersion}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('aspireDashboard.services', 'Services')}</div>
              <div className="text-lg font-bold mt-1">{dashboardInfo.services.length}</div>
            </div>
            <div className="bg-warm-800 rounded-xl p-5">
              <div className="text-sm text-warm-400">{t('aspireDashboard.overallStatus', 'Overall Status')}</div>
              <div className="text-lg font-bold mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  dashboardInfo.services.every(s => s.status === 'healthy')
                    ? statusColor('healthy')
                    : statusColor('degraded')
                }`}>
                  {dashboardInfo.services.every(s => s.status === 'healthy')
                    ? t('aspireDashboard.allHealthy', 'All Healthy')
                    : t('aspireDashboard.partial', 'Partial')}
                </span>
              </div>
            </div>
          </div>

          {/* Service list */}
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="text-sm font-medium mb-4">{t('aspireDashboard.serviceList', 'Service Status')}</h4>
            <div className="space-y-3">
              {dashboardInfo.services.map((service) => (
                <div key={service.name} className="flex items-center justify-between bg-warm-900 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'healthy' ? 'bg-green-400' :
                      service.status === 'degraded' ? 'bg-yellow-400' :
                      service.status === 'unhealthy' ? 'bg-red-400' :
                      'bg-warm-500'
                    }`} />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(service.status)}`}>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aspire features info */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-800/50">
            <h4 className="text-sm font-medium mb-3">{t('aspireDashboard.features', 'Aspire Features')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-warm-900/50 rounded-lg p-4">
                <div className="font-medium text-blue-400 mb-1">{t('aspireDashboard.featureTracing', 'Distributed Tracing')}</div>
                <p className="text-warm-400">{t('aspireDashboard.featureTracingDesc', 'OpenTelemetry-based distributed tracing across all services.')}</p>
              </div>
              <div className="bg-warm-900/50 rounded-lg p-4">
                <div className="font-medium text-green-400 mb-1">{t('aspireDashboard.featureHealth', 'Health Checks')}</div>
                <p className="text-warm-400">{t('aspireDashboard.featureHealthDesc', 'Liveness and readiness probes for all managed resources.')}</p>
              </div>
              <div className="bg-warm-900/50 rounded-lg p-4">
                <div className="font-medium text-purple-400 mb-1">{t('aspireDashboard.featureOrchestration', 'Orchestration')}</div>
                <p className="text-warm-400">{t('aspireDashboard.featureOrchestrationDesc', 'One-command startup of the entire platform stack.')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health check view */}
      {!loading && view === 'health' && (
        <div className="space-y-4">
          {/* Readiness probe */}
          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">{t('aspireDashboard.readiness', 'Readiness Probe')}</h4>
              {healthResult && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(healthResult.status)}`}>
                  {healthResult.status}
                </span>
              )}
            </div>
            {healthResult ? (
              <div className="space-y-2">
                <div className="text-xs text-warm-400">
                  {t('aspireDashboard.totalDuration', 'Total Duration')}: {healthResult.totalDuration}
                </div>
                {healthResult.entries && Object.entries(healthResult.entries).map(([name, entry]) => (
                  <div key={name} className="flex items-center justify-between bg-warm-900 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{name}</span>
                      {entry.tags && entry.tags.map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-warm-700 rounded text-warm-300">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-warm-400">{entry.duration}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-warm-500 text-sm">{t('aspireDashboard.noHealthData', 'No health check data available.')}</p>
            )}
          </div>

          {/* Liveness probe */}
          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">{t('aspireDashboard.liveness', 'Liveness Probe')}</h4>
              {livenessResult && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(livenessResult.status)}`}>
                  {livenessResult.status}
                </span>
              )}
            </div>
            {livenessResult ? (
              <div className="text-xs text-warm-400">
                {t('aspireDashboard.totalDuration', 'Total Duration')}: {livenessResult.totalDuration}
              </div>
            ) : (
              <p className="text-warm-500 text-sm">{t('aspireDashboard.noLivenessData', 'No liveness data available.')}</p>
            )}
          </div>

          <button
            onClick={loadHealth}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t('aspireDashboard.refresh', 'Refresh')}
          </button>
        </div>
      )}

      {/* Tracing info view */}
      {!loading && view === 'tracing' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="text-sm font-medium mb-3">{t('aspireDashboard.tracingTitle', 'OpenTelemetry Tracing')}</h4>
            <p className="text-sm text-warm-400 mb-4">
              {t('aspireDashboard.tracingDesc', 'Distributed tracing is configured via OpenTelemetry and exported to the Aspire Dashboard via OTLP.')}
            </p>
            <div className="space-y-3">
              <div className="bg-warm-900 rounded-lg p-4">
                <div className="font-medium text-sm mb-1">{t('aspireDashboard.tracingAspNet', 'ASP.NET Core Instrumentation')}</div>
                <p className="text-xs text-warm-400">{t('aspireDashboard.tracingAspNetDesc', 'Automatic tracing for HTTP requests, middleware, and controller actions.')}</p>
              </div>
              <div className="bg-warm-900 rounded-lg p-4">
                <div className="font-medium text-sm mb-1">{t('aspireDashboard.tracingHttp', 'HTTP Client Instrumentation')}</div>
                <p className="text-xs text-warm-400">{t('aspireDashboard.tracingHttpDesc', 'Outgoing HTTP calls to external APIs (Claude, Azure, etc.) are traced.')}</p>
              </div>
              <div className="bg-warm-900 rounded-lg p-4">
                <div className="font-medium text-sm mb-1">{t('aspireDashboard.tracingMetrics', 'Runtime Metrics')}</div>
                <p className="text-xs text-warm-400">{t('aspireDashboard.tracingMetricsDesc', 'GC, thread pool, and process metrics collected via OpenTelemetry runtime instrumentation.')}</p>
              </div>
            </div>
          </div>

          <div className="bg-warm-800 rounded-xl p-6">
            <h4 className="text-sm font-medium mb-3">{t('aspireDashboard.dashboardAccess', 'Aspire Dashboard Access')}</h4>
            <p className="text-sm text-warm-400 mb-3">
              {t('aspireDashboard.dashboardAccessDesc', 'When running via the AppHost, the Aspire Dashboard is available at the following URL:')}
            </p>
            <code className="block bg-warm-900 rounded-lg p-3 text-sm text-blue-400 font-mono">
              http://localhost:18888
            </code>
            <p className="text-xs text-warm-400 mt-2">
              {t('aspireDashboard.dashboardNote', 'The dashboard URL may vary. Check the AppHost console output for the actual URL.')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
