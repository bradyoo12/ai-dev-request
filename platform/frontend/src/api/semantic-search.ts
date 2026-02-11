import { authFetch } from './auth'

export interface SemanticIndexItem {
  id: string
  sourceType: string
  sourceId: string
  title: string
  content?: string
  contentHash: string
  embeddingJson?: string
  dimensions: number
  indexedAt: string
  createdAt: string
  updatedAt: string
}

export interface SemanticSearchResult {
  id: string
  sourceType: string
  sourceId: string
  title: string
  content: string
  indexedAt: string
  similarity: number
}

export interface SemanticSearchStats {
  totalIndexed: number
  bySourceType: { sourceType: string; count: number }[]
  dimensions: number
  lastIndexed: string | null
  totalContentSize: number
}

export async function listIndexedItems(sourceType: string): Promise<SemanticIndexItem[]> {
  const res = await authFetch(`/api/semantic-search/index/${encodeURIComponent(sourceType)}`)
  if (!res.ok) throw new Error('Failed to list indexed items')
  return res.json()
}

export async function indexItem(data: { sourceType: string; sourceId: string; title: string; content: string }): Promise<SemanticIndexItem> {
  const res = await authFetch('/api/semantic-search/index', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to index item')
  return res.json()
}

export async function semanticQuery(data: { query: string; sourceType?: string; topK?: number }): Promise<SemanticSearchResult[]> {
  const res = await authFetch('/api/semantic-search/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to search')
  return res.json()
}

export async function deleteIndexedItem(id: string): Promise<void> {
  const res = await authFetch(`/api/semantic-search/index/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete item')
}

export async function getSemanticSearchStats(): Promise<SemanticSearchStats> {
  const res = await authFetch('/api/semantic-search/stats')
  if (!res.ok) throw new Error('Failed to get stats')
  return res.json()
}
