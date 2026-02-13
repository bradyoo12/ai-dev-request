import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { createProjectLogStream, type ProjectLogEntry } from '../api/projects'

interface RealTimeLogViewerProps {
  projectId: string
}

export function RealTimeLogViewer({ projectId }: RealTimeLogViewerProps) {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<ProjectLogEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (isPaused) return

    const eventSource = createProjectLogStream(projectId)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('connected', () => {
      setIsConnected(true)
    })

    eventSource.addEventListener('log', (event) => {
      const log: ProjectLogEntry = JSON.parse(event.data)
      setLogs((prev) => [...prev, log])
    })

    eventSource.addEventListener('heartbeat', () => {
      // Keep-alive event
    })

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [projectId, isPaused])

  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isPaused])

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level.toLowerCase() !== levelFilter.toLowerCase()) {
      return false
    }
    if (sourceFilter !== 'all' && log.source !== sourceFilter) {
      return false
    }
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const sources = Array.from(new Set(logs.map((log) => log.source)))

  function getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      case 'info':
        return 'text-blue-400'
      case 'debug':
        return 'text-gray-400'
      default:
        return 'text-white'
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-400">
            {isConnected ? t('projects.logs.connected') : t('projects.logs.disconnected')}
          </span>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="px-3 py-1 text-sm bg-warm-700 hover:bg-warm-600 rounded transition-colors"
        >
          {isPaused ? t('projects.logs.resume') : t('projects.logs.pause')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-1 bg-warm-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t('projects.logs.allLevels')}</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-1 bg-warm-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{t('projects.logs.allSources')}</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('projects.logs.search')}
          className="flex-1 min-w-[200px] px-3 py-1 bg-warm-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={() => setLogs([])}
          className="px-3 py-1 text-sm bg-warm-700 hover:bg-warm-600 rounded transition-colors"
        >
          {t('projects.logs.clear')}
        </button>
      </div>

      {/* Logs Display */}
      <div className="flex-1 bg-warm-900 rounded-lg p-4 overflow-auto font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {t('projects.logs.noLogs')}
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={log.id || index} className="mb-1 hover:bg-warm-800 px-2 py-1 rounded">
              <span className="text-gray-500">{formatTimestamp(log.timestamp)}</span>
              <span className={`ml-2 font-semibold ${getLevelColor(log.level)}`}>
                [{log.level.toUpperCase()}]
              </span>
              <span className="ml-2 text-gray-400">{log.source}:</span>
              <span className="ml-2 text-white">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Stats */}
      <div className="mt-2 text-xs text-gray-500">
        {t('projects.logs.showing')} {filteredLogs.length} / {logs.length} {t('projects.logs.logs')}
      </div>
    </div>
  )
}
