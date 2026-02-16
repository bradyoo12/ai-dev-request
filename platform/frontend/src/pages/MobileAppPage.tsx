import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getMobileAppConfig,
  updateMobileAppConfig,
  triggerBuild,
  publishApp,
  getBuilds,
  generateNativeCode,
  deployToTestFlight,
  generateExpoPreview,
  getDeployments,
  type MobileAppConfig,
  type BuildRecord,
  type MobileDeployment,
} from '../api/mobileapp'

export default function MobileAppPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('')
  const [config, setConfig] = useState<MobileAppConfig | null>(null)
  const [builds, setBuilds] = useState<BuildRecord[]>([])
  const [deployments, setDeployments] = useState<MobileDeployment[]>([])
  const [loading, setLoading] = useState(false)
  const [building, setBuilding] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'generate' | 'testflight' | 'screens' | 'builds' | 'publish' | 'settings'>('overview')
  const [appDescription, setAppDescription] = useState('')
  const [generatedDeployment, setGeneratedDeployment] = useState<MobileDeployment | null>(null)
  const [expoPreviewUrl, setExpoPreviewUrl] = useState<string | null>(null)

  const loadConfig = async () => {
    if (!projectId.trim()) return
    setLoading(true)
    setError('')
    try {
      const [configData, buildsData, deploymentsData] = await Promise.all([
        getMobileAppConfig(projectId),
        getBuilds(projectId),
        getDeployments(projectId),
      ])
      setConfig(configData)
      setBuilds(buildsData.builds)
      setDeployments(deploymentsData.deployments)
    } catch {
      setError(t('mobileApp.error.loadConfig'))
    } finally {
      setLoading(false)
    }
  }

  const handleBuild = async (platform: string) => {
    if (!config) return
    setBuilding(true)
    try {
      const result = await triggerBuild(projectId, platform)
      setConfig(prev => prev ? {
        ...prev,
        buildNumber: result.buildNumber,
        iosBuildStatus: result.iosBuildStatus,
        androidBuildStatus: result.androidBuildStatus,
        expoQrCodeUrl: result.expoQrCodeUrl,
        previewUrl: result.previewUrl,
        status: 'built',
      } : null)
      const buildsData = await getBuilds(projectId)
      setBuilds(buildsData.builds)
    } catch {
      setError(t('mobileApp.error.build'))
    } finally {
      setBuilding(false)
    }
  }

  const handlePublish = async (store: string) => {
    if (!config) return
    setPublishing(true)
    try {
      await publishApp(projectId, store)
      setConfig(prev => prev ? { ...prev, status: 'published' } : null)
    } catch {
      setError(t('mobileApp.error.publish'))
    } finally {
      setPublishing(false)
    }
  }

  const handleUpdateSettings = async (updates: Record<string, string | boolean>) => {
    if (!config) return
    try {
      await updateMobileAppConfig(projectId, updates)
      setConfig(prev => prev ? { ...prev, ...updates } : null)
    } catch {
      setError(t('mobileApp.error.updateConfig'))
    }
  }

  const handleGenerateCode = async () => {
    if (!appDescription.trim()) return
    setGenerating(true)
    setError('')
    try {
      const deployment = await generateNativeCode(projectId, appDescription)
      setGeneratedDeployment(deployment)
      const deploymentsData = await getDeployments(projectId)
      setDeployments(deploymentsData.deployments)
    } catch {
      setError(t('mobileApp.error.generateCode'))
    } finally {
      setGenerating(false)
    }
  }

  const handleDeployTestFlight = async (deploymentId: string) => {
    setDeploying(true)
    setError('')
    try {
      const deployment = await deployToTestFlight(deploymentId)
      setGeneratedDeployment(deployment)
      const deploymentsData = await getDeployments(projectId)
      setDeployments(deploymentsData.deployments)
    } catch {
      setError(t('mobileApp.error.deployTestFlight'))
    } finally {
      setDeploying(false)
    }
  }

  const handleExpoPreview = async () => {
    setError('')
    try {
      const result = await generateExpoPreview(projectId, appDescription || config?.appDescription || undefined)
      if (result.success) {
        setExpoPreviewUrl(result.previewUrl)
      } else {
        setError(result.error || t('mobileApp.error.expoPreview'))
      }
    } catch {
      setError(t('mobileApp.error.expoPreview'))
    }
  }

  const statusColor = (status: string | null) => {
    if (!status) return 'bg-warm-100 text-warm-600'
    if (status === 'success' || status === 'published' || status === 'ready' || status === 'generated' || status === 'submitted') return 'bg-green-100 text-green-700'
    if (status === 'building' || status === 'generating' || status === 'submitting' || status === 'processing') return 'bg-yellow-100 text-yellow-700'
    if (status === 'failed' || status === 'rejected') return 'bg-red-100 text-red-700'
    return 'bg-warm-100 text-warm-600'
  }

  const deploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'testflight': return t('mobileApp.deploy.typeTestFlight')
      case 'code-generation': return t('mobileApp.deploy.typeCodeGen')
      case 'expo-preview': return t('mobileApp.deploy.typeExpoPreview')
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('mobileApp.title')}</h2>
        <p className="text-warm-500 mt-1">{t('mobileApp.description')}</p>
      </div>

      {!config ? (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder={t('mobileApp.projectIdPlaceholder')}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && loadConfig()}
            />
            <button onClick={loadConfig} disabled={loading || !projectId.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? t('mobileApp.loading') : t('mobileApp.load')}
            </button>
          </div>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </div>
      ) : (
        <>
          {/* App Header */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {config.appName[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{config.appName}</h3>
                  <p className="text-sm text-warm-500">{config.bundleId} · v{config.appVersion} ({config.buildNumber})</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(config.status)}`}>{config.status}</span>
                <div className="flex gap-2">
                  {config.iosEnabled && (
                    <span className={`px-2 py-1 rounded text-xs ${statusColor(config.iosBuildStatus)}`}>
                      iOS: {config.iosBuildStatus || 'none'}
                    </span>
                  )}
                  {config.androidEnabled && (
                    <span className={`px-2 py-1 rounded text-xs ${statusColor(config.androidBuildStatus)}`}>
                      Android: {config.androidBuildStatus || 'none'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b pb-2 overflow-x-auto">
            {(['overview', 'generate', 'testflight', 'screens', 'builds', 'publish', 'settings'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-warm-500 hover:text-warm-700'}`}
              >{t(`mobileApp.tab.${tab}`)}</button>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{config.totalScreens}</p>
                  <p className="text-sm text-warm-500">{t('mobileApp.stats.screens')}</p>
                </div>
                <div className="bg-white rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{config.totalComponents}</p>
                  <p className="text-sm text-warm-500">{t('mobileApp.stats.components')}</p>
                </div>
                <div className="bg-white rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{config.buildNumber}</p>
                  <p className="text-sm text-warm-500">{t('mobileApp.stats.builds')}</p>
                </div>
                <div className="bg-white rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{deployments.length}</p>
                  <p className="text-sm text-warm-500">{t('mobileApp.stats.deployments')}</p>
                </div>
              </div>

              {/* QR Preview */}
              {(config.expoQrCodeUrl || expoPreviewUrl) && (
                <div className="bg-white rounded-lg border p-6 text-center">
                  <h3 className="font-semibold mb-3">{t('mobileApp.qrPreview')}</h3>
                  <div className="w-48 h-48 mx-auto bg-warm-100 rounded-lg flex items-center justify-center border-2 border-dashed border-warm-300">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <p className="text-xs text-warm-400 mt-2">{t('mobileApp.scanQr')}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-warm-500">{t('mobileApp.expoGoHint')}</p>
                  {(expoPreviewUrl || config.expoQrCodeUrl) && (
                    <a href={expoPreviewUrl || config.expoQrCodeUrl || '#'} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                      {t('mobileApp.openExpoSnack')}
                    </a>
                  )}
                </div>
              )}

              {/* Build Actions */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4">{t('mobileApp.quickActions')}</h3>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => handleBuild('both')} disabled={building}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {building ? t('mobileApp.building') : t('mobileApp.buildBoth')}
                  </button>
                  <button onClick={() => handleBuild('ios')} disabled={building || !config.iosEnabled}
                    className="px-4 py-3 bg-warm-800 text-white rounded-lg hover:bg-warm-900 disabled:opacity-50">
                    {t('mobileApp.buildIos')}
                  </button>
                  <button onClick={() => handleBuild('android')} disabled={building || !config.androidEnabled}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {t('mobileApp.buildAndroid')}
                  </button>
                  <button onClick={handleExpoPreview}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    {t('mobileApp.generateExpoPreview')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generate Tab - Natural Language Code Generation */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-2">{t('mobileApp.generate.title')}</h3>
                <p className="text-sm text-warm-500 mb-4">{t('mobileApp.generate.description')}</p>
                <textarea
                  value={appDescription}
                  onChange={e => setAppDescription(e.target.value)}
                  placeholder={t('mobileApp.generate.placeholder')}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={handleGenerateCode} disabled={generating || !appDescription.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {generating ? t('mobileApp.generate.generating') : t('mobileApp.generate.generateButton')}
                  </button>
                  <button onClick={handleExpoPreview} disabled={!appDescription.trim()}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                    {t('mobileApp.generate.previewButton')}
                  </button>
                </div>
              </div>

              {/* Generated Code Preview */}
              {generatedDeployment && generatedDeployment.generatedCodeJson && (
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{t('mobileApp.generate.codePreview')}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(generatedDeployment.status)}`}>
                      {generatedDeployment.status}
                    </span>
                  </div>
                  <div className="bg-warm-900 rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                      {(() => {
                        try {
                          const parsed = JSON.parse(generatedDeployment.generatedCodeJson)
                          const files = parsed.files || parsed.Files || {}
                          const entries = Object.entries(files)
                          return entries.map(([name, content]) =>
                            `// === ${name} ===\n${content as string}\n`
                          ).join('\n')
                        } catch {
                          return generatedDeployment.generatedCodeJson
                        }
                      })()}
                    </pre>
                  </div>
                  {generatedDeployment.status === 'generated' && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleDeployTestFlight(generatedDeployment.id)}
                        disabled={deploying}
                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {deploying ? t('mobileApp.deploy.deploying') : t('mobileApp.deploy.deployToTestFlight')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Expo Preview */}
              {expoPreviewUrl && (
                <div className="bg-white rounded-lg border p-6 text-center">
                  <h3 className="font-semibold mb-3">{t('mobileApp.generate.expoPreview')}</h3>
                  <div className="w-48 h-48 mx-auto bg-warm-100 rounded-lg flex items-center justify-center border-2 border-dashed border-warm-300">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <p className="text-xs text-warm-400 mt-2">{t('mobileApp.scanQr')}</p>
                    </div>
                  </div>
                  <a href={expoPreviewUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                    {t('mobileApp.openExpoSnack')}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TestFlight Tab */}
          {activeTab === 'testflight' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-2">{t('mobileApp.testflight.title')}</h3>
                <p className="text-sm text-warm-500 mb-4">{t('mobileApp.testflight.description')}</p>

                {/* Deployment History */}
                {deployments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-warm-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <p className="text-warm-400 mt-3">{t('mobileApp.testflight.noDeployments')}</p>
                    <p className="text-warm-400 text-sm mt-1">{t('mobileApp.testflight.noDeploymentsHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deployments.map(d => (
                      <div key={d.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {deploymentTypeLabel(d.deploymentType)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(d.status)}`}>
                              {d.status}
                            </span>
                          </div>
                          <span className="text-xs text-warm-400">{new Date(d.createdAt).toLocaleString()}</span>
                        </div>
                        {d.appDescription && (
                          <p className="text-sm text-warm-600 mb-2">{d.appDescription}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-warm-500">
                          {d.appleBundleId && <span>Bundle: {d.appleBundleId}</span>}
                          {d.appVersion && <span>v{d.appVersion}</span>}
                          {d.buildNumber && <span>Build #{d.buildNumber}</span>}
                        </div>
                        {d.testFlightUrl && (
                          <a href={d.testFlightUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                            {t('mobileApp.testflight.openLink')}
                          </a>
                        )}
                        {d.errorMessage && (
                          <p className="mt-2 text-sm text-red-600">{d.errorMessage}</p>
                        )}
                        {d.status === 'generated' && (
                          <button
                            onClick={() => handleDeployTestFlight(d.id)}
                            disabled={deploying}
                            className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm">
                            {deploying ? t('mobileApp.deploy.deploying') : t('mobileApp.deploy.deployToTestFlight')}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Build Logs for latest deployment */}
              {deployments.length > 0 && deployments[0].buildLogsJson && (
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold mb-3">{t('mobileApp.testflight.buildLogs')}</h3>
                  <div className="bg-warm-900 rounded-lg p-4 max-h-64 overflow-auto">
                    {(() => {
                      try {
                        const logs = JSON.parse(deployments[0].buildLogsJson) as Array<{ timestamp: string; level: string; message: string }>
                        return logs.map((log, i) => (
                          <div key={i} className="text-sm font-mono mb-1">
                            <span className="text-warm-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={`ml-2 ${log.level === 'success' ? 'text-green-400' : log.level === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
                              [{log.level}]
                            </span>
                            <span className="text-warm-200 ml-2">{log.message}</span>
                          </div>
                        ))
                      } catch {
                        return <span className="text-warm-400 text-sm">{t('mobileApp.testflight.noLogs')}</span>
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Screens Tab */}
          {activeTab === 'screens' && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('mobileApp.screensTitle')}</h3>
              {config.totalScreens === 0 ? (
                <p className="text-warm-400 text-center py-8">{t('mobileApp.noScreens')}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: config.totalScreens }, (_, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="w-full h-32 bg-warm-50 rounded mb-2 flex items-center justify-center">
                        <svg className="w-8 h-8 text-warm-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Screen {i + 1}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Builds Tab */}
          {activeTab === 'builds' && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('mobileApp.buildsTitle')}</h3>
              {builds.length === 0 ? (
                <p className="text-warm-400 text-center py-8">{t('mobileApp.noBuilds')}</p>
              ) : (
                <div className="space-y-3">
                  {builds.slice().reverse().map((b, i) => (
                    <div key={i} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <span className="font-medium">Build #{b.buildNumber}</span>
                        <span className="text-sm text-warm-500 ml-3">{b.platform}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${statusColor(b.status)}`}>{b.status}</span>
                        <span className="text-xs text-warm-400">{new Date(b.startedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Publish Tab */}
          {activeTab === 'publish' && (
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <h3 className="font-semibold">{t('mobileApp.publishTitle')}</h3>
              <p className="text-sm text-warm-500">{t('mobileApp.publishDesc')}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* iOS */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-warm-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">iOS</div>
                    <div>
                      <p className="font-medium">App Store</p>
                      <p className="text-xs text-warm-500">{t('mobileApp.iosStatus')}: {config.iosPublishStatus || t('mobileApp.notPublished')}</p>
                    </div>
                  </div>
                  <button onClick={() => handlePublish('ios')} disabled={publishing || !config.iosEnabled || config.status === 'draft'}
                    className="w-full py-2 bg-warm-900 text-white rounded-lg hover:bg-warm-800 disabled:opacity-50">
                    {publishing ? t('mobileApp.publishing') : t('mobileApp.publishToAppStore')}
                  </button>
                </div>

                {/* Android */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">GP</div>
                    <div>
                      <p className="font-medium">Google Play</p>
                      <p className="text-xs text-warm-500">{t('mobileApp.androidStatus')}: {config.androidPublishStatus || t('mobileApp.notPublished')}</p>
                    </div>
                  </div>
                  <button onClick={() => handlePublish('android')} disabled={publishing || !config.androidEnabled || config.status === 'draft'}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {publishing ? t('mobileApp.publishing') : t('mobileApp.publishToGooglePlay')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <h3 className="font-semibold">{t('mobileApp.settingsTitle')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('mobileApp.appNameLabel')}</label>
                  <input type="text" value={config.appName} onChange={e => handleUpdateSettings({ appName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('mobileApp.bundleIdLabel')}</label>
                  <input type="text" value={config.bundleId} onChange={e => handleUpdateSettings({ bundleId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('mobileApp.versionLabel')}</label>
                  <input type="text" value={config.appVersion} onChange={e => handleUpdateSettings({ appVersion: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('mobileApp.descriptionLabel')}</label>
                  <input type="text" value={config.appDescription || ''} onChange={e => handleUpdateSettings({ appDescription: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t('mobileApp.enableIos')}</p>
                    <p className="text-xs text-warm-500">{t('mobileApp.enableIosDesc')}</p>
                  </div>
                  <button onClick={() => handleUpdateSettings({ iosEnabled: !config.iosEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.iosEnabled ? 'bg-blue-600' : 'bg-warm-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.iosEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t('mobileApp.enableAndroid')}</p>
                    <p className="text-xs text-warm-500">{t('mobileApp.enableAndroidDesc')}</p>
                  </div>
                  <button onClick={() => handleUpdateSettings({ androidEnabled: !config.androidEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.androidEnabled ? 'bg-blue-600' : 'bg-warm-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.androidEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t('mobileApp.enableExpo')}</p>
                    <p className="text-xs text-warm-500">{t('mobileApp.enableExpoDesc')}</p>
                  </div>
                  <button onClick={() => handleUpdateSettings({ expoEnabled: !config.expoEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.expoEnabled ? 'bg-blue-600' : 'bg-warm-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.expoEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
