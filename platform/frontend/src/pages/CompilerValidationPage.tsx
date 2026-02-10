import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  triggerCompilation,
  getCompilationResult,
  triggerAutoFix,
  getSupportedLanguages,
  type CompilerError,
  type CompilationResultResponse,
  type SupportedLanguage,
} from '../api/compiler'

type CompileStatus = 'idle' | 'compiling' | 'passed' | 'failed' | 'fixing'

export default function CompilerValidationPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId') || ''

  const [status, setStatus] = useState<CompileStatus>('idle')
  const [errors, setErrors] = useState<CompilerError[]>([])
  const [warnings, setWarnings] = useState<CompilerError[]>([])
  const [retryCount, setRetryCount] = useState(0)
  const [lastResult, setLastResult] = useState<CompilationResultResponse | null>(null)
  const [languages, setLanguages] = useState<SupportedLanguage[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('typescript')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLanguages()
    if (requestId) loadExistingResult()
  }, [requestId])

  async function loadLanguages() {
    const langs = await getSupportedLanguages()
    setLanguages(langs)
  }

  async function loadExistingResult() {
    setLoading(true)
    try {
      const result = await getCompilationResult(requestId)
      if (result) {
        setLastResult(result)
        setSelectedLanguage(result.language)
        setRetryCount(result.retryCount)
        setStatus(result.success ? 'passed' : 'failed')
        try { setErrors(JSON.parse(result.errorsJson)) } catch { setErrors([]) }
        try { setWarnings(JSON.parse(result.warningsJson)) } catch { setWarnings([]) }
      }
    } catch {
      // No existing result
    } finally {
      setLoading(false)
    }
  }

  async function handleCompile() {
    if (!requestId) {
      setError(t('compiler.noProject', 'No project selected.'))
      return
    }
    setStatus('compiling')
    setError('')
    try {
      const output = await triggerCompilation(requestId, selectedLanguage)
      setErrors(output.errors)
      setWarnings(output.warnings)
      setRetryCount(output.retryCount)
      setStatus(output.success ? 'passed' : 'failed')
      await loadExistingResult()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compilation failed')
      setStatus('failed')
    }
  }

  async function handleAutoFix() {
    if (!requestId) return
    setStatus('fixing')
    setError('')
    try {
      const output = await triggerAutoFix(requestId)
      setErrors(output.errors)
      setWarnings(output.warnings)
      setRetryCount(output.retryCount)
      setStatus(output.success ? 'passed' : 'failed')
      await loadExistingResult()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-fix failed')
      setStatus('failed')
    }
  }

  function statusBadge() {
    switch (status) {
      case 'compiling':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400">Compiling...</span>
      case 'passed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400">Passed</span>
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-400">Failed</span>
      case 'fixing':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-400">Auto-fixing...</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400">Not run</span>
    }
  }

  if (!requestId) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold mb-2">{t('compiler.title', 'Compiler Validation')}</h3>
        <p className="text-gray-400">{t('compiler.noProject', 'No project selected. Build a project first, then return here to validate.')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{t('compiler.title', 'Compiler Validation')}</h3>
          <p className="text-sm text-gray-400 mt-1">{t('compiler.description', 'Compile generated code to verify it builds successfully')}</p>
        </div>
        {statusBadge()}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t('compiler.language', 'Language / Framework')}</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
              {languages.length === 0 && (
                <option value="typescript">TypeScript</option>
              )}
            </select>
          </div>
          <button
            onClick={handleCompile}
            disabled={status === 'compiling' || status === 'fixing'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {status === 'compiling'
              ? t('compiler.compiling', 'Compiling...')
              : t('compiler.compile', 'Compile')}
          </button>
          {(status === 'failed' || status === 'fixing') && errors.length > 0 && (
            <button
              onClick={handleAutoFix}
              disabled={status === 'fixing'}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {status === 'fixing'
                ? t('compiler.fixing', 'Auto-fixing...')
                : t('compiler.autoFix', 'Auto-fix with AI')}
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {status !== 'idle' && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${errors.length === 0 ? 'text-green-400' : 'text-red-400'}`}>
              {errors.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">{t('compiler.errors', 'Errors')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{warnings.length}</div>
            <div className="text-xs text-gray-400 mt-1">{t('compiler.warnings', 'Warnings')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{retryCount}</div>
            <div className="text-xs text-gray-400 mt-1">{t('compiler.retries', 'Retries')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{selectedLanguage}</div>
            <div className="text-xs text-gray-400 mt-1">{t('compiler.lang', 'Language')}</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-400">{t('compiler.loading', 'Loading...')}</div>
      )}

      {/* Error List */}
      {!loading && errors.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-bold text-red-400 mb-3">{t('compiler.errorList', 'Compilation Errors')}</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {errors.map((err, i) => (
              <div key={i} className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 shrink-0 font-mono text-xs mt-0.5">E{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    {err.file && (
                      <span className="text-gray-400 font-mono text-xs">
                        {err.file}{err.line ? `:${err.line}` : ''}
                      </span>
                    )}
                    <p className="text-red-300 text-sm mt-0.5">{err.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning List */}
      {!loading && warnings.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-bold text-yellow-400 mb-3">{t('compiler.warningList', 'Warnings')}</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {warnings.map((warn, i) => (
              <div key={i} className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 shrink-0 font-mono text-xs mt-0.5">W{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    {warn.file && (
                      <span className="text-gray-400 font-mono text-xs">
                        {warn.file}{warn.line ? `:${warn.line}` : ''}
                      </span>
                    )}
                    <p className="text-yellow-300 text-sm mt-0.5">{warn.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {lastResult && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-bold text-gray-300 mb-2">{t('compiler.lastResult', 'Last Compilation')}</h4>
          <div className="text-sm text-gray-400 space-y-1">
            <p>{t('compiler.language', 'Language')}: <span className="text-white">{lastResult.language}</span></p>
            <p>{t('compiler.status', 'Status')}: <span className={lastResult.success ? 'text-green-400' : 'text-red-400'}>{lastResult.success ? 'Passed' : 'Failed'}</span></p>
            <p>{t('compiler.retries', 'Retries')}: <span className="text-white">{lastResult.retryCount}</span></p>
            <p>{t('compiler.compiledAt', 'Compiled')}: <span className="text-white">{new Date(lastResult.compiledAt).toLocaleString()}</span></p>
          </div>
        </div>
      )}

      {/* Success State */}
      {!loading && status === 'passed' && errors.length === 0 && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 text-center">
          <p className="text-green-300 font-medium">{t('compiler.success', 'Build passed! Generated code compiles successfully.')}</p>
        </div>
      )}
    </div>
  )
}
