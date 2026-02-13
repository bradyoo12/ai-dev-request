import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface VectorSearchConfig {
  id: string
  userId: string
  indexName: string
  provider: string
  searchMode: string
  fusionAlgorithm: string
  vectorWeight: number
  keywordWeight: number
  topK: number
  similarityThreshold: number
  queryExpansion: boolean
  metadataFiltering: boolean
  vectorDimension: number
  totalVectors: number
  avgQueryLatencyMs: number
  totalQueries: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface VectorProvider {
  id: string
  name: string
  description: string
  color: string
}

export interface SearchResult {
  id: string
  title: string
  content: string
  score: number
  vectorScore: number
  keywordScore: number
  fusedScore: number
  source: string
  latencyMs: number
}

export interface SearchResponse {
  query: string
  mode: string
  totalResults: number
  avgLatencyMs: number
  results: SearchResult[]
}

export interface VectorStats {
  totalIndexes: number
  totalVectors: number
  totalQueries: number
  avgLatency: number
  byProvider: { provider: string; count: number; queries: number }[]
  byMode: { mode: string; count: number }[]
}

export async function listConfigs(): Promise<VectorSearchConfig[]> {
  const res = await authFetch(`${API}/api/vector-search`)
  if (!res.ok) throw new Error('Failed to list configs')
  return res.json()
}

export async function createConfig(req: Partial<VectorSearchConfig>): Promise<VectorSearchConfig> {
  const res = await authFetch(`${API}/api/vector-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error('Failed to create config')
  return res.json()
}

export async function runQuery(query: string, searchMode?: string): Promise<SearchResponse> {
  const res = await authFetch(`${API}/api/vector-search/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, searchMode }),
  })
  if (!res.ok) throw new Error('Failed to run query')
  return res.json()
}

export async function deleteConfig(id: string): Promise<void> {
  const res = await authFetch(`${API}/api/vector-search/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete config')
}

export async function getVectorStats(): Promise<VectorStats> {
  const res = await authFetch(`${API}/api/vector-search/stats`)
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}

export async function getProviders(): Promise<VectorProvider[]> {
  const res = await fetch(`${API}/api/vector-search/providers`)
  if (!res.ok) throw new Error('Failed to get providers')
  return res.json()
}
