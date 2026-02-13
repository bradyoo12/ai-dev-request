import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface ServerComponentConfig {
  id: string
  userId: string
  projectName: string
  framework: string
  renderStrategy: string
  streamingEnabled: boolean
  metadataHoisting: boolean
  directDbAccess: boolean
  dataFetchingPattern: string
  serverComponentCount: number
  clientComponentCount: number
  bundleSizeReductionPercent: number
  initialLoadMs: number
  status: string
  migrationNotes: string
  createdAt: string
  updatedAt: string
}

export interface RscFramework {
  id: string
  name: string
  description: string
  color: string
}

export interface RscPattern {
  id: string
  title: string
  description: string
  code: string
}

export interface RscStats {
  totalProjects: number
  avgBundleReduction: number
  avgInitialLoad: number
  byFramework: { framework: string; count: number; avgReduction: number }[]
  byStrategy: { strategy: string; count: number }[]
}

export async function listConfigs(framework?: string): Promise<ServerComponentConfig[]> {
  const params = new URLSearchParams()
  if (framework) params.set('framework', framework)
  const qs = params.toString() ? `?${params}` : ''
  const res = await authFetch(`${API}/api/server-components${qs}`)
  if (!res.ok) throw new Error('Failed to list configs')
  return res.json()
}

export async function createConfig(req: Partial<ServerComponentConfig>): Promise<ServerComponentConfig> {
  const res = await authFetch(`${API}/api/server-components`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error('Failed to create config')
  return res.json()
}

export async function analyzeProject(id: string): Promise<ServerComponentConfig> {
  const res = await authFetch(`${API}/api/server-components/${id}/analyze`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to analyze project')
  return res.json()
}

export async function deleteConfig(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/server-components/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete config')
}

export async function getRscStats(): Promise<RscStats> {
  const res = await authFetch(`${API}/api/server-components/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getFrameworks(): Promise<RscFramework[]> {
  const res = await fetch(`${API}/api/server-components/frameworks`)
  if (!res.ok) throw new Error('Failed to get frameworks')
  return res.json()
}

export async function getPatterns(): Promise<RscPattern[]> {
  const res = await fetch(`${API}/api/server-components/patterns`)
  if (!res.ok) throw new Error('Failed to get patterns')
  return res.json()
}
