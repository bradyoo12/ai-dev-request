import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface McpGatewayServer {
  id: string
  serverName: string
  serverUrl: string
  transportType: string
  description: string
  category: string
  iconUrl: string
  status: string
  isEnabled: boolean
  toolsJson: string
  resourcesJson: string
  toolCount: number
  resourceCount: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgLatencyMs: number
  lastHealthCheck: string
  healthMessage: string
  configJson: string
  createdAt: string
  updatedAt: string
}

export interface CatalogEntry {
  name: string
  description: string
  category: string
  toolCount: number
  iconUrl: string
  serverUrl: string
}

export interface McpGatewayStats {
  totalServers: number
  connectedServers: number
  totalTools: number
  totalResources: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgLatency: number
  successRate: number
  recentServers: { serverName: string; status: string; toolCount: number; totalExecutions: number; avgLatencyMs: number }[]
}

export interface ExecutionResult {
  success: boolean
  toolName: string
  latencyMs: number
  result: string
  timestamp: string
}

export async function listServers(): Promise<McpGatewayServer[]> {
  const res = await authFetch(`${API}/api/mcp-gateway/servers`)
  if (!res.ok) throw new Error('Failed to load servers')
  return res.json()
}

export async function addServer(serverName: string, serverUrl: string, transportType: string, description: string, category: string): Promise<McpGatewayServer> {
  const res = await authFetch(`${API}/api/mcp-gateway/servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serverName, serverUrl, transportType, description, category })
  })
  if (!res.ok) throw new Error('Failed to add server')
  return res.json()
}

export async function healthCheck(serverId: string): Promise<McpGatewayServer> {
  const res = await authFetch(`${API}/api/mcp-gateway/servers/${serverId}/health-check`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to run health check')
  return res.json()
}

export async function executeTool(serverId: string, toolName: string, inputJson?: string): Promise<ExecutionResult> {
  const res = await authFetch(`${API}/api/mcp-gateway/servers/${serverId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolName, inputJson })
  })
  if (!res.ok) throw new Error('Failed to execute tool')
  return res.json()
}

export async function getCatalog(): Promise<CatalogEntry[]> {
  const res = await authFetch(`${API}/api/mcp-gateway/catalog`)
  if (!res.ok) throw new Error('Failed to load catalog')
  return res.json()
}

export async function getMcpGatewayStats(): Promise<McpGatewayStats> {
  const res = await authFetch(`${API}/api/mcp-gateway/stats`)
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
