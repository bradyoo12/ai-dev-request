import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface Suggestion {
  id: number
  userId: string
  title: string
  description: string
  category: string
  status: string
  upvoteCount: number
  commentCount: number
  tokenReward: number
  devRequestId: string | null
  createdAt: string
  updatedAt: string
}

export interface SuggestionListResponse {
  items: Suggestion[]
  total: number
  page: number
  pageSize: number
}

export interface CreateSuggestionResponse {
  suggestion: Suggestion
  tokensAwarded: number
  newBalance: number
}

export interface VoteResponse {
  id: number
  upvoteCount: number
  voted: boolean
  bonusTokensAwarded: number | null
}

export async function getSuggestions(
  page = 1,
  pageSize = 20,
  category?: string,
  sort = 'newest'
): Promise<SuggestionListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort })
  if (category && category !== 'all') params.set('category', category)

  const res = await fetch(`${API_BASE_URL}/api/suggestions?${params}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load suggestions')
  return res.json()
}

export async function getSuggestion(id: number): Promise<Suggestion> {
  const res = await fetch(`${API_BASE_URL}/api/suggestions/${id}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load suggestion')
  return res.json()
}

export async function createSuggestion(
  title: string,
  description: string,
  category?: string,
  devRequestId?: string
): Promise<CreateSuggestionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/suggestions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, description, category, devRequestId }),
  })
  if (!res.ok) throw new Error('Failed to create suggestion')
  return res.json()
}

export async function voteSuggestion(id: number): Promise<VoteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/suggestions/${id}/vote`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = new Error('Failed to vote') as Error & { status: number }
    err.status = res.status
    throw err
  }
  return res.json()
}

export interface SuggestionComment {
  id: number
  suggestionId: number
  userId: string
  content: string
  isAdminReply: boolean
  createdAt: string
}

export interface StatusHistoryEntry {
  id: number
  fromStatus: string
  toStatus: string
  changedByUserId: string
  note: string | null
  createdAt: string
}

export interface AdminSuggestionListResponse {
  items: Suggestion[]
  total: number
  page: number
  pageSize: number
  statusCounts: Record<string, number>
}

export async function getSuggestionComments(id: number): Promise<SuggestionComment[]> {
  const res = await fetch(`${API_BASE_URL}/api/suggestions/${id}/comments`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load comments')
  return res.json()
}

export async function addSuggestionComment(
  id: number,
  content: string,
  isAdminReply = false
): Promise<SuggestionComment> {
  const res = await fetch(`${API_BASE_URL}/api/suggestions/${id}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, isAdminReply }),
  })
  if (!res.ok) throw new Error('Failed to add comment')
  return res.json()
}

export async function getSuggestionHistory(id: number): Promise<StatusHistoryEntry[]> {
  const res = await fetch(`${API_BASE_URL}/api/suggestions/${id}/history`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load history')
  return res.json()
}

export async function updateSuggestionStatus(
  id: number,
  status: string,
  note?: string
): Promise<{ id: number; status: string; previousStatus: string }> {
  const res = await fetch(`${API_BASE_URL}/api/suggestions/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, note }),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}

export async function getAdminSuggestions(
  page = 1,
  pageSize = 20,
  status?: string,
  category?: string
): Promise<AdminSuggestionListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (status && status !== 'all') params.set('status', status)
  if (category && category !== 'all') params.set('category', category)

  const res = await fetch(`${API_BASE_URL}/api/suggestions/admin?${params}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load admin suggestions')
  return res.json()
}
