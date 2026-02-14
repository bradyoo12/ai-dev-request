import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface TicketListItem {
  id: string
  descriptionPreview: string
  category: string
  complexity: string
  status: string
  createdAt: string
}

export interface TicketDetail {
  id: string
  description: string
  contactEmail?: string
  hasScreenshot: boolean
  category: string
  complexity: string
  status: string
  createdAt: string
  analyzedAt?: string
  proposedAt?: string
  projectId?: string
}

export async function getUserTickets(
  page = 1,
  pageSize = 50,
  status?: string
): Promise<TicketListItem[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  })
  if (status) {
    params.set('status', status)
  }

  const response = await fetch(
    `${API_BASE_URL}/api/requests?${params}`,
    { headers: authHeaders() }
  )

  if (!response.ok) {
    throw new Error('Failed to load tickets')
  }

  return response.json()
}

export async function getTicketDetail(id: string): Promise<TicketDetail> {
  const response = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to load ticket detail')
  }

  return response.json()
}
