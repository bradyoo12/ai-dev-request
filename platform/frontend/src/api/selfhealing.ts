import { getAuthHeaders } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface SelfHealingRun {
  id: string
  userId: string
  projectName: string
  testCommand: string
  browserType: string
  status: string
  currentAttempt: number
  maxAttempts: number
  errorsJson: string
  fixesJson: string
  testDurationMs: number
  healingDurationMs: number
  totalDurationMs: number
  testsPassed: number
  testsFailed: number
  testsTotal: number
  finalResult: string
  devRequestId: number | null
  createdAt: string
  updatedAt: string
}

export interface BrowserInfo {
  id: string
  name: string
  description: string
  color: string
}

export interface SelfHealingStats {
  totalRuns: number
  passRate: number
  healRate: number
  avgAttempts: number
  avgTestDurationMs: number
  avgHealingDurationMs: number
  totalTestsPassed: number
  totalTestsFailed: number
  byBrowser: { browser: string; count: number; passRate: number }[]
  byResult: { result: string; count: number }[]
}

export async function listHealingRuns(status?: string): Promise<SelfHealingRun[]> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  const res = await fetch(`${API}/api/self-healing/runs?${params}`, { headers: getAuthHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function startHealingRun(req: {
  projectName?: string
  testCommand?: string
  browserType?: string
  maxAttempts?: number
  devRequestId?: number
}): Promise<SelfHealingRun> {
  const res = await fetch(`${API}/api/self-healing/runs`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return res.json()
}

export async function retryHealingRun(id: string): Promise<SelfHealingRun> {
  const res = await fetch(`${API}/api/self-healing/runs/${id}/retry`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return res.json()
}

export async function getHealingStats(): Promise<SelfHealingStats> {
  const res = await fetch(`${API}/api/self-healing/stats`, { headers: getAuthHeaders() })
  return res.json()
}

export async function getBrowsers(): Promise<BrowserInfo[]> {
  const res = await fetch(`${API}/api/self-healing/browsers`)
  if (!res.ok) return []
  return res.json()
}
