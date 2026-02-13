import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface AgentFinding {
  severity: string // critical, high, medium, low
  title: string
  description: string
  file?: string | null
  line?: string | null
  suggestion?: string | null
}

export interface AgentReviewResult {
  agentType: string // Security, Performance, Architecture, Testing
  status: string // pending, running, completed, failed
  riskScore: number // 0-100
  findings: AgentFinding[]
  summary: string
  completedAt?: string | null
}

export interface TestSuggestion {
  file: string
  function: string
  reason: string
  suggestedTestCases: string[]
}

export interface MultiAgentReview {
  id: string
  projectId: number
  status: string // pending, running, completed, failed
  compositeRiskScore: number // 0-100
  complexityRisk: number
  filesChangedRisk: number
  testCoverageRisk: number
  securityRisk: number
  agentResults: AgentReviewResult[]
  testSuggestions: TestSuggestion[]
  createdAt: string
  completedAt?: string | null
}

export interface MultiAgentReviewSummary {
  id: string
  projectId: number
  status: string
  compositeRiskScore: number
  createdAt: string
  completedAt?: string | null
}

export interface RiskBreakdown {
  compositeRiskScore: number
  complexityRisk: number
  filesChangedRisk: number
  testCoverageRisk: number
  securityRisk: number
}

export interface TriggerReviewRequest {
  projectId: number
  projectPath?: string | null
  projectType?: string | null
}

// === API Functions ===

export async function triggerMultiAgentReview(request: TriggerReviewRequest): Promise<MultiAgentReview> {
  const response = await fetch(`${API_BASE_URL}/api/multi-agent-review/trigger`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.triggerMultiAgentReviewFailed'))
  }
  return response.json()
}

export async function getMultiAgentReview(reviewId: string): Promise<MultiAgentReview> {
  const response = await fetch(`${API_BASE_URL}/api/multi-agent-review/${reviewId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.getMultiAgentReviewFailed'))
  }
  return response.json()
}

export async function getProjectReviews(projectId: number): Promise<MultiAgentReviewSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/multi-agent-review/project/${projectId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    return []
  }
  return response.json()
}

export async function getRiskBreakdown(reviewId: string): Promise<RiskBreakdown> {
  const response = await fetch(`${API_BASE_URL}/api/multi-agent-review/${reviewId}/risk-breakdown`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.getRiskBreakdownFailed'))
  }
  return response.json()
}

// === Helper Functions ===

export function getRiskColor(riskScore: number): string {
  if (riskScore >= 67) return 'red'
  if (riskScore >= 34) return 'yellow'
  return 'green'
}

export function getRiskLabel(riskScore: number): string {
  if (riskScore >= 67) return 'High Risk'
  if (riskScore >= 34) return 'Medium Risk'
  return 'Low Risk'
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'red'
    case 'high':
      return 'orange'
    case 'medium':
      return 'yellow'
    case 'low':
      return 'blue'
    default:
      return 'gray'
  }
}
