import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  executeSandbox,
  getLatestSandboxExecution,
  getSandboxExecutions,
  type SandboxExecution,
  type ResourceUsage,
} from '../api/sandbox-execution'

export default function SandboxExecutionPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('00000000-0000-0000-0000-000000000001')
  const [executionType, setExecutionType] = useState('build')
  const [isolationLevel, setIsolationLevel] = useState('container')
  const [command, setCommand] = useState('npm run build')
  const [result, setResult] = useState<SandboxExecution | null>(null)
  const [history, setHistory] = useState<SandboxExecution[]>([])
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null)
  const [securityViolations, setSecurityViolations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadLatest()
  }, [projectId])

  function parseJson<T>(json: string | null | undefined): T | null {
    if (!json) return null
    try {
      return JSON.parse(json)
    } catch {
      return null
    }
  }

  function parseJsonArray<T>(json: string | null | undefined): T[] {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  async function loadLatest() {
    setLoading(true)
    setError('')
    try {
      const data = await getLatestSandboxExecution(projectId)
      setResult(data)
      if (data) {
        setResourceUsage(parseJson<ResourceUsage>(data.resourceUsage))
        setSecurityViolations(parseJsonArray<string>(data.securityViolationsJson))
      } else {
        setResourceUsage(null)
        setSecurityViolations([])
      }
    } catch {
      setError(t('sandbox.error.loadFailed', 'Failed to load sandbox execution results'))
    } finally {
      setLoading(false)
    }
  }

  async function handleExecute() {
    setExecuting(true)
    setError('')
    try {
      const data = await executeSandbox(projectId, {
        executionType,
        isolationLevel,
        command,
      })
      setResult(data)
      setResourceUsage(parseJson<ResourceUsage>(data.resourceUsage))
      setSecurityViolations(parseJsonArray<string>(data.securityViolationsJson))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sandbox.error.executeFailed', 'Sandbox execution failed'))
    } finally {
      setExecuting(false)
    }
  }

  async function loadHistory() {
    try {
      const h = await getSandboxExecutions(projectId)
      setHistory(h)
      setShowHistory(true)
    } catch {
      setError(t('sandbox.error.historyFailed', 'Failed to load execution history'))
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-300'
      case 'running': return 'bg-blue-900/50 text-blue-300'
      case 'failed': return 'bg-red-900/50 text-red-300'
      case 'timeout': return 'bg-yellow-900/50 text-yellow-300'
      default: return 'bg-warm-700 text-warm-300'
    }
  }

  const defaultCommand = (type: string) => {
    switch (type) {
      case 'build': return 'npm run build'
      case 'test': return 'npm test'
      case 'preview': return 'npm run preview'
      default: return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('sandbox.title', 'Sandboxed Code Execution')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('sandbox.subtitle', 'Run build, test, and preview commands in isolated sandbox environments')}</p>
        </div>
        <button
          onClick={loadHistory}
          className="px-3 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
        >
          {t('sandbox.history', 'History')}
        </button>
      </div>

      {/* Configuration Panel */}
      <div className="bg-warm-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Project ID */}
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('sandbox.projectId', 'Project ID')}</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* Execution Type */}
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('sandbox.executionType', 'Execution Type')}</label>
            <select
              value={executionType}
              onChange={(e) => {
                setExecutionType(e.target.value)
                setCommand(defaultCommand(e.target.value))
              }}
              className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-sm"
            >
              <option value="build">{t('sandbox.type.build', 'Build')}</option>
              <option value="test">{t('sandbox.type.test', 'Test')}</option>
              <option value="preview">{t('sandbox.type.preview', 'Preview')}</option>
            </select>
          </div>

          {/* Isolation Level */}
          <div>
            <label className="block text-sm text-warm-400 mb-1">{t('sandbox.isolationLevel', 'Isolation Level')}</label>
            <select
              value={isolationLevel}
              onChange={(e) => setIsolationLevel(e.target.value)}
              className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-sm"
            >
              <option value="container">{t('sandbox.isolation.container', 'Container')}</option>
              <option value="microvm">{t('sandbox.isolation.microvm', 'MicroVM')}</option>
              <option value="gvisor">{t('sandbox.isolation.gvisor', 'gVisor')}</option>
            </select>
          </div>

          {/* Execute Button */}
          <div className="flex items-end">
            <button
              onClick={handleExecute}
              disabled={executing || !command.trim()}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
            >
              {executing ? t('sandbox.executing', 'Executing...') : t('sandbox.execute', 'Execute')}
            </button>
          </div>
        </div>

        {/* Command Input */}
        <div>
          <label className="block text-sm text-warm-400 mb-1">{t('sandbox.command', 'Command')}</label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="npm run build"
            className="w-full bg-warm-700 border border-warm-600 rounded px-3 py-2 text-sm font-mono"
          />
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

      {!loading && result && (
        <>
          {/* Result Summary */}
          <div className="bg-warm-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(result.status)}`}>
                  {result.status}
                </span>
                <span className="text-sm text-warm-400">{result.executionType}</span>
                <span className="text-xs text-warm-500 bg-warm-700 px-2 py-0.5 rounded">{result.isolationLevel}</span>
              </div>
              <div className="flex items-center gap-3">
                {result.exitCode !== null && (
                  <span className={`text-sm font-mono ${result.exitCode === 0 ? 'text-green-400' : 'text-red-400'}`}>
                    exit: {result.exitCode}
                  </span>
                )}
                {result.completedAt && (
                  <span className="text-xs text-warm-500">{new Date(result.completedAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Command */}
            <div className="mb-4">
              <span className="text-xs text-warm-400">{t('sandbox.commandRan', 'Command')}:</span>
              <pre className="mt-1 p-2 bg-warm-900 rounded text-xs text-warm-300 font-mono">{result.command}</pre>
            </div>

            {/* Resource Usage Stats */}
            {resourceUsage && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{resourceUsage.cpuPercent}%</div>
                  <div className="text-xs text-warm-400 mt-1">{t('sandbox.resource.cpu', 'CPU Usage')}</div>
                </div>
                <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">{resourceUsage.memoryMb} MB</div>
                  <div className="text-xs text-warm-400 mt-1">{t('sandbox.resource.memory', 'Memory')}</div>
                </div>
                <div className="bg-warm-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{(resourceUsage.durationMs / 1000).toFixed(1)}s</div>
                  <div className="text-xs text-warm-400 mt-1">{t('sandbox.resource.duration', 'Duration')}</div>
                </div>
              </div>
            )}
          </div>

          {/* Output Log */}
          {result.outputLog && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-3">{t('sandbox.outputLog', 'Output Log')}</h4>
              <pre className="p-3 bg-warm-900 rounded-lg text-xs text-green-300 font-mono overflow-x-auto max-h-80 whitespace-pre-wrap">
                {result.outputLog}
              </pre>
            </div>
          )}

          {/* Error Log */}
          {result.errorLog && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-3 text-red-400">{t('sandbox.errorLog', 'Error Log')}</h4>
              <pre className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-xs text-red-300 font-mono overflow-x-auto max-h-60 whitespace-pre-wrap">
                {result.errorLog}
              </pre>
            </div>
          )}

          {/* Security Violations */}
          {securityViolations.length > 0 && (
            <div className="bg-warm-800 rounded-xl p-6">
              <h4 className="font-semibold mb-3 text-yellow-400">{t('sandbox.securityViolations', 'Security Violations')}</h4>
              <div className="space-y-2">
                {securityViolations.map((violation, idx) => (
                  <div key={idx} className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-3 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 flex-shrink-0">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                      <path d="M12 9v4"/>
                      <path d="M12 17h.01"/>
                    </svg>
                    <span className="text-sm text-yellow-300">{violation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !result && (
        <div className="bg-warm-800 rounded-xl p-12 text-center">
          <div className="text-warm-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
              <line x1="7" y1="2" x2="7" y2="22"/>
              <line x1="17" y1="2" x2="17" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="2" y1="7" x2="7" y2="7"/>
              <line x1="2" y1="17" x2="7" y2="17"/>
              <line x1="17" y1="7" x2="22" y2="7"/>
              <line x1="17" y1="17" x2="22" y2="17"/>
            </svg>
          </div>
          <p className="text-warm-400">{t('sandbox.empty', 'No sandbox executions yet. Configure and click "Execute" to run a command in a sandboxed environment.')}</p>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-warm-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">{t('sandbox.historyTitle', 'Execution History')}</h4>
            <button onClick={() => setShowHistory(false)} className="text-warm-400 hover:text-white text-sm">
              {t('sandbox.close', 'Close')}
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-warm-400 text-sm">{t('sandbox.noHistory', 'No execution history.')}</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => {
                const ru = parseJson<ResourceUsage>(h.resourceUsage)
                return (
                  <div key={h.id} className="bg-warm-700/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(h.status)}`}>
                        {h.status}
                      </span>
                      <span className="text-sm">{h.executionType}</span>
                      <span className="text-xs text-warm-500 bg-warm-600/50 px-2 py-0.5 rounded">{h.isolationLevel}</span>
                      <span className="text-xs text-warm-400 font-mono">{h.command.substring(0, 40)}{h.command.length > 40 ? '...' : ''}</span>
                      {ru && (
                        <span className="text-xs text-warm-500">
                          {ru.cpuPercent}% CPU, {ru.memoryMb}MB, {(ru.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {h.exitCode !== null && (
                        <span className={`text-xs font-mono ${h.exitCode === 0 ? 'text-green-400' : 'text-red-400'}`}>
                          exit:{h.exitCode}
                        </span>
                      )}
                      <span className="text-xs text-warm-500">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
