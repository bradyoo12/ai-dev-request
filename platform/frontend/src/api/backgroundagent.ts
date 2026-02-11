import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AgentSummary {
  id: string
  agentName: string
  taskDescription: string | null
  status: string
  branchName: string | null
  agentType: string
  priority: string
  progressPercent: number
  completedSteps: number
  totalSteps: number
  elapsedSeconds: number
  estimatedRemainingSeconds: number
  pullRequestUrl: string | null
  pullRequestStatus: string | null
  startedAt: string | null
  createdAt: string
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
}

export interface AgentStep {
  name: string
  status: string
  order: number
  startedAt: string | null
  completedAt: string | null
}

export interface AgentDetail extends AgentSummary {
  filesCreated: number
  filesModified: number
  testsPassed: number
  testsFailed: number
  errorCount: number
  selfHealAttempts: number
  cpuUsagePercent: number
  memoryUsageMb: number
  tokensUsed: number
  estimatedCost: number
  logEntries: LogEntry[]
  steps: AgentStep[]
  installedPackages: string[]
  completedAt: string | null
}

export interface AgentStats {
  totalAgents: number
  activeAgents: number
  completedAgents: number
  failedAgents: number
  totalTokensUsed: number
  totalEstimatedCost: number
  totalPullRequests: number
  avgCompletionSeconds: number
}

export interface AgentType {
  type: string
  name: string
  description: string
  icon: string
}

export async function listAgents(status?: string): Promise<AgentSummary[]> {
  const params = status ? `?status=${status}` : ''
  const res = await authFetch(`${API}/api/background-agents${params}`)
  if (!res.ok) throw new Error('Failed to list agents')
  return res.json()
}

export async function getAgent(agentId: string): Promise<AgentDetail> {
  const res = await authFetch(`${API}/api/background-agents/${agentId}`)
  if (!res.ok) throw new Error('Failed to get agent details')
  return res.json()
}

export async function spawnAgent(data: {
  devRequestId: string
  agentName?: string
  taskDescription?: string
  agentType?: string
  priority?: string
}): Promise<{ agentId: string; branchName: string; status: string }> {
  const res = await authFetch(`${API}/api/background-agents/spawn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to spawn agent')
  return res.json()
}

export async function stopAgent(agentId: string): Promise<{ status: string }> {
  const res = await authFetch(`${API}/api/background-agents/${agentId}/stop`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to stop agent')
  return res.json()
}

export async function getAgentStats(): Promise<AgentStats> {
  const res = await authFetch(`${API}/api/background-agents/stats`)
  if (!res.ok) throw new Error('Failed to get agent stats')
  return res.json()
}

export async function getAgentTypes(): Promise<AgentType[]> {
  const res = await authFetch(`${API}/api/background-agents/types`)
  if (!res.ok) throw new Error('Failed to get agent types')
  return res.json()
}
