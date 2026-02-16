import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CodeReviewAgentResponse, CodeReviewAgentFinding } from '../api/codeReviewAgent'

interface CodeReviewPanelProps {
  review: CodeReviewAgentResponse
}

export default function CodeReviewPanel({ review }: CodeReviewPanelProps) {
  const { t } = useTranslation()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-900/50 text-green-400 border-green-700'
      case 'warning': return 'bg-yellow-900/50 text-yellow-400 border-yellow-700'
      case 'fail': return 'bg-red-900/50 text-red-400 border-red-700'
      default: return 'bg-warm-700 text-warm-400 border-warm-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pass': return t('codeReviewAgent.status.pass')
      case 'warning': return t('codeReviewAgent.status.warning')
      case 'fail': return t('codeReviewAgent.status.fail')
      default: return status
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return 'border-green-500'
    if (score >= 50) return 'border-yellow-500'
    return 'border-red-500'
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900/50 text-red-400'
      case 'warning': return 'bg-yellow-900/50 text-yellow-400'
      case 'info': return 'bg-blue-900/50 text-blue-400'
      default: return 'bg-warm-700 text-warm-400'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '\u26D4'
      case 'warning': return '\u26A0\uFE0F'
      case 'info': return '\u2139\uFE0F'
      default: return '\u2022'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return t('codeReviewAgent.severity.critical')
      case 'warning': return t('codeReviewAgent.severity.warning')
      case 'info': return t('codeReviewAgent.severity.info')
      default: return severity
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'security': return 'bg-purple-900/50 text-purple-400'
      case 'logic': return 'bg-orange-900/50 text-orange-400'
      case 'edge-case': return 'bg-cyan-900/50 text-cyan-400'
      case 'performance': return 'bg-indigo-900/50 text-indigo-400'
      case 'best-practice': return 'bg-emerald-900/50 text-emerald-400'
      default: return 'bg-warm-700 text-warm-400'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'security': return t('codeReviewAgent.category.security')
      case 'logic': return t('codeReviewAgent.category.logic')
      case 'edge-case': return t('codeReviewAgent.category.edgeCase')
      case 'performance': return t('codeReviewAgent.category.performance')
      case 'best-practice': return t('codeReviewAgent.category.bestPractice')
      default: return category
    }
  }

  // Group findings by severity
  const criticalFindings = review.findings.filter(f => f.severity === 'critical')
  const warningFindings = review.findings.filter(f => f.severity === 'warning')
  const infoFindings = review.findings.filter(f => f.severity === 'info')

  const renderFinding = (finding: CodeReviewAgentFinding, index: number) => {
    const isExpanded = expandedIndex === index
    return (
      <div
        key={index}
        className="bg-warm-900 rounded-lg overflow-hidden"
      >
        <button
          onClick={() => setExpandedIndex(isExpanded ? null : index)}
          className="w-full text-left p-4 hover:bg-warm-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{getSeverityIcon(finding.severity)}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(finding.severity)}`}>
              {getSeverityLabel(finding.severity)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryBadge(finding.category)}`}>
              {getCategoryLabel(finding.category)}
            </span>
            <span className="text-sm font-medium text-white flex-1">{finding.title}</span>
            {finding.line && (
              <span className="text-xs font-mono text-warm-500">L{finding.line}</span>
            )}
            <span className={`text-xs text-warm-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              &#9660;
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-sm text-warm-300">{finding.description}</p>
            {finding.suggestion && (
              <div className="bg-warm-800 rounded-lg p-3">
                <p className="text-xs font-medium text-warm-400 mb-1">{t('codeReviewAgent.suggestion')}</p>
                <p className="text-sm text-warm-200">{finding.suggestion}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderFindingGroup = (label: string, findings: CodeReviewAgentFinding[], startIndex: number) => {
    if (findings.length === 0) return null
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wider">{label} ({findings.length})</h4>
        {findings.map((finding, i) => renderFinding(finding, startIndex + i))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-warm-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">{t('codeReviewAgent.overallStatus')}</h3>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(review.overallStatus)}`}>
            {getStatusLabel(review.overallStatus)}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Score circle */}
          <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${getScoreRingColor(review.score)}`}>
            <span className={`text-2xl font-bold ${getScoreColor(review.score)}`}>{review.score}</span>
          </div>

          <div className="flex-1">
            <p className="text-sm text-warm-300 mb-2">{t('codeReviewAgent.score')}</p>
            <div className="flex items-center gap-3">
              {criticalFindings.length > 0 && (
                <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">
                  {criticalFindings.length} {t('codeReviewAgent.severity.critical')}
                </span>
              )}
              {warningFindings.length > 0 && (
                <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                  {warningFindings.length} {t('codeReviewAgent.severity.warning')}
                </span>
              )}
              {infoFindings.length > 0 && (
                <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">
                  {infoFindings.length} {t('codeReviewAgent.severity.info')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <div className="h-2 bg-warm-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                review.score >= 80 ? 'bg-green-500' : review.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${review.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Findings */}
      <div className="bg-warm-800 rounded-xl p-5">
        <h3 className="text-sm font-bold mb-4">{t('codeReviewAgent.findings')}</h3>

        {review.findings.length === 0 ? (
          <p className="text-sm text-warm-500 text-center py-6">{t('codeReviewAgent.noFindings')}</p>
        ) : (
          <div className="space-y-4">
            {renderFindingGroup(t('codeReviewAgent.severity.critical'), criticalFindings, 0)}
            {renderFindingGroup(t('codeReviewAgent.severity.warning'), warningFindings, criticalFindings.length)}
            {renderFindingGroup(
              t('codeReviewAgent.severity.info'),
              infoFindings,
              criticalFindings.length + warningFindings.length,
            )}
          </div>
        )}
      </div>
    </div>
  )
}
