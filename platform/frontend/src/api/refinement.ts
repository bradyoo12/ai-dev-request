import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  tokensUsed: number | null
  createdAt: string
}

export interface SendMessageResponse {
  message: ChatMessage
  tokensUsed: number
  newBalance: number
  error?: string
}

export async function getChatHistory(requestId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/chat`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load chat history')
  return res.json()
}

export async function sendChatMessage(requestId: string, message: string): Promise<SendMessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function sendChatMessageStream(
  requestId: string,
  message: string,
  onToken: (token: string) => void,
  onDone: (tokensUsed: number, newBalance: number) => void,
  onError: (error: string) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/requests/${requestId}/chat/stream`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  })

  if (!res.ok) throw new Error('Failed to start stream')
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
