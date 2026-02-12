import { authFetch } from './auth'

export interface McpToolConfig {
  id: string
  userId: string
  mcpEnabled: boolean
  autoAttachTools: boolean
  contextDepthLevel: string
  fileReadEnabled: boolean
  fileWriteEnabled: boolean
  searchDocsEnabled: boolean
  resolveDepsEnabled: boolean
  queryDbEnabled: boolean
  runTestsEnabled: boolean
  lintCodeEnabled: boolean
  browseWebEnabled: boolean
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgLatencyMs: number
  tokensSaved: number
  executionHistoryJson: string
  customServersJson: string
  createdAt: string
  updatedAt: string
}

export interface McpTool {
  id: string
  name: string
  description: string
  category: string
  icon: string
}

export interface ToolExecutionResult {
  toolName: string
  input: string
  output: string
  success: boolean
  latencyMs: number
  tokensSaved: number
  timestamp: string
}

export interface ToolExecutionEntry {
  toolName: string
  input: string
  output: string
  success: boolean
  latencyMs: number
  timestamp: string
}

export interface McpToolStats {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  avgLatencyMs: number
  tokensSaved: number
  byToolType: { toolName: string; count: number; successCount: number; avgLatency: number }[]
  mostUsedTool: string | null
  customServers: number
}

export async function getMcpToolConfig(): Promise<McpToolConfig> {
  const res = await authFetch('/api/mcp-tools/config')
  if (!res.ok) throw new Error('Failed to get MCP tool config')
  return res.json()
}

export async function updateMcpToolConfig(data: Partial<McpToolConfig>): Promise<McpToolConfig> {
  const res = await authFetch('/api/mcp-tools/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update MCP tool config')
  return res.json()
}

export async function listMcpTools(): Promise<McpTool[]> {
  const res = await authFetch('/api/mcp-tools/tools')
  if (!res.ok) throw new Error('Failed to list MCP tools')
  return res.json()
}

export async function executeMcpTool(toolName: string, input?: string): Promise<ToolExecutionResult> {
  const res = await authFetch('/api/mcp-tools/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolName, input }),
  })
  if (!res.ok) throw new Error('Failed to execute tool')
  return res.json()
}

export async function getMcpToolHistory(): Promise<ToolExecutionEntry[]> {
  const res = await authFetch('/api/mcp-tools/history')
  if (!res.ok) throw new Error('Failed to get tool history')
  return res.json()
}

export async function getMcpToolStats(): Promise<McpToolStats> {
  const res = await authFetch('/api/mcp-tools/stats')
  if (!res.ok) throw new Error('Failed to get tool stats')
  return res.json()
}
