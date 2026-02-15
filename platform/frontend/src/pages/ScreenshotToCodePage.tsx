import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  convertScreenshot,
  listConversions,
  deleteConversion,
  getScreenshotToCodeStats,
  type ScreenshotConversion,
  type ScreenshotToCodeStats,
} from '../api/screenshot-to-code'

type TabId = 'upload' | 'history' | 'stats'

export default function ScreenshotToCodePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabId>('upload')
  const [conversions, setConversions] = useState<ScreenshotConversion[]>([])
  const [stats, setStats] = useState<ScreenshotToCodeStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Upload form
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [designName, setDesignName] = useState('')
  const [framework, setFramework] = useState('react')
  const [stylingLib, setStylingLib] = useState('tailwind')
  const [converting, setConverting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedConversion, setSelectedConversion] = useState<ScreenshotConversion | null>(null)
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tab === 'history') loadConversions()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadConversions() {
    setLoading(true)
    try { setConversions(await listConversions()) } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try { setStats(await getScreenshotToCodeStats()) } catch { /* ignore */ }
    setLoading(false)
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
      // Extract base64 data without the data URL prefix
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  async function handleConvert() {
    if (!imageBase64) return
    setConverting(true)
    try {
      const result = await convertScreenshot({
        imageBase64,
        designName: designName || undefined,
        framework,
        stylingLib,
      })
      setSelectedConversion(result)
      setImageBase64(null)
      setImagePreview(null)
      setDesignName('')
    } catch { /* ignore */ }
    setConverting(false)
  }

  function handleClearImage() {
    setImageBase64(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    try {
      await deleteConversion(id)
      setConversions(prev => prev.filter(c => c.id !== id))
    } catch { /* ignore */ }
  }

  function copyToClipboard(text: string, fileName: string) {
    navigator.clipboard.writeText(text)
    setCopiedFile(fileName)
    setTimeout(() => setCopiedFile(null), 2000)
  }

  function renderGeneratedCode(conversion: ScreenshotConversion) {
    try {
      const parsed = JSON.parse(conversion.generatedCodeJson)
      const files = parsed.files || []
      return (
        <div className="space-y-4">
          {files.map((file: { name: string; language?: string; code: string }, idx: number) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-1">
                <h5 className="text-warm-300 text-sm font-medium">{file.name}</h5>
                <button
                  onClick={() => copyToClipboard(file.code, file.name)}
                  className="text-xs px-2 py-1 bg-warm-700 text-warm-300 rounded hover:bg-warm-600"
                >
                  {copiedFile === file.name ? t('screenshotToCode.copied', 'Copied!') : t('screenshotToCode.copy', 'Copy')}
                </button>
              </div>
              <pre className="bg-warm-900 p-3 rounded text-xs text-warm-300 overflow-x-auto max-h-80 whitespace-pre-wrap">{file.code}</pre>
            </div>
          ))}
        </div>
      )
    } catch {
      return <pre className="bg-warm-900 p-3 rounded text-xs text-warm-300 overflow-x-auto max-h-40">{conversion.generatedCodeJson}</pre>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('screenshotToCode.title', 'Screenshot to Code')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('screenshotToCode.subtitle', 'Upload screenshots or Figma designs and convert them to production-ready React components')}</p>
      </div>

      <div className="flex gap-2">
        {(['upload', 'history', 'stats'] as TabId[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-purple-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`screenshotToCode.tabs.${tabId}`, tabId === 'upload' ? 'Upload' : tabId === 'history' ? 'History' : 'Stats')}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('screenshotToCode.uploadTitle', 'Upload Screenshot')}</h4>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-purple-500 bg-purple-900/20'
                  : imagePreview
                    ? 'border-green-600 bg-green-900/10'
                    : 'border-warm-600 hover:border-warm-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearImage() }}
                    className="text-xs px-3 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800"
                  >
                    {t('screenshotToCode.clearImage', 'Remove Image')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl text-warm-500">&#128247;</div>
                  <p className="text-warm-400 text-sm">{t('screenshotToCode.dropzone', 'Drag & drop a screenshot here, or click to browse')}</p>
                  <p className="text-warm-500 text-xs">{t('screenshotToCode.formats', 'Supports PNG, JPG, GIF, WebP')}</p>
                </div>
              )}
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm text-warm-400 mb-1">{t('screenshotToCode.designName', 'Design Name')}</label>
              <input
                value={designName}
                onChange={e => setDesignName(e.target.value)}
                className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                placeholder={t('screenshotToCode.namePlaceholder', 'Optional name for this conversion')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('screenshotToCode.framework', 'Framework')}</label>
                <select value={framework} onChange={e => setFramework(e.target.value)} className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm">
                  <option value="react">React</option>
                  <option value="nextjs">Next.js</option>
                  <option value="vue">Vue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('screenshotToCode.styling', 'Styling')}</label>
                <select value={stylingLib} onChange={e => setStylingLib(e.target.value)} className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm">
                  <option value="tailwind">Tailwind CSS</option>
                  <option value="css-modules">CSS Modules</option>
                  <option value="styled-components">Styled Components</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={converting || !imageBase64}
              className="px-6 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {converting ? t('screenshotToCode.converting', 'Converting...') : t('screenshotToCode.convertBtn', 'Convert to Code')}
            </button>
          </div>

          {/* Result */}
          {selectedConversion && (
            <div className="bg-warm-800 rounded-lg p-6 space-y-4 border border-purple-700">
              <div className="flex justify-between items-center">
                <h4 className="text-white font-medium">{selectedConversion.designName}</h4>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  selectedConversion.status === 'completed' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>{selectedConversion.status}</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-400">{selectedConversion.componentCount}</p>
                  <p className="text-warm-400 text-xs">{t('screenshotToCode.components', 'Components')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{selectedConversion.framework}</p>
                  <p className="text-warm-400 text-xs">{t('screenshotToCode.framework', 'Framework')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{Math.round(selectedConversion.processingTimeMs)}ms</p>
                  <p className="text-warm-400 text-xs">{t('screenshotToCode.processingTime', 'Processing')}</p>
                </div>
              </div>

              {selectedConversion.status === 'completed' && (
                <div>
                  <h5 className="text-warm-400 text-sm mb-2">{t('screenshotToCode.generatedCode', 'Generated Code')}</h5>
                  {renderGeneratedCode(selectedConversion)}
                </div>
              )}

              {selectedConversion.status === 'failed' && selectedConversion.errorMessage && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{selectedConversion.errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('screenshotToCode.loading', 'Loading...')}</p>
          ) : conversions.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('screenshotToCode.noConversions', 'No conversions yet. Upload a screenshot to get started.')}</p>
            </div>
          ) : (
            conversions.map(conv => (
              <div key={conv.id} className="bg-warm-800 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-medium">{conv.designName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-warm-400">
                    <span>{conv.framework} + {conv.stylingLib}</span>
                    <span>{conv.componentCount} {t('screenshotToCode.components', 'components')}</span>
                    <span>{Math.round(conv.processingTimeMs)}ms</span>
                    <span className={conv.status === 'completed' ? 'text-green-400' : conv.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}>{conv.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedConversion(conv); setTab('upload') }} className="text-xs px-2 py-1 bg-purple-900 text-purple-300 rounded hover:bg-purple-800">
                    {t('screenshotToCode.view', 'View')}
                  </button>
                  <button onClick={() => handleDelete(conv.id)} className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800">
                    {t('screenshotToCode.deleteBtn', 'Delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalConversions}</p>
              <p className="text-warm-400 text-sm">{t('screenshotToCode.stats.total', 'Total Conversions')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.totalComponents}</p>
              <p className="text-warm-400 text-sm">{t('screenshotToCode.stats.components', 'Components Generated')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.completedConversions}</p>
              <p className="text-warm-400 text-sm">{t('screenshotToCode.stats.completed', 'Completed')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.failedConversions}</p>
              <p className="text-warm-400 text-sm">{t('screenshotToCode.stats.failed', 'Failed')}</p>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.avgProcessingTime}ms</p>
              <p className="text-warm-400 text-sm">{t('screenshotToCode.stats.avgTime', 'Avg Processing')}</p>
            </div>
          </div>
          {stats.recentConversions.length > 0 && (
            <div className="bg-warm-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">{t('screenshotToCode.stats.recent', 'Recent Conversions')}</h4>
              <div className="space-y-2">
                {stats.recentConversions.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-warm-300">{r.designName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-warm-400">{r.framework}</span>
                      <span className="text-purple-400">{r.componentCount} comp</span>
                      <span className={r.status === 'completed' ? 'text-green-400' : 'text-red-400'}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
