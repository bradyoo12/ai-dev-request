import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface QueryConfig {
  id: string
  staleTimeMs: number
  cacheTimeMs: number
  retryCount: number
  retryDelayMs: number
  refetchOnWindowFocus: boolean
  refetchOnReconnect: boolean
  refetchOnMount: boolean
  enableDevtools: boolean
  enableGarbageCollection: boolean
  enableOptimisticUpdates: boolean
  totalQueries: number
  totalMutations: number
  cacheHits: number
  cacheMisses: number
  createdAt: string
  updatedAt: string
}

export interface QueryPreset {
  id: string
  name: string
  description: string
  staleTimeMs: number
  cacheTimeMs: number
  retryCount: number
  refetchOnWindowFocus: boolean
}

export interface QueryPattern {
  id: string
  name: string
  description: string
  code: string
  category: string
}

export interface QueryStats {
  totalQueries: number
  totalMutations: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  staleTimeMs: number
  cacheTimeMs: number
  retryCount: number
  activePreset: string
}

export async function getQueryConfig(): Promise<QueryConfig> {
  const res = await authFetch(`${API}/api/query-config/config`)
  if (!res.ok) throw new Error('Failed to load query config')
  return res.json()
}

export async function updateQueryConfig(data: Partial<QueryConfig>): Promise<QueryConfig> {
  const res = await authFetch(`${API}/api/query-config/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update query config')
  return res.json()
}

export async function getQueryPresets(): Promise<QueryPreset[]> {
  const res = await authFetch(`${API}/api/query-config/presets`)
  if (!res.ok) throw new Error('Failed to load presets')
  return res.json()
}

export async function getQueryPatterns(): Promise<QueryPattern[]> {
  const res = await authFetch(`${API}/api/query-config/query-patterns`)
  if (!res.ok) throw new Error('Failed to load patterns')
  return res.json()
}

export async function getQueryStats(): Promise<QueryStats> {
  const res = await authFetch(`${API}/api/query-config/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
