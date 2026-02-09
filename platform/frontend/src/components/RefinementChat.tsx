import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getChatHistory, sendChatMessage } from '../api/refinement'
import type { ChatMessage } from '../api/refinement'
import { createSuggestion } from '../api/suggestions'

interface SuggestionDetected {
  type: 'suggestion_detected'
  category: string
  title: string
  summary: string
}

interface RefinementChatProps {
  requestId: string
  onTokensUsed?: (tokensUsed: number, newBalance: number) => void
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

export default function RefinementChat({ requestId, onTokensUsed }: RefinementChatProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [pendingSuggestion, setPendingSuggestion] = useState<{ suggestion: SuggestionDetected; messageId: number } | null>(null)
  const [registering, setRegistering] = useState(false)
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
      const response = await sendChatMessage(requestId, userMessage)

      if (response.error === 'insufficient_tokens') {
        setError(t('refinement.insufficientTokens'))
        // Remove optimistic message
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
        return
      }

      // Check for suggestion detection in assistant response
      const { cleanContent, suggestion } = parseSuggestionFromContent(response.message.content)

      const cleanMessage = { ...response.message, content: cleanContent }

      // Replace temp message and add assistant response
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempMsg.id),
        { ...tempMsg, id: response.message.id - 1 },
        cleanMessage,
      ])

      if (suggestion) {
        setPendingSuggestion({ suggestion, messageId: response.message.id })
      }

      onTokensUsed?.(response.tokensUsed, response.newBalance)
    } catch {
      setError(t('refinement.sendFailed'))
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="font-medium">{t('refinement.title')}</span>
        </div>
        <span className="text-xs text-gray-400">
          {t('refinement.costPerMessage')}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">{t('refinement.emptyTitle')}</p>
            <p className="text-sm">{t('refinement.emptyDescription')}</p>
            <div className="mt-4 space-y-2">
              {['refinement.suggestion1', 'refinement.suggestion2', 'refinement.suggestion3'].map((key) => (
                <button
                  key={key}
                  onClick={() => setInput(t(key))}
                  className="block w-full text-left text-sm bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-2 text-gray-300 transition-colors"
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
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              {msg.tokensUsed != null && msg.tokensUsed > 0 && (
                <div className="text-xs mt-1 opacity-60">
                  {t('tokens.used', { count: msg.tokensUsed })}
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
              <div className="text-sm text-gray-300 mb-1">
                <strong>{pendingSuggestion.suggestion.title}</strong>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                {pendingSuggestion.suggestion.summary}
              </div>
              <div className="text-xs text-yellow-400 mb-3">
                🎁 {t('suggestions.rewardPrompt', { tokens: 50 })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRegisterSuggestion}
                  disabled={registering}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {registering ? t('suggestions.registering') : t('suggestions.confirmYes')}
                </button>
                <button
                  onClick={handleDeclineSuggestion}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  {t('suggestions.confirmNo')}
                </button>
              </div>
            </div>
          </div>
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </div>
                {t('refinement.thinking')}
              </div>
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
      <div className="border-t border-gray-700 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('refinement.placeholder')}
            rows={2}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="self-end px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
          >
            {t('refinement.send')}
          </button>
        </div>
      </div>
    </div>
  )
}
