import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ProjectDocumentation {
  id: string
  userId: string
  devRequestId: string | null
  projectName: string
  status: string
  architectureOverview: string
  componentDocs: string
  apiReference: string
  setupGuide: string
  qaHistoryJson: string
  sourceFilesCount: number
  totalLinesAnalyzed: number
  generationTimeMs: number
  tokensUsed: number
  estimatedCost: number
  createdAt: string
  updatedAt: string
}

export interface QaEntry {
  question: string
  answer: string
  timestamp: string
}

export interface ProjectDocStats {
  totalDocs: number
  totalFilesAnalyzed: number
  totalLinesAnalyzed: number
  avgGenerationTimeMs: number
  totalTokensUsed: number
}

export async function listProjectDocs(): Promise<ProjectDocumentation[]> {
  const res = await authFetch(`${API}/api/project-docs`)
  if (!res.ok) throw new Error('Failed to load project docs')
  return res.json()
}

export async function getProjectDoc(id: string): Promise<ProjectDocumentation> {
  const res = await authFetch(`${API}/api/project-docs/${id}`)
  if (!res.ok) throw new Error('Failed to load project doc')
  return res.json()
}

export async function generateProjectDoc(data: { projectName: string; description?: string; devRequestId?: string }): Promise<ProjectDocumentation> {
  const res = await authFetch(`${API}/api/project-docs/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to generate documentation')
  return res.json()
}

export async function askProjectDoc(id: string, question: string): Promise<ProjectDocumentation> {
  const res = await authFetch(`${API}/api/project-docs/${id}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error('Failed to ask question')
  return res.json()
}

export async function deleteProjectDoc(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/project-docs/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete documentation')
}

export async function getProjectDocStats(): Promise<ProjectDocStats> {
  const res = await authFetch(`${API}/api/project-docs/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
