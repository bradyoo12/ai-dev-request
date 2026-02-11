import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ComponentListItem {
  id: string
  componentName: string
  promptText: string
  category: string
  status: string
  iterationCount: number
  viewCount: number
  forkCount: number
  likeCount: number
  isPublic: boolean
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ConversationEntry {
  role: string
  content: string
  timestamp: string
}

export interface ComponentDetail {
  id: string
  componentName: string
  promptText: string
  generatedCode: string
  generatedHtml: string
  framework: string
  stylingLibrary: string
  status: string
  iterationCount: number
  conversation: ConversationEntry[]
  category: string
  tags: string[]
  viewCount: number
  forkCount: number
  likeCount: number
  isPublic: boolean
  thumbnailUrl: string | null
  themeTokens: Record<string, string> | null
  generationTimeMs: number
  tokensUsed: number
  estimatedCost: number
  createdAt: string
  updatedAt: string
}

export interface VisualPromptStats {
  totalComponents: number
  totalIterations: number
  totalTokensUsed: number
  totalCost: number
  avgGenerationTimeMs: number
  categoriesUsed: number
  exportedCount: number
  publicCount: number
}

export interface ComponentCategory {
  id: string
  name: string
  icon: string
  count: number
}

export async function listComponents(category?: string): Promise<ComponentListItem[]> {
  const params = category ? `?category=${category}` : ''
  const res = await authFetch(`${API}/api/visual-prompt/components${params}`)
  if (!res.ok) throw new Error('Failed to list components')
  return res.json()
}

export async function getComponent(id: string): Promise<ComponentDetail> {
  const res = await authFetch(`${API}/api/visual-prompt/components/${id}`)
  if (!res.ok) throw new Error('Failed to get component')
  return res.json()
}

export async function generateComponent(data: {
  prompt: string
  componentName?: string
  framework?: string
  stylingLibrary?: string
  category?: string
}): Promise<ComponentDetail> {
  const res = await authFetch(`${API}/api/visual-prompt/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to generate component')
  return res.json()
}

export async function refineComponent(id: string, prompt: string): Promise<ComponentDetail> {
  const res = await authFetch(`${API}/api/visual-prompt/components/${id}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) throw new Error('Failed to refine component')
  return res.json()
}

export async function getGallery(category?: string): Promise<ComponentListItem[]> {
  const params = category ? `?category=${category}` : ''
  const res = await authFetch(`${API}/api/visual-prompt/gallery${params}`)
  if (!res.ok) throw new Error('Failed to load gallery')
  return res.json()
}

export async function exportComponent(id: string, projectId: string, filePath?: string): Promise<{ success: boolean; exportedTo: string; projectId: string }> {
  const res = await authFetch(`${API}/api/visual-prompt/components/${id}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, filePath }),
  })
  if (!res.ok) throw new Error('Failed to export component')
  return res.json()
}

export async function getVisualPromptStats(): Promise<VisualPromptStats> {
  const res = await authFetch(`${API}/api/visual-prompt/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}

export async function getCategories(): Promise<ComponentCategory[]> {
  const res = await authFetch(`${API}/api/visual-prompt/categories`)
  if (!res.ok) throw new Error('Failed to load categories')
  return res.json()
}
