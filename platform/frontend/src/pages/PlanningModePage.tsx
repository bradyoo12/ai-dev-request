import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlanningSession, PlanningMessage, PlanningMode, PlanningStats, PlanSummary } from '../api/planning'
import {
  listPlanningSessions,
  createPlanningSession,
  sendPlanningMessage,
  completePlanningSession,
  deletePlanningSession,
  getPlanningStats,
  getPlanningModes,
} from '../api/planning'

type Tab = 'chat' | 'sessions' | 'stats'

export default function PlanningModePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('chat')
  const [sessionName, setSessionName] = useState('')
  const [selectedMode, setSelectedMode] = useState('brainstorm')
  const [modes, setModes] = useState<PlanningMode[]>([])
  const [activeSession, setActiveSession] = useState<PlanningSession | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sessions, setSessions] = useState<PlanningSession[]>([])
  const [stats, setStats] = useState<PlanningStats | null>(null)
  const [viewSession, setViewSession] = useState<PlanningSession | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getPlanningModes().then(setModes).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'sessions') listPlanningSessions().then(setSessions).catch(() => {})
    if (tab === 'stats') getPlanningStats().then(setStats).catch(() => {})
  }, [tab])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messagesJson])

  const parseMessages = (json: string): PlanningMessage[] => {
    try { return JSON.parse(json) } catch { return [] }
  }

  const parsePlanOutput = (json: string): PlanSummary | null => {
    try {
      const parsed = JSON.parse(json)
      if (parsed && parsed.summary) return parsed
      return null
    } catch { return null }
  }

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return
    setCreating(true)
    try {
      const session = await createPlanningSession({ sessionName, mode: selectedMode })
      setActiveSession(session)
      setSessionName('')
    } catch { /* ignore */ }
    setCreating(false)
  }

  const handleSendMessage = async () => {
    if (!activeSession || !messageInput.trim()) return
    setSending(true)
    try {
      const updated = await sendPlanningMessage(activeSession.id, messageInput)
      setActiveSession(updated)
      setMessageInput('')
    } catch { /* ignore */ }
    setSending(false)
  }

  const handleCompleteSession = async () => {
    if (!activeSession) return
    try {
      const updated = await completePlanningSession(activeSession.id)
      setActiveSession(updated)
    } catch { /* ignore */ }
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await deletePlanningSession(id)
      setSessions(sessions.filter(s => s.id !== id))
      if (viewSession?.id === id) setViewSession(null)
    } catch { /* ignore */ }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-blue-900/30 text-blue-400',
      completed: 'bg-green-900/30 text-green-400',
      archived: 'bg-gray-700 text-gray-400',
    }
    return colors[status] || 'bg-gray-700 text-gray-400'
  }

  const modeBadge = (mode: string) => {
    const colors: Record<string, string> = {
      brainstorm: 'bg-purple-900/30 text-purple-400',
      architecture: 'bg-cyan-900/30 text-cyan-400',
      debug: 'bg-orange-900/30 text-orange-400',
      requirements: 'bg-emerald-900/30 text-emerald-400',
    }
    return colors[mode] || 'bg-gray-700 text-gray-400'
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{t('planning.title', 'Discussion / Planning Mode')}</h3>
      <p className="text-gray-400 text-sm mb-6">{t('planning.subtitle', 'Brainstorm, plan architecture, and debug concepts with AI without generating code -- saving tokens significantly.')}</p>

      <div className="flex gap-2 mb-6">
        {(['chat', 'sessions', 'stats'] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t(`planning.tabs.${t2}`, t2.charAt(0).toUpperCase() + t2.slice(1))}
          </button>
        ))}
      </div>

      {tab === 'chat' && (
        <div className="space-y-6">
          {!activeSession && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h4 className="font-medium mb-4">{t('planning.newSession', 'Start a New Planning Session')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('planning.sessionName', 'Session Name')}</label>
                  <input
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder={t('planning.sessionNamePlaceholder', 'e.g., Auth System Design')}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('planning.mode', 'Planning Mode')}</label>
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {modes.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} - {m.description}</option>
                    ))}
                    {modes.length === 0 && (
                      <>
                        <option value="brainstorm">Brainstorm</option>
                        <option value="architecture">Architecture</option>
                        <option value="debug">Debug</option>
                        <option value="requirements">Requirements</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <button
                onClick={handleCreateSession}
                disabled={creating || !sessionName.trim()}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? t('planning.creating', 'Creating...') : t('planning.createSession', 'Start Session')}
              </button>
            </div>
          )}

          {activeSession && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{activeSession.sessionName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${modeBadge(activeSession.mode)}`}>{activeSession.mode}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(activeSession.status)}`}>{activeSession.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {t('planning.savings', 'Est. savings')}: {activeSession.estimatedSavings.toLocaleString()} tokens
                  </span>
                  {activeSession.status === 'active' && (
                    <button
                      onClick={handleCompleteSession}
                      className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      {t('planning.complete', 'Complete Session')}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveSession(null)}
                    className="px-4 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                  >
                    {t('planning.newChat', 'New Session')}
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                {parseMessages(activeSession.messagesJson).length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">{t('planning.noMessages', 'Start the conversation by sending a message below.')}</div>
                )}
                {parseMessages(activeSession.messagesJson).map((msg, i) => (
                  <div
                    key={i}
                    className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-200 border border-gray-700'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {activeSession.status === 'active' && (
                <div className="flex gap-2">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('planning.messagePlaceholder', 'Type your message... (Enter to send, Shift+Enter for new line)')}
                    rows={2}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !messageInput.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors self-end"
                  >
                    {sending ? t('planning.sending', 'Sending...') : t('planning.send', 'Send')}
                  </button>
                </div>
              )}

              {activeSession.status === 'completed' && parsePlanOutput(activeSession.planOutputJson) && (
                <div className="bg-gray-900 border border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-400 mb-3">{t('planning.planSummary', 'Plan Summary')}</h4>
                  <p className="text-sm text-gray-300 mb-3">{parsePlanOutput(activeSession.planOutputJson)!.summary}</p>
                  {parsePlanOutput(activeSession.planOutputJson)!.keyTopics.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-400 font-medium">{t('planning.keyTopics', 'Key Topics')}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {parsePlanOutput(activeSession.planOutputJson)!.keyTopics.map((topic, i) => (
                          <span key={i} className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-0.5">{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {parsePlanOutput(activeSession.planOutputJson)!.nextSteps.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-400 font-medium">{t('planning.nextSteps', 'Next Steps')}:</span>
                      <ul className="mt-1 space-y-1">
                        {parsePlanOutput(activeSession.planOutputJson)!.nextSteps.map((step, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className="text-gray-500 mt-0.5">-</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{activeSession.totalMessages}</div>
                  <div className="text-xs text-gray-400">{t('planning.totalMessages', 'Messages')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{activeSession.userMessages}</div>
                  <div className="text-xs text-gray-400">{t('planning.userMessages', 'Your Messages')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{activeSession.tokensUsed.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{t('planning.tokensUsed', 'Tokens Used')}</div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{activeSession.estimatedSavings.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{t('planning.estSavings', 'Est. Savings')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">{t('planning.noSessions', 'No planning sessions yet. Start one from the Chat tab!')}</div>
          )}
          {viewSession && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{viewSession.sessionName}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${modeBadge(viewSession.mode)}`}>{viewSession.mode}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(viewSession.status)}`}>{viewSession.status}</span>
                </div>
                <button onClick={() => setViewSession(null)} className="text-sm text-gray-400 hover:text-white">Close</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {parseMessages(viewSession.messagesJson).map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-2 text-xs whitespace-pre-wrap ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                {viewSession.totalMessages} messages, {viewSession.tokensUsed.toLocaleString()} tokens used
              </div>
            </div>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => setViewSession(s)}>
                <div className="font-medium text-sm">{s.sessionName}</div>
                <div className="text-xs text-gray-400 mt-1">{s.totalMessages} messages, {s.tokensUsed.toLocaleString()} tokens</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded ${modeBadge(s.mode)}`}>{s.mode}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(s.status)}`}>{s.status}</span>
                <span className="text-xs text-gray-500">{new Date(s.updatedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDeleteSession(s.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  {t('planning.delete', 'Delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <div className="text-sm text-gray-400">{t('planning.stats.totalSessions', 'Total Sessions')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.activeSessions}</div>
              <div className="text-sm text-gray-400">{t('planning.stats.active', 'Active')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completedSessions}</div>
              <div className="text-sm text-gray-400">{t('planning.stats.completed', 'Completed')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <div className="text-sm text-gray-400">{t('planning.stats.messages', 'Total Messages')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTokensUsed.toLocaleString()}</div>
              <div className="text-sm text-gray-400">{t('planning.stats.tokens', 'Tokens Used')}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.estimatedSavings.toLocaleString()}</div>
              <div className="text-sm text-gray-400">{t('planning.stats.savings', 'Est. Token Savings')}</div>
            </div>
          </div>

          {stats.byMode.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">{t('planning.stats.byMode', 'Sessions by Mode')}</h4>
              <div className="space-y-2">
                {stats.byMode.map((m) => (
                  <div key={m.mode} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${modeBadge(m.mode)}`}>{m.mode}</span>
                      <span className="text-sm font-medium">{m.count} session{m.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{m.totalMessages} messages</span>
                      <span>{m.tokensUsed.toLocaleString()} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && !stats && (
        <div className="text-center py-12 text-gray-500 text-sm">{t('planning.stats.loading', 'Loading stats...')}</div>
      )}
    </div>
  )
}
