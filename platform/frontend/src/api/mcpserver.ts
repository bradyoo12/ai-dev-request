import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface McpServer {
  id: string
  userId: string
  projectId: string
  name: string
  serverType: string   // project_context, database_schema, deployment_config
  endpoint: string
  status: string       // active, inactive, error
  toolsJson: string
  resourcesJson: string
  capabilitiesJson: string
  connectionCount: number
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
}

export interface McpServerConfig {
  name: string
  serverType: string
  endpoint: string
  projectId?: string
  toolsJson?: string
  resourcesJson?: string
  capabilitiesJson?: string
}

export interface McpServerStats {
  totalServers: number
  activeServers: number
  totalConnections: number
  serversByType: {
    projectContext: number
    databaseSchema: number
    deploymentConfig: number
  }
  recentServers: {
    id: string
    name: string
    serverType: string
    status: string
    connectionCount: number
    lastActiveAt: string | null
    createdAt: string
  }[]
}

export interface McpTool {
  name: string
  description: string
  inputSchema: string
}

export interface McpResource {
  uri: string
  name: string
  mimeType: string
  description: string
}

export async function getMcpServers(projectId?: string): Promise<McpServer[]> {
  try {
    const params = projectId ? `?projectId=${projectId}` : ''
    const res = await authFetch(`${API}/api/mcp-server${params}`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getMcpServer(id: string): Promise<McpServer | null> {
  try {
    const res = await authFetch(`${API}/api/mcp-server/${id}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function createMcpServer(config: McpServerConfig): Promise<McpServer> {
  const res = await authFetch(`${API}/api/mcp-server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return res.json()
}

export async function updateMcpServer(id: string, updates: Partial<McpServerConfig>): Promise<McpServer> {
  const res = await authFetch(`${API}/api/mcp-server/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return res.json()
}

export async function deleteMcpServer(id: string): Promise<boolean> {
  try {
    const res = await authFetch(`${API}/api/mcp-server/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export async function getMcpServerTools(id: string): Promise<{ serverId: string; serverType: string; tools: string }> {
  try {
    const res = await authFetch(`${API}/api/mcp-server/${id}/tools`)
    if (!res.ok) return { serverId: id, serverType: '', tools: '[]' }
    return res.json()
  } catch {
    return { serverId: id, serverType: '', tools: '[]' }
  }
}

export async function getMcpServerResources(id: string): Promise<{ serverId: string; serverType: string; resources: string }> {
  try {
    const res = await authFetch(`${API}/api/mcp-server/${id}/resources`)
    if (!res.ok) return { serverId: id, serverType: '', resources: '[]' }
    return res.json()
  } catch {
    return { serverId: id, serverType: '', resources: '[]' }
  }
}

export async function testMcpServerConnection(id: string): Promise<{ success: boolean; latencyMs: number; serverType: string; endpoint: string; testedAt: string }> {
  try {
    const res = await authFetch(`${API}/api/mcp-server/${id}/test`, { method: 'POST' })
    if (!res.ok) return { success: false, latencyMs: 0, serverType: '', endpoint: '', testedAt: '' }
    return res.json()
  } catch {
    return { success: false, latencyMs: 0, serverType: '', endpoint: '', testedAt: '' }
  }
}

export async function getMcpServerStats(): Promise<McpServerStats> {
  try {
    const res = await authFetch(`${API}/api/mcp-server/stats`)
    if (!res.ok) {
      return {
        totalServers: 0,
        activeServers: 0,
        totalConnections: 0,
        serversByType: { projectContext: 0, databaseSchema: 0, deploymentConfig: 0 },
        recentServers: [],
      }
    }
    return res.json()
  } catch {
    return {
      totalServers: 0,
      activeServers: 0,
      totalConnections: 0,
      serversByType: { projectContext: 0, databaseSchema: 0, deploymentConfig: 0 },
      recentServers: [],
    }
  }
}
