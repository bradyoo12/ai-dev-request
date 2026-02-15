import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getAvailableUsers,
  type ConversationSummary,
  type Message,
  type MessageUser,
} from '../api/messages'

export default function MessagesPage() {
  const { t } = useTranslation()
  const { authUser, requireAuth } = useAuth()

  // Conversation list state
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)

  // Active conversation state
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // New message state
  const [messageContent, setMessageContent] = useState('')
  const [sending, setSending] = useState(false)

  // New conversation state
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<MessageUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  // Unread count
  const [unreadTotal, setUnreadTotal] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
    loadUnreadCount()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    setLoadingConversations(true)
    try {
      const data = await getConversations()
      setConversations(data)
    } catch {
      // silently fail
    } finally {
      setLoadingConversations(false)
    }
  }

  async function loadUnreadCount() {
    try {
      const data = await getUnreadCount()
      setUnreadTotal(data.count)
    } catch {
      // silently fail
    }
  }

  async function openConversation(otherUserId: string) {
    setActiveUserId(otherUserId)
    setShowNewConversation(false)
    setLoadingMessages(true)
    try {
      const data = await getConversation(otherUserId)
      setMessages(data)
      // Mark unread messages as read
      const unreadMessages = data.filter(
        (m) => m.receiverId === authUser?.id && !m.isRead
      )
      for (const msg of unreadMessages) {
        await markAsRead(msg.id)
      }
      if (unreadMessages.length > 0) {
        loadConversations()
        loadUnreadCount()
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMessages(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!activeUserId || !messageContent.trim()) return
    if (!requireAuth()) return

    setSending(true)
    try {
      const newMsg = await sendMessage(activeUserId, messageContent.trim())
      setMessages((prev) => [...prev, newMsg])
      setMessageContent('')
      loadConversations()
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  async function handleStartNewConversation() {
    setShowNewConversation(true)
    setActiveUserId(null)
    setMessages([])
    setLoadingUsers(true)
    try {
      const users = await getAvailableUsers()
      setAvailableUsers(users)
    } catch {
      // silently fail
    } finally {
      setLoadingUsers(false)
    }
  }

  function selectUser(user: MessageUser) {
    setShowNewConversation(false)
    openConversation(user.id)
  }

  function getDisplayName(conv: ConversationSummary) {
    return conv.otherUserDisplayName || conv.otherUserEmail || conv.otherUserId
  }

  function getActiveDisplayName() {
    if (!activeUserId) return ''
    const conv = conversations.find((c) => c.otherUserId === activeUserId)
    if (conv) return getDisplayName(conv)
    return activeUserId
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return t('messages.yesterday')
    } else if (diffDays < 7) {
      return `${diffDays}${t('messages.daysAgo')}`
    } else {
      return date.toLocaleDateString()
    }
  }

  const filteredUsers = availableUsers.filter((u) => {
    const search = userSearch.toLowerCase()
    return (
      (u.displayName?.toLowerCase().includes(search) ?? false) ||
      u.email.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('messages.title')}</h1>
        {unreadTotal > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-accent-blue/20 text-accent-blue text-sm font-medium">
            {unreadTotal} {t('messages.unread')}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Conversation list sidebar */}
        <div className="w-full md:w-80 flex-shrink-0 glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-warm-700/50">
            <button
              onClick={handleStartNewConversation}
              className="w-full px-4 py-2 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded-lg text-sm font-medium transition-colors"
            >
              {t('messages.newConversation')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-warm-400 py-8 text-sm">
                {t('messages.noConversations')}
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.otherUserId}
                  onClick={() => openConversation(conv.otherUserId)}
                  className={`w-full text-left p-3 hover:bg-warm-800/50 transition-colors border-b border-warm-700/30 ${
                    activeUserId === conv.otherUserId ? 'bg-warm-800/70' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">
                      {getDisplayName(conv)}
                    </span>
                    <span className="text-xs text-warm-500 flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-warm-400 truncate">
                      {conv.lastMessageContent}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-accent-blue text-white text-xs font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
          {showNewConversation ? (
            // New conversation user picker
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-warm-700/50">
                <h2 className="text-lg font-semibold mb-2">
                  {t('messages.selectRecipient')}
                </h2>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('messages.searchUsers')}
                  className="w-full px-3 py-2 bg-warm-800/50 border border-warm-700/50 rounded-lg text-sm text-warm-100 placeholder:text-warm-500 focus:outline-none focus:border-accent-blue/50"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center text-warm-400 py-8 text-sm">
                    {t('messages.noUsersFound')}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="w-full text-left p-3 hover:bg-warm-800/50 transition-colors border-b border-warm-700/30"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue text-sm font-bold">
                          {(user.displayName || user.email)[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {user.displayName || user.email}
                            {user.isAdmin && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-500/20 text-amber-300">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-warm-400">{user.email}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : activeUserId ? (
            // Active conversation
            <>
              <div className="p-4 border-b border-warm-700/50">
                <h2 className="text-lg font-semibold">{getActiveDisplayName()}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-warm-400 py-8 text-sm">
                    {t('messages.noMessages')}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.senderId === authUser?.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                            isSent
                              ? 'bg-accent-blue/20 text-warm-100 rounded-tr-sm'
                              : 'bg-warm-800/70 text-warm-200 rounded-tl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={`text-xs mt-1 ${
                              isSent ? 'text-accent-blue/60' : 'text-warm-500'
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                            {isSent && msg.isRead && (
                              <span className="ml-1.5">{t('messages.read')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-warm-700/50 flex gap-2"
              >
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={t('messages.typePlaceholder')}
                  maxLength={5000}
                  className="flex-1 px-4 py-2 bg-warm-800/50 border border-warm-700/50 rounded-xl text-sm text-warm-100 placeholder:text-warm-500 focus:outline-none focus:border-accent-blue/50"
                />
                <button
                  type="submit"
                  disabled={sending || !messageContent.trim()}
                  className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {sending ? t('messages.sending') : t('messages.send')}
                </button>
              </form>
            </>
          ) : (
            // No conversation selected
            <div className="flex-1 flex items-center justify-center text-warm-400 text-sm">
              {t('messages.selectConversation')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
