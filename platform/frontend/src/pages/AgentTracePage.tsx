import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  recordAttribution,
  getLatestTrace,
  getTraceHistory,
  exportTrace,
  type AgentTrace,
  type FileAttribution,
} from '../api/agent-trace'

export default function AgentTracePage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('00000000-0000-0000-0000-000000000001')
  const [trace, setTrace] = useState<AgentTrace | null>(null)
  const [history, setHistory] = useState<AgentTrace[]>([])
  const [fileAttributions, setFileAttributions] = useState<FileAttribution[]>([])
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [expandedFile, setExpandedFile] = useState<string | null>(null)

  useEffect(() => {
    loadLatestTrace()
  }, [projectId])

  function parseJson<T>(json: string | null | undefined): T[] {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  async function loadLatestTrace() {
    setLoading(true)
    setError('')
    try {
      const data = await getLatestTrace(projectId)
      setTrace(data)
      if (data) {
        setFileAttributions(parseJson<FileAttribution>(data.traceDataJson))
      } else {
        setFileAttributions([])
      }
    } catch {
      setError(t('agentTrace.error.loadFailed', 'Failed to load trace data'))
    } finally {
      setLoading(false)
    }
  }

  async function handleRecord() {
    setRecording(true)
    setError('')
    try {
      const data = await recordAttribution(projectId)
      setTrace(data)
      setFileAttributions(parseJson<FileAttribution>(data.traceDataJson))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('agentTrace.error.recordFailed', 'Attribution recording failed'))
    } finally {
      setRecording(false)
    }
  }

  async function handleExport() {
    if (!trace) return
    setExporting(true)
    setError('')
    try {
      const data = await exportTrace(projectId, trace.id)
      if (data) {
        setTrace(data)
      } else {
        setError(t('agentTrace.error.exportFailed', 'Export failed'))
      }
    } catch {
      setError(t('agentTrace.error.exportFailed', 'Export failed'))
    } finally {
      setExporting(false)
    }
  }

  async function loadHistory() {
    try {
      const h = await getTraceHistory(projectId)
      setHistory(h)
      setShowHistory(true)
    } catch {
      setError(t('agentTrace.error.loadFailed', 'Failed to load trace data'))
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-300'
      case 'recording': return 'bg-blue-900/50 text-blue-300'
      case 'failed': return 'bg-red-900/50 text-red-300'
      default: return 'bg-warm-700 text-warm-300'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('agentTrace.status.completed', 'Completed')
      case 'recording': return t('agentTrace.status.recording', 'Recording')
      case 'failed': return t('agentTrace.status.failed', 'Failed')
      default: return t('agentTrace.status.pending', 'Pending')
    }
  }

  const contributionColor = (pct: number) => {
    if (pct > 70) return 'bg-blue-500'
    if (pct >= 30) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const contributionTextColor = (pct: number) => {
    if (pct > 70) return 'text-blue-400'
    if (pct >= 30) return 'text-yellow-400'
    return 'text-green-400'
  }

  function computeSourceDistribution(file: FileAttribution) {
    let aiLines = 0
    let humanLines = 0
    let mixedLines = 0
    for (const range of file.ranges) {
      const count = range.endLine - range.startLine + 1
      if (range.source === 'ai') aiLines += count
      else if (range.source === 'human') humanLines += count
      else mixedLines += count
    }
    const total = aiLines + humanLines + mixedLines
    if (total === 0) return { ai: 0, human: 0, mixed: 0 }
    return {
      ai: Math.round((aiLines / total) * 100),
      human: Math.round((humanLines / total) * 100),
      mixed: Math.round((mixedLines / total) * 100),
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('agentTrace.title', 'Agent Trace')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('agentTrace.subtitle', 'AI code attribution and transparency')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-warm-400">{t('agentTrace.projectId', 'Project ID')}:</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-72 bg-warm-700 border border-warm-600 rounded px-2 py-1 text-sm font-mono"
          />
          <button
            onClick={handleRecord}
            disabled={recording}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
          >
            {recording ? t('agentTrace.recording', 'Recording...') : t('agentTrace.record', 'Record Attribution')}
          </button>
          {trace && trace.status === 'completed' && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? t('agentTrace.exporting', 'Exporting...') : t('agentTrace.export', 'Export Report')}
            </button>
          )}
          <button
            onClick={() => showHistory ? setShowHistory(false) : loadHistory()}
            className="px-3 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
          >
            {showHistory ? t('agentTrace.history.hide', 'Hide History') : t('agentTrace.history.show', 'Show History')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && trace && (
        <>
          {/* Summary Card */}
          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(trace.status)}`}>
                  {statusLabel(trace.status)}
                </span>
                <span className="text-sm text-warm-400">v{trace.version}</span>
              </div>
              <div className="flex items-center gap-3">
                {trace.exportedAt && (
                  <span className="text-xs text-warm-500">
                    {t('agentTrace.exportedAt', 'Exported')}: {new Date(trace.exportedAt).toLocaleString()}
                  </span>
                )}
                {trace.updatedAt && (
                  <span className="text-xs text-warm-500">{new Date(trace.updatedAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{trace.totalFiles}</div>
                <div className="text-xs text-warm-400 mt-1">{t('agentTrace.stats.totalFiles', 'Total Files')}</div>
              </div>
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{trace.aiGeneratedFiles}</div>
                <div className="text-xs text-warm-400 mt-1">{t('agentTrace.stats.aiGenerated', 'AI Generated')}</div>
              </div>
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{trace.humanEditedFiles}</div>
                <div className="text-xs text-warm-400 mt-1">{t('agentTrace.stats.humanEdited', 'Human Edited')}</div>
              </div>
              <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{trace.mixedFiles}</div>
                <div className="text-xs text-warm-400 mt-1">{t('agentTrace.stats.mixed', 'Mixed')}</div>
              </div>
            </div>
          </div>

          {/* AI Contribution Progress Bar */}
          <div className="bg-warm-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('agentTrace.stats.aiContribution', 'AI Contribution')}</span>
              <span className={`text-sm font-bold ${contributionTextColor(trace.aiContributionPercentage)}`}>
                {trace.aiContributionPercentage}%
              </span>
            </div>
            <div className="w-full bg-warm-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${contributionColor(trace.aiContributionPercentage)}`}
                style={{ width: `${Math.min(trace.aiContributionPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-warm-500">{t('agentTrace.contribution.low', 'Low AI')}</span>
              <span className="text-xs text-warm-500">{t('agentTrace.contribution.high', 'High AI')}</span>
            </div>
          </div>

          {/* File Attribution List */}
          {fileAttributions.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-4">{t('agentTrace.fileAttribution', 'File Attribution')}</h4>
              <div className="space-y-2">
                {fileAttributions.map((file, idx) => {
                  const dist = computeSourceDistribution(file)
                  return (
                    <div
                      key={idx}
                      onClick={() => setExpandedFile(expandedFile === file.filePath ? null : file.filePath)}
                      className="bg-warm-700/50 rounded-lg p-3 cursor-pointer hover:bg-warm-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-warm-200">{file.filePath}</span>
                        <div className="flex items-center gap-2 text-xs">
                          {dist.ai > 0 && <span className="text-purple-300">AI {dist.ai}%</span>}
                          {dist.human > 0 && <span className="text-green-300">Human {dist.human}%</span>}
                          {dist.mixed > 0 && <span className="text-yellow-300">Mixed {dist.mixed}%</span>}
                        </div>
                      </div>
                      {/* Distribution bar */}
                      <div className="w-full h-2 rounded-full bg-warm-600 flex overflow-hidden">
                        {dist.ai > 0 && (
                          <div className="bg-purple-500 h-full" style={{ width: `${dist.ai}%` }} />
                        )}
                        {dist.human > 0 && (
                          <div className="bg-green-500 h-full" style={{ width: `${dist.human}%` }} />
                        )}
                        {dist.mixed > 0 && (
                          <div className="bg-yellow-500 h-full" style={{ width: `${dist.mixed}%` }} />
                        )}
                      </div>

                      {/* Expanded detail */}
                      {expandedFile === file.filePath && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs text-warm-400 font-medium mb-2">
                            {t('agentTrace.lineRanges', 'Line Ranges')}
                          </div>
                          {file.ranges.map((range, rIdx) => (
                            <div key={rIdx} className="flex items-center gap-3 text-xs bg-warm-800 rounded px-2 py-1.5">
                              <span className="font-mono text-warm-300">
                                L{range.startLine}-{range.endLine}
                              </span>
                              <span className={`px-2 py-0.5 rounded font-medium ${
                                range.source === 'ai' ? 'bg-purple-900/50 text-purple-300' :
                                range.source === 'human' ? 'bg-green-900/50 text-green-300' :
                                'bg-yellow-900/50 text-yellow-300'
                              }`}>
                                {range.source}
                              </span>
                              {range.agentId && (
                                <span className="text-warm-500">Agent: {range.agentId}</span>
                              )}
                              {range.conversationId && (
                                <span className="text-warm-500">Conv: {range.conversationId.slice(0, 8)}...</span>
                              )}
                              {range.timestamp && (
                                <span className="text-warm-500 ml-auto">{new Date(range.timestamp).toLocaleString()}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !trace && (
        <div className="bg-warm-800 rounded-xl p-12 text-center">
          <div className="text-warm-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <p className="text-warm-400">{t('agentTrace.empty', 'No trace data yet. Click "Record Attribution" to start.')}</p>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-warm-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">{t('agentTrace.history.title', 'Trace History')}</h4>
            <button onClick={() => setShowHistory(false)} className="text-warm-400 hover:text-white text-sm transition-colors">
              {t('agentTrace.close', 'Close')}
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-warm-400 text-sm">{t('agentTrace.noHistory', 'No trace history.')}</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-warm-700/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(h.status)}`}>
                      {statusLabel(h.status)}
                    </span>
                    <span className="text-sm">v{h.version}</span>
                    <span className="text-xs text-warm-400">
                      {h.totalFiles} files, {h.aiContributionPercentage}% AI
                    </span>
                  </div>
                  <span className="text-xs text-warm-500">{new Date(h.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
