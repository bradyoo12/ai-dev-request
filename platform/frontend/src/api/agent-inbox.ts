import { authFetch } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface AgentInboxItem {
  id: string
  userId: string
  devRequestId: string | null
  type: string
  content: string
  title: string | null
  status: string
  source: string
  submitterEmail: string | null
  submitterName: string | null
  aiResponseJson: string | null
  triggeredDevRequestId: string | null
  createdAt: string
  updatedAt: string
}

export interface AgentInboxListResponse {
  items: AgentInboxItem[]
  total: number
  page: number
  pageSize: number
}

export async function getAgentInboxItems(
  page = 1,
  pageSize = 20,
  status?: string,
  type?: string,
  devRequestId?: string
): Promise<AgentInboxListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status && status !== 'all') params.set('status', status)
  if (type && type !== 'all') params.set('type', type)
  if (devRequestId) params.set('devRequestId', devRequestId)

  const res = await authFetch(`${API_BASE_URL}/api/agent-inbox?${params}`)
  if (!res.ok) throw new Error('Failed to load inbox items')
  return res.json()
}

export async function getAgentInboxItem(id: string): Promise<AgentInboxItem> {
  const res = await authFetch(`${API_BASE_URL}/api/agent-inbox/${id}`)
  if (!res.ok) throw new Error('Failed to load inbox item')
  return res.json()
}

export async function createAgentInboxItem(body: {
  userId: string
  devRequestId?: string
  type?: string
  content: string
  title?: string
  source?: string
  submitterEmail?: string
  submitterName?: string
}): Promise<{ id: string; type: string; status: string; createdAt: string }> {
  const res = await fetch(`${API_BASE_URL}/api/agent-inbox`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to create inbox item')
  return res.json()
}

export async function updateAgentInboxStatus(
  id: string,
  status: string
): Promise<{ id: string; status: string; previousStatus: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/agent-inbox/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}

export async function implementAgentInboxItem(
  id: string
): Promise<{ id: string; devRequestId: string; status: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/agent-inbox/${id}/implement`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to implement item')
  return res.json()
}

export async function deleteAgentInboxItem(
  id: string
): Promise<{ deleted: boolean; id: string }> {
  const res = await authFetch(`${API_BASE_URL}/api/agent-inbox/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete inbox item')
  return res.json()
}
