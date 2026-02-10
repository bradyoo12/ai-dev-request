import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === Interfaces ===

export interface MarketplaceTemplate {
  id: string
  authorId: number
  name: string
  description: string
  category: string
  techStack: string
  tags?: string | null
  templateData: string
  previewImageUrl?: string | null
  rating: number
  ratingCount: number
  downloadCount: number
  status: string
  isOfficial: boolean
  createdAt: string
  updatedAt?: string | null
}

export interface MarketplaceBrowseResult {
  templates: MarketplaceTemplate[]
  totalCount: number
}

export interface MarketplaceImportResult {
  success: boolean
  templateId?: string | null
  templateName?: string | null
  templateData?: string | null
}

export interface MarketplaceRateResult {
  success: boolean
  newRating: number
  newRatingCount: number
}

export interface MarketplaceCategoryCount {
  category: string
  count: number
}

export interface SubmitTemplatePayload {
  authorId: number
  name: string
  description: string
  category: string
  techStack: string
  tags?: string
  templateData?: string
  previewImageUrl?: string
}

// === API Functions ===

export async function browseTemplates(
  category?: string,
  techStack?: string,
  search?: string,
  sortBy: string = 'popular'
): Promise<MarketplaceBrowseResult> {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (techStack) params.set('techStack', techStack)
  if (search) params.set('search', search)
  params.set('sortBy', sortBy)

  const response = await fetch(`${API_BASE_URL}/api/marketplace/templates?${params}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.marketplaceBrowseFailed'))
  }
  return response.json()
}

export async function getTemplate(id: string): Promise<MarketplaceTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/marketplace/templates/${id}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.marketplaceGetFailed'))
  }
  return response.json()
}

export async function submitTemplate(payload: SubmitTemplatePayload): Promise<MarketplaceTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/marketplace/templates`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.marketplaceSubmitFailed'))
  }
  return response.json()
}

export async function updateTemplate(
  id: string,
  payload: Partial<SubmitTemplatePayload> & { status?: string }
): Promise<MarketplaceTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/marketplace/templates/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.marketplaceUpdateFailed'))
  }
  return response.json()
}

export async function importTemplate(id: string, userId: number): Promise<MarketplaceImportResult> {
  const response = await fetch(`${API_BASE_URL}/api/marketplace/templates/${id}/import`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.marketplaceImportFailed'))
  }
  return response.json()
}

export async function rateTemplate(
  id: string,
  userId: number,
  rating: number
): Promise<MarketplaceRateResult> {
  const response = await fetch(`${API_BASE_URL}/api/marketplace/templates/${id}/rate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId, rating }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.marketplaceRateFailed'))
  }
  return response.json()
}

export async function getCategories(): Promise<MarketplaceCategoryCount[]> {
  const response = await fetch(`${API_BASE_URL}/api/marketplace/categories`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getPopularTemplates(limit: number = 10): Promise<MarketplaceTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/api/marketplace/templates/popular?limit=${limit}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
