import { authFetch } from './auth'

export interface ProjectMemory {
  id: string
  userId: string
  projectName: string
  memoryType: string
  category: string
  content: string
  summary: string
  sourceType: string
  sourceRef: string
  confidence: number
  reinforcements: number
  contradictions: number
  isActive: boolean
  tagsJson: string
  embeddingJson: string
  lastAppliedAt: string
  createdAt: string
  updatedAt: string
}

export interface MemoryStats {
  totalMemories: number
  activeMemories: number
  avgConfidence: number
  totalReinforcements: number
  totalContradictions: number
  byCategory: { category: string; count: number; avgConfidence: number }[]
  byType: { type: string; count: number }[]
  recentMemories: { summary: string; category: string; confidence: number; reinforcements: number; updatedAt: string }[]
}

export async function listMemories(project?: string, category?: string): Promise<ProjectMemory[]> {
  const params = new URLSearchParams()
  if (project) params.set('project', project)
  if (category) params.set('category', category)
  const qs = params.toString()
  const res = await authFetch(`/api/project-memory/memories${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to list memories')
  return res.json()
}

export async function addMemory(data: {
  content: string
  projectName?: string
  memoryType?: string
  category?: string
  summary?: string
  sourceType?: string
  sourceRef?: string
  tagsJson?: string
}): Promise<ProjectMemory> {
  const res = await authFetch('/api/project-memory/memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add memory')
  return res.json()
}

export async function updateMemory(id: string, data: {
  content?: string
  summary?: string
  category?: string
  isActive?: boolean
  tagsJson?: string
}): Promise<ProjectMemory> {
  const res = await authFetch(`/api/project-memory/memories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update memory')
  return res.json()
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await authFetch(`/api/project-memory/memories/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete memory')
}

export async function reinforceMemory(id: string): Promise<ProjectMemory> {
  const res = await authFetch(`/api/project-memory/memories/${id}/reinforce`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to reinforce memory')
  return res.json()
}

export async function contradictMemory(id: string): Promise<ProjectMemory> {
  const res = await authFetch(`/api/project-memory/memories/${id}/contradict`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to contradict memory')
  return res.json()
}

export async function getMemoryStats(): Promise<MemoryStats> {
  const res = await authFetch('/api/project-memory/stats')
  if (!res.ok) throw new Error('Failed to get memory stats')
  return res.json()
}

export async function listProjects(): Promise<{ name: string; memoryCount: number }[]> {
  const res = await authFetch('/api/project-memory/projects')
  if (!res.ok) throw new Error('Failed to list projects')
  return res.json()
}
