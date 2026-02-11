import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getPreviews,
  createPreview,
  iteratePreview,
  exportPreview,
  deletePreview,
  type ComponentPreview,
  type ChatMessage,
} from '../api/component-preview'

export default function ComponentPreviewPage() {
  const { t } = useTranslation()
  const [previews, setPreviews] = useState<ComponentPreview[]>([])
  const [activePreview, setActivePreview] = useState<ComponentPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [componentName, setComponentName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [iterating, setIterating] = useState(false)
  const [creating, setCreating] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  async function loadPreviews() {
    setLoading(true)
    setError('')
    try {
      const data = await getPreviews()
      setPreviews(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('componentPreview.error.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!componentName.trim() || !prompt.trim()) return
    setCreating(true)
    setError('')
    try {
      const preview = await createPreview(componentName.trim(), prompt.trim())
      setPreviews((prev) => [preview, ...prev])
      setActivePreview(preview)
      setComponentName('')
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('componentPreview.error.createFailed'))
    } finally {
      setCreating(false)
    }
  }

  async function handleIterate() {
    if (!activePreview || !chatInput.trim()) return
    setIterating(true)
    setError('')
    try {
      const updated = await iteratePreview(activePreview.id, chatInput.trim())
      setActivePreview(updated)
      setPreviews((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setChatInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('componentPreview.error.iterateFailed'))
    } finally {
      setIterating(false)
    }
  }

  async function handleExport() {
    if (!activePreview) return
    try {
      const updated = await exportPreview(activePreview.id)
      setActivePreview(updated)
      setPreviews((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('componentPreview.error.exportFailed'))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePreview(id)
      setPreviews((prev) => prev.filter((p) => p.id !== id))
      if (activePreview?.id === id) setActivePreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('componentPreview.error.deleteFailed'))
    }
  }

  useEffect(() => {
    loadPreviews()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activePreview?.chatHistory])

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-600/20 text-gray-400',
    generating: 'bg-yellow-600/20 text-yellow-400',
    ready: 'bg-green-600/20 text-green-400',
    exported: 'bg-blue-600/20 text-blue-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">{t('componentPreview.title')}</h3>
        <p className="text-gray-400 text-sm mb-4">{t('componentPreview.subtitle')}</p>

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Create New Component */}
        <div className="space-y-3">
          <input
            type="text"
            value={componentName}
            onChange={(e) => setComponentName(e.target.value)}
            placeholder={t('componentPreview.namePlaceholder')}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('componentPreview.promptPlaceholder')}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm resize-none"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !componentName.trim() || !prompt.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {creating ? t('componentPreview.creating') : t('componentPreview.create')}
          </button>
        </div>
      </div>

      {/* Main Layout: Preview List + Active Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component List */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4">{t('componentPreview.myComponents')}</h4>
          {loading ? (
            <p className="text-gray-400 text-sm">{t('componentPreview.loadingList')}</p>
          ) : previews.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('componentPreview.empty')}</p>
          ) : (
            <div className="space-y-2">
              {previews.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActivePreview(p)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activePreview?.id === p.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white text-sm">{p.componentName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-gray-600/20 text-gray-400'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    v{p.iterationCount} &middot; {new Date(p.updatedAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                    className="mt-1 text-xs text-red-400 hover:text-red-300"
                  >
                    {t('componentPreview.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Preview */}
        {activePreview ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Preview Header */}
            <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">{activePreview.componentName}</h4>
                <p className="text-xs text-gray-400">
                  {t('componentPreview.iteration')} {activePreview.iterationCount} &middot;{' '}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[activePreview.status] || ''}`}>
                    {activePreview.status}
                  </span>
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={activePreview.status === 'exported'}
                className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-700/50 rounded text-sm transition-colors disabled:opacity-50"
              >
                {activePreview.status === 'exported' ? t('componentPreview.exported') : t('componentPreview.export')}
              </button>
            </div>

            {/* Code Preview */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-300 mb-3">{t('componentPreview.codePreview')}</h5>
              <div className="bg-gray-950 rounded-lg p-4 overflow-auto max-h-[400px]">
                <pre className="text-sm text-green-300 font-mono whitespace-pre-wrap">{activePreview.code}</pre>
              </div>
            </div>

            {/* Live Preview (iframe sandbox) */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-300 mb-3">{t('componentPreview.livePreview')}</h5>
              <div className="bg-white rounded-lg overflow-hidden" style={{ height: '300px' }}>
                <iframe
                  srcDoc={generatePreviewHtml(activePreview.code)}
                  sandbox="allow-scripts"
                  className="w-full h-full border-0"
                  title="Component Preview"
                />
              </div>
            </div>

            {/* Chat / Iteration */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-300 mb-3">{t('componentPreview.chatTitle')}</h5>
              <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                {(activePreview.chatHistory as ChatMessage[]).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-900/20 border border-blue-700/30 text-blue-200 ml-8'
                        : 'bg-gray-800/50 border border-gray-700/30 text-gray-300 mr-8'
                    }`}
                  >
                    <span className="text-xs text-gray-500 block mb-1">
                      {msg.role === 'user' ? t('componentPreview.you') : t('componentPreview.ai')}
                    </span>
                    {msg.content}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleIterate()}
                  placeholder={t('componentPreview.chatPlaceholder')}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  disabled={iterating}
                />
                <button
                  onClick={handleIterate}
                  disabled={iterating || !chatInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
                >
                  {iterating ? t('componentPreview.sending') : t('componentPreview.send')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400">{t('componentPreview.selectOrCreate')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function generatePreviewHtml(code: string): string {
  const bodyContent = extractJsx(code)
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.tailwindcss.com"><\/script>
<style>body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }</style>
</head>
<body>
${bodyContent}
</body>
</html>`
}

function extractJsx(code: string): string {
  const returnMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}/)
  if (returnMatch) {
    let jsx = returnMatch[1]
    jsx = jsx.replace(/className=/g, 'class=')
    jsx = jsx.replace(/\{[^}]*\}/g, '')
    return jsx
  }
  return '<div class="p-6 text-gray-500">Preview will appear here</div>'
}
