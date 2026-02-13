import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  startOrchestration,
  getOrchestrationStatus,
  getOrchestrationTasks,
  cancelOrchestration,
  getConflicts,
  resolveConflict,
  createEventSource,
  type ParallelOrchestration,
  type SubagentTask,
  type MergeConflict,
  type OrchestrationLogEntry,
} from '../api/orchestration'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-700 text-slate-300',
  running: 'bg-blue-600 text-white animate-pulse',
  completed: 'bg-green-600 text-white',
  failed: 'bg-red-600 text-white',
}

const TASK_TYPE_ICONS: Record<string, string> = {
  frontend: '🎨',
  backend: '⚙️',
  schema: '🗄️',
  tests: '🧪',
  docs: '📚',
}

const TASK_TYPE_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  schema: 'Schema',
  tests: 'Tests',
  docs: 'Documentation',
}

export default function SubagentOrchestrationPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [devRequestId, setDevRequestId] = useState(searchParams.get('requestId') || '')

  const [orchestration, setOrchestration] = useState<ParallelOrchestration | null>(null)
  const [tasks, setTasks] = useState<SubagentTask[]>([])
  const [conflicts, setConflicts] = useState<MergeConflict[]>([])
  const [logs, setLogs] = useState<OrchestrationLogEntry[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (devRequestId && searchParams.get('requestId') !== devRequestId) {
      setSearchParams({ requestId: devRequestId })
    }
  }, [devRequestId, searchParams, setSearchParams])

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  async function handleStart() {
    if (!devRequestId.trim()) {
      setError(t('orchestration.errorNoRequestId', 'Please enter a request ID'))
      return
    }

    try {
      setLoading(true)
      setError('')
      setLogs([])

      const result = await startOrchestration(devRequestId)
      setOrchestration(result)

      // Load initial tasks
      const tasksData = await getOrchestrationTasks(devRequestId)
      setTasks(tasksData)

      // Load conflicts
      const conflictsData = await getConflicts(result.id)
      setConflicts(conflictsData)

      // Start SSE stream
      subscribeToUpdates(result.id)

      addLog('System', t('orchestration.started', 'Parallel orchestration started'), 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orchestration.errorStart', 'Failed to start orchestration'))
      addLog('System', `Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    if (!devRequestId.trim() || !orchestration) return

    try {
      setLoading(true)
      const [statusData, tasksData, conflictsData] = await Promise.all([
        getOrchestrationStatus(devRequestId),
        getOrchestrationTasks(devRequestId),
        getConflicts(orchestration.id),
      ])

      setOrchestration(statusData)
      setTasks(tasksData)
      setConflicts(conflictsData)

      addLog('System', t('orchestration.refreshed', 'Status refreshed'), 'info')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orchestration.errorRefresh', 'Failed to refresh'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!devRequestId.trim()) return

    try {
      setLoading(true)
      const result = await cancelOrchestration(devRequestId)
      setOrchestration(result)

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        setIsStreaming(false)
      }

      addLog('System', t('orchestration.cancelled', 'Orchestration cancelled'), 'warning')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orchestration.errorCancel', 'Failed to cancel'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResolveConflict(conflictId: number, auto: boolean) {
    if (!orchestration) return

    try {
      const resolved = await resolveConflict(orchestration.id, conflictId, auto)
      setConflicts(prev => prev.map(c => c.id === conflictId ? resolved : c))

      addLog('System', t('orchestration.conflictResolved', `Conflict resolved: ${resolved.filePath}`), 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orchestration.errorResolve', 'Failed to resolve conflict'))
    }
  }

  function subscribeToUpdates(orchestrationId: number) {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = createEventSource(orchestrationId)
    eventSourceRef.current = eventSource
    setIsStreaming(true)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'task_update' && data.task) {
          setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t))
          addLog(
            TASK_TYPE_LABELS[data.task.taskType as keyof typeof TASK_TYPE_LABELS] || data.task.taskType,
            data.message || `Status: ${data.task.status}`,
            data.task.status === 'failed' ? 'error' : data.task.status === 'completed' ? 'success' : 'info'
          )
        } else if (data.type === 'orchestration_update' && data.orchestration) {
          setOrchestration(data.orchestration)
        } else if (data.type === 'conflict_detected' && data.conflict) {
          setConflicts(prev => [...prev, data.conflict])
          addLog('System', `Conflict detected: ${data.conflict.filePath}`, 'warning')
        } else if (data.type === 'log' && data.message) {
          addLog(data.source || 'System', data.message, data.level || 'info')
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setIsStreaming(false)
      addLog('System', t('orchestration.streamClosed', 'Real-time stream closed'), 'warning')
    }
  }

  function addLog(source: string, message: string, level: OrchestrationLogEntry['level']) {
    setLogs(prev => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        taskType: source,
        message,
        level,
      },
    ])
  }

  function calculateProgress(): number {
    if (!orchestration || orchestration.totalTasks === 0) return 0
    return Math.round((orchestration.completedTasks / orchestration.totalTasks) * 100)
  }

  function calculateSpeedup(): string {
    if (!orchestration || !orchestration.completedAt || !orchestration.startedAt) return '-'

    const parallelTime = orchestration.totalDurationMs
    const sequentialTime = tasks.reduce((sum, task) => sum + task.durationMs, 0)

    if (sequentialTime === 0) return '-'

    const speedup = ((sequentialTime - parallelTime) / sequentialTime) * 100
    return speedup > 0 ? `-${speedup.toFixed(1)}%` : '0%'
  }

  function formatDuration(ms: number): string {
    if (ms === 0) return '-'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`
  }

  function getTasksByType(type: SubagentTask['taskType']): SubagentTask[] {
    return tasks.filter(t => t.taskType === type)
  }

  const taskTypes: SubagentTask['taskType'][] = ['frontend', 'backend', 'schema', 'tests', 'docs']

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {t('orchestration.title', 'Parallel Subagent Orchestration')}
          </h1>
          <p className="text-slate-400">
            {t('orchestration.subtitle', 'Accelerate code generation with parallel AI agents')}
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-slate-900 rounded-lg p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="requestId" className="block text-sm font-medium text-slate-300 mb-2">
                {t('orchestration.requestIdLabel', 'Project / Request ID')}
              </label>
              <input
                id="requestId"
                type="text"
                value={devRequestId}
                onChange={(e) => setDevRequestId(e.target.value)}
                placeholder={t('orchestration.requestIdPlaceholder', 'Enter request ID...')}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || isStreaming}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleStart}
                disabled={loading || isStreaming || !devRequestId.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? t('orchestration.starting', 'Starting...') : t('orchestration.start', 'Start Generation')}
              </button>
              {orchestration && (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-200 rounded-lg font-medium transition-colors"
                  >
                    {t('orchestration.refresh', 'Refresh')}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading || orchestration.status === 'completed' || orchestration.status === 'failed'}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
                  >
                    {t('orchestration.cancel', 'Cancel')}
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Status Header */}
        {orchestration && (
          <div className="bg-slate-900 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-slate-400">{t('orchestration.status', 'Status')}</span>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[orchestration.status]}`}>
                      {orchestration.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-slate-400">{t('orchestration.progress', 'Progress')}</span>
                  <div className="mt-1 text-2xl font-bold">
                    {calculateProgress()}%
                  </div>
                </div>
                <div>
                  <span className="text-sm text-slate-400">{t('orchestration.duration', 'Duration')}</span>
                  <div className="mt-1 text-2xl font-bold">
                    {formatDuration(orchestration.totalDurationMs)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-slate-400">{t('orchestration.speedup', 'Time Saved')}</span>
                  <div className="mt-1 text-2xl font-bold text-green-400">
                    {calculateSpeedup()} ⚡
                  </div>
                </div>
              </div>
              {isStreaming && (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">{t('orchestration.liveUpdates', 'Live Updates')}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}

        {/* Subagent Cards */}
        {tasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">{t('orchestration.agents', 'Active Agents')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {taskTypes.map(type => {
                const typeTasks = getTasksByType(type)
                if (typeTasks.length === 0) return null

                const task = typeTasks[0] // Show first task of each type
                const progress = task.durationMs > 0 && task.status === 'completed' ? 100 : task.status === 'running' ? 50 : 0

                return (
                  <div key={type} className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{TASK_TYPE_ICONS[type]}</span>
                        <span className="font-medium">{TASK_TYPE_LABELS[type]}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[task.status]}`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            task.status === 'completed' ? 'bg-green-500' : task.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-slate-400 space-y-1">
                      <div>{t('orchestration.duration', 'Duration')}: {formatDuration(task.durationMs)}</div>
                      <div>{t('orchestration.tokens', 'Tokens')}: {task.tokensUsed.toLocaleString()}</div>
                      {task.errorMessage && (
                        <div className="text-red-400 text-xs mt-2 truncate" title={task.errorMessage}>
                          {task.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Timeline View */}
        {tasks.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{t('orchestration.timeline', 'Execution Timeline')}</h2>
            <div className="space-y-3">
              {taskTypes.map(type => {
                const typeTasks = getTasksByType(type)
                if (typeTasks.length === 0) return null

                const task = typeTasks[0]
                const maxDuration = Math.max(...tasks.map(t => t.durationMs)) || 1
                const widthPercent = (task.durationMs / maxDuration) * 100

                return (
                  <div key={type} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-slate-400">
                      {TASK_TYPE_LABELS[type]}
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-full h-8 overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 flex items-center px-3 text-sm font-medium ${
                          task.status === 'completed'
                            ? 'bg-green-600'
                            : task.status === 'failed'
                            ? 'bg-red-600'
                            : task.status === 'running'
                            ? 'bg-blue-600 animate-pulse'
                            : 'bg-slate-700'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        {task.status === 'completed' && '✓'}
                        {task.status === 'running' && '●'}
                        {task.status === 'failed' && '✗'}
                      </div>
                      {task.status === 'completed' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          {formatDuration(task.durationMs)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Conflicts Panel */}
        {conflicts.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              {t('orchestration.conflicts', 'Conflicts')}
              <span className="px-2 py-1 bg-orange-600 text-white rounded-full text-sm">
                {conflicts.filter(c => c.status === 'unresolved').length}
              </span>
            </h2>
            <div className="space-y-3">
              {conflicts.map(conflict => (
                <div
                  key={conflict.id}
                  className={`p-4 rounded-lg border ${
                    conflict.status === 'resolved'
                      ? 'bg-green-900/20 border-green-600'
                      : conflict.status === 'manual'
                      ? 'bg-yellow-900/20 border-yellow-600'
                      : 'bg-orange-900/20 border-orange-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-blue-400">{conflict.filePath}</span>
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">
                          {conflict.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{conflict.description}</p>
                      <div className="text-xs text-slate-500">
                        {t('orchestration.conflictingTasks', 'Conflicting tasks')}: {conflict.conflictingTasks.join(', ')}
                      </div>
                    </div>
                    {conflict.status === 'unresolved' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleResolveConflict(conflict.id, true)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          {t('orchestration.autoResolve', 'Auto')}
                        </button>
                        <button
                          onClick={() => handleResolveConflict(conflict.id, false)}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                        >
                          {t('orchestration.manualResolve', 'Manual')}
                        </button>
                      </div>
                    )}
                    {conflict.status === 'resolved' && (
                      <span className="text-green-400 text-sm">✓ {t('orchestration.resolved', 'Resolved')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Logs */}
        {logs.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">{t('orchestration.logs', 'Live Logs')}</h2>
            <div className="bg-black rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.level === 'error'
                      ? 'text-red-400'
                      : log.level === 'warning'
                      ? 'text-yellow-400'
                      : log.level === 'success'
                      ? 'text-green-400'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span className="text-blue-400">[{log.taskType}]</span> {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!orchestration && !loading && (
          <div className="bg-slate-900 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold mb-2">
              {t('orchestration.emptyTitle', 'Ready to Accelerate')}
            </h3>
            <p className="text-slate-400 max-w-md mx-auto">
              {t(
                'orchestration.emptyDescription',
                'Enter a request ID and start parallel code generation. Multiple AI agents will work simultaneously on different parts of your project.'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
