import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface Team {
  id: number
  name: string
  description?: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: number
  teamId: number
  userId: string
  role: string
  joinedAt: string
}

export interface TeamActivity {
  id: number
  userId: string
  action: string
  targetUserId?: string
  detail?: string
  createdAt: string
}

export interface TeamProject {
  id: number
  teamId: number
  devRequestId: string
  sharedByUserId: string
  sharedAt: string
}

export async function getTeams(): Promise<Team[]> {
  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.teamsFailed'))
  return response.json()
}

export async function createTeam(name: string, description?: string): Promise<Team> {
  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  })
  if (!response.ok) throw new Error(t('api.error.teamCreateFailed'))
  return response.json()
}

export async function getTeam(teamId: number): Promise<Team> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.teamsFailed'))
  return response.json()
}

export async function updateTeam(teamId: number, name: string, description?: string): Promise<Team> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  })
  if (!response.ok) throw new Error(t('api.error.teamCreateFailed'))
  return response.json()
}

export async function deleteTeam(teamId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.teamDeleteFailed'))
}

export async function getMembers(teamId: number): Promise<TeamMember[]> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.teamsFailed'))
  return response.json()
}

export async function addMember(teamId: number, email: string, role: string = 'editor'): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, role }),
  })
  if (!response.ok) throw new Error(t('api.error.memberAddFailed'))
  return response.json()
}

export async function updateMemberRole(teamId: number, memberId: number, role: string): Promise<TeamMember> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members/${memberId}/role`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  })
  if (!response.ok) throw new Error(t('api.error.memberAddFailed'))
  return response.json()
}

export async function removeMember(teamId: number, memberId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.memberRemoveFailed'))
}

export async function getActivities(teamId: number, limit: number = 50): Promise<TeamActivity[]> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/activities?limit=${limit}`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.teamsFailed'))
  return response.json()
}

export async function getTeamProjects(teamId: number): Promise<TeamProject[]> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/projects`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.teamsFailed'))
  return response.json()
}

export async function shareProject(teamId: number, devRequestId: string): Promise<TeamProject> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/projects`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ devRequestId }),
  })
  if (!response.ok) throw new Error(t('api.error.teamsFailed'))
  return response.json()
}

export async function unshareProject(teamId: number, projectId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/projects/${projectId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(t('api.error.teamsFailed'))
}
