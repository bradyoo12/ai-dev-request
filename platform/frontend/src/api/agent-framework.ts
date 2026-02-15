import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AgentFrameworkStatus {
  frameworkEnabled: boolean
  frameworkVersion: string
  runtimeVersion: string
  maxConcurrentAgents: number
  activeAgents: number
  defaultModel: string
  middlewarePipeline: string[]
  healthStatus: string
  features: string[]
}

export interface NativeAgent {
  id: string
  name: string
  description: string
  agentType: string
  model: string
  capabilities: string[]
  middleware: string[]
  status: string
  createdAt: string
}

export interface AgentFrameworkConfig {
  id: string
  frameworkEnabled: boolean
  maxConcurrentAgents: number
  defaultModel: string
  middlewarePipeline: string[]
  createdAt: string
  updatedAt: string
}

export interface AgentFrameworkMetrics {
  totalAgents: number
  activeAgents: number
  idleAgents: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageLatencyMs: number
  throughput: number
  frameworkEnabled: boolean
  maxConcurrentAgents: number
  middlewarePipeline: string[]
  agentsByType: Record<string, number>
  agentsByStatus: Record<string, number>
}

export interface RegisterAgentRequest {
  name: string
  description: string
  agentType: string
  model?: string
  capabilities?: string[]
  middleware?: string[]
}

export interface UpdateConfigRequest {
  frameworkEnabled?: boolean
  maxConcurrentAgents?: number
  defaultModel?: string
  middlewarePipeline?: string[]
}

export async function getFrameworkStatus(): Promise<AgentFrameworkStatus> {
  const res = await authFetch(`${API}/api/agent-framework/status`)
  if (!res.ok) throw new Error('Failed to get framework status')
  return res.json()
}

export async function listNativeAgents(): Promise<NativeAgent[]> {
  const res = await authFetch(`${API}/api/agent-framework/agents`)
  if (!res.ok) throw new Error('Failed to list native agents')
  return res.json()
}

export async function registerAgent(data: RegisterAgentRequest): Promise<NativeAgent> {
  const res = await authFetch(`${API}/api/agent-framework/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to register agent')
  return res.json()
}

export async function unregisterAgent(agentId: string): Promise<void> {
  const res = await authFetch(`${API}/api/agent-framework/agents/${agentId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to unregister agent')
}

export async function getFrameworkConfig(): Promise<AgentFrameworkConfig> {
  const res = await authFetch(`${API}/api/agent-framework/config`)
  if (!res.ok) throw new Error('Failed to get framework config')
  return res.json()
}

export async function updateFrameworkConfig(data: UpdateConfigRequest): Promise<AgentFrameworkConfig> {
  const res = await authFetch(`${API}/api/agent-framework/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update framework config')
  return res.json()
}

export async function getFrameworkMetrics(): Promise<AgentFrameworkMetrics> {
  const res = await authFetch(`${API}/api/agent-framework/metrics`)
  if (!res.ok) throw new Error('Failed to get framework metrics')
  return res.json()
}
