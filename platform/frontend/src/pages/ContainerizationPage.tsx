import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  generateDockerfile,
  getContainerConfig,
  triggerBuild,
  getBuildStatus,
  getBuildLogs,
  deployContainer,
  generateK8sManifest,
} from '../api/containerization'
import type { ContainerConfig, ContainerBuildStatus, ContainerBuildLogs } from '../api/containerization'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-600/20 text-yellow-400',
  building: 'bg-blue-600/20 text-blue-400',
  built: 'bg-green-600/20 text-green-400',
  pushing: 'bg-blue-600/20 text-blue-400',
  pushed: 'bg-green-600/20 text-green-400',
  deploying: 'bg-purple-600/20 text-purple-400',
  deployed: 'bg-emerald-600/20 text-emerald-400',
  error: 'bg-red-600/20 text-red-400',
}

const STACK_LABELS: Record<string, string> = {
  nodejs: 'Node.js',
  dotnet: '.NET',
  python: 'Python',
  static: 'Static / Nginx',
}

export default function ContainerizationPage() {
  const { t } = useTranslation()

  const [projectId, setProjectId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [config, setConfig] = useState<ContainerConfig | null>(null)
  const [buildStatus, setBuildStatus] = useState<ContainerBuildStatus | null>(null)
  const [buildLogs, setBuildLogs] = useState<ContainerBuildLogs | null>(null)

  const [registryUrl, setRegistryUrl] = useState('')
  const [imageTag, setImageTag] = useState('latest')
  const [showCompose, setShowCompose] = useState(false)
  const [showK8s, setShowK8s] = useState(false)

  const parsedProjectId = parseInt(projectId, 10)

  const handleGenerate = async () => {
    if (!parsedProjectId || isNaN(parsedProjectId)) {
      setError(t('containerization.invalidProjectId', 'Please enter a valid project ID'))
      return
    }
    try {
      setLoading(true)
      setError('')
      const result = await generateDockerfile(parsedProjectId)
      setConfig(result)
      setSuccess(t('containerization.generateSuccess', 'Dockerfile generated successfully!'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('containerization.generateError', 'Failed to generate Dockerfile'))
    } finally {
      setLoading(false)
    }
  }

  const handleLoadConfig = async () => {
    if (!parsedProjectId || isNaN(parsedProjectId)) {
      setError(t('containerization.invalidProjectId', 'Please enter a valid project ID'))
      return
    }
    try {
      setLoading(true)
      setError('')
      const result = await getContainerConfig(parsedProjectId)
      setConfig(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('containerization.loadError', 'Failed to load configuration'))
    } finally {
      setLoading(false)
    }
  }

  const handleBuild = async () => {
    if (!parsedProjectId || isNaN(parsedProjectId)) return
    try {
      setLoading(true)
      setError('')
      const result = await triggerBuild(parsedProjectId)
      setConfig(result)
      setSuccess(t('containerization.buildSuccess', 'Build completed successfully!'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('containerization.buildError', 'Build failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshStatus = async () => {
    if (!parsedProjectId || isNaN(parsedProjectId)) return
    try {
      const status = await getBuildStatus(parsedProjectId)
      setBuildStatus(status)
    } catch {
      // silently ignore status polling errors
    }
  }

  const handleLoadLogs = async () => {
    if (!parsedProjectId || isNaN(parsedProjectId)) return
    try {
      const logs = await getBuildLogs(parsedProjectId)
      setBuildLogs(logs)
    } catch {
      // silently ignore log polling errors
    }
  }

  const handleDeploy = async () => {
    if (!parsedProjectId || isNaN(parsedProjectId)) return
    try {
      setLoading(true)
      setError('')
      const result = await deployContainer(parsedProjectId)
      setConfig(result)
      if (result.errorMessage) {
        setError(result.errorMessage)
      } else {
        setSuccess(t('containerization.deploySuccess', 'Container deployed successfully!'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('containerization.deployError', 'Deployment failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateK8s = async () => {
    if (!parsedProjectId || isNaN(parsedProjectId)) return
    try {
      setLoading(true)
      setError('')
      const result = await generateK8sManifest(parsedProjectId)
      setConfig(result)
      setShowK8s(true)
      setSuccess(t('containerization.k8sSuccess', 'Kubernetes manifest generated!'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('containerization.k8sError', 'Failed to generate K8s manifest'))
    } finally {
      setLoading(false)
    }
  }

  const parseLogs = (logsJson: string): Array<{ timestamp: string; message: string }> => {
    try {
      return JSON.parse(logsJson)
    } catch {
      return []
    }
  }

  const currentStatus = config?.buildStatus || buildStatus?.status || 'pending'

  return (
    <div className="space-y-6" data-testid="containerization-page">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400" data-testid="container-error">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}
      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-400" data-testid="container-success">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 text-green-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <h3 className="text-lg font-bold">{t('containerization.title', 'Docker Containerization')}</h3>
      </div>

      {/* Project ID Input */}
      <div className="bg-gray-900 rounded-xl p-6">
        <label className="block text-sm text-gray-400 mb-2">{t('containerization.projectIdLabel', 'Project ID')}</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            placeholder="Enter project ID..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-700 focus:border-blue-500 outline-none"
            data-testid="project-id-input"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            data-testid="generate-btn"
          >
            {loading ? t('containerization.generating', 'Generating...') : t('containerization.generateBtn', 'Generate Dockerfile')}
          </button>
          <button
            onClick={handleLoadConfig}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            data-testid="load-config-btn"
          >
            {t('containerization.loadConfig', 'Load Config')}
          </button>
        </div>
      </div>

      {/* Detected Stack */}
      {config && (
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">{t('containerization.detectedStack', 'Detected Stack')}</div>
              <span className="bg-blue-600/20 text-blue-400 text-sm px-3 py-1 rounded-full font-medium" data-testid="detected-stack">
                {STACK_LABELS[config.detectedStack] || config.detectedStack}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">{t('containerization.buildStatusLabel', 'Build Status')}</div>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[currentStatus] || 'bg-gray-600/20 text-gray-400'}`} data-testid="build-status">
                {currentStatus}
              </span>
            </div>
          </div>

          {/* Image Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">{t('containerization.imageName', 'Image')}:</span>
              <span className="ml-2 text-white font-mono">{config.imageName}:{config.imageTag}</span>
            </div>
            {config.builtAt && (
              <div>
                <span className="text-gray-400">{t('containerization.builtAt', 'Built')}:</span>
                <span className="ml-2 text-white">{new Date(config.builtAt).toLocaleString()}</span>
              </div>
            )}
            {config.deployedAt && (
              <div>
                <span className="text-gray-400">{t('containerization.deployedAt', 'Deployed')}:</span>
                <span className="ml-2 text-white">{new Date(config.deployedAt).toLocaleString()}</span>
              </div>
            )}
            {config.buildDurationMs > 0 && (
              <div>
                <span className="text-gray-400">{t('containerization.duration', 'Duration')}:</span>
                <span className="ml-2 text-white">{(config.buildDurationMs / 1000).toFixed(1)}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dockerfile Preview */}
      {config?.dockerfile && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h4 className="text-md font-bold mb-3">{t('containerization.dockerfilePreview', 'Dockerfile')}</h4>
          <pre className="bg-black rounded-lg p-4 text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto" data-testid="dockerfile-preview">
            {config.dockerfile}
          </pre>
        </div>
      )}

      {/* Docker Compose Preview */}
      {config?.composeFile && (
        <div className="bg-gray-900 rounded-xl p-6">
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-2 text-md font-bold mb-3 hover:text-blue-400 transition-colors"
            data-testid="toggle-compose"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showCompose ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"/></svg>
            {t('containerization.composePreview', 'docker-compose.yml')}
          </button>
          {showCompose && (
            <pre className="bg-black rounded-lg p-4 text-sm text-cyan-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto" data-testid="compose-preview">
              {config.composeFile}
            </pre>
          )}
        </div>
      )}

      {/* K8s Manifest */}
      {config && (
        <div className="bg-gray-900 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-bold">{t('containerization.k8sTitle', 'Kubernetes Manifest')}</h4>
            <button
              onClick={handleGenerateK8s}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              data-testid="generate-k8s-btn"
            >
              {t('containerization.generateK8s', 'Generate K8s Manifest')}
            </button>
          </div>
          {config.k8sManifest && showK8s && (
            <pre className="bg-black rounded-lg p-4 text-sm text-amber-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto" data-testid="k8s-preview">
              {config.k8sManifest}
            </pre>
          )}
          {config.k8sManifest && !showK8s && (
            <button
              onClick={() => setShowK8s(true)}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              {t('containerization.showK8s', 'Show manifest...')}
            </button>
          )}
        </div>
      )}

      {/* Registry Configuration */}
      {config && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h4 className="text-md font-bold mb-3">{t('containerization.registryConfig', 'Registry Configuration')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('containerization.registryUrl', 'Registry URL')}</label>
              <input
                type="text"
                value={registryUrl}
                onChange={e => setRegistryUrl(e.target.value)}
                placeholder="e.g., ghcr.io/username"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-blue-500 outline-none"
                data-testid="registry-url-input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('containerization.imageTagLabel', 'Image Tag')}</label>
              <input
                type="text"
                value={imageTag}
                onChange={e => setImageTag(e.target.value)}
                placeholder="latest"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-blue-500 outline-none"
                data-testid="image-tag-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Build & Deploy Actions */}
      {config && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h4 className="text-md font-bold mb-3">{t('containerization.actions', 'Actions')}</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleBuild}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              data-testid="build-btn"
            >
              {t('containerization.triggerBuild', 'Build Image')}
            </button>
            <button
              onClick={handleDeploy}
              disabled={loading || (currentStatus !== 'built' && currentStatus !== 'pushed')}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              data-testid="deploy-btn"
            >
              {t('containerization.deployBtn', 'Deploy Container')}
            </button>
            <button
              onClick={handleRefreshStatus}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              data-testid="refresh-status-btn"
            >
              {t('containerization.refreshStatus', 'Refresh Status')}
            </button>
            <button
              onClick={handleLoadLogs}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              data-testid="load-logs-btn"
            >
              {t('containerization.loadLogs', 'Load Logs')}
            </button>
          </div>
        </div>
      )}

      {/* Build Status Details */}
      {buildStatus && (
        <div className="bg-gray-900 rounded-xl p-6" data-testid="build-status-panel">
          <h4 className="text-md font-bold mb-3">{t('containerization.buildStatusTitle', 'Build Status')}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">{t('containerization.status', 'Status')}:</span>
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${STATUS_COLORS[buildStatus.status] || ''}`}>
                {buildStatus.status}
              </span>
            </div>
            <div>
              <span className="text-gray-400">{t('containerization.image', 'Image')}:</span>
              <span className="ml-2 text-white font-mono">{buildStatus.imageName}:{buildStatus.imageTag}</span>
            </div>
            {buildStatus.buildDurationMs > 0 && (
              <div>
                <span className="text-gray-400">{t('containerization.duration', 'Duration')}:</span>
                <span className="ml-2 text-white">{(buildStatus.buildDurationMs / 1000).toFixed(1)}s</span>
              </div>
            )}
            {buildStatus.errorMessage && (
              <div className="col-span-2 text-red-400">
                {buildStatus.errorMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Build Logs */}
      {buildLogs && (
        <div className="bg-gray-900 rounded-xl p-6" data-testid="build-logs-panel">
          <h4 className="text-md font-bold mb-3">{t('containerization.buildLogsTitle', 'Build Logs')}</h4>
          <div className="bg-black rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs" data-testid="build-logs-output">
            {parseLogs(buildLogs.logs).map((entry, i) => (
              <div key={i} className="text-gray-300">
                <span className="text-gray-500">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>{' '}
                {entry.message}
              </div>
            ))}
            {parseLogs(buildLogs.logs).length === 0 && (
              <div className="text-gray-500">{t('containerization.noLogs', 'No build logs available')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
