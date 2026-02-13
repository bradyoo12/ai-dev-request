import { getAuthHeaders } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface OrgMemory {
  id: string
  userId: string
  scope: string
  category: string
  title: string
  content: string
  sourceProject: string
  relevance: number
  usageCount: number
  tagsJson: string
  embeddingStatus: string
  devRequestId: number | null
  createdAt: string
  updatedAt: string
}

export interface MemoryCategory {
  id: string
  name: string
  description: string
  color: string
}

export interface OrgMemoryStats {
  totalMemories: number
  userMemories: number
  orgMemories: number
  indexedCount: number
  avgRelevance: number
  totalUsages: number
  byCategory: { category: string; count: number; avgRelevance: number }[]
  byScope: { scope: string; count: number }[]
}

export async function listMemories(scope?: string, category?: string): Promise<OrgMemory[]> {
  const params = new URLSearchParams()
  if (scope) params.set('scope', scope)
  if (category) params.set('category', category)
  const res = await fetch(`${API}/api/org-memory/memories?${params}`, { headers: getAuthHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function createMemory(req: {
  title?: string
  content?: string
  scope?: string
  category?: string
  sourceProject?: string
  tags?: string[]
}): Promise<OrgMemory> {
  const res = await fetch(`${API}/api/org-memory/memories`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return res.json()
}

export async function deleteMemory(id: string): Promise<void> {
  await fetch(`${API}/api/org-memory/memories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
}

export async function searchMemories(query: string, scope?: string): Promise<OrgMemory[]> {
  const res = await fetch(`${API}/api/org-memory/search`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, scope }),
  })
  if (!res.ok) return []
  return res.json()
}

export async function getMemoryStats(): Promise<OrgMemoryStats> {
  const res = await fetch(`${API}/api/org-memory/stats`, { headers: getAuthHeaders() })
  return res.json()
}

export async function getCategories(): Promise<MemoryCategory[]> {
  const res = await fetch(`${API}/api/org-memory/categories`)
  if (!res.ok) return []
  return res.json()
}
