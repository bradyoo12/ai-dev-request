import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AgentTerminalSession {
  id: string
  userId: string
  projectName: string
  accessMode: string
  sandboxType: string
  commandsExecuted: number
  browserActions: number
  subagentsDelegated: number
  filesModified: number
  cpuLimitPercent: number
  memoryLimitMb: number
  timeoutMinutes: number
  networkEgressAllowed: boolean
  sessionDurationMs: number
  status: string
  outputLog: string
  createdAt: string
  updatedAt: string
}

export interface CommandResult {
  command: string
  exitCode: number
  output: string
  durationMs: number
}

export interface BrowserResult {
  action: string
  url: string
  screenshot: boolean
  consoleErrors: number
}

export interface ExecuteResponse {
  session: AgentTerminalSession
  commandResults: CommandResult[]
  browserResults: BrowserResult[] | null
}

export interface SandboxType {
  id: string
  name: string
  description: string
  color: string
}

export interface TerminalStats {
  totalSessions: number
  totalCommands: number
  totalBrowserActions: number
  totalSubagents: number
  avgDuration: number
  byMode: { mode: string; count: number; commands: number }[]
  bySandbox: { sandbox: string; count: number }[]
}

export async function listSessions(): Promise<AgentTerminalSession[]> {
  const res = await authFetch(`${API}/api/agent-terminal`)
  if (!res.ok) throw new Error('Failed to list sessions')
  return res.json()
}

export async function executeCommand(projectName: string, command?: string, accessMode?: string, sandboxType?: string): Promise<ExecuteResponse> {
  const res = await authFetch(`${API}/api/agent-terminal/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, command, accessMode, sandboxType }),
  })
  if (!res.ok) throw new Error('Failed to execute command')
  return res.json()
}

export async function deleteSession(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/agent-terminal/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete session')
}

export async function getTerminalStats(): Promise<TerminalStats> {
  const res = await authFetch(`${API}/api/agent-terminal/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getSandboxTypes(): Promise<SandboxType[]> {
  const res = await fetch(`${API}/api/agent-terminal/sandboxes`)
  if (!res.ok) throw new Error('Failed to get sandbox types')
  return res.json()
}
