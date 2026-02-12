import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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

export async function getSupportPosts(
  page = 1,
  pageSize = 10,
  category?: string,
  sort = 'newest'
): Promise<SupportPostListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort })
  if (category && category !== 'all') params.set('category', category)

  const res = await fetch(`${API_BASE_URL}/api/support?${params}`)
  if (!res.ok) throw new Error('Failed to load support posts')
  return res.json()
}

export async function getSupportPost(id: string): Promise<SupportPost> {
  const res = await fetch(`${API_BASE_URL}/api/support/${id}`)
  if (!res.ok) throw new Error('Failed to load support post')
  return res.json()
}

export async function createSupportPost(
  title: string,
  content: string,
  category?: string
): Promise<SupportPost> {
  const res = await fetch(`${API_BASE_URL}/api/support`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, content, category }),
  })
  if (!res.ok) throw new Error('Failed to create support post')
  return res.json()
}

export async function setRewardCredit(
  id: string,
  rewardCredit: number
): Promise<{ id: string; rewardCredit: number; rewardedByUserId: string; rewardedAt: string }> {
  const res = await fetch(`${API_BASE_URL}/api/support/${id}/reward`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ rewardCredit }),
  })
  if (!res.ok) throw new Error('Failed to set reward credit')
  return res.json()
}

export async function updateSupportStatus(
  id: string,
  status: string
): Promise<{ id: string; status: string; previousStatus: string }> {
  const res = await fetch(`${API_BASE_URL}/api/support/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}
