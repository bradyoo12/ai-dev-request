import { useState, useEffect, useRef } from 'react';
import { usePreviewLogs } from '../hooks/usePreviewLogs';

interface PreviewLogViewerProps {
  previewId: string;
  autoConnect?: boolean;
}

export function PreviewLogViewer({ previewId, autoConnect = true }: PreviewLogViewerProps) {
  const { logs, isConnected, error, connect, disconnect, clearLogs } = usePreviewLogs({
    previewId,
    autoConnect,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  const filteredLogs = logs.filter((log) => {
    if (showErrorsOnly && !log.isError) {
      return false;
    }
    if (levelFilter !== 'all' && log.level !== levelFilter) {
      return false;
    }
    if (typeFilter !== 'all' && log.type !== typeFilter) {
      return false;
    }
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  function getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-400 bg-red-900/20';
      case 'warning':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-white';
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }

  const errorCount = logs.filter((log) => log.isError).length;

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {errorCount > 0 && (
            <div className="px-2 py-1 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-400">
              {errorCount} {errorCount === 1 ? 'error' : 'errors'} detected
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isConnected && !autoConnect && (
            <button
              onClick={connect}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Connect
            </button>
          )}
          {isConnected && (
            <button
              onClick={disconnect}
              className="px-3 py-1 text-sm bg-warm-700 hover:bg-warm-600 rounded transition-colors"
            >
              Disconnect
            </button>
          )}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-3 py-1 text-sm bg-warm-700 hover:bg-warm-600 rounded transition-colors"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <label className="flex items-center gap-2 px-3 py-1 bg-warm-700 rounded text-sm cursor-pointer hover:bg-warm-600 transition-colors">
          <input
            type="checkbox"
            checked={showErrorsOnly}
            onChange={(e) => setShowErrorsOnly(e.target.checked)}
            className="rounded"
          />
          <span>Errors only</span>
        </label>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-1 bg-warm-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All levels</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1 bg-warm-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All streams</option>
          <option value="stdout">stdout</option>
          <option value="stderr">stderr</option>
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search logs..."
          className="flex-1 min-w-[200px] px-3 py-1 bg-warm-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={clearLogs}
          className="px-3 py-1 text-sm bg-warm-700 hover:bg-warm-600 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Logs Display */}
      <div className="flex-1 bg-warm-900 rounded-lg p-4 overflow-auto font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {logs.length === 0 ? 'Waiting for logs...' : 'No logs match the current filters'}
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={`mb-1 px-2 py-1 rounded hover:bg-warm-800 ${
                log.isError ? 'bg-red-900/10' : ''
              }`}
            >
              <span className="text-gray-500">{formatTimestamp(log.timestamp)}</span>
              <span
                className={`ml-2 px-1.5 py-0.5 rounded text-xs font-semibold ${getLevelColor(
                  log.level
                )}`}
              >
                {log.level.toUpperCase()}
              </span>
              <span className="ml-2 text-xs text-gray-500">[{log.type}]</span>
              <span className="ml-2 text-white break-all">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Stats */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>
          Showing {filteredLogs.length} / {logs.length} logs
        </span>
        {logs.length > 0 && (
          <span>
            Preview ID: {previewId.substring(0, 8)}...
          </span>
        )}
      </div>
    </div>
  );
}
