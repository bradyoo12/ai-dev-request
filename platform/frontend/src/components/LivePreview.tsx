import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type DeviceMode = 'desktop' | 'tablet' | 'mobile'

interface LivePreviewProps {
  previewUrl: string
}

const deviceSizes: Record<DeviceMode, { width: string; label: string }> = {
  desktop: { width: '100%', label: '1440px' },
  tablet: { width: '768px', label: '768px' },
  mobile: { width: '375px', label: '375px' },
}

export default function LivePreview({ previewUrl }: LivePreviewProps) {
  const { t } = useTranslation()
  const [device, setDevice] = useState<DeviceMode>('desktop')
  const [copied, setCopied] = useState(false)

  const fullUrl = previewUrl.startsWith('http') ? previewUrl : `https://${previewUrl}`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="bg-warm-900 border border-warm-700 rounded-xl overflow-hidden mb-6">
      <div className="flex items-center justify-between px-4 py-3 bg-warm-800 border-b border-warm-700">
        <h4 className="font-bold text-emerald-400">{t('preview.title')}</h4>
        <div className="flex items-center gap-2">
          <div className="flex bg-warm-900 rounded-lg p-0.5">
            {(['desktop', 'tablet', 'mobile'] as DeviceMode[]).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  device === d
                    ? 'bg-emerald-600 text-white'
                    : 'text-warm-400 hover:text-white'
                }`}
              >
                {t(`preview.${d}`)}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopyUrl}
            className="px-3 py-1 bg-warm-700 hover:bg-warm-600 rounded-lg text-xs text-warm-300 transition-colors"
          >
            {copied ? t('preview.copied') : t('preview.copyUrl')}
          </button>
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-warm-700 hover:bg-warm-600 rounded-lg text-xs text-warm-300 transition-colors"
          >
            {t('preview.openNew')}
          </a>
        </div>
      </div>

      <div className="flex justify-center bg-warm-950 p-4" style={{ minHeight: '500px' }}>
        <div
          className="bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            width: deviceSizes[device].width,
            maxWidth: '100%',
            height: '500px',
          }}
        >
          <iframe
            src={fullUrl}
            title={t('preview.title')}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>

      <div className="px-4 py-2 bg-warm-800 border-t border-warm-700 flex items-center justify-between text-xs text-warm-500">
        <span>{deviceSizes[device].label}</span>
        <span className="font-mono truncate max-w-[300px]">{fullUrl}</span>
      </div>
    </div>
  )
}
