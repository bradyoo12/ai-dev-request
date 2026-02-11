import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  CodeReviewPipelineConfig,
  PipelineResults,
  PipelineHistoryEntry,
  PipelineStats,
  PipelineFinding,
  PipelineStepResult,
  GeneratedTestFile,
} from '../api/codeReviewPipeline'
import {
  getPipelineConfig,
  updatePipelineConfig,
  runPipeline,
  getPipelineResults,
  getPipelineHistory,
  getPipelineStats,
} from '../api/codeReviewPipeline'

type Tab = 'pipeline' | 'results' | 'history' | 'stats'

export default function CodeReviewPipelinePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('pipeline')

  // Pipeline tab
  const [projectId, setProjectId] = useState('')
  const [config, setConfig] = useState<CodeReviewPipelineConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<CodeReviewPipelineConfig | null>(null)

  // Results tab
  const [resultsProjectId, setResultsProjectId] = useState('')
  const [results, setResults] = useState<PipelineResults | null>(null)
  const [loadingResults, setLoadingResults] = useState(false)

  // History tab
  const [historyProjectId, setHistoryProjectId] = useState('')
  const [history, setHistory] = useState<PipelineHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Stats tab
  const [stats, setStats] = useState<PipelineStats | null>(null)

  useEffect(() => {
    if (tab === 'stats') {
      getPipelineStats().then(setStats).catch(() => {})
    }
  }, [tab])

  const handleLoadConfig = async () => {
    if (!projectId.trim()) return
    setLoading(true)
    try {
      const cfg = await getPipelineConfig(projectId)
      setConfig(cfg)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleToggle = async (field: string, value: boolean) => {
    if (!config) return
    try {
      const updated = await updatePipelineConfig(config.projectName, { [field]: value })
      setConfig(updated)
    } catch { /* ignore */ }
  }

  const handleThresholdChange = async (value: number) => {
    if (!config) return
    try {
      const updated = await updatePipelineConfig(config.projectName, { minQualityThreshold: value })
      setConfig(updated)
    } catch { /* ignore */ }
  }

  const handleRunPipeline = async () => {
    if (!config) return
    setRunning(true)
    setRunResult(null)
    try {
      const result = await runPipeline({ projectId: config.projectName })
      setRunResult(result)
      setConfig(result)
    } catch { /* ignore */ }
    setRunning(false)
  }

  const handleLoadResults = async () => {
    if (!resultsProjectId.trim()) return
    setLoadingResults(true)
    try {
      const r = await getPipelineResults(resultsProjectId)
      setResults(r)
    } catch { setResults(null) }
    setLoadingResults(false)
  }

  const handleLoadHistory = async () => {
    if (!historyProjectId.trim()) return
    setLoadingHistory(true)
    try {
      const h = await getPipelineHistory(historyProjectId)
      setHistory(h)
    } catch { setHistory([]) }
    setLoadingHistory(false)
  }

  const severityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-900/30 text-red-400',
      high: 'bg-orange-900/30 text-orange-400',
      medium: 'bg-yellow-900/30 text-yellow-400',
      low: 'bg-blue-900/30 text-blue-400',
    }
    return colors[severity] || 'bg-gray-700 text-gray-400'
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      idle: 'bg-gray-700 text-gray-400',
      running: 'bg-blue-900/30 text-blue-400',
      completed: 'bg-green-900/30 text-green-400',
      failed: 'bg-red-900/30 text-red-400',
    }
    return colors[status] || 'bg-gray-700 text-gray-400'
  }

  const qualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const parseFindings = (json: string): PipelineFinding[] => {
    try { return JSON.parse(json) } catch { return [] }
  }

  const parseSteps = (json: string): PipelineStepResult[] => {
    try { return JSON.parse(json) } catch { return [] }
  }

  const parseTests = (json: string): GeneratedTestFile[] => {
    try { return JSON.parse(json) } catch { return [] }
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('codeReviewPipeline.title', 'Code Review Pipeline')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('codeReviewPipeline.subtitle', 'Automated AI code review pipeline with AST analysis, SAST scanning, AI review, test generation, and quality scoring for generated code.')}</p>

      <div className="flex gap-2 mb-6">
        {(['pipeline', 'results', 'history', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`codeReviewPipeline.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {/* Pipeline Tab */}
      {tab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h4 className="font-medium mb-4">{t('codeReviewPipeline.configTitle', 'Pipeline Configuration')}</h4>
            <div className="flex gap-2 mb-4">
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder={t('codeReviewPipeline.projectIdPlaceholder', 'Enter project name or ID...')}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleLoadConfig}
                disabled={loading || !projectId.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? t('codeReviewPipeline.loading', 'Loading...') : t('codeReviewPipeline.loadConfig', 'Load Config')}
              </button>
            </div>

            {config && (
              <div className="space-y-4">
                {/* Toggle switches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { field: 'pipelineEnabled', label: t('codeReviewPipeline.pipelineEnabled', 'Pipeline Enabled'), value: config.pipelineEnabled },
                    { field: 'autoRunAfterGeneration', label: t('codeReviewPipeline.autoRun', 'Auto-Run After Generation'), value: config.autoRunAfterGeneration },
                    { field: 'autoFixEnabled', label: t('codeReviewPipeline.autoFix', 'Auto-Fix Enabled'), value: config.autoFixEnabled },
                    { field: 'astAnalysisEnabled', label: t('codeReviewPipeline.astAnalysis', 'AST Analysis'), value: config.astAnalysisEnabled },
                    { field: 'sastScanEnabled', label: t('codeReviewPipeline.sastScan', 'SAST Scan'), value: config.sastScanEnabled },
                    { field: 'aiReviewEnabled', label: t('codeReviewPipeline.aiReview', 'AI Review'), value: config.aiReviewEnabled },
                    { field: 'testGenerationEnabled', label: t('codeReviewPipeline.testGeneration', 'Test Generation'), value: config.testGenerationEnabled },
                  ].map(({ field, label, value }) => (
                    <div key={field} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3">
                      <span className="text-sm">{label}</span>
                      <button
                        onClick={() => handleToggle(field, !value)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Min quality threshold */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('codeReviewPipeline.minThreshold', 'Min Quality Threshold')}</span>
                    <span className="text-sm font-bold">{config.minQualityThreshold}/100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.minQualityThreshold}
                    onChange={(e) => handleThresholdChange(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Current status */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Status: <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(config.lastRunStatus)}`}>{config.lastRunStatus}</span></span>
                  {config.lastRunAt && <span>Last run: {new Date(config.lastRunAt).toLocaleString()}</span>}
                  <span>Score: <span className={`font-bold ${qualityScoreColor(config.qualityScore)}`}>{config.qualityScore}</span></span>
                </div>

                {/* Run Pipeline button */}
                <button
                  onClick={handleRunPipeline}
                  disabled={running || !config.pipelineEnabled}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {running ? t('codeReviewPipeline.running', 'Running Pipeline...') : t('codeReviewPipeline.runPipeline', 'Run Pipeline')}
                </button>

                {/* Pipeline step-by-step results after run */}
                {runResult && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">{t('codeReviewPipeline.runResults', 'Pipeline Run Results')}</h4>

                    {/* Quality Score */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <div className={`text-4xl font-bold ${qualityScoreColor(runResult.qualityScore)}`}>{runResult.qualityScore}</div>
                      <div className="text-sm text-gray-400 mt-1">{t('codeReviewPipeline.qualityScore', 'Quality Score')}</div>
                      <div className={`text-xs mt-2 px-3 py-1 rounded inline-block ${runResult.qualityScore >= runResult.minQualityThreshold ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {runResult.qualityScore >= runResult.minQualityThreshold ? 'PASSED' : 'FAILED'} (threshold: {runResult.minQualityThreshold})
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      {parseSteps(runResult.pipelineStepsJson).map((step, i) => (
                        <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${step.status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            <span className="text-sm font-medium">{step.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{step.findingsCount} findings</span>
                            <span>{step.durationMs}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Findings */}
                    {parseFindings(runResult.findingsJson).length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">{t('codeReviewPipeline.findings', 'Findings')}</h5>
                        <div className="space-y-2">
                          {parseFindings(runResult.findingsJson).map((finding, i) => (
                            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${severityBadge(finding.severity)}`}>{finding.severity}</span>
                                <span className="text-xs text-gray-500">{finding.category}</span>
                                {finding.fixed && <span className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400">Fixed</span>}
                                {finding.autoFixAvailable && !finding.fixed && <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Auto-fix available</span>}
                              </div>
                              <div className="text-sm text-gray-300">{finding.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generated Tests */}
                    {parseTests(runResult.generatedTestsJson).length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">{t('codeReviewPipeline.generatedTests', 'Generated Tests')}</h5>
                        <div className="space-y-2">
                          {parseTests(runResult.generatedTestsJson).map((test, i) => (
                            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{test.fileName}</div>
                                <div className="text-xs text-gray-400">{test.description}</div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {test.testCount} tests, {test.linesOfCode} lines
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Tab */}
      {tab === 'results' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h4 className="font-medium mb-4">{t('codeReviewPipeline.latestResults', 'Latest Pipeline Results')}</h4>
            <div className="flex gap-2 mb-4">
              <input
                value={resultsProjectId}
                onChange={(e) => setResultsProjectId(e.target.value)}
                placeholder={t('codeReviewPipeline.projectIdPlaceholder', 'Enter project name or ID...')}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleLoadResults}
                disabled={loadingResults || !resultsProjectId.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loadingResults ? t('codeReviewPipeline.loading', 'Loading...') : t('codeReviewPipeline.loadResults', 'Load Results')}
              </button>
            </div>
          </div>

          {results && (
            <div className="space-y-4">
              {/* Quality Score + Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                  <div className={`text-3xl font-bold ${qualityScoreColor(results.qualityScore)}`}>{results.qualityScore}</div>
                  <div className="text-xs text-gray-400 mt-1">{t('codeReviewPipeline.qualityScore', 'Quality Score')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                  <div className={`text-lg font-bold ${results.passed ? 'text-green-400' : 'text-red-400'}`}>{results.passed ? 'PASSED' : 'FAILED'}</div>
                  <div className="text-xs text-gray-400 mt-1">Threshold: {results.minQualityThreshold}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{results.totalFindingsFound}</div>
                  <div className="text-xs text-gray-400 mt-1">{t('codeReviewPipeline.findingsFound', 'Findings Found')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{results.totalTestsGenerated}</div>
                  <div className="text-xs text-gray-400 mt-1">{t('codeReviewPipeline.testsGenerated', 'Tests Generated')}</div>
                </div>
              </div>

              {/* Pipeline Steps */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h5 className="text-sm font-medium mb-3">{t('codeReviewPipeline.pipelineSteps', 'Pipeline Steps')}</h5>
                <div className="space-y-2">
                  {results.pipelineSteps.map((step, i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${step.status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span className="text-sm font-medium">{step.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{step.findingsCount} findings</span>
                        <span>{step.durationMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Findings by category */}
              {results.findings.length > 0 && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-3">{t('codeReviewPipeline.findingsByCategory', 'Findings by Category')}</h5>
                  <div className="space-y-2">
                    {results.findings.map((finding, i) => (
                      <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${severityBadge(finding.severity)}`}>{finding.severity}</span>
                          <span className="text-xs text-gray-500">{finding.category}</span>
                          {finding.fixed && <span className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400">Fixed</span>}
                        </div>
                        <div className="text-sm text-gray-300">{finding.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Tests */}
              {results.generatedTests.length > 0 && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-3">{t('codeReviewPipeline.testFiles', 'Generated Test Files')}</h5>
                  <div className="space-y-2">
                    {results.generatedTests.map((test, i) => (
                      <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{test.fileName}</div>
                          <div className="text-xs text-gray-400">{test.description}</div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {test.testCount} tests, {test.linesOfCode} lines
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h4 className="font-medium mb-4">{t('codeReviewPipeline.executionHistory', 'Pipeline Execution History')}</h4>
            <div className="flex gap-2 mb-4">
              <input
                value={historyProjectId}
                onChange={(e) => setHistoryProjectId(e.target.value)}
                placeholder={t('codeReviewPipeline.projectIdPlaceholder', 'Enter project name or ID...')}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleLoadHistory}
                disabled={loadingHistory || !historyProjectId.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loadingHistory ? t('codeReviewPipeline.loading', 'Loading...') : t('codeReviewPipeline.loadHistory', 'Load History')}
              </button>
            </div>
          </div>

          {history.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t('codeReviewPipeline.noHistory', 'No pipeline runs found. Run the pipeline first from the Pipeline tab.')}</div>
          )}

          {history.map((entry) => (
            <div key={entry.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{entry.projectName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(entry.lastRunStatus)}`}>{entry.lastRunStatus}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${entry.passed ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {entry.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className={`text-lg font-bold ${qualityScoreColor(entry.qualityScore)}`}>{entry.qualityScore}</div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-gray-400">
                <div>Runs: {entry.totalRuns}</div>
                <div>Passed: {entry.passedRuns}</div>
                <div>Failed: {entry.failedRuns}</div>
                <div>Findings: {entry.totalFindingsFound}</div>
                <div>Fixed: {entry.totalFindingsFixed}</div>
                <div>Tests: {entry.totalTestsGenerated}</div>
              </div>
              {entry.lastRunAt && (
                <div className="text-xs text-gray-500 mt-2">Last run: {new Date(entry.lastRunAt).toLocaleString()}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalRuns}</div>
              <div className="text-sm text-gray-400">{t('codeReviewPipeline.stats.totalRuns', 'Total Runs')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.passRate}%</div>
              <div className="text-sm text-gray-400">{t('codeReviewPipeline.stats.passRate', 'Pass Rate')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${qualityScoreColor(stats.avgQualityScore)}`}>{stats.avgQualityScore}</div>
              <div className="text-sm text-gray-400">{t('codeReviewPipeline.stats.avgScore', 'Avg Score')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.totalTestsGenerated}</div>
              <div className="text-sm text-gray-400">{t('codeReviewPipeline.stats.testsGenerated', 'Tests Generated')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalFindingsFixed}</div>
              <div className="text-sm text-gray-400">{t('codeReviewPipeline.stats.findingsFixed', 'Findings Fixed')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">${stats.totalCost.toFixed(4)}</div>
              <div className="text-sm text-gray-400">{t('codeReviewPipeline.stats.totalCost', 'Total Cost')}</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h5 className="text-sm font-medium mb-3">{t('codeReviewPipeline.stats.breakdown', 'Detailed Breakdown')}</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Pipelines</span>
                <span>{stats.totalPipelines}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Passed Runs</span>
                <span className="text-green-400">{stats.passedRuns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Failed Runs</span>
                <span className="text-red-400">{stats.failedRuns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Findings</span>
                <span>{stats.totalFindingsFound}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tokens Used</span>
                <span>{stats.totalTokensUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Findings Fixed</span>
                <span className="text-green-400">{stats.totalFindingsFixed}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && !stats && (
        <div className="text-center py-12 text-gray-500 text-sm">{t('codeReviewPipeline.stats.loading', 'Loading stats...')}</div>
      )}
    </div>
  )
}
