import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import RiskScoreBadge from './RiskScoreBadge'
import type { MultiAgentReview, AgentReviewResult } from '../api/multi-agent-review'
import { getSeverityColor } from '../api/multi-agent-review'

interface ReviewDashboardProps {
  review: MultiAgentReview
}

export default function ReviewDashboard({ review }: ReviewDashboardProps) {
  const { t } = useTranslation()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set())

  const agentIcons: Record<string, string> = {
    Security: '🛡️',
    Performance: '⚡',
    Architecture: '🏗️',
    Testing: '🧪',
  }

  const toggleTestExpand = (index: number) => {
    const newExpanded = new Set(expandedTests)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedTests(newExpanded)
  }

  const filteredAgent = selectedAgent
    ? review.agentResults.find((a) => a.agentType === selectedAgent)
    : null

  return (
    <div className="space-y-6">
      {/* Risk Score Section */}
      <div>
        <h3 className="text-xl font-semibold text-warm-100 mb-4">
          {t('reviewDashboard.riskScore', 'Risk Assessment')}
        </h3>
        <RiskScoreBadge
          riskScore={review.compositeRiskScore}
          breakdown={{
            compositeRiskScore: review.compositeRiskScore,
            complexityRisk: review.complexityRisk,
            filesChangedRisk: review.filesChangedRisk,
            testCoverageRisk: review.testCoverageRisk,
            securityRisk: review.securityRisk,
          }}
          size="lg"
        />
      </div>

      {/* Agent Results Section */}
      <div>
        <h3 className="text-xl font-semibold text-warm-100 mb-4">
          {t('reviewDashboard.agentResults', 'Agent Review Results')}
        </h3>

        {/* Agent Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedAgent(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedAgent === null
                ? 'bg-blue-500 text-white'
                : 'bg-warm-800 text-warm-300 hover:bg-warm-700'
            }`}
          >
            {t('reviewDashboard.allAgents', 'All Agents')}
          </button>
          {review.agentResults.map((agent) => (
            <button
              key={agent.agentType}
              onClick={() => setSelectedAgent(agent.agentType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedAgent === agent.agentType
                  ? 'bg-blue-500 text-white'
                  : 'bg-warm-800 text-warm-300 hover:bg-warm-700'
              }`}
            >
              <span className="mr-2">{agentIcons[agent.agentType] || '🤖'}</span>
              {agent.agentType}
            </button>
          ))}
        </div>

        {/* Agent Cards */}
        <div className="space-y-4">
          {(filteredAgent ? [filteredAgent] : review.agentResults).map((agent) => (
            <AgentCard key={agent.agentType} agent={agent} icon={agentIcons[agent.agentType]} />
          ))}
        </div>
      </div>

      {/* Test Suggestions Section */}
      {review.testSuggestions.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-warm-100 mb-4">
            {t('reviewDashboard.testSuggestions', 'Missing Test Coverage')}
          </h3>
          <div className="space-y-3">
            {review.testSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-warm-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-blue-400">{suggestion.file}</span>
                      <span className="text-xs text-warm-400">→</span>
                      <span className="text-sm font-semibold text-warm-200">{suggestion.function}</span>
                    </div>
                    <p className="text-sm text-warm-400 mb-3">{suggestion.reason}</p>
                  </div>
                  <button
                    onClick={() => toggleTestExpand(index)}
                    className="ml-4 px-3 py-1 text-xs bg-warm-700 hover:bg-warm-600 text-warm-200 rounded transition-colors"
                  >
                    {expandedTests.has(index)
                      ? t('reviewDashboard.hideTests', 'Hide')
                      : t('reviewDashboard.showTests', 'Show Tests')}
                  </button>
                </div>

                {expandedTests.has(index) && (
                  <div className="mt-3 pt-3 border-t border-warm-700">
                    <p className="text-xs font-semibold text-warm-300 mb-2">
                      {t('reviewDashboard.suggestedTests', 'Suggested Test Cases')}:
                    </p>
                    <ul className="space-y-1">
                      {suggestion.suggestedTestCases.map((testCase, tcIndex) => (
                        <li key={tcIndex} className="text-sm text-warm-400 flex items-start gap-2">
                          <span className="text-green-400 mt-1">✓</span>
                          <span>{testCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Status */}
      <div className="text-center text-xs text-warm-500">
        {t('reviewDashboard.reviewedAt', 'Reviewed at')}{' '}
        {new Date(review.createdAt).toLocaleString()}
        {review.completedAt && (
          <>
            {' • '}
            {t('reviewDashboard.completedAt', 'Completed at')}{' '}
            {new Date(review.completedAt).toLocaleString()}
          </>
        )}
      </div>
    </div>
  )
}

interface AgentCardProps {
  agent: AgentReviewResult
  icon?: string
}

function AgentCard({ agent, icon }: AgentCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const getRiskColor = (risk: number) => {
    if (risk >= 67) return 'text-red-400'
    if (risk >= 34) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getSeverityBadgeClass = (severity: string) => {
    const color = getSeverityColor(severity)
    const colorMap: Record<string, string> = {
      red: 'bg-red-500/20 text-red-400 border-red-500',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500',
      gray: 'bg-gray-500/20 text-gray-400 border-gray-500',
    }
    return colorMap[color] || colorMap.gray
  }

  const groupedFindings = agent.findings.reduce((acc, finding) => {
    if (!acc[finding.severity]) acc[finding.severity] = []
    acc[finding.severity].push(finding)
    return acc
  }, {} as Record<string, typeof agent.findings>)

  return (
    <div className="bg-warm-800 rounded-lg p-5">
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <h4 className="text-lg font-semibold text-warm-100">{agent.agentType}</h4>
            <p className="text-sm text-warm-400">{agent.summary}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getRiskColor(agent.riskScore)}`}>
            {agent.riskScore}
          </div>
          <p className="text-xs text-warm-500">{t('reviewDashboard.riskScore', 'Risk Score')}</p>
        </div>
      </div>

      {/* Findings Summary */}
      {agent.findings.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-warm-400">
              {agent.findings.length} {t('reviewDashboard.findingsCount', 'findings')}
            </span>
            {Object.entries(groupedFindings).map(([severity, findings]) => (
              <span
                key={severity}
                className={`px-2 py-1 text-xs rounded border ${getSeverityBadgeClass(severity)}`}
              >
                {findings.length} {severity}
              </span>
            ))}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 text-sm bg-warm-700 hover:bg-warm-600 text-warm-200 rounded transition-colors"
          >
            {expanded
              ? t('reviewDashboard.hideFindings', 'Hide Findings')
              : t('reviewDashboard.showFindings', 'Show Findings')}
          </button>

          {expanded && (
            <div className="mt-4 space-y-3">
              {agent.findings.map((finding, index) => (
                <div key={index} className="bg-warm-900 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-warm-100">{finding.title}</h5>
                    <span className={`px-2 py-1 text-xs rounded border ${getSeverityBadgeClass(finding.severity)}`}>
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-sm text-warm-400 mb-2">{finding.description}</p>
                  {finding.file && (
                    <div className="flex items-center gap-2 text-xs text-warm-500 mb-2">
                      <span className="font-mono">{finding.file}</span>
                      {finding.line && (
                        <>
                          <span>:</span>
                          <span>{finding.line}</span>
                        </>
                      )}
                    </div>
                  )}
                  {finding.suggestion && (
                    <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                      <p className="text-xs font-semibold text-blue-400 mb-1">
                        {t('reviewDashboard.suggestion', 'Suggestion')}:
                      </p>
                      <p className="text-sm text-warm-300">{finding.suggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {agent.findings.length === 0 && (
        <div className="text-center py-4 text-sm text-green-400">
          {t('reviewDashboard.noFindings', 'No issues found')} ✓
        </div>
      )}
    </div>
  )
}
