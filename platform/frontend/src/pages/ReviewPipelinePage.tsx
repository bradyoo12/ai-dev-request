import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getReviewPipelineConfig,
  updateReviewPipelineConfig,
  triggerPipelineReview,
  getReviewPipelineStats,
} from '../api/reviewPipeline'
import type {
  ReviewPipelineConfig,
  ReviewResult,
  ReviewPipelineStats,
  ReviewFinding,
} from '../api/reviewPipeline'

type SubTab = 'review' | 'configure' | 'stats'

const DIMENSION_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  security: { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  performance: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  accessibility: { bar: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  architecture: { bar: 'bg-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  maintainability: { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

export default function ReviewPipelinePage() {
  useTranslation()
  const [subTab, setSubTab] = useState<SubTab>('review')
  const [config, setConfig] = useState<ReviewPipelineConfig | null>(null)
  const [stats, setStats] = useState<ReviewPipelineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Review tab state
  const [projectName, setProjectName] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [configRes, statsRes] = await Promise.all([
        getReviewPipelineConfig(),
        getReviewPipelineStats(),
      ])
      setConfig(configRes)
      setStats(statsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review pipeline configuration')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfigChange(updates: Partial<ReviewPipelineConfig>) {
    try {
      const updated = await updateReviewPipelineConfig(updates)
      setConfig(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    }
  }

  async function handleRunReview() {
    if (reviewing || !projectName.trim()) return
    try {
      setReviewing(true)
      setError('')
      const result = await triggerPipelineReview(projectName.trim())
      setReviewResult(result)
      // Refresh stats after review
      const newStats = await getReviewPipelineStats()
      setStats(newStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run review')
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Code Review Pipeline</h3>
            <p className="text-sm text-gray-400">Automated multi-dimensional code quality assurance before deployment</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
        {(['review', 'configure', 'stats'] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              subTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'review' ? 'Review' : tab === 'configure' ? 'Configure' : 'Stats'}
          </button>
        ))}
      </div>

      {error && (
        <div className="glass-card p-4 border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Review Tab */}
      {subTab === 'review' && (
        <div className="space-y-6">
          {/* Project Input + Run Button */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold text-white mb-4">Run Code Review</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-warm-400 focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleRunReview()}
              />
              <button
                onClick={handleRunReview}
                disabled={reviewing || !projectName.trim()}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-blue text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {reviewing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Reviewing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    Run Review
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Review Results */}
          {reviewResult && (
            <>
              {/* Overall Score + Pass/Fail */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white">
                    Review Results: {reviewResult.projectName}
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      reviewResult.passesThreshold
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {reviewResult.passesThreshold ? 'PASSED' : 'FAILED'} (threshold: {reviewResult.qualityThreshold})
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${scoreColor(reviewResult.overallScore)}`}>
                      {reviewResult.overallScore}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Overall Score</div>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-gray-800/50">
                      <div className="text-lg font-semibold text-white">{reviewResult.findings.length}</div>
                      <div className="text-xs text-gray-400">Findings</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-800/50">
                      <div className="text-lg font-semibold text-emerald-400">{reviewResult.autoFixCount}</div>
                      <div className="text-xs text-gray-400">Auto-Fixed</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-800/50">
                      <div className="text-lg font-semibold text-blue-400">{reviewResult.testsGenerated}</div>
                      <div className="text-xs text-gray-400">Tests Generated</div>
                    </div>
                  </div>
                </div>

                {/* Dimension Score Bars */}
                <div className="space-y-3">
                  {[
                    { key: 'security', label: 'Security', score: reviewResult.securityScore },
                    { key: 'performance', label: 'Performance', score: reviewResult.performanceScore },
                    { key: 'accessibility', label: 'Accessibility', score: reviewResult.accessibilityScore },
                    { key: 'architecture', label: 'Architecture', score: reviewResult.architectureScore },
                    { key: 'maintainability', label: 'Maintainability', score: reviewResult.maintainabilityScore },
                  ].map(({ key, label, score }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className={`text-sm w-28 ${DIMENSION_COLORS[key]?.text || 'text-gray-400'}`}>{label}</span>
                      <div className="flex-1 h-3 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${DIMENSION_COLORS[key]?.bar || 'bg-gray-500'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-mono w-10 text-right ${scoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Findings List */}
              {reviewResult.findings.length > 0 && (
                <div className="glass-card p-6">
                  <h4 className="text-sm font-semibold text-white mb-4">
                    Findings ({reviewResult.findings.length})
                  </h4>
                  <div className="space-y-3">
                    {reviewResult.findings.map((finding: ReviewFinding) => (
                      <div key={finding.id} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.info
                              }`}
                            >
                              {finding.severity}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                DIMENSION_COLORS[finding.dimension]?.bg || 'bg-gray-500/10'
                              } ${DIMENSION_COLORS[finding.dimension]?.text || 'text-gray-400'}`}
                            >
                              {finding.dimension}
                            </span>
                            {finding.autoFixApplied && (
                              <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                auto-fixed
                              </span>
                            )}
                          </div>
                        </div>
                        <h5 className="text-sm font-medium text-white mb-1">{finding.title}</h5>
                        <p className="text-xs text-gray-400 mb-2">{finding.description}</p>
                        {finding.file && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span className="font-mono">{finding.file}{finding.line > 0 ? `:${finding.line}` : ''}</span>
                          </div>
                        )}
                        {finding.suggestedFix && (
                          <div className="mt-2 p-2 rounded bg-gray-900/50 border border-gray-700/30">
                            <span className="text-xs text-gray-500">Suggested fix:</span>
                            <pre className="text-xs text-gray-300 font-mono mt-1">{finding.suggestedFix}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Configure Tab */}
      {subTab === 'configure' && config && (
        <div className="space-y-6">
          {/* Dimension Toggles */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold text-white mb-4">Review Dimensions</h4>
            <div className="space-y-4">
              {[
                { key: 'securityCheckEnabled' as const, label: 'Security Check', desc: 'Scan for vulnerabilities, hardcoded secrets, and injection risks' },
                { key: 'performanceCheckEnabled' as const, label: 'Performance Check', desc: 'Detect N+1 queries, memory leaks, and slow algorithms' },
                { key: 'accessibilityCheckEnabled' as const, label: 'Accessibility Check', desc: 'Validate WCAG compliance, alt text, and keyboard navigation' },
                { key: 'architectureCheckEnabled' as const, label: 'Architecture Check', desc: 'Verify design patterns, dependency structure, and module boundaries' },
                { key: 'maintainabilityCheckEnabled' as const, label: 'Maintainability Check', desc: 'Analyze code complexity, duplication, and type safety' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                  <button
                    onClick={() => handleConfigChange({ [key]: !config[key] })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      config[key] ? 'bg-warm-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        config[key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-Fix + Test Generation */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold text-white mb-4">Automation</h4>
            <div className="space-y-4">
              {[
                { key: 'autoFixEnabled' as const, label: 'Auto-Fix Common Issues', desc: 'Automatically apply safe fixes for non-critical issues' },
                { key: 'testGenerationEnabled' as const, label: 'Auto Test Generation', desc: 'Generate test files for every reviewed file' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                  <button
                    onClick={() => handleConfigChange({ [key]: !config[key] })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      config[key] ? 'bg-warm-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        config[key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Threshold Slider */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold text-white mb-4">Quality Threshold</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Minimum score to pass review</span>
                <span className={`text-lg font-bold ${scoreColor(config.qualityThreshold)}`}>
                  {config.qualityThreshold}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={config.qualityThreshold}
                onChange={(e) => handleConfigChange({ qualityThreshold: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-700 accent-warm-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 (Lenient)</span>
                <span>50</span>
                <span>100 (Strict)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {subTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Reviews', value: stats.totalReviews, color: 'text-white' },
              { label: 'Avg Quality Score', value: stats.avgQualityScore.toFixed(1), color: scoreColor(stats.avgQualityScore) },
              { label: 'Pass Rate', value: `${stats.passRate}%`, color: stats.passRate >= 70 ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'Auto-Fixes Applied', value: stats.totalAutoFixes, color: 'text-emerald-400' },
              { label: 'Tests Generated', value: stats.totalTestsGenerated, color: 'text-blue-400' },
              { label: 'Quality Threshold', value: stats.qualityThreshold, color: 'text-warm-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-4">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Recent Review History */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold text-white mb-4">Recent Reviews</h4>
            {stats.recentReviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet. Run your first code review to see history.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentReviews.map((entry) => (
                  <div key={entry.reviewId} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          entry.passedThreshold ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium text-white">{entry.projectName}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(entry.reviewedAt).toLocaleDateString()} - {entry.findingsCount} findings, {entry.autoFixCount} fixes
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${scoreColor(entry.overallScore)}`}>
                      {entry.overallScore}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
