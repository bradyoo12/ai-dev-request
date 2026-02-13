import { getAuthHeaders } from './auth'
import { apiCache } from '../utils/apiCache'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_TIMEOUT = 5000 // 5 seconds

export interface SupportPost {
  id: string
  userId: string
  title: string
  content: string
  category: string
  status: string
  rewardCredit: number | null
  rewardedByUserId: string | null
  rewardedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SupportPostListResponse {
  items: SupportPost[]
  total: number
  page: number
  pageSize: number
}

function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId))
}

export async function getSupportPosts(
  page = 1,
  pageSize = 10,
  category?: string,
  sort = 'newest'
): Promise<SupportPostListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort })
  if (category && category !== 'all') params.set('category', category)

  const cacheKey = `support-posts:${params.toString()}`

  return apiCache.get(
    cacheKey,
    async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/support?${params}`)
        if (!res.ok) throw new Error('Failed to load support posts')
        return res.json()
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.')
        }
        throw err
      }
    },
    30000, // Cache for 30 seconds
    true // Use stale-while-revalidate for instant response
  )
}

export async function getSupportPost(id: string): Promise<SupportPost> {
  const cacheKey = `support-post:${id}`

  return apiCache.get(
    cacheKey,
    async () => {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/support/${id}`)
        if (!res.ok) throw new Error('Failed to load support post')
        return res.json()
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.')
        }
        throw err
      }
    },
    30000 // Cache individual posts for 30 seconds
  )
}

export async function createSupportPost(
  title: string,
  content: string,
  category?: string
): Promise<SupportPost> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/support`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, content, category }),
    })
    if (!res.ok) throw new Error('Failed to create support post')
    const data = await res.json()

    // Invalidate support posts cache
    apiCache.invalidatePattern(/^support-posts:/)

    return data
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function setRewardCredit(
  id: string,
  rewardCredit: number
): Promise<{ id: string; rewardCredit: number; rewardedByUserId: string; rewardedAt: string }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/support/${id}/reward`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rewardCredit }),
    })
    if (!res.ok) throw new Error('Failed to set reward credit')
    const data = await res.json()

    // Invalidate related caches
    apiCache.invalidate(`support-post:${id}`)
    apiCache.invalidatePattern(/^support-posts:/)

    return data
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export async function updateSupportStatus(
  id: string,
  status: string
): Promise<{ id: string; status: string; previousStatus: string }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/support/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error('Failed to update status')
    const data = await res.json()

    // Invalidate related caches
    apiCache.invalidate(`support-post:${id}`)
    apiCache.invalidatePattern(/^support-posts:/)

    return data
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}
