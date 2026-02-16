import { getAuthHeaders } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === TypeScript Interfaces ===

export interface AutonomousTestExecution {
  id: string
  userId: string
  devRequestId: string
  previewDeploymentId: string
  projectName?: string | null
  targetUrl?: string | null
  browserType: string
  status: string // pending, running, completed, failed, error, cancelled
  maxIterations: number
  currentIteration: number
  testsPassed: boolean
  finalTestResult?: string | null
  screenshotsJson?: string | null
  issuesFoundJson?: string | null
  fixesAppliedJson?: string | null
  visionAnalysisCount: number
  issuesDetected: number
  issuesFixed: number
  totalDurationMs: number
  createdAt: string
  updatedAt: string
  completedAt?: string | null
}

export interface StartTestRequest {
  targetUrl: string
  projectName?: string
  browserType?: string
  maxIterations?: number
}

export interface BrowserTestSession {
  id: string
  executionId: string
  iterationNumber: number
  pageUrl?: string | null
  status: string
  issuesFound: number
  issuesResolved: number
  confidenceScore: number
  durationMs: number
  issuesJson?: string | null
  fixesJson?: string | null
  createdAt: string
  completedAt?: string | null
}

export interface BrowserInfo {
  id: string
  name: string
  color: string
}

// === API Functions ===

export async function startBrowserTest(request: StartTestRequest): Promise<AutonomousTestExecution> {
  const response = await fetch(`${API_URL}/api/autonomous-testing/start`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to start browser test')
  }
  return response.json()
}

export async function getExecution(id: string): Promise<AutonomousTestExecution | null> {
  const response = await fetch(`${API_URL}/api/autonomous-testing/${id}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function cancelExecution(id: string): Promise<AutonomousTestExecution> {
  const response = await fetch(`${API_URL}/api/autonomous-testing/${id}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to cancel execution')
  }
  return response.json()
}

export async function getSessions(executionId: string): Promise<BrowserTestSession[]> {
  const response = await fetch(`${API_URL}/api/autonomous-testing/${executionId}/sessions`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getExecutionHistory(limit: number = 20): Promise<AutonomousTestExecution[]> {
  const response = await fetch(`${API_URL}/api/autonomous-testing/history?limit=${limit}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getBrowsers(): Promise<BrowserInfo[]> {
  const response = await fetch(`${API_URL}/api/autonomous-testing/browsers`)
  if (!response.ok) return []
  return response.json()
}
