import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AgentSdkSession {
  id: string
  projectName: string
  taskDescription: string
  toolCallsTotal: number
  toolCallsSucceeded: number
  subagentsSpawned: number
  skillsInvoked: number
  mcpServersConnected: number
  contextTokensUsed: number
  contextCompressions: number
  retryAttempts: number
  successRate: number
  durationMs: number
  agentModel: string
  status: string
  createdAt: string
}

export interface ToolBreakdown {
  tool: string
  calls: number
  avgDurationMs: number
  successRate: number
}

export interface SubagentDetail {
  id: number
  name: string
  model: string
  toolCalls: number
  tokensUsed: number
  durationMs: number
  status: string
}

export interface SkillDetail {
  name: string
  durationMs: number
  success: boolean
}

export interface McpDetail {
  server: string
  toolsAvailable: number
  callsMade: number
  latencyMs: number
}

export interface ExecuteResponse {
  session: AgentSdkSession
  toolBreakdown: ToolBreakdown[]
  subagentDetails: SubagentDetail[]
  skillDetails: SkillDetail[]
  mcpDetails: McpDetail[]
  agentLoop: {
    totalTurns: number
    avgTurnDurationMs: number
    contextWindowUsage: number
    compressionsSaved: number
  }
}

export interface AgentModel {
  id: string
  name: string
  description: string
  recommended: boolean
  color: string
}

export interface SdkStats {
  totalSessions: number
  avgSuccessRate?: number
  totalToolCalls?: number
  totalSubagents?: number
  totalSkills?: number
  totalMcpServers?: number
  avgDurationMs?: number
  byModel?: { model: string; count: number; avgSuccessRate: number }[]
}

export async function listSessions(): Promise<AgentSdkSession[]> {
  const res = await authFetch(`${API}/api/agent-sdk`)
  if (!res.ok) return []
  return res.json()
}

export async function execute(projectName: string, taskDescription: string, agentModel: string): Promise<ExecuteResponse> {
  const res = await authFetch(`${API}/api/agent-sdk/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, taskDescription, agentModel })
  })
  return res.json()
}

export async function deleteSession(id: string): Promise<void> {
  await authFetch(`${API}/api/agent-sdk/${id}`, { method: 'DELETE' })
}

export async function getSdkStats(): Promise<SdkStats> {
  const res = await authFetch(`${API}/api/agent-sdk/stats`)
  if (!res.ok) return { totalSessions: 0 }
  return res.json()
}

export async function getModels(): Promise<AgentModel[]> {
  const res = await fetch(`${API}/api/agent-sdk/models`)
  if (!res.ok) return []
  return res.json()
}
