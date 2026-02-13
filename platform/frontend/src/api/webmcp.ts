import { authFetch } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export interface WebMcpSession {
  id: string
  targetUrl: string
  browserType: string
  elementsDiscovered: number
  actionsPerformed: number
  eventsCaptured: number
  domNodesAnalyzed: number
  semanticAccuracy: number
  actionReliability: number
  sessionDurationMs: number
  protocol: string
  status: string
  createdAt: string
}

export interface McpAction {
  id: number
  type: string
  selector: string
  success: boolean
  durationMs: number
}

export interface McpEvent {
  id: number
  type: string
  target: string
  timestamp: string
}

export interface SemanticElement {
  type: string
  count: number
  examples: string[]
}

export interface ConnectResponse {
  session: WebMcpSession
  actions: McpAction[]
  events: McpEvent[]
  semanticElements: SemanticElement[]
  capabilities: {
    directDomAccess: boolean
    eventListening: boolean
    semanticUnderstanding: boolean
    crossBrowser: boolean
    formAutoFill: boolean
    screenshotFree: boolean
  }
}

export interface BrowserInfo {
  id: string
  name: string
  description: string
  supported: boolean
  color: string
}

export interface McpStats {
  totalSessions: number
  avgSemanticAccuracy?: number
  avgActionReliability?: number
  totalActions?: number
  totalEvents?: number
  totalElements?: number
  byBrowser?: { browser: string; count: number; avgAccuracy: number }[]
}

export async function listSessions(): Promise<WebMcpSession[]> {
  const res = await authFetch(`${API}/api/webmcp`)
  if (!res.ok) return []
  return res.json()
}

export async function connect(targetUrl: string, browserType: string, protocol: string): Promise<ConnectResponse> {
  const res = await authFetch(`${API}/api/webmcp/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl, browserType, protocol })
  })
  return res.json()
}

export async function deleteSession(id: string): Promise<void> {
  await authFetch(`${API}/api/webmcp/${id}`, { method: 'DELETE' })
}

export async function getMcpStats(): Promise<McpStats> {
  const res = await authFetch(`${API}/api/webmcp/stats`)
  if (!res.ok) return { totalSessions: 0 }
  return res.json()
}

export async function getBrowsers(): Promise<BrowserInfo[]> {
  const res = await fetch(`${API}/api/webmcp/browsers`)
  if (!res.ok) return []
  return res.json()
}
