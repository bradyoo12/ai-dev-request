import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  startLiveGeneration,
  cancelLiveGeneration,
  getLiveStreamStatus,
  connectToLiveStream,
} from '../api/live-generation'
import type {
  LiveStreamStartData,
  FileCreatedData,
  FileUpdatedData,
  BuildProgressData,
  PreviewReadyData,
  LiveStreamCompleteData,
} from '../api/live-generation'

// === File Tree Node ===

interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeNode[]
  status: 'pending' | 'streaming' | 'completed'
}

function buildFileTree(files: Record<string, { status: string }>): FileTreeNode[] {
  const root: FileTreeNode[] = []
  const filePaths = Object.keys(files)

  for (const filePath of filePaths) {
    const parts = filePath.split('/')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const existingNode = currentLevel.find((n) => n.name === part)

      if (existingNode) {
        if (!isFile && existingNode.children) {
          currentLevel = existingNode.children
        }
      } else {
        const newNode: FileTreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          status: isFile ? (files[filePath]?.status as 'pending' | 'streaming' | 'completed') : 'pending',
          children: isFile ? undefined : [],
        }
        currentLevel.push(newNode)
        if (!isFile && newNode.children) {
          currentLevel = newNode.children
        }
      }
    }
  }

  return root
}

function FileTreeItem({
  node,
  depth,
  selectedFile,
  onSelectFile,
}: {
  node: FileTreeNode
  depth: number
  selectedFile: string | null
  onSelectFile: (path: string) => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  const isSelected = selectedFile === node.path

  const statusIcon = () => {
    if (node.type === 'folder') return null
    switch (node.status) {
      case 'completed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        )
      case 'streaming':
        return <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
      default:
        return <div className="w-2 h-2 rounded-full bg-warm-600 shrink-0" />
    }
  }

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-warm-400 hover:text-warm-200 hover:bg-warm-700/50 rounded transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 shrink-0">
            <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>
          </svg>
          <span className="font-mono">{node.name}</span>
        </button>
        {isOpen && node.children?.map((child) => (
          <FileTreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    )
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={`flex items-center gap-1.5 w-full px-2 py-1 text-xs font-mono rounded transition-colors ${
        isSelected
          ? 'bg-blue-600/20 text-blue-300'
          : 'text-warm-300 hover:text-warm-100 hover:bg-warm-700/50'
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      </svg>
      <span className="truncate">{node.name}</span>
      {statusIcon()}
    </button>
  )
}

// === Main Component ===

export default function LiveGenerationPage() {
  const { t } = useTranslation()
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const devRequestId = parseInt(requestId || '0', 10)

  // Stream state
  const [isStreaming, setIsStreaming] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [streamStatus, setStreamStatus] = useState<string>('idle')

  // File data
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [fileStatuses, setFileStatuses] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Progress
  const [progressPercent, setProgressPercent] = useState(0)
  const [streamedTokens, setStreamedTokens] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)
  const [completedFiles, setCompletedFiles] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | null>(null)

  // Preview
  const [previewReady, setPreviewReady] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewReadyData | null>(null)
  const [durationMs, setDurationMs] = useState(0)

  // Estimated time
  const [startTime, setStartTime] = useState<number | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const codeContainerRef = useRef<HTMLPreElement | null>(null)

  // Auto-scroll code container
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight
    }
  }, [fileContents, selectedFile])

  // Build file tree from current file statuses
  const fileTree = useMemo(() => {
    const filesMap: Record<string, { status: string }> = {}
    for (const [path, status] of Object.entries(fileStatuses)) {
      filesMap[path] = { status }
    }
    return buildFileTree(filesMap)
  }, [fileStatuses])

  // Estimated time remaining
  const estimatedTimeRemaining = useMemo(() => {
    if (!startTime || progressPercent <= 0 || progressPercent >= 100) return null
    const elapsed = Date.now() - startTime
    const totalEstimated = elapsed / (progressPercent / 100)
    const remaining = totalEstimated - elapsed
    return Math.max(0, Math.round(remaining / 1000))
  }, [startTime, progressPercent])

  // Load existing status on mount
  useEffect(() => {
    if (!devRequestId) return
    getLiveStreamStatus(devRequestId).then((status) => {
      if (status) {
        setStreamStatus(status.status)
      }
    }).catch(() => { /* ignore */ })
  }, [devRequestId])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  const resetStreamState = useCallback(() => {
    setFileContents({})
    setFileStatuses({})
    setSelectedFile(null)
    setCurrentFile(null)
    setStreamedTokens(0)
    setTotalTokens(0)
    setProgressPercent(0)
    setCompletedFiles(0)
    setTotalFiles(0)
    setPreviewReady(false)
    setPreviewData(null)
    setDurationMs(0)
    setStartTime(null)
  }, [])

  const handleStreamEvent = useCallback((type: string, data: unknown) => {
    switch (type) {
      case 'stream_start': {
        const d = data as LiveStreamStartData
        setTotalFiles(d.totalFiles)
        setTotalTokens(d.totalTokens)
        setStreamStatus('streaming')
        setStartTime(Date.now())
        break
      }
      case 'file_created': {
        const d = data as FileCreatedData
        setCurrentFile(d.filename)
        setFileContents((prev) => ({ ...prev, [d.filename]: '' }))
        setFileStatuses((prev) => ({ ...prev, [d.filename]: 'streaming' }))
        // Auto-select first file, or switch to the new file
        setSelectedFile(d.filename)
        break
      }
      case 'file_updated': {
        const d = data as FileUpdatedData
        setFileContents((prev) => ({
          ...prev,
          [d.filename]: (prev[d.filename] || '') + d.content,
        }))
        setStreamedTokens((prev) => prev + d.tokens)
        setProgressPercent(d.progress)
        break
      }
      case 'build_progress': {
        const d = data as BuildProgressData
        setProgressPercent(d.progress)
        setStreamedTokens(d.streamedTokens)
        setTotalTokens(d.totalTokens)
        setCompletedFiles(d.completedFiles)
        setTotalFiles(d.totalFiles)
        setCurrentFile(d.currentFile)
        // Mark completed files
        setFileStatuses((prev) => {
          const updated = { ...prev }
          // If completedFiles increased, mark previous files as completed
          for (const key of Object.keys(updated)) {
            if (key !== d.currentFile && updated[key] === 'streaming') {
              updated[key] = 'completed'
            }
          }
          return updated
        })
        break
      }
      case 'preview_ready': {
        const d = data as PreviewReadyData
        setPreviewReady(true)
        setPreviewData(d)
        setDurationMs(d.durationMs)
        // Mark all files completed
        setFileStatuses((prev) => {
          const updated: Record<string, string> = {}
          for (const key of Object.keys(prev)) {
            updated[key] = 'completed'
          }
          return updated
        })
        break
      }
      case 'stream_complete': {
        const d = data as LiveStreamCompleteData
        setStreamStatus('completed')
        setIsStreaming(false)
        setProgressPercent(100)
        setStreamedTokens(d.totalTokens)
        setCompletedFiles(d.totalFiles)
        setDurationMs(d.durationMs)
        eventSourceRef.current?.close()
        eventSourceRef.current = null
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
  }, [])

  const handleStartGeneration = async () => {
    if (!devRequestId) return
    try {
      setError('')
      setStarting(true)
      resetStreamState()

      await startLiveGeneration(devRequestId)
      setStreamStatus('idle')

      // Connect to live SSE stream
      const es = connectToLiveStream(
        devRequestId,
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
        },
      )

      eventSourceRef.current = es
      setIsStreaming(true)
      setStreamStatus('streaming')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('liveGeneration.error.startFailed'))
    } finally {
      setStarting(false)
    }
  }

  const handleCancelGeneration = async () => {
    try {
      setError('')
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      await cancelLiveGeneration(devRequestId)
      setStreamStatus('cancelled')
      setIsStreaming(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('liveGeneration.error.cancelFailed'))
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'idle': return t('liveGeneration.status.idle')
      case 'streaming': return t('liveGeneration.status.streaming')
      case 'completed': return t('liveGeneration.status.completed')
      case 'cancelled': return t('liveGeneration.status.cancelled')
      case 'error': return t('liveGeneration.status.error')
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-warm-500'
      case 'streaming': return 'bg-green-500 animate-pulse'
      case 'completed': return 'bg-green-500'
      case 'cancelled': return 'bg-orange-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-warm-500'
    }
  }

  const getProgressBarColor = () => {
    switch (streamStatus) {
      case 'completed': return 'bg-green-500'
      case 'cancelled': return 'bg-orange-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  // Line numbers for the code
  const selectedContent = selectedFile ? fileContents[selectedFile] || '' : ''
  const lineCount = selectedContent.split('\n').length

  if (!devRequestId) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-400">{t('liveGeneration.invalidRequestId')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
        >
          {t('liveGeneration.goHome')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">{t('liveGeneration.title')}</h2>
          <span className="text-xs text-warm-500 font-mono">#{devRequestId}</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(streamStatus)}`} />
            <span className="text-xs text-warm-400">{getStatusLabel(streamStatus)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isStreaming ? (
            <button
              onClick={handleStartGeneration}
              disabled={starting}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              {starting ? t('liveGeneration.starting') : t('liveGeneration.startGeneration')}
            </button>
          ) : (
            <button
              onClick={handleCancelGeneration}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="5" y="5" rx="2"/></svg>
              {t('liveGeneration.cancel')}
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-300 hover:text-white ml-2">&times;</button>
        </div>
      )}

      {/* Progress bar */}
      {(isStreaming || streamStatus === 'completed' || streamStatus === 'cancelled') && (
        <div className="bg-warm-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-warm-400">
                {t('liveGeneration.progress')}: {progressPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-warm-500">
                {completedFiles}/{totalFiles} {t('liveGeneration.files')}
              </span>
              {estimatedTimeRemaining !== null && isStreaming && (
                <span className="text-xs text-warm-500">
                  ~{estimatedTimeRemaining}s {t('liveGeneration.remaining')}
                </span>
              )}
            </div>
            <span className="text-xs text-warm-500 font-mono">
              {streamedTokens.toLocaleString()}/{totalTokens.toLocaleString()} {t('liveGeneration.tokens')}
            </span>
          </div>
          <div className="w-full h-2 bg-warm-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          {currentFile && isStreaming && (
            <p className="text-xs text-warm-500 mt-2 font-mono">
              {t('liveGeneration.generating')}: {currentFile}
            </p>
          )}
          {durationMs > 0 && streamStatus === 'completed' && (
            <p className="text-xs text-green-400 mt-2">
              {t('liveGeneration.completedIn')} {(durationMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      )}

      {/* Main content: File tree + Code editor */}
      {Object.keys(fileStatuses).length > 0 ? (
        <div className="flex gap-4 h-[500px]">
          {/* File tree panel (left) */}
          <div className="w-56 shrink-0 bg-warm-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-warm-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-400">
                <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>
              </svg>
              <span className="text-xs font-medium text-warm-300">{t('liveGeneration.fileTree')}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {fileTree.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  depth={0}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                />
              ))}
            </div>
          </div>

          {/* Code editor panel (right) */}
          <div className="flex-1 bg-warm-800 rounded-xl overflow-hidden flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-warm-700 overflow-x-auto shrink-0">
              {Object.keys(fileContents).map((filePath) => {
                const status = fileStatuses[filePath] || 'pending'
                const isActive = selectedFile === filePath
                return (
                  <button
                    key={filePath}
                    onClick={() => setSelectedFile(filePath)}
                    className={`px-4 py-2 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? status === 'completed'
                          ? 'text-green-400 border-green-500'
                          : status === 'streaming'
                            ? 'text-blue-400 border-blue-500'
                            : 'text-warm-400 border-warm-600'
                        : 'text-warm-500 border-transparent hover:text-warm-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {status === 'completed' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      )}
                      {status === 'streaming' && (
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      )}
                      {filePath.split('/').pop()}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* File path bar */}
            {selectedFile && (
              <div className="px-3 py-1.5 bg-warm-900/50 border-b border-warm-700 shrink-0">
                <span className="text-xs text-warm-500 font-mono">{selectedFile}</span>
              </div>
            )}

            {/* Code display with line numbers */}
            <div className="flex-1 overflow-auto bg-warm-900">
              <div className="flex min-h-full">
                {/* Line numbers */}
                <div className="shrink-0 py-4 pr-3 text-right select-none border-r border-warm-800">
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className="px-3 text-xs text-warm-600 font-mono leading-relaxed">
                      {i + 1}
                    </div>
                  ))}
                </div>
                {/* Code content */}
                <pre
                  ref={codeContainerRef}
                  className="flex-1 p-4 text-sm font-mono leading-relaxed overflow-x-auto"
                >
                  <code className="text-warm-200">
                    {selectedContent}
                    {isStreaming && selectedFile && fileStatuses[selectedFile] === 'streaming' && (
                      <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
                    )}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="bg-warm-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-warm-700 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warm-400">
              <path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>
            </svg>
          </div>
          <h4 className="text-sm font-bold mb-2">{t('liveGeneration.emptyTitle')}</h4>
          <p className="text-sm text-warm-400 mb-4">
            {t('liveGeneration.emptyDescription')}
          </p>
          <button
            onClick={handleStartGeneration}
            disabled={starting}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {starting ? t('liveGeneration.starting') : t('liveGeneration.startGeneration')}
          </button>
        </div>
      )}

      {/* Preview ready banner */}
      {previewReady && previewData && (
        <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div>
              <h4 className="text-sm font-bold text-green-300">{t('liveGeneration.previewReady')}</h4>
              <p className="text-xs text-green-400/80 mt-0.5">
                {previewData.totalFiles} {t('liveGeneration.files')} {t('liveGeneration.generatedIn')} {(previewData.durationMs / 1000).toFixed(1)}s
                ({previewData.totalTokens.toLocaleString()} {t('liveGeneration.tokens')})
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
