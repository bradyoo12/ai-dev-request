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
