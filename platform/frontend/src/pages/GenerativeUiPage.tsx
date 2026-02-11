import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getGenerativeUiSession,
  updateGenerativeUiSession,
  sendChatMessage,
  getChatMessages,
  getToolDefinitions,
  type GenerativeUiSession,
  type ChatMessage,
  type ToolDefinition,
} from '../api/generativeui'

export default function GenerativeUiPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState('')
  const [session, setSession] = useState<GenerativeUiSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [tools, setTools] = useState<ToolDefinition[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'chat' | 'components' | 'tools' | 'settings'>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadSession = async () => {
    if (!projectId.trim()) return
    setLoading(true)
    setError('')
    try {
      const [sessionData, messagesData, toolsData] = await Promise.all([
        getGenerativeUiSession(projectId),
        getChatMessages(projectId),
        getToolDefinitions(projectId),
      ])
      setSession(sessionData)
      setMessages(messagesData.messages)
      setTools(toolsData.tools)
    } catch {
      setError(t('generativeUi.error.loadSession'))
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !session || sending) return
    const userMessage = input.trim()
    setInput('')
    setSending(true)

    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }])

    try {
      const response = await sendChatMessage(projectId, userMessage, {
        expectComponent: userMessage.toLowerCase().includes('component') || userMessage.toLowerCase().includes('ui'),
        enableToolUse: session.generativeUiEnabled,
      })
      setMessages(prev => [...prev, {
        role: response.role,
        content: response.content,
        componentType: response.componentType,
        toolCalls: response.toolCalls,
        timestamp: response.timestamp,
      }])
      setSession(prev => prev ? {
        ...prev,
        totalMessages: prev.totalMessages + 2,
        userMessages: prev.userMessages + 1,
        aiMessages: prev.aiMessages + 1,
        totalTokensUsed: prev.totalTokensUsed + response.tokensUsed,
      } : null)
    } catch {
      setError(t('generativeUi.error.sendMessage'))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleUpdateSettings = async (updates: { streamingEnabled?: boolean; generativeUiEnabled?: boolean; activeModel?: string }) => {
    if (!session) return
    try {
      await updateGenerativeUiSession(projectId, updates)
      setSession(prev => prev ? { ...prev, ...updates } : null)
    } catch {
      setError(t('generativeUi.error.updateSettings'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('generativeUi.title')}</h2>
        <p className="text-gray-500 mt-1">{t('generativeUi.description')}</p>
      </div>

      {!session ? (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder={t('generativeUi.projectIdPlaceholder')}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && loadSession()}
            />
            <button
              onClick={loadSession}
              disabled={loading || !projectId.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('generativeUi.loading') : t('generativeUi.startChat')}
            </button>
          </div>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </div>
      ) : (
        <>
          {/* Session Header */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${session.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <h3 className="font-semibold">{session.sessionName}</h3>
                  <p className="text-sm text-gray-500">
                    {t('generativeUi.model')}: {session.activeModel} · {t('generativeUi.tokens')}: {Math.round(session.totalTokensUsed).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{t('generativeUi.stats.messages')}: {session.totalMessages}</span>
                <span>{t('generativeUi.stats.components')}: {session.generatedComponents}</span>
                <span>{t('generativeUi.stats.toolCalls')}: {session.toolCallCount}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b pb-2">
            {(['chat', 'components', 'tools', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t(`generativeUi.tab.${tab}`)}
              </button>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="bg-white rounded-lg border flex flex-col" style={{ height: '500px' }}>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 mt-20">
                    <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p>{t('generativeUi.emptyChat')}</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.componentType && (
                        <div className="mt-2 p-2 bg-white/10 rounded border border-white/20 text-xs">
                          <span className="font-medium">{t('generativeUi.componentGenerated')}: </span>
                          <span className="font-mono">{msg.componentType}</span>
                        </div>
                      )}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.toolCalls.map((tc, j) => (
                            <div key={j} className="p-2 bg-white/10 rounded border border-white/20 text-xs">
                              <span className="font-medium">{t('generativeUi.toolCall')}: </span>
                              <span className="font-mono">{tc.name}</span>
                              <span className="text-gray-400 ml-2">→ {tc.result}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-3">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('generativeUi.inputPlaceholder')}
                    className="flex-1 px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={2}
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 self-end"
                  >
                    {sending ? t('generativeUi.sending') : t('generativeUi.send')}
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{t('generativeUi.streamingLabel')}: {session.streamingEnabled ? '✓' : '✗'}</span>
                  <span>{t('generativeUi.generativeUiLabel')}: {session.generativeUiEnabled ? '✓' : '✗'}</span>
                  <span>{t('generativeUi.enterToSend')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Components Tab */}
          {activeTab === 'components' && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('generativeUi.componentsTitle')}</h3>
              {session.generatedComponents === 0 ? (
                <p className="text-gray-400 text-center py-8">{t('generativeUi.noComponents')}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: session.generatedComponents }, (_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Component {i + 1}</span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">generated</span>
                      </div>
                      <div className="bg-gray-50 rounded p-3 font-mono text-xs text-gray-600">
                        {'<GeneratedComponent />'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('generativeUi.toolsTitle')}</h3>
              <div className="space-y-3">
                {tools.map((tool, i) => (
                  <div key={i} className="border rounded-lg p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{tool.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded mt-2 inline-block">{tool.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <h3 className="font-semibold">{t('generativeUi.settingsTitle')}</h3>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">{t('generativeUi.enableStreaming')}</p>
                  <p className="text-xs text-gray-500">{t('generativeUi.enableStreamingDesc')}</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings({ streamingEnabled: !session.streamingEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${session.streamingEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${session.streamingEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">{t('generativeUi.enableGenerativeUi')}</p>
                  <p className="text-xs text-gray-500">{t('generativeUi.enableGenerativeUiDesc')}</p>
                </div>
                <button
                  onClick={() => handleUpdateSettings({ generativeUiEnabled: !session.generativeUiEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${session.generativeUiEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${session.generativeUiEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="py-3 border-b">
                <p className="font-medium text-sm mb-2">{t('generativeUi.modelSelection')}</p>
                <select
                  value={session.activeModel}
                  onChange={e => handleUpdateSettings({ activeModel: e.target.value })}
                  className="px-4 py-2 border rounded-lg w-full max-w-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                  <option value="claude-opus-4-6">Claude Opus 4.6</option>
                  <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                </select>
              </div>

              <div className="py-3">
                <h4 className="font-medium text-sm mb-3">{t('generativeUi.sessionStats')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{session.totalMessages}</p>
                    <p className="text-xs text-gray-500">{t('generativeUi.stats.totalMessages')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{session.generatedComponents}</p>
                    <p className="text-xs text-gray-500">{t('generativeUi.stats.generatedComponents')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{session.toolCallCount}</p>
                    <p className="text-xs text-gray-500">{t('generativeUi.stats.toolCallsTotal')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">${session.estimatedCost.toFixed(4)}</p>
                    <p className="text-xs text-gray-500">{t('generativeUi.stats.estimatedCost')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
