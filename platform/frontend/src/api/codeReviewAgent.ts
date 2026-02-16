import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
  }
}

// === TypeScript Interfaces ===

export interface CodeReviewAgentFinding {
  severity: 'critical' | 'warning' | 'info'
  category: 'security' | 'logic' | 'edge-case' | 'performance' | 'best-practice'
  title: string
  description: string
  line: number | null
  suggestion: string
}

export interface CodeReviewAgentResponse {
  id: string
  overallStatus: 'pass' | 'warning' | 'fail'
  score: number
  findings: CodeReviewAgentFinding[]
  fileName: string
  language: string
  reviewedAt: string
}

export interface CodeReviewAgentRequest {
  code: string
  language: string
  fileName: string
}

// === API Functions ===

export async function submitCodeReview(request: CodeReviewAgentRequest): Promise<CodeReviewAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/code-review-agent/review`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Code review failed')
  }
  return response.json()
}

export async function getCodeReview(id: string): Promise<CodeReviewAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/code-review-agent/review/${id}`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Review not found')
  }
  return response.json()
}
