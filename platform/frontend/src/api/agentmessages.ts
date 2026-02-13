import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface AgentMessage {
  id: number
  projectName: string
  messageType: string
  fromAgent: string
  toAgent: string
  payload: string
  priority: string
  deliveryStatus: string
  latencyMs: number
  requiresAck: boolean
  acknowledged: boolean
  correlationId: string
  retryCount: number
  status: string
  createdAt: string
}

export interface SendResponse {
  id: number
  messageType: string
  fromAgent: string
  toAgent: string
  priority: string
  deliveryStatus: string
  latencyMs: number
  requiresAck: boolean
  acknowledged: boolean
  correlationId: string
  payload: Record<string, unknown>
  recommendation: string
}

export interface Protocol {
  id: string
  name: string
  description: string
  fields: string[]
  requiresAck: boolean
}

export interface MessageStats {
  total: number
  byType: { type: string; count: number; avgLatency: number }[]
}

export async function listMessages(): Promise<AgentMessage[]> {
  const res = await authFetch(`${API}/api/agent-messages`)
  if (!res.ok) return []
  return res.json()
}

export async function sendMessage(projectName: string, messageType: string, fromAgent: string, toAgent: string, content: string, priority: string): Promise<SendResponse> {
  const res = await authFetch(`${API}/api/agent-messages/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, messageType, fromAgent, toAgent, content, priority })
  })
  return res.json()
}

export async function deleteMessage(id: number): Promise<void> {
  await authFetch(`${API}/api/agent-messages/${id}`, { method: 'DELETE' })
}

export async function getMessageStats(): Promise<MessageStats> {
  const res = await authFetch(`${API}/api/agent-messages/stats`)
  if (!res.ok) return { total: 0, byType: [] }
  return res.json()
}

export async function getProtocols(): Promise<Protocol[]> {
  const res = await fetch(`${API}/api/agent-messages/protocols`)
  if (!res.ok) return []
  return res.json()
}
