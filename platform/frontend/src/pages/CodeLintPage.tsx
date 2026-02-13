import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listResults,
  runAnalysis,
  applyAutofix,
  dismissIssue,
  deleteResult,
  getLintStats,
  getLintRules,
  type CodeLintResult,
  type LintRule,
  type LintStats,
} from '../api/codelint'

type LintTab = 'analyze' | 'issues' | 'rules' | 'stats'

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  error: 'bg-orange-600 text-white',
  warning: 'bg-yellow-600 text-white',
  info: 'bg-blue-600 text-white',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400',
  applied: 'text-green-400',
  dismissed: 'text-warm-500',
  'pr-created': 'text-blue-400',
}

export default function CodeLintPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<LintTab>('analyze')
  const [results, setResults] = useState<CodeLintResult[]>([])
  const [rules, setRules] = useState<LintRule[]>([])
  const [stats, setStats] = useState<LintStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Analyze form
  const [projectName, setProjectName] = useState('')
  const [language, setLanguage] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [lastResults, setLastResults] = useState<CodeLintResult[]>([])

  // Filters
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    loadRules()
  }, [])

  useEffect(() => {
    if (tab === 'issues') loadResults()
    if (tab === 'stats') loadStats()
  }, [tab])

  async function loadRules() {
    try { setRules(await getLintRules()) } catch { /* ignore */ }
  }

  async function loadResults() {
    setLoading(true)
    try { setResults(await listResults(filterSeverity || undefined, filterCategory || undefined)) } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadStats() {
    setLoading(true)
    try { setStats(await getLintStats()) } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleAnalyze() {
    if (!projectName.trim()) return
    setAnalyzing(true)
    setLastResults([])
    try {
      const issues = await runAnalysis(projectName, language || undefined)
      setLastResults(issues)
    } catch { /* ignore */ }
    setAnalyzing(false)
  }

  async function handleAutofix(id: string) {
    try {
      const updated = await applyAutofix(id)
      setResults(prev => prev.map(r => r.id === id ? updated : r))
      setLastResults(prev => prev.map(r => r.id === id ? updated : r))
    } catch { /* ignore */ }
  }

  async function handleDismiss(id: string) {
    try {
      const updated = await dismissIssue(id)
      setResults(prev => prev.map(r => r.id === id ? updated : r))
      setLastResults(prev => prev.map(r => r.id === id ? updated : r))
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    try {
      await deleteResult(id)
      setResults(prev => prev.filter(r => r.id !== id))
    } catch { /* ignore */ }
  }

  function renderIssue(r: CodeLintResult, showActions = true) {
    return (
      <div key={r.id} className={`bg-warm-800 rounded-lg p-4 border ${r.isResolved ? 'border-warm-800 opacity-60' : 'border-warm-700'}`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_COLORS[r.severity] || 'bg-warm-700'}`}>{r.severity}</span>
              <span className="text-xs text-warm-500">{r.ruleId}</span>
              <span className="text-xs bg-warm-700 px-2 py-0.5 rounded">{r.language}</span>
              <span className={`text-xs ${STATUS_COLORS[r.autofixStatus] || 'text-warm-500'}`}>{r.autofixStatus}</span>
            </div>
            <p className="text-white text-sm mt-1">{r.message}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-warm-500">
              <span>{r.filePath}:{r.lineNumber}</span>
              {r.projectName && <span>{r.projectName}</span>}
            </div>
            {r.snippet && (
              <pre className="bg-warm-900 rounded p-2 text-xs text-warm-300 font-mono mt-2 overflow-x-auto">{r.snippet}</pre>
            )}
          </div>
          {showActions && !r.isResolved && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => handleAutofix(r.id)} className="px-3 py-1 bg-green-700 text-white rounded text-xs hover:bg-green-600">
                {t('lint.autofix', 'Autofix')}
              </button>
              <button onClick={() => handleDismiss(r.id)} className="px-3 py-1 bg-warm-600 text-white rounded text-xs hover:bg-warm-500">
                {t('lint.dismiss', 'Dismiss')}
              </button>
              <button onClick={() => handleDelete(r.id)} className="px-3 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-600">
                {t('lint.delete', 'Delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">{t('lint.title', 'Code Linting')}</h3>
        <p className="text-warm-400 text-sm mt-1">{t('lint.subtitle', 'AI-powered code analysis with SonarQube-style autofix')}</p>
      </div>

      <div className="flex gap-2">
        {(['analyze', 'issues', 'rules', 'stats'] as LintTab[]).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-blue-600 text-white' : 'bg-warm-800 text-warm-400 hover:text-white'
            }`}
          >
            {t(`lint.tabs.${tabId}`, tabId === 'analyze' ? 'Analyze' : tabId === 'issues' ? 'Issues' : tabId === 'rules' ? 'Rules' : 'Stats')}
          </button>
        ))}
      </div>

      {/* Analyze Tab */}
      {tab === 'analyze' && (
        <div className="space-y-4">
          <div className="bg-warm-800 rounded-lg p-6 space-y-4">
            <h4 className="text-white font-medium">{t('lint.runAnalysis', 'Run Code Analysis')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('lint.projectName', 'Project Name')}</label>
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., my-web-app"
                />
              </div>
              <div>
                <label className="block text-sm text-warm-400 mb-1">{t('lint.language', 'Language')}</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="">{t('lint.autoDetect', 'Auto-detect')}</option>
                  <option value="typescript">TypeScript</option>
                  <option value="csharp">C#</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !projectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzing ? t('lint.analyzing', 'Analyzing...') : t('lint.analyzeBtn', 'Run Analysis')}
            </button>
          </div>

          {lastResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-medium">{t('lint.foundIssues', 'Found Issues')} ({lastResults.length})</h4>
              {lastResults.map(r => renderIssue(r))}
            </div>
          )}
        </div>
      )}

      {/* Issues Tab */}
      {tab === 'issues' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <select
              value={filterSeverity}
              onChange={e => { setFilterSeverity(e.target.value); setTimeout(loadResults, 0) }}
              className="bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">{t('lint.allSeverities', 'All Severities')}</option>
              <option value="critical">{t('lint.critical', 'Critical')}</option>
              <option value="error">{t('lint.error', 'Error')}</option>
              <option value="warning">{t('lint.warning', 'Warning')}</option>
              <option value="info">{t('lint.info', 'Info')}</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setTimeout(loadResults, 0) }}
              className="bg-warm-700 border border-warm-600 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">{t('lint.allCategories', 'All Categories')}</option>
              {rules.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-warm-400 text-sm">{t('lint.loading', 'Loading...')}</p>
          ) : results.length === 0 ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('lint.noIssues', 'No issues found. Run an analysis first!')}</p>
            </div>
          ) : (
            <div className="space-y-3">{results.map(r => renderIssue(r))}</div>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rules.map(r => (
              <div key={r.id} className="bg-warm-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-white font-medium">{r.name}</span>
                </div>
                <p className="text-warm-400 text-sm">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-warm-400 text-sm">{t('lint.loading', 'Loading...')}</p>
          ) : !stats ? (
            <div className="bg-warm-800 rounded-lg p-8 text-center">
              <p className="text-warm-400">{t('lint.noStats', 'No analysis statistics yet.')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('lint.stats.total', 'Total Issues'), value: stats.totalIssues },
                  { label: t('lint.stats.resolved', 'Resolved'), value: stats.resolved },
                  { label: t('lint.stats.autofixed', 'Autofixed'), value: stats.autofixed },
                  { label: t('lint.stats.critical', 'Critical'), value: stats.critical, color: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="bg-warm-800 rounded-lg p-4 text-center">
                    <p className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</p>
                    <p className="text-xs text-warm-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {stats.bySeverity.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('lint.stats.bySeverity', 'By Severity')}</h4>
                  <div className="space-y-2">
                    {stats.bySeverity.map(s => (
                      <div key={s.severity} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                        <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_COLORS[s.severity] || 'bg-warm-700'}`}>{s.severity}</span>
                        <span className="text-xs text-warm-500">{s.count} {t('lint.issuesLabel', 'issues')} ({s.resolved} {t('lint.stats.resolved', 'resolved')})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.byCategory.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('lint.stats.byCategory', 'By Category')}</h4>
                  <div className="space-y-2">
                    {stats.byCategory.map(c => {
                      const info = rules.find(r => r.id === c.category)
                      return (
                        <div key={c.category} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info?.color || '#6b7280' }} />
                            <span className="text-sm text-white">{info?.name || c.category}</span>
                          </div>
                          <span className="text-xs text-warm-500">{c.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {stats.byLanguage.length > 0 && (
                <div className="bg-warm-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{t('lint.stats.byLanguage', 'By Language')}</h4>
                  <div className="space-y-2">
                    {stats.byLanguage.map(l => (
                      <div key={l.language} className="flex items-center justify-between py-2 border-b border-warm-700 last:border-0">
                        <span className="text-sm text-white">{l.language}</span>
                        <span className="text-xs text-warm-500">{l.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
