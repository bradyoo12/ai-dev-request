import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  triggerTestGeneration,
  getTestResults,
  getTestHistory,
  type TestGenerationRecord,
  type TestFileInfo,
} from '../api/test-generation'

export default function TestGenerationPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState(1)
  const [record, setRecord] = useState<TestGenerationRecord | null>(null)
  const [history, setHistory] = useState<TestGenerationRecord[]>([])
  const [testFiles, setTestFiles] = useState<TestFileInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [selectedFile, setSelectedFile] = useState<TestFileInfo | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadResults()
  }, [projectId])

  async function loadResults() {
    setLoading(true)
    setError('')
    try {
      const result = await getTestResults(projectId)
      setRecord(result)
      if (result?.testFilesJson) {
        try {
          const parsed = JSON.parse(result.testFilesJson)
          setTestFiles(Array.isArray(parsed) ? parsed : [])
        } catch {
          setTestFiles([])
        }
      } else {
        setTestFiles([])
      }
    } catch {
      setError(t('testGeneration.error.loadFailed', 'Failed to load test results'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const result = await triggerTestGeneration(projectId)
      setRecord(result)
      if (result?.testFilesJson) {
        try {
          const parsed = JSON.parse(result.testFilesJson)
          setTestFiles(Array.isArray(parsed) ? parsed : [])
        } catch {
          setTestFiles([])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('testGeneration.error.generateFailed', 'Test generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  async function loadHistory() {
    try {
      const h = await getTestHistory(projectId)
      setHistory(h)
      setShowHistory(true)
    } catch {
      setError(t('testGeneration.error.historyFailed', 'Failed to load history'))
    }
  }

  const filteredFiles = typeFilter === 'all'
    ? testFiles
    : testFiles.filter(f => f.type === typeFilter)

  const unitCount = testFiles.filter(f => f.type === 'unit').length
  const integrationCount = testFiles.filter(f => f.type === 'integration').length
  const e2eCount = testFiles.filter(f => f.type === 'e2e').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('testGeneration.title', 'AI Test Generation')}</h3>
          <p className="text-gray-400 text-sm mt-1">{t('testGeneration.subtitle', 'Auto-generate unit, integration, and E2E tests for your project')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">{t('testGeneration.projectId', 'Project ID')}:</label>
          <input
            type="number"
            min={1}
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? t('testGeneration.generating', 'Generating...') : t('testGeneration.generate', 'Generate Tests')}
          </button>
          <button
            onClick={loadHistory}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            {t('testGeneration.history', 'History')}
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

      {!loading && record && (
        <>
          {/* Summary Card */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  record.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                  record.status === 'generating' ? 'bg-blue-900/50 text-blue-300' :
                  record.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {record.status}
                </span>
                <span className="text-sm text-gray-400">v{record.generationVersion}</span>
              </div>
              {record.completedAt && (
                <span className="text-xs text-gray-500">{new Date(record.completedAt).toLocaleString()}</span>
              )}
            </div>

            {record.summary && (
              <p className="text-gray-300 text-sm mb-4">{record.summary}</p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{record.testFilesGenerated}</div>
                <div className="text-xs text-gray-400 mt-1">{t('testGeneration.stats.files', 'Test Files')}</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{record.totalTestCount}</div>
                <div className="text-xs text-gray-400 mt-1">{t('testGeneration.stats.tests', 'Total Tests')}</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{record.coverageEstimate}%</div>
                <div className="text-xs text-gray-400 mt-1">{t('testGeneration.stats.coverage', 'Est. Coverage')}</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-sm font-medium text-yellow-400 truncate">{record.testFramework || '—'}</div>
                <div className="text-xs text-gray-400 mt-1">{t('testGeneration.stats.framework', 'Framework')}</div>
              </div>
            </div>
          </div>

          {/* Coverage Bar */}
          {record.status === 'completed' && (
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t('testGeneration.coverageBar', 'Estimated Coverage')}</span>
                <span className="text-sm text-gray-400">{record.coverageEstimate}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    record.coverageEstimate >= 80 ? 'bg-green-500' :
                    record.coverageEstimate >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(record.coverageEstimate, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Test Files List */}
          {testFiles.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">{t('testGeneration.files', 'Generated Test Files')}</h4>
                <div className="flex gap-2">
                  {['all', 'unit', 'integration', 'e2e'].map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        typeFilter === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {type === 'all' ? `All (${testFiles.length})` :
                       type === 'unit' ? `Unit (${unitCount})` :
                       type === 'integration' ? `Integration (${integrationCount})` :
                       `E2E (${e2eCount})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filteredFiles.map((file, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedFile(selectedFile?.path === file.path ? null : file)}
                    className="bg-gray-700/50 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          file.type === 'unit' ? 'bg-blue-900/50 text-blue-300' :
                          file.type === 'integration' ? 'bg-purple-900/50 text-purple-300' :
                          'bg-green-900/50 text-green-300'
                        }`}>
                          {file.type}
                        </span>
                        <span className="text-sm font-mono">{file.path}</span>
                      </div>
                      <span className="text-xs text-gray-400">{file.testCount} {t('testGeneration.testsLabel', 'tests')}</span>
                    </div>
                    {selectedFile?.path === file.path && file.content && (
                      <pre className="mt-3 p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto max-h-80">
                        {file.content}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !record && (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="m9 15 2 2 4-4"/>
            </svg>
          </div>
          <p className="text-gray-400">{t('testGeneration.empty', 'No test generation results yet. Click "Generate Tests" to start.')}</p>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">{t('testGeneration.historyTitle', 'Generation History')}</h4>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white text-sm">
              {t('testGeneration.close', 'Close')}
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('testGeneration.noHistory', 'No generation history.')}</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      h.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                      h.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {h.status}
                    </span>
                    <span className="text-sm">v{h.generationVersion}</span>
                    <span className="text-xs text-gray-400">{h.testFilesGenerated} files, {h.totalTestCount} tests</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
