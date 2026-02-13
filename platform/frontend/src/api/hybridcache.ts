import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface HybridCacheEntry {
  id: string
  cacheKey: string
  cacheLayer: string
  category: string
  sizeBytes: number
  hitCount: number
  missCount: number
  stampedeProtected: boolean
  stampedeBlockedCount: number
  avgLatencyMs: number
  costSavedUsd: number
  status: string
  ttlSeconds: number
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface CacheCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export interface CacheStats {
  totalEntries: number
  activeEntries: number
  expiredEntries: number
  evictedEntries: number
  totalHits: number
  totalMisses: number
  hitRate: number
  totalSizeBytes: number
  totalCostSaved: number
  avgLatencyMs: number
  stampedeBlocked: number
  byCategory: { category: string; count: number; hits: number; misses: number; costSaved: number }[]
  byLayer: { layer: string; count: number; sizeBytes: number; avgLatencyMs: number }[]
}

export async function listCacheEntries(category?: string): Promise<HybridCacheEntry[]> {
  const url = category
    ? `${API}/api/hybrid-cache/entries?category=${encodeURIComponent(category)}`
    : `${API}/api/hybrid-cache/entries`
  const res = await authFetch(url)
  if (!res.ok) throw new Error('Failed to load cache entries')
  return res.json()
}

export async function createCacheEntry(data: {
  cacheKey?: string
  cacheLayer?: string
  category?: string
  sizeBytes: number
  stampedeProtected: boolean
  ttlSeconds: number
}): Promise<HybridCacheEntry> {
  const res = await authFetch(`${API}/api/hybrid-cache/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create cache entry')
  return res.json()
}

export async function invalidateEntry(id: string): Promise<HybridCacheEntry> {
  const res = await authFetch(`${API}/api/hybrid-cache/entries/${id}/invalidate`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to invalidate cache entry')
  return res.json()
}

export async function invalidateAll(category?: string): Promise<{ evicted: number }> {
  const url = category
    ? `${API}/api/hybrid-cache/invalidate-all?category=${encodeURIComponent(category)}`
    : `${API}/api/hybrid-cache/invalidate-all`
  const res = await authFetch(url, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to invalidate cache')
  return res.json()
}

export async function getCacheStats(): Promise<CacheStats> {
  const res = await authFetch(`${API}/api/hybrid-cache/stats`)
  if (!res.ok) throw new Error('Failed to load cache stats')
  return res.json()
}

export async function getCacheCategories(): Promise<CacheCategory[]> {
  const res = await fetch(`${API}/api/hybrid-cache/categories`)
  if (!res.ok) throw new Error('Failed to load cache categories')
  return res.json()
}
