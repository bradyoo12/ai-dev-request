import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { generateExpoPreview } from '../api/requests'

interface MobilePreviewProps {
  requestId: string
  previewUrl?: string
  platform?: string
}

export default function MobilePreview({ requestId, previewUrl, platform }: MobilePreviewProps) {
  const { t } = useTranslation()
  const [snackUrl, setSnackUrl] = useState<string | null>(previewUrl || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMobilePlatform =
    platform === 'mobile' ||
    platform?.includes('react-native') ||
    platform?.includes('expo')

  if (!isMobilePlatform) return null

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateExpoPreview(requestId)
      if (result.success) {
        setSnackUrl(result.snackUrl)
      } else {
        setError(result.error || t('mobile.previewError'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mobile.previewError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-6 mb-6">
      <h4 className="font-bold mb-4 text-purple-400">{t('mobile.previewTitle')}</h4>

      {snackUrl ? (
        <div className="flex items-start gap-6">
          <div className="bg-white rounded-xl p-3 flex-shrink-0">
            <QRCodeSVG value={snackUrl} size={128} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-warm-300 mb-3">{t('mobile.previewDescription')}</p>
            <div className="text-xs text-warm-400 space-y-1 mb-4">
              <p>1. {t('mobile.step1')}</p>
              <p>2. {t('mobile.step2')}</p>
              <p>3. {t('mobile.step3')}</p>
            </div>
            <a
              href={snackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t('mobile.openInBrowser')}
            </a>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          {loading ? (
            <div>
              <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-warm-400">{t('mobile.generating')}</p>
            </div>
          ) : error ? (
            <div>
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t('mobile.retryGenerate')}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-warm-400 mb-3">{t('mobile.generateDescription')}</p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t('mobile.generatePreview')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
