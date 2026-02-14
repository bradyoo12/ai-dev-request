import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
  }
}

export interface SubtaskItem {
  id: string
  devRequestId: string
  parentSubtaskId?: string
  orderIndex: number
  priority: number
  title: string
  description?: string
  estimatedHours?: number
  status: string
  dependencyIds: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateSubtaskInput {
  title: string
  description?: string
  estimatedHours?: number
  orderIndex?: number
  priority?: number
  parentSubtaskId?: string
  dependencyIds?: string[]
}

export interface UpdateSubtaskInput {
  title?: string
  description?: string
  estimatedHours?: number
  orderIndex?: number
  priority?: number
  status?: string
  parentSubtaskId?: string
  dependencyIds?: string[]
}

export async function getSubtasks(requestId: string): Promise<SubtaskItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks`,
    { headers: getAuthHeaders() }
  )

  if (!response.ok) {
    throw new Error('Failed to load subtasks')
  }

  return response.json()
}

export async function getSubtask(
  requestId: string,
  subtaskId: string
): Promise<SubtaskItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/${subtaskId}`,
    { headers: getAuthHeaders() }
  )

  if (!response.ok) {
    throw new Error('Failed to load subtask')
  }

  return response.json()
}

export async function createSubtask(
  requestId: string,
  input: CreateSubtaskInput
): Promise<SubtaskItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to create subtask')
  }

  return response.json()
}

export async function createSubtasksBatch(
  requestId: string,
  inputs: CreateSubtaskInput[]
): Promise<SubtaskItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/batch`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(inputs),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to create subtasks')
  }

  return response.json()
}

export async function updateSubtask(
  requestId: string,
  subtaskId: string,
  input: UpdateSubtaskInput
): Promise<SubtaskItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/${subtaskId}`,
    {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(input),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to update subtask')
  }

  return response.json()
}

export async function generateSubtasks(
  requestId: string
): Promise<SubtaskItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/generate`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to generate subtasks')
  }

  return response.json()
}

export async function deleteSubtask(
  requestId: string,
  subtaskId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/${subtaskId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete subtask')
  }
}

export async function approveAllSubtasks(
  requestId: string
): Promise<{ message: string; approvedCount: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/approve-all`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to approve subtasks')
  }

  return response.json()
}

export async function approvePlan(
  requestId: string
): Promise<{ message: string; subtaskCount: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/approve-plan`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to approve plan')
  }

  return response.json()
}

export async function rejectPlan(
  requestId: string
): Promise<{ message: string; removedCount: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/reject-plan`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to reject plan')
  }

  return response.json()
}
