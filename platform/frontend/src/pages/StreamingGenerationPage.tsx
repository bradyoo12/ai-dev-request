import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  startGeneration,
  cancelGeneration,
  getStreamStatus,
  getStreamHistory,
  connectToStream,
} from '../api/streaming-generation'
import type {
  GenerationStream,
  FileProgress,
  StreamStartData,
  FileStartData,
  CodeChunkData,
  FileCompleteData,
  ProgressUpdateData,
  StreamCompleteData,
} from '../api/streaming-generation'

export default function StreamingGenerationPage() {
  const { t } = useTranslation()
  const [stream, setStream] = useState<GenerationStream | null>(null)
  const [history, setHistory] = useState<GenerationStream[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [devRequestId, setDevRequestId] = useState<number>(1)
  const [devRequestIdInput, setDevRequestIdInput] = useState('1')
  const [showHistory, setShowHistory] = useState(false)

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [fileStatuses, setFileStatuses] = useState<Record<string, string>>({})
  const [streamedTokens, setStreamedTokens] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)
  const [progressPercent, setProgressPercent] = useState(0)
  const [completedFiles, setCompletedFiles] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [streamStatus, setStreamStatus] = useState<string>('idle')

  const eventSourceRef = useRef<EventSource | null>(null)
  const codeContainerRef = useRef<HTMLPreElement | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [statusData, historyData] = await Promise.all([
        getStreamStatus(devRequestId),
        getStreamHistory(devRequestId),
      ])
      setStream(statusData)
      setHistory(historyData)
      if (statusData) {
        setStreamStatus(statusData.status)
      }
    } catch {
      setError(t('streamingGeneration.loadError', 'Failed to load stream data'))
    } finally {
      setLoading(false)
    }
  }, [devRequestId, t])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-scroll code container
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight
    }
  }, [fileContents, activeTab])

  const resetStreamState = () => {
    setFileContents({})
    setFileStatuses({})
    setActiveTab(null)
    setCurrentFile(null)
    setStreamedTokens(0)
    setTotalTokens(0)
    setProgressPercent(0)
    setCompletedFiles(0)
    setTotalFiles(0)
  }

  const handleStartGeneration = async () => {
    try {
      setError('')
      setStarting(true)
      resetStreamState()

      const result = await startGeneration(devRequestId)
      setStream(result)
      setStreamStatus('idle')

      // Connect to SSE stream
      const es = connectToStream(
        devRequestId,
        (event) => {
          try {
            const data = JSON.parse(event.data)
            handleStreamEvent(event.type, data)
          } catch {
            // data might be a plain string for error events
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
    } catch (err) {
      setError(err instanceof Error ? err.message : t('streamingGeneration.startError', 'Failed to start generation'))
    } finally {
      setStarting(false)
    }
  }

  const handleStreamEvent = (type: string, data: unknown) => {
    switch (type) {
      case 'stream_start': {
        const d = data as StreamStartData
        setTotalFiles(d.totalFiles)
        setTotalTokens(d.totalTokens)
        setStreamStatus('streaming')
        break
      }
      case 'file_start': {
        const d = data as FileStartData
        setCurrentFile(d.file)
        setActiveTab(d.file)
        setFileContents((prev) => ({ ...prev, [d.file]: '' }))
        setFileStatuses((prev) => ({ ...prev, [d.file]: 'streaming' }))
        break
      }
      case 'code_chunk': {
        const d = data as CodeChunkData
        setFileContents((prev) => ({
          ...prev,
          [d.file]: (prev[d.file] || '') + d.chunk,
        }))
        setStreamedTokens((prev) => prev + d.tokens)
        break
      }
      case 'file_complete': {
        const d = data as FileCompleteData
        setFileStatuses((prev) => ({ ...prev, [d.file]: 'completed' }))
        setCompletedFiles(d.completedFiles)
        break
      }
      case 'progress_update': {
        const d = data as ProgressUpdateData
        setStreamedTokens(d.streamedTokens)
        setTotalTokens(d.totalTokens)
        setProgressPercent(d.progressPercent)
        break
      }
      case 'stream_complete': {
        const d = data as StreamCompleteData
        setStreamStatus('completed')
        setIsStreaming(false)
        setProgressPercent(100)
        setStreamedTokens(d.totalTokens)
        setCompletedFiles(d.totalFiles)
        eventSourceRef.current?.close()
        eventSourceRef.current = null
        loadData()
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

  const handleCancelGeneration = async () => {
    try {
      setError('')
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      await cancelGeneration(devRequestId)
      setStreamStatus('cancelled')
      setIsStreaming(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('streamingGeneration.cancelError', 'Failed to cancel'))
    }
  }

  const handleLoadRequest = () => {
    const parsed = parseInt(devRequestIdInput, 10)
    if (!isNaN(parsed) && parsed > 0) {
      // Clean up existing stream
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      setIsStreaming(false)
      resetStreamState()
      setDevRequestId(parsed)
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
        return { color: 'bg-gray-500', label: t('streamingGeneration.status.idle', 'Idle'), textColor: 'text-gray-400' }
      case 'streaming':
        return { color: 'bg-green-500 animate-pulse', label: t('streamingGeneration.status.streaming', 'Streaming'), textColor: 'text-green-400' }
      case 'paused':
        return { color: 'bg-yellow-500', label: t('streamingGeneration.status.paused', 'Paused'), textColor: 'text-yellow-400' }
      case 'completed':
        return { color: 'bg-green-500', label: t('streamingGeneration.status.completed', 'Completed'), textColor: 'text-green-400' }
      case 'cancelled':
        return { color: 'bg-orange-500', label: t('streamingGeneration.status.cancelled', 'Cancelled'), textColor: 'text-orange-400' }
      case 'error':
        return { color: 'bg-red-500', label: t('streamingGeneration.status.error', 'Error'), textColor: 'text-red-400' }
      default:
        return { color: 'bg-gray-500', label: status, textColor: 'text-gray-400' }
    }
  }

  const getFileTabColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 border-green-500'
      case 'streaming': return 'text-blue-400 border-blue-500'
      default: return 'text-gray-400 border-gray-600'
    }
  }

  const getHistoryStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-400'
      case 'streaming': return 'bg-blue-900/50 text-blue-400'
      case 'cancelled': return 'bg-orange-900/50 text-orange-400'
      case 'error': return 'bg-red-900/50 text-red-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const parseGeneratedFiles = (stream: GenerationStream | null): FileProgress[] => {
    if (!stream?.generatedFiles) return []
    try {
      return JSON.parse(stream.generatedFiles)
    } catch {
      return []
    }
  }

  const statusIndicator = getStatusIndicator(streamStatus)
  const fileTabs = Object.keys(fileContents)

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('streamingGeneration.loading', 'Loading stream data...')}</p>
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

      {/* Request ID Selector & Actions */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-gray-400">{t('streamingGeneration.requestId', 'Request ID')}:</label>
          <input
            type="number"
            value={devRequestIdInput}
            onChange={(e) => setDevRequestIdInput(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-24"
            min={1}
          />
          <button
            onClick={handleLoadRequest}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {t('streamingGeneration.load', 'Load')}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${statusIndicator.color}`} />
              <span className={`text-xs font-medium ${statusIndicator.textColor}`}>{statusIndicator.label}</span>
            </div>

            {!isStreaming ? (
              <button
                onClick={handleStartGeneration}
                disabled={starting}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                {starting ? t('streamingGeneration.starting', 'Starting...') : t('streamingGeneration.startGeneration', 'Start Generation')}
              </button>
            ) : (
              <button
                onClick={handleCancelGeneration}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="5" y="5" rx="2"/></svg>
                {t('streamingGeneration.cancel', 'Cancel')}
              </button>
            )}

            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors"
              >
                {showHistory ? t('streamingGeneration.hideHistory', 'Hide History') : t('streamingGeneration.showHistory', 'History')} ({history.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar & Token Counter */}
      {(isStreaming || streamStatus === 'completed' || streamStatus === 'cancelled') && (
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">
                {t('streamingGeneration.progress', 'Progress')}: {progressPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                {completedFiles}/{totalFiles} {t('streamingGeneration.files', 'files')}
              </span>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {streamedTokens.toLocaleString()}/{totalTokens.toLocaleString()} {t('streamingGeneration.tokens', 'tokens')}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                streamStatus === 'completed' ? 'bg-green-500' :
                streamStatus === 'cancelled' ? 'bg-orange-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          {currentFile && isStreaming && (
            <p className="text-xs text-gray-500 mt-2 font-mono">
              {t('streamingGeneration.generating', 'Generating')}: {currentFile}
            </p>
          )}
        </div>
      )}

      {/* File Tabs & Code Display */}
      {fileTabs.length > 0 && (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {/* File Tabs */}
          <div className="flex border-b border-gray-700 overflow-x-auto">
            {fileTabs.map((filePath) => {
              const status = fileStatuses[filePath] || 'pending'
              const isActive = activeTab === filePath
              return (
                <button
                  key={filePath}
                  onClick={() => setActiveTab(filePath)}
                  className={`px-4 py-2 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? getFileTabColor(status)
                      : 'text-gray-500 border-transparent hover:text-gray-300'
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

          {/* Code Display Area */}
          <div className="relative">
            {activeTab && (
              <div className="px-2 py-1 bg-gray-900/50 border-b border-gray-700">
                <span className="text-xs text-gray-500 font-mono">{activeTab}</span>
              </div>
            )}
            <pre
              ref={codeContainerRef}
              className="p-4 overflow-auto max-h-96 bg-gray-900 text-sm font-mono leading-relaxed"
            >
              <code className="text-gray-200">
                {activeTab ? fileContents[activeTab] || '' : ''}
                {isStreaming && activeTab && fileStatuses[activeTab] === 'streaming' && (
                  <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
                )}
              </code>
            </pre>
          </div>
        </div>
      )}

      {/* Empty state - no active stream */}
      {!isStreaming && fileTabs.length === 0 && streamStatus !== 'completed' && (
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
          <h4 className="text-sm font-bold mb-2">{t('streamingGeneration.noStream', 'No Active Generation')}</h4>
          <p className="text-sm text-gray-400 mb-4">
            {t('streamingGeneration.noStreamDescription', 'Start a new code generation to see real-time streaming output with token-by-token display.')}
          </p>
          <button
            onClick={handleStartGeneration}
            disabled={starting}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {starting ? t('streamingGeneration.starting', 'Starting...') : t('streamingGeneration.startFirstGeneration', 'Start First Generation')}
          </button>
        </div>
      )}

      {/* Stream History */}
      {showHistory && history.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3">{t('streamingGeneration.historyTitle', 'Stream History')}</h3>
          <div className="space-y-2">
            {history.map((entry) => {
              const files = parseGeneratedFiles(entry)
              return (
                <div key={entry.id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getHistoryStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                    {entry.status === 'completed' && (
                      <span className="text-xs text-gray-400">
                        {entry.completedFiles} {t('streamingGeneration.files', 'files')} / {entry.streamedTokens.toLocaleString()} {t('streamingGeneration.tokens', 'tokens')}
                      </span>
                    )}
                    {files.length > 0 && (
                      <span className="text-xs text-gray-500 font-mono">
                        {files.map((f) => f.path.split('/').pop()).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
