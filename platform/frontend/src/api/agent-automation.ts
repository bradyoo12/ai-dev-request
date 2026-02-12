import i18n from '../i18n'
import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface AgentTask {
  id: string
  issueNumber: number
  issueTitle: string
  status: 'queued' | 'analyzing' | 'implementing' | 'testing' | 'pr_created' | 'failed'
  prNumber?: number
  prUrl?: string
  startedAt: string
  completedAt?: string
  error?: string
}

export interface AgentAutomationConfig {
  enabled: boolean
  triggerLabels: string[]
  maxConcurrent: number
  autoMerge: boolean
  webhookSecret?: string
}

export async function getAgentConfig(): Promise<AgentAutomationConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/agent-automation/config`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.agentAutomationConfigLoad'))
  }
  return response.json()
}

export async function updateAgentConfig(config: Partial<AgentAutomationConfig>): Promise<AgentAutomationConfig> {
  const response = await authFetch(`${API_BASE_URL}/api/agent-automation/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.agentAutomationConfigUpdate'))
  }
  return response.json()
}

export async function getAgentTasks(page?: number): Promise<AgentTask[]> {
  const params = page ? `?page=${page}` : ''
  const response = await authFetch(`${API_BASE_URL}/api/agent-automation/tasks${params}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.agentAutomationTasksLoad'))
  }
  return response.json()
}

export async function retryAgentTask(taskId: string): Promise<AgentTask> {
  const response = await authFetch(`${API_BASE_URL}/api/agent-automation/tasks/${taskId}/retry`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.agentAutomationRetry'))
  }
  return response.json()
}
