import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface Discussion {
  id: string
  devRequestId?: string
  userId: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface DiscussionMessage {
  id: string
  discussionId: string
  role: string
  content: string
  createdAt: string
}

export interface DiscussionWithMessages {
  discussion: Discussion
  messages: DiscussionMessage[]
}

export interface CreateDiscussionDto {
  title?: string
  devRequestId?: string
}

export interface AddDiscussionMessageDto {
  role: string
  content: string
}

export async function getDiscussions(): Promise<Discussion[]> {
  const response = await fetch(`${API_BASE_URL}/api/discussion`, {
    headers: authHeaders()
  })

  if (!response.ok) {
    throw new Error('Failed to fetch discussions')
  }

  return response.json()
}

export async function createDiscussion(dto: CreateDiscussionDto): Promise<Discussion> {
  const response = await fetch(`${API_BASE_URL}/api/discussion`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dto)
  })

  if (!response.ok) {
    throw new Error('Failed to create discussion')
  }

  return response.json()
}

export async function getDiscussion(id: string): Promise<DiscussionWithMessages> {
  const response = await fetch(`${API_BASE_URL}/api/discussion/${id}`, {
    headers: authHeaders()
  })

  if (!response.ok) {
    throw new Error('Failed to fetch discussion')
  }

  return response.json()
}

export async function addMessage(id: string, dto: AddDiscussionMessageDto): Promise<DiscussionMessage> {
  const response = await fetch(`${API_BASE_URL}/api/discussion/${id}/messages`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dto)
  })

  if (!response.ok) {
    throw new Error('Failed to add message')
  }

  return response.json()
}

export async function exportDiscussion(id: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/discussion/${id}/export`, {
    method: 'POST',
    headers: authHeaders()
  })

  if (!response.ok) {
    throw new Error('Failed to export discussion')
  }

  return response.json()
}

export async function deleteDiscussion(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/discussion/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })

  if (!response.ok) {
    throw new Error('Failed to delete discussion')
  }
}
