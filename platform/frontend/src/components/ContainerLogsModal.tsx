import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getPreviewLogs } from '../api/preview'

interface ContainerLogsModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export function ContainerLogsModal({ projectId, isOpen, onClose }: ContainerLogsModalProps) {
  const { t } = useTranslation()
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, isOpen])

  useEffect(() => {
    if (!isOpen) return

    async function fetchLogs() {
      try {
        setLoading(true)
        const data = await getPreviewLogs(projectId)
        setLogs(data)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs')
        setLogs('')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [isOpen, projectId])

  function handleCopyLogs() {
    navigator.clipboard.writeText(logs)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logs-dialog-title"
    >
      <div className="bg-warm-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 id="logs-dialog-title" className="text-lg font-bold">
            {t('preview.containerLogs', 'Container Logs')}
          </h3>
          <button
            onClick={onClose}
            className="text-warm-400 hover:text-white transition-colors text-xl leading-none"
            aria-label={t('common.close', 'Close')}
          >
            &times;
          </button>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center gap-2 mb-3 text-xs text-warm-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>{t('preview.autoRefresh', 'Auto-refresh every 5s')}</span>
        </div>

        {/* Logs Display */}
        <div className="flex-1 bg-warm-900 rounded-lg p-4 overflow-auto mb-4 min-h-[300px]">
          {loading && !logs && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" role="status" />
              <span className="ml-3 text-warm-400">{t('preview.loadingLogs', 'Loading logs...')}</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && !logs && (
            <div className="text-warm-500 text-sm text-center py-8">
              {t('preview.noLogs', 'No logs available yet')}
            </div>
          )}

          {logs && (
            <pre className="text-xs font-mono text-warm-300 whitespace-pre-wrap break-words">
              {logs}
            </pre>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCopyLogs}
            disabled={!logs}
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-700 text-blue-300 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? t('preview.copied', 'Copied!') : t('preview.copyLogs', 'Copy Logs')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  )
}
