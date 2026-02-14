import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createCodeGenSession,
  cancelCodeGenSession,
  getUserCodeGenSessions,
  connectToCodeGenStream,
} from '../api/streaming-codegen'
import type {
  StreamingCodeGenSession,
  CodeGenFileProgress,
  CodeGenStreamStartData,
  CodeGenFileCreatedData,
  CodeGenCodeChunkData,
  CodeGenFileUpdatedData,
  CodeGenProgressUpdateData,
  CodeGenBuildProgressData,
  CodeGenPreviewReadyData,
  CodeGenStreamCompleteData,
} from '../api/streaming-codegen'

const LANGUAGE_COLORS: Record<string, string> = {
  tsx: 'text-blue-400',
  ts: 'text-blue-300',
  jsx: 'text-yellow-400',
  js: 'text-yellow-300',
  css: 'text-pink-400',
  json: 'text-green-400',
  html: 'text-orange-400',
  md: 'text-warm-300',
}

export default function StreamingCodeGenPage() {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState<StreamingCodeGenSession[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [prompt, setPrompt] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  // Active session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [fileLanguages, setFileLanguages] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [fileStatuses, setFileStatuses] = useState<Record<string, string>>({})
  const [streamedTokens, setStreamedTokens] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)
  const [progressPercent, setProgressPercent] = useState(0)
  const [completedFiles, setCompletedFiles] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [streamStatus, setStreamStatus] = useState<string>('idle')
  const [buildSteps, setBuildSteps] = useState<{ step: string; status: string; output: string }[]>([])
  const [_previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string | null>(null)
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const codeContainerRef = useRef<HTMLPreElement | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getUserCodeGenSessions()
      setSessions(data)
    } catch {
      setError(t('streamingCodeGen.loadError', 'Failed to load sessions'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Auto-scroll code container
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight
    }
  }, [fileContents, activeTab])

  // Estimate time remaining
  useEffect(() => {
    if (isStreaming && streamStartTime && progressPercent > 5) {
      const elapsed = Date.now() - streamStartTime
      const totalEstimated = elapsed / (progressPercent / 100)
      const remaining = totalEstimated - elapsed
      const seconds = Math.round(remaining / 1000)
      if (seconds > 0) {
        setEstimatedTimeLeft(seconds > 60 ? `${Math.round(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`)
      }
    } else {
      setEstimatedTimeLeft(null)
    }
  }, [isStreaming, streamStartTime, progressPercent])

  const resetStreamState = () => {
    setFileContents({})
    setFileLanguages({})
    setFileStatuses({})
    setActiveTab(null)
    setCurrentFile(null)
    setStreamedTokens(0)
    setTotalTokens(0)
    setProgressPercent(0)
    setCompletedFiles(0)
    setTotalFiles(0)
    setBuildSteps([])
    setPreviewUrl(null)
    setPreviewHtml(null)
    setEstimatedTimeLeft(null)
    setStreamStartTime(null)
  }

  const handleStartGeneration = async () => {
    try {
      setError('')
      setStarting(true)
      resetStreamState()

      const session = await createCodeGenSession(prompt || undefined)
      setActiveSessionId(session.id)
      setStreamStatus('idle')

      // Connect to SSE stream
      const es = connectToCodeGenStream(
        session.id,
        (event) => {
          try {
            const data = JSON.parse(event.data)
            handleStreamEvent(event.type, data)
          } catch {
            if (event.type === 'error') {
              setError(event.data)
              setStreamStatus('error')
              setIsStreaming(false)
            }
          }
        },
        () => {
          setIsStreaming(false)
        }
      )

      eventSourceRef.current = es
      setIsStreaming(true)
      setStreamStatus('streaming')
      setStreamStartTime(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('streamingCodeGen.startError', 'Failed to start generation'))
    } finally {
      setStarting(false)
    }
  }

  const handleStreamEvent = (type: string, data: unknown) => {
    switch (type) {
      case 'stream_start': {
        const d = data as CodeGenStreamStartData
        setTotalFiles(d.totalFiles)
        setTotalTokens(d.totalTokens)
        setStreamStatus('streaming')
        break
      }
      case 'file_created': {
        const d = data as CodeGenFileCreatedData
        setCurrentFile(d.file)
        setActiveTab(d.file)
        setFileContents((prev) => ({ ...prev, [d.file]: '' }))
        setFileLanguages((prev) => ({ ...prev, [d.file]: d.language }))
        setFileStatuses((prev) => ({ ...prev, [d.file]: 'streaming' }))
        break
      }
      case 'code_chunk': {
        const d = data as CodeGenCodeChunkData
        setFileContents((prev) => ({
          ...prev,
          [d.file]: (prev[d.file] || '') + d.chunk,
        }))
        setStreamedTokens((prev) => prev + d.tokens)
        break
      }
      case 'file_updated': {
        const d = data as CodeGenFileUpdatedData
        setFileStatuses((prev) => ({ ...prev, [d.file]: 'completed' }))
        setCompletedFiles(d.completedFiles)
        break
      }
      case 'progress_update': {
        const d = data as CodeGenProgressUpdateData
        setStreamedTokens(d.streamedTokens)
        setTotalTokens(d.totalTokens)
        setProgressPercent(d.progressPercent)
        break
      }
      case 'build_progress': {
        const d = data as CodeGenBuildProgressData
        setStreamStatus('building')
        setBuildSteps((prev) => {
          const existing = prev.findIndex((s) => s.step === d.step)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = d
            return updated
          }
          return [...prev, d]
        })
        break
      }
      case 'preview_ready': {
        const d = data as CodeGenPreviewReadyData
        setPreviewUrl(d.previewUrl)
        setStreamStatus('preview_ready')
        generatePreviewHtml()
        break
      }
      case 'stream_complete': {
        const d = data as CodeGenStreamCompleteData
        setStreamStatus('completed')
        setIsStreaming(false)
        setProgressPercent(100)
        setStreamedTokens(d.totalTokens)
        setCompletedFiles(d.totalFiles)
        if (d.previewUrl) setPreviewUrl(d.previewUrl)
        eventSourceRef.current?.close()
        eventSourceRef.current = null
        loadSessions()
        break
      }
      case 'error': {
        const msg = typeof data === 'string' ? data : JSON.stringify(data)
        setError(msg)
        setStreamStatus('error')
        setIsStreaming(false)
        eventSourceRef.current?.close()
        eventSourceRef.current = null
        break
      }
    }
  }

  // Generate a simple preview HTML from the generated files
  const generatePreviewHtml = () => {
    setPreviewHtml(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body{font-family:'Inter',system-ui,sans-serif;}</style>
</head>
<body>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Generated App
        </span>
        <div class="flex gap-1">
          <a href="#" class="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700">Home</a>
          <a href="#" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">About</a>
          <a href="#" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Contact</a>
        </div>
      </div>
    </nav>
    <main class="max-w-6xl mx-auto px-6 py-10">
      <section class="text-center py-16">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">Welcome to Your App</h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">A modern React application built with TypeScript, Tailwind CSS, and React Router. Generated in real-time by AI.</p>
      </section>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4"><span class="text-2xl">&#9889;</span></div>
          <h3 class="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
          <p class="text-sm text-gray-600">Built with Vite for instant HMR and optimized builds.</p>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4"><span class="text-2xl">&#127912;</span></div>
          <h3 class="font-semibold text-gray-900 mb-2">Beautiful UI</h3>
          <p class="text-sm text-gray-600">Styled with Tailwind CSS for a polished look.</p>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4"><span class="text-2xl">&#128274;</span></div>
          <h3 class="font-semibold text-gray-900 mb-2">Type Safe</h3>
          <p class="text-sm text-gray-600">Full TypeScript support for reliable code.</p>
        </div>
      </div>
    </main>
    <footer class="border-t border-gray-200 py-8 text-center text-sm text-gray-500">Built with AI Dev Request Platform</footer>
  </div>
</body>
</html>`)
  }

  const handleCancelGeneration = async () => {
    try {
      setError('')
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      if (activeSessionId) {
        await cancelCodeGenSession(activeSessionId)
      }
      setStreamStatus('cancelled')
      setIsStreaming(false)
      await loadSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('streamingCodeGen.cancelError', 'Failed to cancel'))
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'idle':
        return { color: 'bg-warm-500', label: t('streamingCodeGen.status.idle', 'Idle'), textColor: 'text-warm-400' }
      case 'streaming':
        return { color: 'bg-blue-500 animate-pulse', label: t('streamingCodeGen.status.streaming', 'Generating'), textColor: 'text-blue-400' }
      case 'building':
        return { color: 'bg-yellow-500 animate-pulse', label: t('streamingCodeGen.status.building', 'Building'), textColor: 'text-yellow-400' }
      case 'preview_ready':
        return { color: 'bg-purple-500', label: t('streamingCodeGen.status.previewReady', 'Preview Ready'), textColor: 'text-purple-400' }
      case 'completed':
        return { color: 'bg-green-500', label: t('streamingCodeGen.status.completed', 'Completed'), textColor: 'text-green-400' }
      case 'cancelled':
        return { color: 'bg-orange-500', label: t('streamingCodeGen.status.cancelled', 'Cancelled'), textColor: 'text-orange-400' }
      case 'error':
        return { color: 'bg-red-500', label: t('streamingCodeGen.status.error', 'Error'), textColor: 'text-red-400' }
      default:
        return { color: 'bg-warm-500', label: status, textColor: 'text-warm-400' }
    }
  }

  const getFileIcon = (language: string) => {
    switch (language) {
      case 'tsx':
      case 'jsx':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        )
      case 'css':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/></svg>
        )
      case 'json':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
        )
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
        )
    }
  }

  const getHistoryStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-400'
      case 'streaming': return 'bg-blue-900/50 text-blue-400'
      case 'building': return 'bg-yellow-900/50 text-yellow-400'
      case 'preview_ready': return 'bg-purple-900/50 text-purple-400'
      case 'cancelled': return 'bg-orange-900/50 text-orange-400'
      case 'error': return 'bg-red-900/50 text-red-400'
      default: return 'bg-warm-700 text-warm-400'
    }
  }

  const parseFiles = (session: StreamingCodeGenSession): CodeGenFileProgress[] => {
    if (!session.generatedFilesJson) return []
    try {
      return JSON.parse(session.generatedFilesJson)
    } catch {
      return []
    }
  }

  const statusIndicator = getStatusIndicator(streamStatus)
  const fileTabs = Object.keys(fileContents)
  const fileTree = fileTabs.reduce<Record<string, string[]>>((acc, path) => {
    const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '.'
    if (!acc[dir]) acc[dir] = []
    acc[dir].push(path)
    return acc
  }, {})

  if (loading && sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-warm-400">{t('streamingCodeGen.loading', 'Loading sessions...')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Prompt Input & Actions */}
      <div className="bg-warm-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-warm-200 mb-3">
          {t('streamingCodeGen.promptTitle', 'Describe Your App')}
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('streamingCodeGen.promptPlaceholder', 'e.g., A modern portfolio site with projects gallery...')}
              className="w-full bg-warm-900 border border-warm-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-warm-500 focus:outline-none focus:border-blue-500 transition-colors"
              onKeyDown={(e) => { if (e.key === 'Enter' && !isStreaming && !starting) handleStartGeneration() }}
              disabled={isStreaming}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3">
              <div className={`w-2.5 h-2.5 rounded-full ${statusIndicator.color}`} />
              <span className={`text-xs font-medium ${statusIndicator.textColor}`}>{statusIndicator.label}</span>
            </div>

            {!isStreaming ? (
              <button
                onClick={handleStartGeneration}
                disabled={starting}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                {starting ? t('streamingCodeGen.starting', 'Starting...') : t('streamingCodeGen.generate', 'Generate')}
              </button>
            ) : (
              <button
                onClick={handleCancelGeneration}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="5" y="5" rx="2"/></svg>
                {t('streamingCodeGen.cancel', 'Cancel')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(isStreaming || streamStatus === 'completed' || streamStatus === 'cancelled' || streamStatus === 'building' || streamStatus === 'preview_ready') && (
        <div className="bg-warm-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-warm-400">
                {t('streamingCodeGen.progress', 'Progress')}: {progressPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-warm-500">
                {completedFiles}/{totalFiles} {t('streamingCodeGen.files', 'files')}
              </span>
              {estimatedTimeLeft && (
                <span className="text-xs text-warm-500">
                  ~{estimatedTimeLeft} {t('streamingCodeGen.remaining', 'remaining')}
                </span>
              )}
            </div>
            <span className="text-xs text-warm-500 font-mono">
              {streamedTokens.toLocaleString()}/{totalTokens.toLocaleString()} {t('streamingCodeGen.tokens', 'tokens')}
            </span>
          </div>
          <div className="w-full h-2.5 bg-warm-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                streamStatus === 'completed' ? 'bg-green-500' :
                streamStatus === 'cancelled' ? 'bg-orange-500' :
                streamStatus === 'building' ? 'bg-yellow-500' :
                streamStatus === 'preview_ready' ? 'bg-purple-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          {currentFile && isStreaming && (
            <p className="text-xs text-warm-500 mt-2 font-mono">
              {t('streamingCodeGen.generating', 'Generating')}: {currentFile}
            </p>
          )}
        </div>
      )}

      {/* Main Content: Code Editor + File Tree + Preview */}
      {fileTabs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* File Tree (left panel) */}
          <div className="lg:col-span-1 bg-warm-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-warm-700">
              <h4 className="text-xs font-semibold text-warm-300 uppercase tracking-wider">
                {t('streamingCodeGen.fileTree', 'File Explorer')}
              </h4>
            </div>
            <div className="p-3 space-y-1 max-h-96 overflow-auto">
              {Object.entries(fileTree).map(([dir, paths]) => (
                <div key={dir}>
                  {dir !== '.' && (
                    <div className="flex items-center gap-1.5 px-2 py-1 text-warm-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>
                      <span className="text-xs font-mono">{dir}/</span>
                    </div>
                  )}
                  {paths.map((path) => {
                    const fileName = path.split('/').pop() || path
                    const lang = fileLanguages[path] || ''
                    const status = fileStatuses[path] || 'pending'
                    const isActive = activeTab === path
                    return (
                      <button
                        key={path}
                        onClick={() => setActiveTab(path)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                          isActive
                            ? 'bg-warm-700 text-white'
                            : 'text-warm-400 hover:bg-warm-700/50 hover:text-warm-200'
                        } ${dir !== '.' ? 'ml-4' : ''}`}
                      >
                        <span className={LANGUAGE_COLORS[lang] || 'text-warm-400'}>
                          {getFileIcon(lang)}
                        </span>
                        <span className="truncate flex-1 text-left">{fileName}</span>
                        {status === 'streaming' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        )}
                        {status === 'completed' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 flex-shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Code Editor (right panel) */}
          <div className="lg:col-span-2 bg-warm-800 rounded-xl overflow-hidden">
            {/* File Tabs */}
            <div className="flex border-b border-warm-700 overflow-x-auto">
              {fileTabs.map((filePath) => {
                const status = fileStatuses[filePath] || 'pending'
                const lang = fileLanguages[filePath] || ''
                const isActive = activeTab === filePath
                return (
                  <button
                    key={filePath}
                    onClick={() => setActiveTab(filePath)}
                    className={`px-4 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? status === 'completed'
                          ? 'text-green-400 border-green-500 bg-warm-900/30'
                          : status === 'streaming'
                          ? 'text-blue-400 border-blue-500 bg-warm-900/30'
                          : 'text-warm-300 border-warm-500 bg-warm-900/30'
                        : 'text-warm-500 border-transparent hover:text-warm-300'
                    }`}
                  >
                    <span className={LANGUAGE_COLORS[lang] || 'text-warm-400'}>
                      {getFileIcon(lang)}
                    </span>
                    {filePath.split('/').pop()}
                    {status === 'streaming' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Code Display Area */}
            <div className="relative">
              {activeTab && (
                <div className="px-3 py-1.5 bg-warm-900/50 border-b border-warm-700 flex items-center justify-between">
                  <span className="text-xs text-warm-500 font-mono">{activeTab}</span>
                  <span className={`text-xs ${LANGUAGE_COLORS[fileLanguages[activeTab] || ''] || 'text-warm-500'}`}>
                    {fileLanguages[activeTab]?.toUpperCase() || ''}
                  </span>
                </div>
              )}
              <pre
                ref={codeContainerRef}
                className="p-4 overflow-auto max-h-[480px] bg-warm-900 text-sm font-mono leading-relaxed"
              >
                <code className="text-warm-200">
                  {activeTab ? (fileContents[activeTab] || '') : ''}
                  {isStreaming && activeTab && fileStatuses[activeTab] === 'streaming' && (
                    <span className="inline-block w-2 h-5 bg-green-400 animate-pulse ml-0.5 -mb-1" />
                  )}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Build Progress */}
      {buildSteps.length > 0 && (
        <div className="bg-warm-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-warm-200 mb-3">
            {t('streamingCodeGen.buildProgress', 'Build Progress')}
          </h3>
          <div className="space-y-2">
            {buildSteps.map((step) => (
              <div key={step.step} className="flex items-center gap-3 bg-warm-900 rounded-lg px-4 py-2.5">
                {step.status === 'running' ? (
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : step.status === 'completed' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 flex-shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-warm-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <span className="text-xs font-medium text-warm-200 capitalize">{step.step}</span>
                  <span className="text-xs text-warm-500 ml-2">{step.output}</span>
                </div>
                <span className={`text-xs font-medium ${step.status === 'completed' ? 'text-green-400' : step.status === 'running' ? 'text-yellow-400' : 'text-warm-500'}`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Preview */}
      {previewHtml && (streamStatus === 'preview_ready' || streamStatus === 'completed') && (
        <div className="bg-warm-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-warm-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-warm-200">
              {t('streamingCodeGen.livePreview', 'Live Preview')}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-400">{t('streamingCodeGen.previewLive', 'Live')}</span>
            </div>
          </div>
          <div className="bg-white rounded-b-xl">
            <iframe
              srcDoc={previewHtml}
              title="Live Preview"
              className="w-full h-[500px] border-0"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isStreaming && fileTabs.length === 0 && streamStatus !== 'completed' && streamStatus !== 'preview_ready' && (
        <div className="bg-warm-800 rounded-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <h4 className="text-lg font-bold mb-2">{t('streamingCodeGen.emptyTitle', 'Real-Time Code Generation')}</h4>
          <p className="text-sm text-warm-400 mb-6 max-w-md mx-auto">
            {t('streamingCodeGen.emptyDescription', 'Describe your app and watch as AI generates code in real-time with a live preview. Similar to Bolt.new and Lovable.')}
          </p>
          <button
            onClick={handleStartGeneration}
            disabled={starting}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            {starting ? t('streamingCodeGen.starting', 'Starting...') : t('streamingCodeGen.startGeneration', 'Start Generating')}
          </button>
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-warm-800 hover:bg-warm-700 text-warm-300 rounded-lg text-xs font-medium transition-colors"
          >
            {showHistory ? t('streamingCodeGen.hideHistory', 'Hide History') : t('streamingCodeGen.showHistory', 'Session History')} ({sessions.length})
          </button>

          {showHistory && (
            <div className="bg-warm-800 rounded-xl p-5 mt-3">
              <h3 className="text-sm font-bold mb-3">{t('streamingCodeGen.historyTitle', 'Previous Sessions')}</h3>
              <div className="space-y-2">
                {sessions.map((entry) => {
                  const files = parseFiles(entry)
                  return (
                    <div key={entry.id} className="bg-warm-900 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getHistoryStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        {entry.prompt && (
                          <span className="text-xs text-warm-300 truncate max-w-48">
                            {entry.prompt}
                          </span>
                        )}
                        {files.length > 0 && (
                          <span className="text-xs text-warm-500">
                            {entry.completedFiles} {t('streamingCodeGen.files', 'files')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-warm-500">{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
