import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const t = (key: string) => i18n.t(key)

export interface Participant {
  userId: string
  displayName: string
  color: string
  joinedAt: string
}

export interface ActivityEntry {
  userId: string
  displayName: string
  action: string
  detail: string
  timestamp: string
}

export interface CollaborativeSession {
  id: string
  projectId: number
  status: string
  sessionName: string
  participants: Participant[]
  participantCount: number
  documentContent: string | null
  documentVersion: number
  activityFeed: ActivityEntry[]
  createdBy: string
  createdAt: string
  endedAt: string | null
  lastActivityAt: string
}

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export async function createSession(projectId: number, sessionName: string): Promise<CollaborativeSession> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/collab/session`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionName }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('collaborativeEditing.error.createFailed'))
  }
  return response.json()
}

export async function getSession(projectId: number): Promise<CollaborativeSession | null> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/collab/session`, {
    headers: authHeaders(),
  })
  if (response.status === 404) return null
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('collaborativeEditing.error.loadFailed'))
  }
  return response.json()
}

export async function joinSession(projectId: number, displayName: string): Promise<CollaborativeSession> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/collab/join`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('collaborativeEditing.error.joinFailed'))
  }
  return response.json()
}

export async function updateDocument(projectId: number, content: string): Promise<CollaborativeSession> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/collab/document`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('collaborativeEditing.error.updateFailed'))
  }
  return response.json()
}

export async function endSession(projectId: number): Promise<CollaborativeSession> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/collab/end`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('collaborativeEditing.error.endFailed'))
  }
  return response.json()
}

export async function getSessionHistory(projectId: number): Promise<CollaborativeSession[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/collab/history`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('collaborativeEditing.error.historyFailed'))
  }
  return response.json()
}
