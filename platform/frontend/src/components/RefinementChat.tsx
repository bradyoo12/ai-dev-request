import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getChatHistory, sendChatMessage, sendChatMessageStream, applyChanges } from '../api/refinement'
import type { ChatMessage } from '../api/refinement'
import { createSuggestion } from '../api/suggestions'

interface SuggestionDetected {
  type: 'suggestion_detected'
  category: string
  title: string
  summary: string
}

interface FollowUpAction {
  label: string
  message: string
}

interface RefinementChatProps {
  requestId: string
  onTokensUsed?: (tokensUsed: number, newBalance: number) => void
}

function hasFileChanges(content: string): boolean {
  return /\*\*File:\s*`[^`]+`\*\*\s*\n```/.test(content)
}

function countFileChanges(content: string): number {
  const matches = content.match(/\*\*File:\s*`[^`]+`\*\*/g)
  return matches ? matches.length : 0
}

function parseSuggestionFromContent(content: string): { cleanContent: string; suggestion: SuggestionDetected | null } {
  const regex = /```suggestion_detected\n([\s\S]*?)\n```/
  const match = content.match(regex)

  if (!match) return { cleanContent: content, suggestion: null }

  try {
    const suggestion = JSON.parse(match[1]) as SuggestionDetected
    if (suggestion.type === 'suggestion_detected') {
      const cleanContent = content.replace(regex, '').trim()
      return { cleanContent, suggestion }
    }
  } catch {
    // Parse failed, not a valid suggestion block
  }

  return { cleanContent: content, suggestion: null }
}

function parseFollowUpActions(content: string): { cleanContent: string; actions: FollowUpAction[] } {
  const regex = /```follow_up_actions\n([\s\S]*?)\n```/
  const match = content.match(regex)

  if (!match) return { cleanContent: content, actions: [] }

  try {
    const actions = JSON.parse(match[1]) as FollowUpAction[]
    if (Array.isArray(actions) && actions.every(a => a.label && a.message)) {
      const cleanContent = content.replace(regex, '').trim()
      return { cleanContent, actions }
    }
  } catch {
    // Parse failed, not valid follow-up actions
  }

  return { cleanContent: content, actions: [] }
}

export default function RefinementChat({ requestId, onTokensUsed }: RefinementChatProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [pendingSuggestion, setPendingSuggestion] = useState<{ suggestion: SuggestionDetected; messageId: number } | null>(null)
  const [registering, setRegistering] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [appliedMessages, setAppliedMessages] = useState<Set<number>>(new Set())
  const [applyingId, setApplyingId] = useState<number | null>(null)
  const [followUpActions, setFollowUpActions] = useState<FollowUpAction[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadHistory = useCallback(async () => {
    try {
      const history = await getChatHistory(requestId)
      setMessages(history)
    } catch {
      // No history yet, that's fine
    }
  }, [requestId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setError('')
    setSending(true)
    setPendingSuggestion(null)
    setStreamingContent('')
    setFollowUpActions([])

    // Optimistic add user message
    const tempMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      tokensUsed: null,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      // Try streaming first
      let streamed = ''
      await sendChatMessageStream(
        requestId,
        userMessage,
        (token) => {
          streamed += token
          setStreamingContent(prev => prev + token)
        },
        (tokensUsed, newBalance) => {
          // Stream complete — finalize message
          const { cleanContent: contentWithoutSuggestion, suggestion } = parseSuggestionFromContent(streamed)
          const { cleanContent, actions } = parseFollowUpActions(contentWithoutSuggestion)
          const assistantMsg: ChatMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: cleanContent,
            tokensUsed,
            createdAt: new Date().toISOString(),
          }
          setMessages(prev => [...prev, assistantMsg])
          setStreamingContent('')
          setSending(false)
          setFollowUpActions(actions)

          if (suggestion) {
            setPendingSuggestion({ suggestion, messageId: assistantMsg.id })
          }

          onTokensUsed?.(tokensUsed, newBalance)
        },
        (errorMsg) => {
          if (errorMsg === 'insufficient_tokens') {
            setError(t('refinement.insufficientTokens'))
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
          } else {
            setError(errorMsg)
          }
          setStreamingContent('')
          setSending(false)
        },
      )
    } catch {
      // Fallback to non-streaming endpoint
      setStreamingContent('')
      try {
        const response = await sendChatMessage(requestId, userMessage)

        if (response.error === 'insufficient_tokens') {
          setError(t('refinement.insufficientTokens'))
          setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
          return
        }

        const { cleanContent: contentWithoutSuggestion, suggestion } = parseSuggestionFromContent(response.message.content)
        const { cleanContent, actions } = parseFollowUpActions(contentWithoutSuggestion)
        const cleanMessage = { ...response.message, content: cleanContent }

        setMessages(prev => [
          ...prev.filter(m => m.id !== tempMsg.id),
          { ...tempMsg, id: response.message.id - 1 },
          cleanMessage,
        ])
        setFollowUpActions(actions)

        if (suggestion) {
          setPendingSuggestion({ suggestion, messageId: response.message.id })
        }

        onTokensUsed?.(response.tokensUsed, response.newBalance)
      } catch {
        setError(t('refinement.sendFailed'))
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      }
    } finally {
      setSending(false)
    }
  }

  const handleRegisterSuggestion = async () => {
    if (!pendingSuggestion || registering) return
    setRegistering(true)

    try {
      const result = await createSuggestion(
        pendingSuggestion.suggestion.title,
        pendingSuggestion.suggestion.summary,
        pendingSuggestion.suggestion.category,
        requestId
      )

      // Add a confirmation message
      const confirmMsg: ChatMessage = {
        id: Date.now(),
        role: 'assistant',
        content: t('suggestions.registered', {
          id: result.suggestion.id,
          title: result.suggestion.title,
          tokens: result.tokensAwarded,
        }),
        tokensUsed: null,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, confirmMsg])

      onTokensUsed?.(0, result.newBalance)
      setPendingSuggestion(null)
    } catch {
      setError(t('suggestions.registerFailed'))
    } finally {
      setRegistering(false)
    }
  }

  const handleDeclineSuggestion = () => {
    setPendingSuggestion(null)
  }

  const handleApplyChanges = async (msg: ChatMessage) => {
    if (applyingId || appliedMessages.has(msg.id)) return
    setApplyingId(msg.id)
    try {
      const result = await applyChanges(requestId, msg.content)
      setAppliedMessages(prev => new Set(prev).add(msg.id))

      const allFiles = [...result.modifiedFiles, ...result.createdFiles]
      const confirmMsg: ChatMessage = {
        id: Date.now(),
        role: 'assistant',
        content: t('refinement.changesApplied', { count: result.totalChanges }) +
          '\n' + allFiles.map(f => `- ${f}`).join('\n'),
        tokensUsed: null,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, confirmMsg])
    } catch {
      setError(t('refinement.applyFailed'))
    } finally {
      setApplyingId(null)
    }
  }

  const handleFollowUpClick = (action: FollowUpAction) => {
    setInput(action.message)
    setFollowUpActions([])
    // Auto-send after a brief delay so user can see what's being sent
    setTimeout(() => {
      const sendBtn = document.querySelector('[data-send-btn]') as HTMLButtonElement
      sendBtn?.click()
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-warm-900 rounded-2xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
      {/* Header */}
      <div className="bg-warm-800 px-4 py-3 border-b border-warm-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="font-medium">{t('refinement.title')}</span>
        </div>
        <span className="text-xs text-warm-400">
          {t('refinement.costPerMessage')}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-warm-500 py-8">
            <p className="text-lg mb-2">{t('refinement.emptyTitle')}</p>
            <p className="text-sm">{t('refinement.emptyDescription')}</p>
            <div className="mt-4 space-y-2">
              {['refinement.suggestion1', 'refinement.suggestion2', 'refinement.suggestion3'].map((key) => (
                <button
                  key={key}
                  onClick={() => setInput(t(key))}
                  className="block w-full text-left text-sm bg-warm-800 hover:bg-warm-700 rounded-lg px-4 py-2 text-warm-300 transition-colors"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-warm-800 text-warm-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              {msg.tokensUsed != null && msg.tokensUsed > 0 && (
                <div className="text-xs mt-1 opacity-60">
                  {t('tokens.used', { count: msg.tokensUsed })}
                </div>
              )}
              {msg.role === 'assistant' && hasFileChanges(msg.content) && (
                <div className="mt-2 pt-2 border-t border-warm-700">
                  {appliedMessages.has(msg.id) ? (
                    <span className="text-xs text-green-400 font-medium">
                      {t('refinement.changesAppliedBadge')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApplyChanges(msg)}
                      disabled={applyingId === msg.id}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-warm-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      {applyingId === msg.id
                        ? t('refinement.applying')
                        : t('refinement.applyChanges', { count: countFileChanges(msg.content) })}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Suggestion Confirmation Prompt */}
        {pendingSuggestion && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-700/50 rounded-2xl px-4 py-3">
              <div className="text-sm font-medium text-yellow-300 mb-2">
                💡 {t('suggestions.confirmPrompt')}
              </div>
              <div className="text-sm text-warm-300 mb-1">
                <strong>{pendingSuggestion.suggestion.title}</strong>
              </div>
              <div className="text-xs text-warm-400 mb-3">
                {pendingSuggestion.suggestion.summary}
              </div>
              <div className="text-xs text-yellow-400 mb-3">
                🎁 {t('suggestions.rewardPrompt', { tokens: 50 })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRegisterSuggestion}
                  disabled={registering}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-warm-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {registering ? t('suggestions.registering') : t('suggestions.confirmYes')}
                </button>
                <button
                  onClick={handleDeclineSuggestion}
                  className="px-3 py-1.5 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
                >
                  {t('suggestions.confirmNo')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Follow-Up Action Chips */}
        {followUpActions.length > 0 && !sending && (
          <div className="flex flex-wrap gap-2 px-1">
            {followUpActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleFollowUpClick(action)}
                className="px-3 py-1.5 bg-warm-800 hover:bg-warm-700 border border-warm-600 rounded-full text-sm text-warm-200 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-warm-800 rounded-2xl px-4 py-3">
              {streamingContent ? (
                <div className="whitespace-pre-wrap text-sm text-warm-100">
                  {streamingContent}
                  <span className="inline-block w-2 h-4 bg-blue-400 ml-0.5 animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-warm-400 text-sm">
                  <div className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </div>
                  {t('refinement.thinking')}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-700 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-warm-700 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('refinement.placeholder')}
            rows={2}
            className="flex-1 bg-warm-800 border border-warm-700 rounded-xl px-4 py-2.5 text-white placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          <button
            data-send-btn
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="self-end px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-700 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
          >
            {t('refinement.send')}
          </button>
        </div>
      </div>
    </div>
  )
}
