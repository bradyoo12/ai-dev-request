import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  deployPreview,
  getPreviewStatus,
  expirePreview,
  listPreviews,
  type PreviewDeployment,
} from '../api/preview'
import { ContainerLogsModal } from '../components/ContainerLogsModal'

function generateQrCodeSvg(url: string): string {
  // Simple QR-like SVG placeholder that encodes the URL visually
  // In production this would use a proper QR library
  const size = 200
  const cells = 21
  const cellSize = size / cells
  let rects = ''

  // Create a deterministic pattern from the URL
  const hash = Array.from(url).reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0)

  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      const isFinder =
        (row < 7 && col < 7) ||
        (row < 7 && col >= cells - 7) ||
        (row >= cells - 7 && col < 7)

      const isFinderInner =
        (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
        (row >= 2 && row <= 4 && col >= cells - 5 && col <= cells - 3) ||
        (row >= cells - 5 && row <= cells - 3 && col >= 2 && col <= 4)

      const isFinderBorder =
        isFinder && (row === 0 || row === 6 || col === 0 || col === 6 ||
          row === cells - 7 || row === cells - 1 || col === cells - 7 || col === cells - 1)

      const shouldFill = isFinder
        ? (isFinderBorder || isFinderInner)
        : ((hash * (row * cells + col + 1)) & 3) === 0

      if (shouldFill) {
        rects += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="white"/>`
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#1f2937"/>
    ${rects}
  </svg>`
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Deployed': return 'text-green-400'
    case 'Deploying': return 'text-yellow-400'
    case 'BuildingImage': return 'text-blue-400'
    case 'PushingImage': return 'text-purple-400'
    case 'CreatingContainer': return 'text-yellow-400'
    case 'Pending': return 'text-blue-400'
    case 'Expired': return 'text-warm-400'
    case 'Failed': return 'text-red-400'
    default: return 'text-warm-400'
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'Deployed': return 'bg-green-900/40 border-green-700 text-green-300'
    case 'Deploying': return 'bg-yellow-900/40 border-yellow-700 text-yellow-300'
    case 'BuildingImage': return 'bg-blue-900/40 border-blue-700 text-blue-300'
    case 'PushingImage': return 'bg-purple-900/40 border-purple-700 text-purple-300'
    case 'CreatingContainer': return 'bg-yellow-900/40 border-yellow-700 text-yellow-300'
    case 'Pending': return 'bg-blue-900/40 border-blue-700 text-blue-300'
    case 'Expired': return 'bg-warm-900/40 border-warm-700 text-warm-400'
    case 'Failed': return 'bg-red-900/40 border-red-700 text-red-300'
    default: return 'bg-warm-900/40 border-warm-700 text-warm-400'
  }
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('Expired')
        return
      }
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setRemaining(`${hours}h ${minutes}m ${seconds}s`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return <span className="text-sm font-mono text-yellow-300">{remaining}</span>
}

export default function PreviewDeploymentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId') || ''

  const [currentPreview, setCurrentPreview] = useState<PreviewDeployment | null>(null)
  const [history, setHistory] = useState<PreviewDeployment[]>([])
  const [deploying, setDeploying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const loadData = useCallback(async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const [status, previews] = await Promise.all([
        getPreviewStatus(requestId),
        listPreviews(requestId),
      ])
      setCurrentPreview(status)
      setHistory(previews)
    } catch {
      // No existing previews
    } finally {
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDeploy() {
    if (!requestId) {
      setError('No project selected. Please provide a requestId.')
      return
    }
    setDeploying(true)
    setError('')
    try {
      const result = await deployPreview(requestId)
      setCurrentPreview(result)
      const previews = await listPreviews(requestId)
      setHistory(previews)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed')
    } finally {
      setDeploying(false)
    }
  }

  async function handleExpire() {
    setError('')
    try {
      const result = await expirePreview(requestId)
      setCurrentPreview(result)
      const previews = await listPreviews(requestId)
      setHistory(previews)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expire preview')
    }
  }

  function handleCopyUrl() {
    if (currentPreview?.previewUrl) {
      navigator.clipboard.writeText(currentPreview.previewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('preview.title', 'Preview Deployments')}</h2>
        <p className="text-warm-400">{t('preview.loginRequired', 'Please log in to deploy previews.')}</p>
      </div>
    )
  }

  if (!requestId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-2">{t('preview.title', 'Preview Deployments')}</h2>
        <p className="text-warm-400">{t('preview.noProject', 'No project selected. Go to your project to deploy a preview.')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
        >
          {t('preview.goHome', 'Go to Dashboard')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-warm-400 hover:text-white transition-colors">
          &larr;
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{t('preview.title', 'Preview Deployments')}</h2>
          <p className="text-sm text-warm-400 mt-1">{t('preview.description', 'Deploy instant edge previews with sub-5-second URLs')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-warm-400">{t('preview.loading', 'Loading...')}</div>
      )}

      {/* Deploy Button */}
      {(!currentPreview || currentPreview.status === 'Expired' || currentPreview.status === 'Failed') && (
        <div className="bg-warm-800 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold mb-2">{t('preview.deployNew', 'Deploy Preview')}</h3>
          <p className="text-sm text-warm-400 mb-4">
            {t('preview.deployDescription', 'Generate an instant preview URL for your project. Preview expires after 24 hours.')}
          </p>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {deploying
              ? t('preview.deploying', 'Deploying...')
              : t('preview.deployButton', 'Deploy Preview')}
          </button>
        </div>
      )}

      {/* Active Preview */}
      {currentPreview && currentPreview.status === 'Deployed' && (
        <div className="bg-warm-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{t('preview.activePreview', 'Active Preview')}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(currentPreview.status)}`}>
              {currentPreview.status}
            </span>
          </div>

          {/* Preview URL */}
          <div className="bg-warm-900 rounded-lg p-4">
            <label className="text-xs text-warm-500 block mb-1">{t('preview.urlLabel', 'Preview URL')}</label>
            <div className="flex items-center gap-2">
              <a
                href={currentPreview.previewUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm font-mono flex-1 truncate"
              >
                {currentPreview.previewUrl}
              </a>
              <button
                onClick={handleCopyUrl}
                className="px-3 py-1.5 bg-warm-700 hover:bg-warm-600 rounded text-xs font-medium transition-colors whitespace-nowrap"
              >
                {copied ? t('preview.copied', 'Copied!') : t('preview.copy', 'Copy')}
              </button>
            </div>
          </div>

          {/* QR Code */}
          {currentPreview.previewUrl && (
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs text-warm-500">{t('preview.qrLabel', 'Scan for mobile preview')}</label>
              <div
                className="bg-warm-900 rounded-lg p-4"
                dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(currentPreview.previewUrl) }}
              />
            </div>
          )}

          {/* Countdown & Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-warm-900 rounded-lg p-3">
              <label className="text-xs text-warm-500 block mb-1">{t('preview.provider', 'Provider')}</label>
              <span className="text-sm text-white">
                {currentPreview.provider === 'AzureContainerInstances'
                  ? 'Azure Container Instances'
                  : currentPreview.provider}
              </span>
            </div>
            <div className="bg-warm-900 rounded-lg p-3">
              <label className="text-xs text-warm-500 block mb-1">{t('preview.expiresIn', 'Expires in')}</label>
              {currentPreview.expiresAt ? (
                <CountdownTimer expiresAt={currentPreview.expiresAt} />
              ) : (
                <span className="text-sm text-warm-400">--</span>
              )}
            </div>
          </div>

          {/* Container Details */}
          {(currentPreview.region || currentPreview.fqdn || currentPreview.port) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentPreview.region && (
                <div className="bg-warm-900 rounded-lg p-3">
                  <label className="text-xs text-warm-500 block mb-1">{t('preview.region', 'Region')}</label>
                  <span className="text-sm text-white">{currentPreview.region}</span>
                </div>
              )}
              {currentPreview.fqdn && (
                <div className="bg-warm-900 rounded-lg p-3">
                  <label className="text-xs text-warm-500 block mb-1">{t('preview.fqdn', 'FQDN')}</label>
                  <span className="text-sm text-white font-mono break-all">{currentPreview.fqdn}</span>
                </div>
              )}
              {currentPreview.port && (
                <div className="bg-warm-900 rounded-lg p-3">
                  <label className="text-xs text-warm-500 block mb-1">{t('preview.port', 'Port')}</label>
                  <span className="text-sm text-white">{currentPreview.port}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowLogs(true)}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-700 text-blue-300 rounded-lg text-sm font-medium transition-colors"
            >
              {t('preview.viewLogs', 'View Logs')}
            </button>
            <button
              onClick={handleExpire}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-700 text-red-300 rounded-lg text-sm font-medium transition-colors"
            >
              {t('preview.tearDown', 'Tear Down Preview')}
            </button>
          </div>
        </div>
      )}

      {/* Deploying State */}
      {currentPreview && currentPreview.status === 'Deploying' && (
        <div className="bg-warm-800 rounded-xl p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-1">{t('preview.deployingTitle', 'Deploying Preview...')}</h3>
          <p className="text-sm text-warm-400">{t('preview.deployingDescription', 'Your preview is being deployed to the edge. This usually takes less than 5 seconds.')}</p>
        </div>
      )}

      {/* Building Image State */}
      {currentPreview && currentPreview.status === 'BuildingImage' && (
        <div className="bg-warm-800 rounded-xl p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-1">{t('preview.buildingImage', 'Building Docker Image...')}</h3>
          <p className="text-sm text-warm-400">{t('preview.buildingImageDescription', 'Generating Dockerfile and building container image')}</p>
        </div>
      )}

      {/* Pushing Image State */}
      {currentPreview && currentPreview.status === 'PushingImage' && (
        <div className="bg-warm-800 rounded-xl p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-1">{t('preview.pushingImage', 'Pushing to Registry...')}</h3>
          <p className="text-sm text-warm-400">{t('preview.pushingImageDescription', 'Uploading image to Azure Container Registry')}</p>
        </div>
      )}

      {/* Creating Container State */}
      {currentPreview && currentPreview.status === 'CreatingContainer' && (
        <div className="bg-warm-800 rounded-xl p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-1">{t('preview.creatingContainer', 'Creating Container...')}</h3>
          <p className="text-sm text-warm-400">{t('preview.creatingContainerDescription', 'Provisioning Azure Container Instance with public IP')}</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-warm-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">{t('preview.history', 'Preview History')}</h3>
          <div className="space-y-2">
            {history.map((preview) => (
              <div key={preview.id} className="flex items-center justify-between py-2 px-3 bg-warm-900 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs font-medium ${getStatusColor(preview.status)}`}>
                    {preview.status}
                  </span>
                  {preview.previewUrl ? (
                    <a
                      href={preview.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono truncate"
                    >
                      {preview.previewUrl}
                    </a>
                  ) : (
                    <span className="text-xs text-warm-500">--</span>
                  )}
                </div>
                <span className="text-xs text-warm-500 whitespace-nowrap ml-2">
                  {new Date(preview.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Container Logs Modal */}
      <ContainerLogsModal
        projectId={requestId}
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
      />
    </div>
  )
}
