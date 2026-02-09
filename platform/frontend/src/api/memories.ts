import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface MemoryRecord {
  id: number
  content: string
  category: string
  scope: string
  sessionId?: string
  createdAt: string
  updatedAt: string
}

export interface MemoryListResult {
  memories: MemoryRecord[]
  totalCount: number
  page: number
  pageSize: number
}

export async function getMemories(page = 1, pageSize = 50): Promise<MemoryListResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/memories?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders() }
  )
  if (!response.ok) {
    throw new Error(t('api.error.memoriesFailed'))
  }
  return response.json()
}

export async function addMemory(data: {
  content: string
  category: string
  scope?: string
}): Promise<MemoryRecord> {
  const response = await fetch(`${API_BASE_URL}/api/memories`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.memoryAddFailed'))
  }
  return response.json()
}

export async function deleteMemory(memoryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/memories/${memoryId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.memoryDeleteFailed'))
  }
}

export async function deleteAllMemories(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/memories`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new Error(t('api.error.memoryDeleteAllFailed'))
  }
}
