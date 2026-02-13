import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface BrowserIdeSession {
  id: string
  projectName: string
  runtime: string
  code: string
  linesOfCode: number
  packagesInstalled: number
  executionTimeMs: number
  hasErrors: boolean
  errorCount: number
  consoleOutputLines: number
  livePreviewEnabled: boolean
  sharedLink: boolean
  shareId: string
  forkCount: number
  memoryUsageMb: number
  status: string
  createdAt: string
}

export interface ExecuteResponse {
  session: BrowserIdeSession
  consoleOutput: string[]
  livePreviewUrl: string | null
  executionTimeMs: number
  memoryUsageMb: number
}

export interface IdeRuntime {
  id: string
  name: string
  description: string
  icon: string
  extensions: string[]
  color: string
}

export interface IdeStats {
  totalSessions: number
  avgExecutionTimeMs: number
  avgLinesOfCode: number
  avgMemoryUsageMb: number
  errorRate: number
  totalShared: number
  byRuntime: { runtime: string; count: number; avgExecutionTimeMs: number; errorRate: number }[]
}

export async function listSessions(): Promise<BrowserIdeSession[]> {
  const res = await authFetch(`${API}/api/browser-ide`)
  if (!res.ok) throw new Error('Failed to list sessions')
  return res.json()
}

export async function executeCode(projectName: string, code: string, runtime: string): Promise<ExecuteResponse> {
  const res = await authFetch(`${API}/api/browser-ide/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, code, runtime }),
  })
  if (!res.ok) throw new Error('Failed to execute code')
  return res.json()
}

export async function deleteSession(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/browser-ide/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete session')
}

export async function getIdeStats(): Promise<IdeStats> {
  const res = await authFetch(`${API}/api/browser-ide/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getRuntimes(): Promise<IdeRuntime[]> {
  const res = await fetch(`${API}/api/browser-ide/runtimes`)
  if (!res.ok) throw new Error('Failed to get runtimes')
  return res.json()
}
