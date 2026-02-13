import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface TerminalExecution {
  id: string
  projectName: string
  command: string
  category: string
  autoApproved: boolean
  blocked: boolean
  blockReason: string | null
  exitCode: number
  outputLines: number
  durationMs: number
  securityLevel: string
  status: string
  createdAt: string
}

export interface ExecuteResponse {
  execution: TerminalExecution
  output: string | null
  policyMatch: { matched: boolean; list: string; pattern: string | null }
}

export interface PolicyInfo {
  allowList: { pattern: string; category: string }[]
  denyList: { pattern: string; severity: string }[]
  securityLevels: { id: string; name: string; description: string; color: string }[]
}

export interface TerminalStats {
  totalExecutions: number
  autoApproved?: number
  blocked?: number
  successRate?: number
  avgDurationMs?: number
  byCategory?: { category: string; count: number; autoApproved: number }[]
}

export async function listExecutions(): Promise<TerminalExecution[]> {
  const res = await authFetch(`${API}/api/terminal-execution`)
  if (!res.ok) return []
  return res.json()
}

export async function executeCommand(projectName: string, command: string, securityLevel: string): Promise<ExecuteResponse> {
  const res = await authFetch(`${API}/api/terminal-execution/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, command, securityLevel })
  })
  return res.json()
}

export async function deleteExecution(id: string): Promise<void> {
  await authFetch(`${API}/api/terminal-execution/${id}`, { method: 'DELETE' })
}

export async function getTerminalStats(): Promise<TerminalStats> {
  const res = await authFetch(`${API}/api/terminal-execution/stats`)
  if (!res.ok) return { totalExecutions: 0 }
  return res.json()
}

export async function getPolicies(): Promise<PolicyInfo> {
  const res = await fetch(`${API}/api/terminal-execution/policies`)
  if (!res.ok) return { allowList: [], denyList: [], securityLevels: [] }
  return res.json()
}
