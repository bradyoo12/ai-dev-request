import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface LangGraphWorkflow {
  id: string
  workflowName: string
  description: string
  graphDefinitionJson: string
  status: string
  nodesJson: string
  edgesJson: string
  executionStateJson: string
  totalNodes: number
  completedNodes: number
  failedNodes: number
  stampedeProtectionEnabled: boolean
  cacheHitsCount: number
  totalExecutions: number
  avgExecutionTimeMs: number
  devRequestId: number | null
  createdAt: string
  updatedAt: string
}

export interface NodeType {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodeTypes: string[]
  nodeNames: string[]
}

export interface LangGraphStats {
  totalWorkflows: number
  completedWorkflows: number
  successRate: number
  avgNodes: number
  totalExecutions: number
  totalCacheHits: number
  recentWorkflows: { id: string; workflowName: string; status: string; totalNodes: number; completedNodes: number; updatedAt: string }[]
}

export async function listWorkflows(): Promise<LangGraphWorkflow[]> {
  const res = await authFetch(`${API}/api/langgraph/workflows`)
  if (!res.ok) throw new Error('Failed to load workflows')
  return res.json()
}

export async function createWorkflow(name: string, description: string, nodeTypes?: string[], devRequestId?: number): Promise<LangGraphWorkflow> {
  const res = await authFetch(`${API}/api/langgraph/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, nodeTypes, devRequestId }),
  })
  if (!res.ok) throw new Error('Failed to create workflow')
  return res.json()
}

export async function getWorkflow(id: string): Promise<LangGraphWorkflow> {
  const res = await authFetch(`${API}/api/langgraph/workflows/${id}`)
  if (!res.ok) throw new Error('Failed to load workflow')
  return res.json()
}

export async function executeWorkflow(id: string): Promise<LangGraphWorkflow> {
  const res = await authFetch(`${API}/api/langgraph/workflows/${id}/execute`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to execute workflow')
  return res.json()
}

export async function pauseWorkflow(id: string): Promise<LangGraphWorkflow> {
  const res = await authFetch(`${API}/api/langgraph/workflows/${id}/pause`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to pause workflow')
  return res.json()
}

export async function getNodeTypes(): Promise<NodeType[]> {
  const res = await fetch(`${API}/api/langgraph/node-types`)
  if (!res.ok) throw new Error('Failed to load node types')
  return res.json()
}

export async function getTemplates(): Promise<WorkflowTemplate[]> {
  const res = await fetch(`${API}/api/langgraph/templates`)
  if (!res.ok) throw new Error('Failed to load templates')
  return res.json()
}

export async function getLangGraphStats(): Promise<LangGraphStats> {
  const res = await authFetch(`${API}/api/langgraph/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
