import { getAuthHeaders } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
  readAt: string | null
}

export interface ConversationSummary {
  otherUserId: string
  otherUserDisplayName: string | null
  otherUserEmail: string | null
  lastMessageContent: string
  lastMessageAt: string
  unreadCount: number
}

export interface MessageUser {
  id: string
  displayName: string | null
  email: string
  isAdmin: boolean
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/messages`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load conversations')
  return res.json()
}

export async function getConversation(otherUserId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE_URL}/api/messages/conversation/${otherUserId}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to load conversation')
  return res.json()
}

export async function sendMessage(receiverId: string, content: string): Promise<Message> {
  const res = await fetch(`${API_BASE_URL}/api/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ receiverId, content }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function markAsRead(messageId: string): Promise<{ id: string; isRead: boolean; readAt: string }> {
  const res = await fetch(`${API_BASE_URL}/api/messages/${messageId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to mark message as read')
  return res.json()
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to get unread count')
  return res.json()
}

export async function getAvailableUsers(): Promise<MessageUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/messages/users`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to get available users')
  return res.json()
}
