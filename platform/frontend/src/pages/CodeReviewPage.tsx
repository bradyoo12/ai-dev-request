import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  triggerReview,
  getReviewResults,
  getReviewHistory,
  applyFix,
  applyAllFixes,
} from '../api/code-review'
import type { CodeQualityReview, ReviewFinding } from '../api/code-review'

export default function CodeReviewPage() {
  const { t } = useTranslation()
  const [review, setReview] = useState<CodeQualityReview | null>(null)
  const [history, setHistory] = useState<CodeQualityReview[]>([])
  const [findings, setFindings] = useState<ReviewFinding[]>([])
  const [appliedFixes, setAppliedFixes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [applyingFix, setApplyingFix] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState<number>(1)
  const [projectIdInput, setProjectIdInput] = useState('1')
  const [showHistory, setShowHistory] = useState(false)
  const [filterDimension, setFilterDimension] = useState<string>('all')
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null)

  const parseFindings = (reviewData: CodeQualityReview | null): ReviewFinding[] => {
    if (!reviewData?.findings) return []
    try {
      return JSON.parse(reviewData.findings)
    } catch {
      return []
    }
  }

  const parseAppliedFixes = (reviewData: CodeQualityReview | null): string[] => {
    if (!reviewData?.appliedFixes) return []
    try {
      return JSON.parse(reviewData.appliedFixes)
    } catch {
      return []
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [resultData, historyData] = await Promise.all([
        getReviewResults(projectId),
        getReviewHistory(projectId),
      ])
      setReview(resultData)
      setHistory(historyData)
      setFindings(parseFindings(resultData))
      setAppliedFixes(parseAppliedFixes(resultData))
    } catch {
      setError(t('codeReview.loadError', 'Failed to load review data'))
    } finally {
      setLoading(false)
    }
  }, [projectId, t])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTriggerReview = async () => {
    try {
      setError('')
      setReviewing(true)
      const result = await triggerReview(projectId)
      setReview(result)
      setFindings(parseFindings(result))
      setAppliedFixes(parseAppliedFixes(result))
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('codeReview.reviewError', 'Review failed'))
    } finally {
      setReviewing(false)
    }
  }

  const handleApplyFix = async (findingId: string) => {
    try {
      setError('')
      setApplyingFix(findingId)
      const result = await applyFix(projectId, findingId)
      setReview(result)
      setAppliedFixes(parseAppliedFixes(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('codeReview.fixError', 'Fix failed'))
    } finally {
      setApplyingFix(null)
    }
  }

  const handleApplyAllFixes = async (severity: string) => {
    try {
      setError('')
      setApplyingFix(`all-${severity}`)
      const result = await applyAllFixes(projectId, severity)
      setReview(result)
      setAppliedFixes(parseAppliedFixes(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('codeReview.fixAllError', 'Apply all fixes failed'))
    } finally {
      setApplyingFix(null)
    }
  }

  const handleLoadProject = () => {
    const parsed = parseInt(projectIdInput, 10)
    if (!isNaN(parsed) && parsed > 0) {
      setProjectId(parsed)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-400'
    if (score >= 3) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getOverallBadgeColor = (score: number) => {
    if (score >= 4) return 'bg-green-900/50 text-green-400 border-green-700'
    if (score >= 3) return 'bg-yellow-900/50 text-yellow-400 border-yellow-700'
    return 'bg-red-900/50 text-red-400 border-red-700'
  }

  const getScoreBarColor = (score: number) => {
    if (score >= 4) return 'bg-green-500'
    if (score >= 3) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900/50 text-red-400'
      case 'warning': return 'bg-yellow-900/50 text-yellow-400'
      case 'info': return 'bg-blue-900/50 text-blue-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400'
    if (confidence >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDimensionLabel = (dimension: string) => {
    switch (dimension) {
      case 'architecture': return t('codeReview.dimensions.architecture', 'Architecture')
      case 'security': return t('codeReview.dimensions.security', 'Security')
      case 'performance': return t('codeReview.dimensions.performance', 'Performance')
      case 'accessibility': return t('codeReview.dimensions.accessibility', 'Accessibility')
      case 'maintainability': return t('codeReview.dimensions.maintainability', 'Maintainability')
      default: return dimension
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-400'
      case 'reviewing': return 'bg-yellow-900/50 text-yellow-400'
      case 'failed': return 'bg-red-900/50 text-red-400'
      case 'pending': return 'bg-gray-700 text-gray-400'
      default: return 'bg-gray-700 text-gray-400'
    }
  }

  const filteredFindings = filterDimension === 'all'
    ? findings
    : findings.filter(f => f.dimension === filterDimension)

  const dimensions = [
    { key: 'architecture', label: getDimensionLabel('architecture'), score: review?.architectureScore ?? 0 },
    { key: 'security', label: getDimensionLabel('security'), score: review?.securityScore ?? 0 },
    { key: 'performance', label: getDimensionLabel('performance'), score: review?.performanceScore ?? 0 },
    { key: 'accessibility', label: getDimensionLabel('accessibility'), score: review?.accessibilityScore ?? 0 },
    { key: 'maintainability', label: getDimensionLabel('maintainability'), score: review?.maintainabilityScore ?? 0 },
  ]

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">{t('codeReview.loading', 'Loading review data...')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">&times;</button>
        </div>
      )}

      {/* Project ID Selector & Actions */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">{t('codeReview.projectId', 'Project ID')}:</label>
          <input
            type="number"
            value={projectIdInput}
            onChange={(e) => setProjectIdInput(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-24"
            min={1}
          />
          <button
            onClick={handleLoadProject}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {t('codeReview.load', 'Load')}
          </button>
          <button
            onClick={handleTriggerReview}
            disabled={reviewing}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {reviewing ? t('codeReview.reviewing', 'Reviewing...') : t('codeReview.runReview', 'Run Review')}
          </button>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="ml-auto px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              {showHistory ? t('codeReview.hideHistory', 'Hide History') : t('codeReview.showHistory', 'Show History')} ({history.length})
            </button>
          )}
        </div>
      </div>

      {review && review.status === 'completed' && (
        <>
          {/* Overall Score Badge */}
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">{t('codeReview.overviewTitle', 'Code Quality Overview')}</h3>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(review.status)}`}>
                  {review.status}
                </span>
                <span className="text-xs text-gray-500">v{review.reviewVersion}</span>
              </div>
            </div>

            {/* Overall Score */}
            <div className="flex items-center gap-6 mb-6">
              <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${getOverallBadgeColor(review.overallScore)}`}>
                <span className="text-2xl font-bold">{review.overallScore}</span>
              </div>
              <div>
                <p className="text-sm text-gray-300">{t('codeReview.overallScore', 'Overall Score')}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">
                    {review.criticalCount} {t('codeReview.critical', 'Critical')}
                  </span>
                  <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                    {review.warningCount} {t('codeReview.warnings', 'Warnings')}
                  </span>
                  <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">
                    {review.infoCount} {t('codeReview.info', 'Info')}
                  </span>
                </div>
                {review.fixesApplied > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    {review.fixesApplied} {t('codeReview.fixesApplied', 'fixes applied')}
                  </p>
                )}
              </div>
            </div>

            {/* Dimension Score Bars */}
            <div className="space-y-3">
              {dimensions.map((dim) => (
                <div key={dim.key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-28 text-right">{dim.label}</span>
                  <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getScoreBarColor(dim.score)}`}
                      style={{ width: `${(dim.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-8 ${getScoreColor(dim.score)}`}>{dim.score}/5</span>
                </div>
              ))}
            </div>
          </div>

          {/* Findings Section */}
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">{t('codeReview.findingsTitle', 'Findings')}</h3>
              <div className="flex items-center gap-2">
                <select
                  value={filterDimension}
                  onChange={(e) => setFilterDimension(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="all">{t('codeReview.allDimensions', 'All Dimensions')}</option>
                  <option value="architecture">{getDimensionLabel('architecture')}</option>
                  <option value="security">{getDimensionLabel('security')}</option>
                  <option value="performance">{getDimensionLabel('performance')}</option>
                  <option value="accessibility">{getDimensionLabel('accessibility')}</option>
                  <option value="maintainability">{getDimensionLabel('maintainability')}</option>
                </select>
              </div>
            </div>

            {/* Bulk Fix Buttons */}
            <div className="flex items-center gap-2 mb-4">
              {review.criticalCount > 0 && (
                <button
                  onClick={() => handleApplyAllFixes('critical')}
                  disabled={applyingFix !== null}
                  className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {applyingFix === 'all-critical' ? t('codeReview.applying', 'Applying...') : t('codeReview.fixAllCritical', 'Fix All Critical')}
                </button>
              )}
              {review.warningCount > 0 && (
                <button
                  onClick={() => handleApplyAllFixes('warning')}
                  disabled={applyingFix !== null}
                  className="px-3 py-1 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {applyingFix === 'all-warning' ? t('codeReview.applying', 'Applying...') : t('codeReview.fixAllWarnings', 'Fix All Warnings')}
                </button>
              )}
              {review.infoCount > 0 && (
                <button
                  onClick={() => handleApplyAllFixes('info')}
                  disabled={applyingFix !== null}
                  className="px-3 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {applyingFix === 'all-info' ? t('codeReview.applying', 'Applying...') : t('codeReview.fixAllInfo', 'Fix All Info')}
                </button>
              )}
            </div>

            {/* Findings List */}
            {filteredFindings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                {t('codeReview.noFindings', 'No findings for this filter.')}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredFindings.map((finding) => {
                  const isFixed = appliedFixes.includes(finding.id)
                  const isDiffExpanded = expandedDiff === finding.id
                  return (
                    <div
                      key={finding.id}
                      className={`bg-gray-900 rounded-lg p-4 ${isFixed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(finding.severity)}`}>
                            {finding.severity}
                          </span>
                          <span className="text-xs text-gray-500">{getDimensionLabel(finding.dimension)}</span>
                          {finding.fixConfidence != null && (
                            <span className={`text-xs font-medium ${getConfidenceColor(finding.fixConfidence)}`}>
                              {finding.fixConfidence}% {t('codeReview.confidence', 'confidence')}
                            </span>
                          )}
                          {isFixed && (
                            <span className="text-xs text-green-400 font-medium">
                              {t('codeReview.fixed', 'Fixed')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {finding.originalCode && finding.suggestedFix && (
                            <button
                              onClick={() => setExpandedDiff(isDiffExpanded ? null : finding.id)}
                              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-medium transition-colors"
                            >
                              {isDiffExpanded ? t('codeReview.hideDiff', 'Hide Diff') : t('codeReview.viewDiff', 'View Diff')}
                            </button>
                          )}
                          {!isFixed && finding.suggestedFix && (
                            <>
                              <button
                                onClick={() => handleApplyFix(finding.id)}
                                disabled={applyingFix !== null}
                                className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {applyingFix === finding.id ? t('codeReview.applying', 'Applying...') : t('codeReview.acceptFix', 'Accept')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1">{finding.title}</h4>
                      <p className="text-xs text-gray-400 mb-2">{finding.description}</p>
                      {(finding.file || finding.line) && (
                        <p className="text-xs font-mono text-gray-500 mb-2">
                          {finding.file}{finding.line ? `:${finding.line}` : ''}
                        </p>
                      )}
                      {/* Inline diff viewer */}
                      {isDiffExpanded && finding.originalCode && finding.suggestedFix && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="bg-red-950/30 border border-red-900/40 rounded p-2">
                            <p className="text-xs text-red-400 font-medium mb-1">{t('codeReview.originalCode', 'Original')}</p>
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-48">{finding.originalCode}</pre>
                          </div>
                          <div className="bg-green-950/30 border border-green-900/40 rounded p-2">
                            <p className="text-xs text-green-400 font-medium mb-1">{t('codeReview.suggestedFix', 'Suggested Fix')}</p>
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-auto max-h-48">{finding.suggestedFix}</pre>
                          </div>
                        </div>
                      )}
                      {/* Collapsed suggested fix (when diff is not expanded) */}
                      {!isDiffExpanded && finding.suggestedFix && !finding.originalCode && (
                        <div className="bg-gray-800 rounded p-2 mt-2">
                          <p className="text-xs text-gray-500 mb-1">{t('codeReview.suggestedFix', 'Suggested Fix')}:</p>
                          <p className="text-xs text-gray-300">{finding.suggestedFix}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {review && review.status === 'reviewing' && (
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">{t('codeReview.inProgress', 'AI code review in progress...')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('codeReview.inProgressDetail', 'Analyzing architecture, security, performance, accessibility, and maintainability')}</p>
        </div>
      )}

      {review && review.status === 'failed' && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-5">
          <h4 className="text-sm font-bold text-red-400 mb-2">{t('codeReview.failedTitle', 'Review Failed')}</h4>
          <p className="text-sm text-gray-400">{t('codeReview.failedMessage', 'The code quality review could not be completed. Please try running a new review.')}</p>
        </div>
      )}

      {!review && !loading && (
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <h4 className="text-sm font-bold mb-2">{t('codeReview.noReview', 'No Review Yet')}</h4>
          <p className="text-sm text-gray-400 mb-4">
            {t('codeReview.noReviewDescription', 'Run an AI-powered code quality review to analyze architecture, security, performance, accessibility, and maintainability.')}
          </p>
          <button
            onClick={handleTriggerReview}
            disabled={reviewing}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {reviewing ? t('codeReview.reviewing', 'Reviewing...') : t('codeReview.runFirstReview', 'Run First Review')}
          </button>
        </div>
      )}

      {/* Review History */}
      {showHistory && history.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3">{t('codeReview.historyTitle', 'Review History')}</h3>
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">v{entry.reviewVersion}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                  {entry.status === 'completed' && (
                    <span className={`text-sm font-bold ${getScoreColor(entry.overallScore)}`}>
                      {entry.overallScore}/5
                    </span>
                  )}
                  {entry.status === 'completed' && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-400">{entry.criticalCount}C</span>
                      <span className="text-yellow-400">{entry.warningCount}W</span>
                      <span className="text-blue-400">{entry.infoCount}I</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
