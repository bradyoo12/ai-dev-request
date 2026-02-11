import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface FrameworkConfig {
  selectedFramework: string
  selectedBackend: string
  selectedDatabase: string
  selectedStyling: string
  projectsGenerated: number
  autoDetectStack: boolean
  includeDocker: boolean
  includeCI: boolean
  includeTests: boolean
  favoriteFrameworks: string[]
}

export interface Framework {
  id: string
  name: string
  category: string
  tier: number
  language: string
  description: string
  icon: string
  tags: string[]
}

export interface BackendOption {
  id: string
  name: string
  description: string
}

export interface DatabaseOption {
  id: string
  name: string
  description: string
}

export interface GeneratePreviewResult {
  framework: string
  projectStructure: string[]
  estimatedFiles: number
  estimatedTokens: number
  estimatedCost: number
  estimatedTimeSeconds: number
  features: string[]
}

export interface FrameworkStats {
  totalProjects: number
  favoriteFramework: string
  frameworksUsed: number
  recentProjects: { framework: string; projectName: string; generatedAt: string }[]
}

export async function getFrameworkConfig(): Promise<FrameworkConfig> {
  const res = await authFetch(`${API}/api/framework/config`)
  if (!res.ok) throw new Error('Failed to load framework config')
  return res.json()
}

export async function updateFrameworkConfig(data: Partial<FrameworkConfig>): Promise<{ success: boolean }> {
  const res = await authFetch(`${API}/api/framework/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update config')
  return res.json()
}

export async function getFrameworks(): Promise<Framework[]> {
  const res = await authFetch(`${API}/api/framework/frameworks`)
  if (!res.ok) throw new Error('Failed to load frameworks')
  return res.json()
}

export async function getBackends(): Promise<BackendOption[]> {
  const res = await authFetch(`${API}/api/framework/backends`)
  if (!res.ok) throw new Error('Failed to load backends')
  return res.json()
}

export async function getDatabases(): Promise<DatabaseOption[]> {
  const res = await authFetch(`${API}/api/framework/databases`)
  if (!res.ok) throw new Error('Failed to load databases')
  return res.json()
}

export async function generatePreview(framework?: string, description?: string): Promise<GeneratePreviewResult> {
  const res = await authFetch(`${API}/api/framework/generate-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ framework, description }),
  })
  if (!res.ok) throw new Error('Failed to generate preview')
  return res.json()
}

export async function getFrameworkStats(): Promise<FrameworkStats> {
  const res = await authFetch(`${API}/api/framework/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
