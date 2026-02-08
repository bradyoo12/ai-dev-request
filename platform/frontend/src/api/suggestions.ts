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
  if (!res.ok) throw new Error('Failed to vote')
  return res.json()
}
