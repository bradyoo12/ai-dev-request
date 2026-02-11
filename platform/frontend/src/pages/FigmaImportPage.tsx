import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listImports,
  importFromUrl,
  importFromScreenshot,
  deleteImport,
  getFigmaImportStats,
  type FigmaImport,
  type FigmaImportStats,
} from '../api/figmaimport'

type FigmaTab = 'import' | 'history' | 'stats'

export default function FigmaImportPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<FigmaTab>('import')
  const [imports, setImports] = useState<FigmaImport[]>([])
  const [stats, setStats] = useState<FigmaImportStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Import form
  const [figmaUrl, setFigmaUrl] = useState('')
  const [designName, setDesignName] = useState('')
  const [framework, setFramework] = useState('react')
  const [stylingLib, setStylingLib] = useState('tailwind')
  const [importing, setImporting] = useState(false)
  const [selectedImport, setSelectedImport] = useState<FigmaImport | null>(null)

  useEffect(() => {
    if (tab === 'history') loadImports()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadImports() {
    setLoading(true)
    try { setImports(await listImports()) } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try { setStats(await getFigmaImportStats()) } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleImportUrl() {
    if (!figmaUrl.trim()) return
    setImporting(true)
    try {
      const result = await importFromUrl({ figmaUrl, designName: designName || undefined, framework, stylingLib })
      setSelectedImport(result)
      setFigmaUrl('')
      setDesignName('')
    } catch { /* ignore */ }
    setImporting(false)
  }

  async function handleImportScreenshot() {
    setImporting(true)
    try {
      const result = await importFromScreenshot({ designName: designName || 'Screenshot Import', framework, stylingLib })
      setSelectedImport(result)
    } catch { /* ignore */ }
    setImporting(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteImport(id)
      setImports(prev => prev.filter(i => i.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('figmaImport.title', 'Figma to Code')}</h3>
        <p className="text-gray-400 text-sm mt-1">{t('figmaImport.subtitle', 'Import Figma designs and generate production-ready components')}</p>
      </div>

      <div className="flex gap-2">
        {(['import', 'history', 'stats'] as FigmaTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`figmaImport.tabs.${tabId}`, tabId === 'import' ? 'Import' : tabId === 'history' ? 'History' : 'Stats')}
          </button>
        ))}
      </div>

      {tab === 'import' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('figmaImport.fromUrl', 'Import from Figma URL')}</h4>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('figmaImport.figmaUrl', 'Figma URL')}</label>
              <input value={figmaUrl} onChange={e => setFigmaUrl(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm" placeholder="https://www.figma.com/file/..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('figmaImport.designName', 'Design Name')}</label>
              <input value={designName} onChange={e => setDesignName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm" placeholder={t('figmaImport.namePlaceholder', 'Optional name for this import')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('figmaImport.framework', 'Framework')}</label>
                <select value={framework} onChange={e => setFramework(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm">
                  <option value="react">React</option>
                  <option value="nextjs">Next.js</option>
                  <option value="vue">Vue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{t('figmaImport.styling', 'Styling')}</label>
                <select value={stylingLib} onChange={e => setStylingLib(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm">
                  <option value="tailwind">Tailwind CSS</option>
                  <option value="css-modules">CSS Modules</option>
                  <option value="styled-components">Styled Components</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleImportUrl} disabled={importing || !figmaUrl.trim()} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50">
                {importing ? t('figmaImport.importing', 'Importing...') : t('figmaImport.importBtn', 'Import from URL')}
              </button>
              <button onClick={handleImportScreenshot} disabled={importing} className="px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 disabled:opacity-50">
                {t('figmaImport.screenshotBtn', 'Import Screenshot')}
              </button>
            </div>
          </div>

          {selectedImport && (
            <div className="bg-gray-800 rounded-lg p-6 space-y-4 border border-purple-700">
              <div className="flex justify-between items-center">
                <h4 className="text-white font-medium">{selectedImport.designName}</h4>
                <span className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded">{selectedImport.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-400">{selectedImport.componentCount}</p>
                  <p className="text-gray-400 text-xs">{t('figmaImport.components', 'Components')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{selectedImport.tokenCount}</p>
                  <p className="text-gray-400 text-xs">{t('figmaImport.tokens', 'Design Tokens')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{Math.round(selectedImport.processingTimeMs)}ms</p>
                  <p className="text-gray-400 text-xs">{t('figmaImport.processingTime', 'Processing')}</p>
                </div>
              </div>
              <div>
                <h5 className="text-gray-400 text-sm mb-2">{t('figmaImport.extractedTokens', 'Extracted Tokens')}</h5>
                <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-40">{JSON.stringify(JSON.parse(selectedImport.designTokensJson), null, 2)}</pre>
              </div>
              <div>
                <h5 className="text-gray-400 text-sm mb-2">{t('figmaImport.generatedCode', 'Generated Code')}</h5>
                <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-40">{JSON.stringify(JSON.parse(selectedImport.generatedCodeJson), null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-400 text-sm">{t('figmaImport.loading', 'Loading...')}</p>
          ) : imports.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">{t('figmaImport.noImports', 'No imports yet. Import a Figma design to get started.')}</p>
            </div>
          ) : (
            imports.map(imp => (
              <div key={imp.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-medium">{imp.designName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{imp.sourceType}</span>
                    <span>{imp.framework} + {imp.stylingLib}</span>
                    <span>{imp.componentCount} {t('figmaImport.components', 'components')}</span>
                    <span className={imp.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>{imp.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedImport(imp)} className="text-xs px-2 py-1 bg-purple-900 text-purple-300 rounded hover:bg-purple-800">{t('figmaImport.view', 'View')}</button>
                  <button onClick={() => handleDelete(imp.id)} className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800">{t('figmaImport.deleteBtn', 'Delete')}</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalImports}</p>
              <p className="text-gray-400 text-sm">{t('figmaImport.stats.total', 'Total Imports')}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.totalComponents}</p>
              <p className="text-gray-400 text-sm">{t('figmaImport.stats.components', 'Components')}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.totalTokens}</p>
              <p className="text-gray-400 text-sm">{t('figmaImport.stats.tokens', 'Design Tokens')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.completedImports}</p>
              <p className="text-gray-400 text-sm">{t('figmaImport.stats.completed', 'Completed')}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.avgProcessingTime}ms</p>
              <p className="text-gray-400 text-sm">{t('figmaImport.stats.avgTime', 'Avg Processing')}</p>
            </div>
          </div>
          {stats.recentImports.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">{t('figmaImport.stats.recent', 'Recent Imports')}</h4>
              <div className="space-y-2">
                {stats.recentImports.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{r.designName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{r.sourceType}</span>
                      <span className="text-purple-400">{r.componentCount} comp</span>
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
