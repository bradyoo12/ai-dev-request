import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ReplTestSession {
  id: string
  userId: string
  projectName: string
  testMode: string
  runtime: string
  totalTests: number
  passedTests: number
  failedTests: number
  potemkinDetections: number
  dbStateChecks: number
  logsCaptured: number
  avgLatencyMs: number
  speedupFactor: number
  costReduction: number
  status: string
  resultSummary: string
  createdAt: string
  updatedAt: string
}

export interface TestResult {
  id: string
  name: string
  status: string
  latencyMs: number
  potemkin: boolean
  logSnippet: string
  dbVerified: boolean
}

export interface RunTestResponse {
  session: ReplTestSession
  results: TestResult[]
  comparison: {
    replLatencyMs: number
    browserLatencyMs: number
    replCost: number
    browserCost: number
  }
}

export interface ReplRuntime {
  id: string
  name: string
  description: string
  color: string
}

export interface ReplStats {
  totalSessions: number
  totalTests: number
  passRate: number
  avgSpeedup: number
  avgCostReduction: number
  potemkinDetected: number
  byMode: { mode: string; count: number; tests: number }[]
  byRuntime: { runtime: string; count: number }[]
}

export async function listSessions(): Promise<ReplTestSession[]> {
  const res = await authFetch(`${API}/api/repl-test`)
  if (!res.ok) throw new Error('Failed to list sessions')
  return res.json()
}

export async function runTests(projectName: string, testMode?: string, runtime?: string): Promise<RunTestResponse> {
  const res = await authFetch(`${API}/api/repl-test/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, testMode, runtime }),
  })
  if (!res.ok) throw new Error('Failed to run tests')
  return res.json()
}

export async function deleteSession(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/repl-test/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete session')
}

export async function getReplStats(): Promise<ReplStats> {
  const res = await authFetch(`${API}/api/repl-test/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getRuntimes(): Promise<ReplRuntime[]> {
  const res = await fetch(`${API}/api/repl-test/runtimes`)
  if (!res.ok) throw new Error('Failed to get runtimes')
  return res.json()
}
