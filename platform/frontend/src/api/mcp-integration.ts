import i18n from '../i18n'
import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const t = (key: string) => i18n.t(key)

function authHeaders(): Record<string, string> {
  return getAuthHeaders()
}

// === Interfaces ===

export interface McpTool {
  name: string
  description: string
  inputSchema: string
}

export interface McpResource {
  uri: string
  name: string
  description: string
  mimeType: string
}

export interface McpConnection {
  id: string
  projectId: number | null
  name: string
  serverUrl: string
  transport: string // sse, stdio, grpc
  status: string // disconnected, connecting, connected, error
  authType: string | null
  availableTools: string | null // JSON array
  availableResources: string | null // JSON array
  toolCallCount: number
  lastConnectedAt: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string | null
}

export interface ToolCallRequest {
  toolName: string
  arguments: string
}

export interface ToolCallResult {
  success: boolean
  result: string | null
  error: string | null
}

export interface McpServerStatus {
  connectionId: string
  name: string
  status: string
  lastConnectedAt: string | null
  toolCount: number
  resourceCount: number
  toolCallCount: number
  errorMessage: string | null
}

export interface RegisterServerRequest {
  projectId?: number | null
  name: string
  serverUrl: string
  transport?: string
  authType?: string | null
  authToken?: string | null
}

// === API Functions ===

export async function getPlatformTools(): Promise<McpTool[]> {
  const response = await fetch(`${API_BASE_URL}/api/mcp/tools`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function callPlatformTool(request: ToolCallRequest): Promise<ToolCallResult> {
  const response = await fetch(`${API_BASE_URL}/api/mcp/tools/call`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.mcpToolCallFailed'))
  }
  return response.json()
}

export async function registerServer(request: RegisterServerRequest): Promise<McpConnection> {
  const response = await fetch(`${API_BASE_URL}/api/mcp/servers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.mcpRegisterFailed'))
  }
  return response.json()
}

export async function unregisterServer(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/mcp/servers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.mcpUnregisterFailed'))
  }
}

export async function listServers(projectId?: number): Promise<McpConnection[]> {
  const params = projectId != null ? `?projectId=${projectId}` : ''
  const response = await fetch(`${API_BASE_URL}/api/mcp/servers${params}`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}

export async function getServerStatus(id: string): Promise<McpServerStatus | null> {
  const response = await fetch(`${API_BASE_URL}/api/mcp/servers/${id}/status`, {
    headers: authHeaders(),
  })
  if (!response.ok) return null
  return response.json()
}

export async function discoverTools(id: string): Promise<McpConnection> {
  const response = await fetch(`${API_BASE_URL}/api/mcp/servers/${id}/discover`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.mcpDiscoverFailed'))
  }
  return response.json()
}

export async function callExternalTool(serverId: string, request: ToolCallRequest): Promise<ToolCallResult> {
  const response = await fetch(`${API_BASE_URL}/api/mcp/servers/${serverId}/tools/call`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || t('api.error.mcpExternalToolCallFailed'))
  }
  return response.json()
}

export async function listProjectServers(projectId: number): Promise<McpConnection[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/mcp/servers`, {
    headers: authHeaders(),
  })
  if (!response.ok) return []
  return response.json()
}
