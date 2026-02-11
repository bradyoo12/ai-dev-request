import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listStreamingPreviewSessions,
  createStreamingPreviewSession,
  startStreamingPreview,
  executeStreamingPreviewAction,
  getStreamingPreviewStats,
  type StreamingPreviewSession,
  type StreamingPreviewDetail,
  type StreamingPreviewStats,
} from '../api/streaming-preview'

export default function StreamingPreviewPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'stream' | 'sessions' | 'stats'>('stream')

  // Stream tab state
  const [sessionName, setSessionName] = useState('')
  const [streamType, setStreamType] = useState<'code' | 'component' | 'architecture'>('code')
  const [currentSession, setCurrentSession] = useState<StreamingPreviewDetail | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [displayedCode, setDisplayedCode] = useState('')
  const [displayedReasoning, setDisplayedReasoning] = useState<string[]>([])
  const [reasoningOpen, setReasoningOpen] = useState(true)
  const [creating, setCreating] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  // Sessions tab state
  const [sessions, setSessions] = useState<StreamingPreviewSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // Stats tab state
  const [stats, setStats] = useState<StreamingPreviewStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [error, setError] = useState('')
  const codeRef = useRef<HTMLPreElement>(null)
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'sessions') loadSessions()
    if (activeTab === 'stats') loadStats()
  }, [activeTab])

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight
    }
  }, [displayedCode])

  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const data = await listStreamingPreviewSessions()
      setSessions(data.sessions)
    } catch {
      setError(t('streamingPreview.error.loadSessions', 'Failed to load sessions'))
    } finally {
      setLoadingSessions(false)
    }
  }

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const data = await getStreamingPreviewStats()
      setStats(data)
    } catch {
      setError(t('streamingPreview.error.loadStats', 'Failed to load stats'))
    } finally {
      setLoadingStats(false)
    }
  }

  const handleCreateAndStream = async () => {
    if (!sessionName.trim()) return
    setError('')
    setCreating(true)
    setDisplayedCode('')
    setDisplayedReasoning([])
    setActionMessage('')

    try {
      const session = await createStreamingPreviewSession({
        name: sessionName.trim(),
        streamType,
      })
      setCurrentSession(session)

      // Start streaming
      setIsStreaming(true)
      const result = await startStreamingPreview(session.id)
      setCurrentSession(result)

      // Simulate progressive code display
      const fullCode = result.generatedCode || ''
      const reasoning = result.reasoningSteps || []
      const chunkSize = Math.max(1, Math.floor(fullCode.length / (result.chunksDelivered || 20)))
      let currentIndex = 0
      let reasoningIndex = 0
      const reasoningInterval = Math.floor((result.chunksDelivered || 20) / reasoning.length)

      streamIntervalRef.current = setInterval(() => {
        if (currentIndex >= fullCode.length) {
          if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current)
            streamIntervalRef.current = null
          }
          setIsStreaming(false)
          setDisplayedReasoning(reasoning)
          return
        }

        const nextIndex = Math.min(currentIndex + chunkSize, fullCode.length)
        setDisplayedCode(fullCode.substring(0, nextIndex))
        currentIndex = nextIndex

        // Progressively show reasoning steps
        const chunkNumber = Math.floor(currentIndex / chunkSize)
        const targetReasoningIndex = Math.min(
          Math.floor(chunkNumber / reasoningInterval) + 1,
          reasoning.length
        )
        if (targetReasoningIndex > reasoningIndex) {
          reasoningIndex = targetReasoningIndex
          setDisplayedReasoning(reasoning.slice(0, reasoningIndex))
        }
      }, 80)
    } catch {
      setError(t('streamingPreview.error.startStream', 'Failed to start streaming'))
      setIsStreaming(false)
    } finally {
      setCreating(false)
    }
  }

  const handleAction = async (action: string) => {
    if (!currentSession) return
    setActionMessage('')
    try {
      const result = await executeStreamingPreviewAction(currentSession.id, action)
      setActionMessage(result.message)
    } catch {
      setError(t('streamingPreview.error.action', 'Failed to execute action'))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-700 text-gray-300'
      case 'streaming':
        return 'bg-blue-900/50 text-blue-400'
      case 'completed':
        return 'bg-green-900/50 text-green-400'
      case 'error':
        return 'bg-red-900/50 text-red-400'
      default:
        return 'bg-gray-700 text-gray-400'
    }
  }

  const getStreamTypeBadge = (type: string) => {
    switch (type) {
      case 'code':
        return 'bg-purple-900/50 text-purple-400'
      case 'component':
        return 'bg-blue-900/50 text-blue-400'
      case 'architecture':
        return 'bg-orange-900/50 text-orange-400'
      default:
        return 'bg-gray-700 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {(['stream', 'sessions', 'stats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'stream' && t('streamingPreview.tab.stream', 'Stream')}
            {tab === 'sessions' && t('streamingPreview.tab.sessions', 'Sessions')}
            {tab === 'stats' && t('streamingPreview.tab.stats', 'Stats')}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Stream Tab */}
      {activeTab === 'stream' && (
        <div className="space-y-4">
          {/* Create Session Form */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold mb-3">{t('streamingPreview.createSession', 'Create Streaming Session')}</h3>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-400 mb-1 block">{t('streamingPreview.sessionName', 'Session Name')}</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  placeholder={t('streamingPreview.sessionNamePlaceholder', 'e.g., Counter Component')}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleCreateAndStream()}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('streamingPreview.streamType', 'Stream Type')}</label>
                <select
                  value={streamType}
                  onChange={e => setStreamType(e.target.value as 'code' | 'component' | 'architecture')}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="code">{t('streamingPreview.type.code', 'Code')}</option>
                  <option value="component">{t('streamingPreview.type.component', 'Component')}</option>
                  <option value="architecture">{t('streamingPreview.type.architecture', 'Architecture')}</option>
                </select>
              </div>
              <button
                onClick={handleCreateAndStream}
                disabled={creating || isStreaming || !sessionName.trim()}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                {creating
                  ? t('streamingPreview.creating', 'Creating...')
                  : isStreaming
                    ? t('streamingPreview.streaming', 'Streaming...')
                    : t('streamingPreview.startStreaming', 'Start Streaming')}
              </button>
            </div>
          </div>

          {/* Live Code Display */}
          {(displayedCode || isStreaming) && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  {isStreaming && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                  <span className="text-xs text-gray-400 font-mono">
                    {currentSession?.sessionName || 'Generated Code'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getStreamTypeBadge(currentSession?.streamType || streamType)}`}>
                    {currentSession?.streamType || streamType}
                  </span>
                </div>
                {currentSession && (
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{currentSession.totalTokens.toLocaleString()} tokens</span>
                    <span>{(currentSession.streamDurationMs / 1000).toFixed(1)}s</span>
                    <span>{currentSession.chunksDelivered} chunks</span>
                  </div>
                )}
              </div>
              <pre
                ref={codeRef}
                className="p-4 overflow-auto max-h-96 bg-gray-900 text-sm font-mono leading-relaxed"
              >
                <code className="text-gray-200">
                  {displayedCode}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
                  )}
                </code>
              </pre>
            </div>
          )}

          {/* Reasoning Panel */}
          {displayedReasoning.length > 0 && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setReasoningOpen(!reasoningOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/><path d="M19 9H5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z"/><path d="M12 14v8"/><path d="M8 18h8"/></svg>
                  {t('streamingPreview.reasoning', 'AI Reasoning')} ({displayedReasoning.length} {t('streamingPreview.steps', 'steps')})
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${reasoningOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {reasoningOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {displayedReasoning.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-300">{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview HTML */}
          {currentSession?.previewHtml && currentSession.status === 'completed' && !isStreaming && (
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-700">
                <span className="text-xs text-gray-400">{t('streamingPreview.preview', 'Preview')}</span>
              </div>
              <div
                className="p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: currentSession.previewHtml }}
              />
            </div>
          )}

          {/* Action Buttons */}
          {currentSession && currentSession.status === 'completed' && !isStreaming && (
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-400 mr-2">{t('streamingPreview.actions', 'Actions')}:</span>
                {(currentSession.actions || []).map(action => (
                  <button
                    key={action}
                    onClick={() => handleAction(action)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    {action === 'copy' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    )}
                    {action === 'edit' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    )}
                    {action === 'deploy' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                    )}
                    {action === 'addToProject' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    )}
                    {action === 'copy' ? t('streamingPreview.action.copy', 'Copy')
                      : action === 'edit' ? t('streamingPreview.action.edit', 'Edit')
                      : action === 'deploy' ? t('streamingPreview.action.deploy', 'Deploy')
                      : action === 'addToProject' ? t('streamingPreview.action.addToProject', 'Add to Project')
                      : action}
                  </button>
                ))}
              </div>
              {actionMessage && (
                <p className="mt-3 text-sm text-green-400">{actionMessage}</p>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          {currentSession && (isStreaming || currentSession.status === 'completed') && (
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>{t('streamingPreview.progress', 'Progress')}</span>
                <span>
                  {isStreaming
                    ? t('streamingPreview.status.streaming', 'Streaming...')
                    : t('streamingPreview.status.completed', 'Completed')}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isStreaming ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                  }`}
                  style={{
                    width: isStreaming
                      ? `${Math.min((displayedCode.length / (currentSession.generatedCode?.length || 1)) * 100, 99)}%`
                      : '100%',
                  }}
                />
              </div>
              <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
                <span>{t('streamingPreview.metric.tokens', 'Tokens')}: {currentSession.totalTokens.toLocaleString()}</span>
                <span>{t('streamingPreview.metric.duration', 'Duration')}: {(currentSession.streamDurationMs / 1000).toFixed(1)}s</span>
                <span>{t('streamingPreview.metric.chunks', 'Chunks')}: {currentSession.chunksDelivered}</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!currentSession && !isStreaming && !displayedCode && (
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              </div>
              <h4 className="text-sm font-bold mb-2">{t('streamingPreview.empty.title', 'No Active Stream')}</h4>
              <p className="text-sm text-gray-400">
                {t('streamingPreview.empty.description', 'Create a session above to start streaming code generation with live preview and reasoning panels.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold">{t('streamingPreview.sessionsTitle', 'Past Sessions')}</h3>
            <button
              onClick={loadSessions}
              disabled={loadingSessions}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loadingSessions
                ? t('streamingPreview.refreshing', 'Refreshing...')
                : t('streamingPreview.refresh', 'Refresh')}
            </button>
          </div>
          {loadingSessions ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">{t('streamingPreview.loading', 'Loading...')}</p>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">
              {t('streamingPreview.noSessions', 'No sessions found. Create one in the Stream tab.')}
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => (
                <div key={session.id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(session.status)}`}>
                      {session.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStreamTypeBadge(session.streamType)}`}>
                      {session.streamType}
                    </span>
                    <span className="text-sm text-gray-300">{session.sessionName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{session.totalTokens.toLocaleString()} tokens</span>
                    <span>{(session.streamDurationMs / 1000).toFixed(1)}s</span>
                    <span>{new Date(session.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {loadingStats ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">{t('streamingPreview.loadingStats', 'Loading stats...')}</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="bg-gray-800 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-blue-400">{stats.totalSessions}</p>
                <p className="text-xs text-gray-400 mt-1">{t('streamingPreview.stats.totalSessions', 'Total Sessions')}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-5">
                <p className="text-sm font-bold text-gray-300 mb-2">{t('streamingPreview.stats.byType', 'By Type')}</p>
                {Object.entries(stats.byType).length === 0 ? (
                  <p className="text-xs text-gray-500">{t('streamingPreview.stats.noData', 'No data')}</p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded ${getStreamTypeBadge(type)}`}>{type}</span>
                        <span className="text-sm font-mono text-gray-300">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-800 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-yellow-400">{(stats.avgDurationMs / 1000).toFixed(1)}s</p>
                <p className="text-xs text-gray-400 mt-1">{t('streamingPreview.stats.avgDuration', 'Avg Duration')}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-purple-400">{stats.totalTokens.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{t('streamingPreview.stats.totalTokens', 'Total Tokens')}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold text-green-400">{stats.streamsCompleted}</p>
                <p className="text-xs text-gray-400 mt-1">{t('streamingPreview.stats.completed', 'Streams Completed')}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-400">{t('streamingPreview.stats.noStats', 'No stats available yet.')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
