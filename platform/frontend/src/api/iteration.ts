import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface FileChange {
  file: string
  operation: 'create' | 'modify' | 'delete'
  diff?: string
  explanation?: string
}

export interface IterationMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  fileChanges: FileChange[]
  tokensUsed: number | null
  createdAt: string
}

export interface SendIterationResponse {
  message: IterationMessage
  tokensUsed: number
  newBalance: number
  error?: string
}

export interface AcceptChangesResponse {
  appliedChanges: number
  modifiedFiles: string[]
  createdFiles: string[]
}

export interface RevertChangesResponse {
  success: boolean
  restoredFiles: string[]
}

export async function getChatHistory(requestId: string): Promise<IterationMessage[]> {
  const res = await fetch(`${API_BASE_URL}/api/dev-request/${requestId}/chat-history`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load chat history')
  return res.json()
}

export async function sendIterationMessage(
  requestId: string,
  message: string
): Promise<SendIterationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dev-request/${requestId}/iterate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Failed to send iteration message')
  return res.json()
}

export async function sendIterationMessageStream(
  requestId: string,
  message: string,
  onToken: (token: string) => void,
  onFileChanges: (changes: FileChange[]) => void,
  onDone: (tokensUsed: number, newBalance: number) => void,
  onError: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/dev-request/${requestId}/iterate/stream`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
    signal,
  })

  if (!res.ok) throw new Error('Failed to start iteration stream')
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let eventType = 'message'
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        const data = line.slice(6)
        try {
          const parsed = JSON.parse(data)
          if (eventType === 'error') {
            onError(parsed.error || 'Stream error')
            return
          } else if (eventType === 'file_changes') {
            onFileChanges(parsed.changes || [])
          } else if (eventType === 'done') {
            onDone(parsed.tokensUsed, parsed.newBalance)
            return
          } else if (parsed.token != null) {
            onToken(parsed.token)
          }
        } catch {
          // Skip unparseable lines
        }
        eventType = 'message'
      }
    }
  }
}

export async function acceptChanges(
  requestId: string,
  messageId: number
): Promise<AcceptChangesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dev-request/${requestId}/iterate/accept`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ messageId }),
  })
  if (!res.ok) throw new Error('Failed to accept changes')
  return res.json()
}

export async function revertChanges(
  requestId: string,
  messageId: number
): Promise<RevertChangesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dev-request/${requestId}/iterate/revert`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ messageId }),
  })
  if (!res.ok) throw new Error('Failed to revert changes')
  return res.json()
}

export async function getDiffPreview(
  requestId: string,
  message: string
): Promise<{ fileChanges: FileChange[] }> {
  const res = await fetch(`${API_BASE_URL}/api/dev-request/${requestId}/iterate/diff`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Failed to get diff preview')
  return res.json()
}

export async function undoLastIteration(requestId: string): Promise<RevertChangesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dev-request/${requestId}/iterate/undo`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to undo last iteration')
  return res.json()
}
