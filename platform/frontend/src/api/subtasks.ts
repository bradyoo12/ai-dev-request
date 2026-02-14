import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

export interface SubTask {
  id: string
  devRequestId: string
  title: string
  description?: string
  status: string
  order: number
  estimatedCredits?: number
  dependsOnSubTaskId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSubTaskItem {
  title: string
  description?: string
  order: number
  estimatedCredits?: number
  dependsOnSubTaskId?: string
}

export interface UpdateSubTaskData {
  title: string
  description?: string
  status: string
  order: number
  dependsOnSubTaskId?: string
}

export async function fetchSubTasks(requestId: string): Promise<SubTask[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks`,
    { headers: authHeaders() }
  )

  if (!response.ok) return []
  return response.json()
}

export async function createSubTasks(
  requestId: string,
  subTasks: CreateSubTaskItem[]
): Promise<SubTask[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subTasks }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to create subtasks')
  }

  return response.json()
}

export async function updateSubTask(
  requestId: string,
  subtaskId: string,
  data: UpdateSubTaskData
): Promise<SubTask> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/${subtaskId}`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to update subtask')
  }

  return response.json()
}

export async function deleteSubTask(
  requestId: string,
  subtaskId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/${subtaskId}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete subtask')
  }
}

export async function approveSubTask(
  requestId: string,
  subtaskId: string
): Promise<SubTask> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/${subtaskId}/approve`,
    {
      method: 'POST',
      headers: authHeaders(),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to approve subtask')
  }

  return response.json()
}

export async function approveAllSubTasks(
  requestId: string
): Promise<SubTask[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/${requestId}/subtasks/approve-all`,
    {
      method: 'POST',
      headers: authHeaders(),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to approve all subtasks')
  }

  return response.json()
}
