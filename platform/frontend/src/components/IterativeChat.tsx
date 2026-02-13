import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getChatHistory, sendIterationMessage, sendIterationMessageStream, acceptChanges, revertChanges } from '../api/iteration'
import type { IterationMessage, FileChange } from '../api/iteration'

interface IterativeChatProps {
  requestId: string
  onTokensUsed?: (tokensUsed: number, newBalance: number) => void
  onFilesChanged?: (changes: FileChange[]) => void
}

interface MessageWithChanges extends IterationMessage {
  isPending?: boolean
  changeStatus?: 'pending' | 'accepted' | 'reverted'
}

export default function IterativeChat({ requestId, onTokensUsed, onFilesChanged }: IterativeChatProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<MessageWithChanges[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [revertingId, setRevertingId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadHistory = useCallback(async () => {
    try {
      const history = await getChatHistory(requestId)
      setMessages(history.map(msg => ({
        ...msg,
        changeStatus: msg.fileChanges && msg.fileChanges.length > 0 ? 'accepted' : undefined
      })))
    } catch {
      // No history yet
    }
  }, [requestId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setError('')
    setSending(true)
    setStreamingContent('')

    const tempMsg: MessageWithChanges = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      fileChanges: [],
      tokensUsed: null,
      createdAt: new Date().toISOString(),
      isPending: true
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      // Try streaming
      let streamed = ''
      let fileChanges: FileChange[] = []

      await sendIterationMessageStream(
        requestId,
        userMessage,
        (token) => {
          streamed += token
          setStreamingContent(prev => prev + token)
        },
        (changes) => {
          fileChanges = changes
        },
        (tokensUsed, newBalance) => {
          const assistantMsg: MessageWithChanges = {
            id: Date.now() + 1,
            role: 'assistant',
            content: streamed,
            fileChanges,
            tokensUsed,
            createdAt: new Date().toISOString(),
            changeStatus: fileChanges.length > 0 ? 'pending' : undefined
          }
          setMessages(prev => [
            ...prev.filter(m => m.id !== tempMsg.id),
            { ...tempMsg, isPending: false },
            assistantMsg
          ])
          setStreamingContent('')
          setSending(false)

          onTokensUsed?.(tokensUsed, newBalance)
          if (fileChanges.length > 0) {
            onFilesChanged?.(fileChanges)
          }
        },
        (errorMsg) => {
          if (errorMsg === 'insufficient_tokens') {
            setError(t('iteration.insufficientTokens'))
          } else {
            setError(errorMsg)
          }
          setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
          setStreamingContent('')
          setSending(false)
        }
      )
    } catch {
      // Fallback to non-streaming
      setStreamingContent('')
      try {
        const response = await sendIterationMessage(requestId, userMessage)

        if (response.error === 'insufficient_tokens') {
          setError(t('iteration.insufficientTokens'))
          setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
          return
        }

        const assistantMsg: MessageWithChanges = {
          ...response.message,
          changeStatus: response.message.fileChanges.length > 0 ? 'pending' : undefined
        }

        setMessages(prev => [
          ...prev.filter(m => m.id !== tempMsg.id),
          { ...tempMsg, isPending: false },
          assistantMsg
        ])

        onTokensUsed?.(response.tokensUsed, response.newBalance)
        if (response.message.fileChanges.length > 0) {
          onFilesChanged?.(response.message.fileChanges)
        }
      } catch {
        setError(t('iteration.sendFailed'))
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      }
    } finally {
      setSending(false)
    }
  }

  const handleAcceptChanges = async (msg: MessageWithChanges) => {
    if (acceptingId || !msg.fileChanges || msg.fileChanges.length === 0) return
    setAcceptingId(msg.id)

    try {
      const result = await acceptChanges(requestId, msg.id)

      setMessages(prev => prev.map(m =>
        m.id === msg.id ? { ...m, changeStatus: 'accepted' as const } : m
      ))

      const confirmMsg: MessageWithChanges = {
        id: Date.now(),
        role: 'assistant',
        content: t('iteration.changesAccepted', {
          count: result.appliedChanges,
          files: result.modifiedFiles.join(', ')
        }),
        fileChanges: [],
        tokensUsed: null,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, confirmMsg])

      onFilesChanged?.(msg.fileChanges || [])
    } catch {
      setError(t('iteration.acceptFailed'))
    } finally {
      setAcceptingId(null)
    }
  }

  const handleRevertChanges = async (msg: MessageWithChanges) => {
    if (revertingId || !msg.fileChanges || msg.fileChanges.length === 0) return
    setRevertingId(msg.id)

    try {
      await revertChanges(requestId, msg.id)

      setMessages(prev => prev.map(m =>
        m.id === msg.id ? { ...m, changeStatus: 'reverted' as const } : m
      ))

      const confirmMsg: MessageWithChanges = {
        id: Date.now(),
        role: 'assistant',
        content: t('iteration.changesReverted'),
        fileChanges: [],
        tokensUsed: null,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, confirmMsg])

      // Reload history to get previous state
      await loadHistory()
    } catch {
      setError(t('iteration.revertFailed'))
    } finally {
      setRevertingId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getFileChangeSummary = (fileChanges: FileChange[]) => {
    const modified = fileChanges.filter(f => f.operation === 'modify').length
    const created = fileChanges.filter(f => f.operation === 'create').length
    const deleted = fileChanges.filter(f => f.operation === 'delete').length

    const parts = []
    if (modified > 0) parts.push(t('iteration.filesModified', { count: modified }))
    if (created > 0) parts.push(t('iteration.filesCreated', { count: created }))
    if (deleted > 0) parts.push(t('iteration.filesDeleted', { count: deleted }))

    return parts.join(', ')
  }

  return (
    <div className="bg-warm-900 rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-warm-800 px-4 py-3 border-b border-warm-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="font-medium">{t('iteration.title')}</span>
        </div>
        <span className="text-xs text-warm-400">
          {t('iteration.costPerMessage')}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !sending && (
          <div className="text-center text-warm-500 py-8">
            <p className="text-lg mb-2">{t('iteration.emptyTitle')}</p>
            <p className="text-sm">{t('iteration.emptyDescription')}</p>
            <div className="mt-4 space-y-2">
              {['iteration.suggestion1', 'iteration.suggestion2', 'iteration.suggestion3'].map((key) => (
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

              {/* File Changes Indicator */}
              {msg.role === 'assistant' && msg.fileChanges && msg.fileChanges.length > 0 && (
                <div className="mt-3 pt-3 border-t border-warm-700 space-y-2">
                  <div className="text-xs text-warm-400">
                    📁 {getFileChangeSummary(msg.fileChanges)}
                  </div>

                  <div className="space-y-1">
                    {msg.fileChanges.slice(0, 3).map((change, idx) => (
                      <div key={idx} className="text-xs text-warm-300 font-mono">
                        <span className={`inline-block w-5 ${
                          change.operation === 'create' ? 'text-green-400' :
                          change.operation === 'delete' ? 'text-red-400' :
                          'text-blue-400'
                        }`}>
                          {change.operation === 'create' ? '+' : change.operation === 'delete' ? '-' : 'M'}
                        </span>
                        {change.file}
                      </div>
                    ))}
                    {msg.fileChanges.length > 3 && (
                      <div className="text-xs text-warm-500">
                        +{msg.fileChanges.length - 3} more files
                      </div>
                    )}
                  </div>

                  {/* Accept/Revert Buttons */}
                  {msg.changeStatus === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleAcceptChanges(msg)}
                        disabled={acceptingId === msg.id}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-warm-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        {acceptingId === msg.id ? t('iteration.accepting') : t('iteration.acceptChanges')}
                      </button>
                      <button
                        onClick={() => handleRevertChanges(msg)}
                        disabled={revertingId === msg.id}
                        className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-warm-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        {revertingId === msg.id ? t('iteration.reverting') : t('iteration.revertChanges')}
                      </button>
                    </div>
                  )}

                  {msg.changeStatus === 'accepted' && (
                    <div className="text-xs text-green-400 font-medium pt-2">
                      ✓ {t('iteration.changesAcceptedBadge')}
                    </div>
                  )}

                  {msg.changeStatus === 'reverted' && (
                    <div className="text-xs text-red-400 font-medium pt-2">
                      ✗ {t('iteration.changesRevertedBadge')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

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
                  {t('iteration.thinking')}
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
            placeholder={t('iteration.placeholder')}
            rows={2}
            className="flex-1 bg-warm-800 border border-warm-700 rounded-xl px-4 py-2.5 text-white placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="self-end px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-700 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
          >
            {t('iteration.send')}
          </button>
        </div>
      </div>
    </div>
  )
}
