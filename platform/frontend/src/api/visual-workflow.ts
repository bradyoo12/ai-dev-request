import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === Interfaces ===

export interface VisualWorkflow {
  id: string
  name: string
  description?: string | null
  nodesJson: string
  edgesJson: string
  triggerType: string
  triggerConfigJson?: string | null
  status: string
  naturalLanguagePrompt?: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkflowNode {
  id: string
  type: string
  label: string
  positionX: number
  positionY: number
  configJson: string
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label: string
}

export interface VisualWorkflowRun {
  id: string
  workflowId: string
  status: string
  currentNodeId?: string | null
  nodeResultsJson: string
  startedAt: string
  completedAt?: string | null
  error?: string | null
}

export interface CreateVisualWorkflowPayload {
  name: string
  description?: string
  nodesJson?: string
  edgesJson?: string
  triggerType?: string
  triggerConfigJson?: string
  naturalLanguagePrompt?: string
}

export interface UpdateVisualWorkflowPayload {
  name?: string
  description?: string
  nodesJson?: string
  edgesJson?: string
  triggerType?: string
  triggerConfigJson?: string
  status?: string
}

// === API Functions ===

export async function getWorkflows(): Promise<VisualWorkflow[]> {
  const response = await fetch(`${API_BASE_URL}/api/visual-workflow`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Failed to load workflows')
  return response.json()
}

export async function getWorkflowById(id: string): Promise<VisualWorkflow> {
  const response = await fetch(`${API_BASE_URL}/api/visual-workflow/${id}`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Failed to load workflow')
  return response.json()
}

export async function createWorkflow(payload: CreateVisualWorkflowPayload): Promise<VisualWorkflow> {
  const response = await fetch(`${API_BASE_URL}/api/visual-workflow`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || 'Failed to create workflow') }
  return response.json()
}

export async function updateWorkflow(id: string, payload: UpdateVisualWorkflowPayload): Promise<VisualWorkflow> {
  const response = await fetch(`${API_BASE_URL}/api/visual-workflow/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || 'Failed to update workflow') }
  return response.json()
}

export async function deleteWorkflow(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/visual-workflow/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to delete workflow')
}

export async function generateWorkflow(prompt: string): Promise<VisualWorkflow> {
  const response = await fetch(`${API_BASE_URL}/api/visual-workflow/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ prompt }),
  })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || 'Failed to generate workflow') }
  return response.json()
}

export async function executeWorkflow(id: string): Promise<VisualWorkflowRun> {
  const response = await fetch(`${API_BASE_URL}/api/visual-workflow/${id}/execute`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || 'Failed to execute workflow') }
  return response.json()
}

export async function getExecutionStatus(id: string): Promise<VisualWorkflowRun> {
  const response = await fetch(`${API_BASE_URL}/api/visual-workflow/${id}/status`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Failed to get execution status')
  return response.json()
}
