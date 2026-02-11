import { authFetch } from './auth'

export interface GenerativeUiSession {
  id: string
  devRequestId: string
  sessionName: string
  status: string
  totalMessages: number
  aiMessages: number
  userMessages: number
  generatedComponents: number
  toolCallCount: number
  streamingEnabled: boolean
  generativeUiEnabled: boolean
  activeModel: string
  totalTokensUsed: number
  estimatedCost: number
  lastMessageAt: string | null
  createdAt: string
}

export interface ChatMessage {
  role: string
  content: string
  componentType?: string | null
  toolCalls?: ToolCallRecord[] | null
  timestamp: string
}

export interface ToolCallRecord {
  name: string
  arguments: string
  result: string
}

export interface MessageResponse {
  messageId: string
  role: string
  content: string
  componentType?: string | null
  toolCalls?: ToolCallRecord[] | null
  tokensUsed: number
  timestamp: string
}

export interface GeneratedComponent {
  name: string
  type: string
  code: string
  generatedAt: string
}

export interface ToolDefinition {
  name: string
  description: string
  category: string
}

export async function getGenerativeUiSession(projectId: string): Promise<GenerativeUiSession> {
  const res = await authFetch(`/api/generative-ui/session/${projectId}`)
  if (!res.ok) throw new Error('Failed to fetch generative UI session')
  return res.json()
}

export async function updateGenerativeUiSession(
  projectId: string,
  data: { sessionName?: string; streamingEnabled?: boolean; generativeUiEnabled?: boolean; activeModel?: string }
): Promise<void> {
  const res = await authFetch(`/api/generative-ui/session/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update session')
}

export async function sendChatMessage(
  projectId: string,
  content: string,
  options?: { expectComponent?: boolean; enableToolUse?: boolean }
): Promise<MessageResponse> {
  const res = await authFetch('/api/generative-ui/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      content,
      expectComponent: options?.expectComponent ?? false,
      enableToolUse: options?.enableToolUse ?? true,
    }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function getChatMessages(projectId: string, limit = 50): Promise<{ messages: ChatMessage[] }> {
  const res = await authFetch(`/api/generative-ui/messages/${projectId}?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function getGeneratedComponents(projectId: string): Promise<{ components: GeneratedComponent[] }> {
  const res = await authFetch(`/api/generative-ui/components/${projectId}`)
  if (!res.ok) throw new Error('Failed to fetch components')
  return res.json()
}

export async function getToolDefinitions(projectId: string): Promise<{ tools: ToolDefinition[] }> {
  const res = await authFetch(`/api/generative-ui/tools/${projectId}`)
  if (!res.ok) throw new Error('Failed to fetch tools')
  return res.json()
}
