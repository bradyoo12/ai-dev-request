import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createSession,
  getSession,
  joinSession,
  updateDocument,
  endSession,
  getSessionHistory,
  type CollaborativeSession,
  type ActivityEntry,
} from '../api/collaborative-editing'

export default function CollaborativeEditingPage() {
  const { t } = useTranslation()
  const [projectId, setProjectId] = useState(1)
  const [session, setSession] = useState<CollaborativeSession | null>(null)
  const [history, setHistory] = useState<CollaborativeSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [documentText, setDocumentText] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'activity'>('editor')
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadSession()
  }, [projectId])

  async function loadSession() {
    setLoading(true)
    setError('')
    try {
      const result = await getSession(projectId)
      setSession(result)
      if (result?.documentContent) {
        setDocumentText(result.documentContent)
      }
    } catch {
      // No active session is normal
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSession() {
    setError('')
    try {
      const result = await createSession(projectId, sessionName)
      setSession(result)
      setDocumentText(result.documentContent || '')
      setSessionName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('collaborativeEditing.error.createFailed', 'Failed to create session'))
    }
  }

  async function handleJoinSession() {
    setError('')
    try {
      const result = await joinSession(projectId, displayName || 'Anonymous')
      setSession(result)
      setDocumentText(result.documentContent || '')
      setDisplayName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('collaborativeEditing.error.joinFailed', 'Failed to join session'))
    }
  }

  async function handleSaveDocument() {
    setSaving(true)
    setError('')
    try {
      const result = await updateDocument(projectId, documentText)
      setSession(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('collaborativeEditing.error.updateFailed', 'Failed to save changes'))
    } finally {
      setSaving(false)
    }
  }

  async function handleEndSession() {
    setError('')
    try {
      await endSession(projectId)
      setSession(null)
      setDocumentText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('collaborativeEditing.error.endFailed', 'Failed to end session'))
    }
  }

  async function loadHistory() {
    try {
      const h = await getSessionHistory(projectId)
      setHistory(h)
      setShowHistory(true)
    } catch {
      setError(t('collaborativeEditing.error.historyFailed', 'Failed to load history'))
    }
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'created': return '🟢'
      case 'joined': return '👤'
      case 'edited': return '✏️'
      case 'ended': return '🔴'
      default: return '📝'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('collaborativeEditing.title', 'Collaborative Editing')}</h3>
          <p className="text-warm-400 text-sm mt-1">{t('collaborativeEditing.subtitle', 'Real-time collaborative editing for dev requests with presence and activity tracking')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-warm-400">{t('collaborativeEditing.projectId', 'Project ID')}:</label>
          <input
            type="number"
            min={1}
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="w-20 bg-warm-700 border border-warm-600 rounded px-2 py-1 text-sm"
          />
          <button
            onClick={loadHistory}
            className="px-3 py-2 bg-warm-700 hover:bg-warm-600 rounded-lg text-sm transition-colors"
          >
            {t('collaborativeEditing.history', 'History')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* No Active Session — Create or Join */}
      {!loading && !session && (
        <div className="bg-warm-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Session */}
            <div className="bg-warm-700/50 rounded-lg p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                {t('collaborativeEditing.createSession', 'Create New Session')}
              </h4>
              <p className="text-warm-400 text-sm mb-4">{t('collaborativeEditing.createDesc', 'Start a new collaborative editing session for this project.')}</p>
              <input
                type="text"
                placeholder={t('collaborativeEditing.sessionNamePlaceholder', 'Session name (optional)')}
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full bg-warm-800 border border-warm-600 rounded px-3 py-2 text-sm mb-3"
              />
              <button
                onClick={handleCreateSession}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t('collaborativeEditing.create', 'Create Session')}
              </button>
            </div>

            {/* Join Session */}
            <div className="bg-warm-700/50 rounded-lg p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                {t('collaborativeEditing.joinSession', 'Join Existing Session')}
              </h4>
              <p className="text-warm-400 text-sm mb-4">{t('collaborativeEditing.joinDesc', 'Join an active session to collaborate with your team.')}</p>
              <input
                type="text"
                placeholder={t('collaborativeEditing.displayNamePlaceholder', 'Your display name')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-warm-800 border border-warm-600 rounded px-3 py-2 text-sm mb-3"
              />
              <button
                onClick={handleJoinSession}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t('collaborativeEditing.join', 'Join Session')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Session */}
      {!loading && session && (
        <>
          {/* Session Info Bar */}
          <div className="bg-warm-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
                  {session.status}
                </span>
                <span className="text-sm font-medium">{session.sessionName}</span>
                <span className="text-xs text-warm-400">v{session.documentVersion}</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Participant Avatars */}
                <div className="flex -space-x-2">
                  {session.participants.map((p, idx) => (
                    <div
                      key={idx}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-warm-800"
                      style={{ backgroundColor: p.color }}
                      title={p.displayName}
                    >
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-warm-400">
                  {session.participantCount} {t('collaborativeEditing.participants', 'participants')}
                </span>
                <button
                  onClick={handleEndSession}
                  className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs transition-colors"
                >
                  {t('collaborativeEditing.endSession', 'End Session')}
                </button>
              </div>
            </div>
          </div>

          {/* Editor / Activity Tabs */}
          <div className="bg-warm-800 rounded-xl overflow-hidden">
            <div className="flex border-b border-warm-700">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'editor' ? 'bg-warm-700 text-white border-b-2 border-blue-500' : 'text-warm-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2 justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  {t('collaborativeEditing.tab.editor', 'Editor')}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'activity' ? 'bg-warm-700 text-white border-b-2 border-blue-500' : 'text-warm-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2 justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  {t('collaborativeEditing.tab.activity', 'Activity Feed')} ({session.activityFeed.length})
                </span>
              </button>
            </div>

            {activeTab === 'editor' && (
              <div className="p-4">
                <textarea
                  ref={editorRef}
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder={t('collaborativeEditing.editorPlaceholder', 'Start typing your development request here...\n\nAll participants can see changes in real-time.')}
                  className="w-full bg-warm-900 border border-warm-700 rounded-lg p-4 text-sm font-mono min-h-[300px] resize-y focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-warm-500">
                    {t('collaborativeEditing.docVersion', 'Document version')}: {session.documentVersion}
                  </span>
                  <button
                    onClick={handleSaveDocument}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-warm-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? t('collaborativeEditing.saving', 'Saving...') : t('collaborativeEditing.save', 'Save Changes')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {session.activityFeed.length === 0 ? (
                  <p className="text-warm-400 text-sm text-center py-4">{t('collaborativeEditing.noActivity', 'No activity yet.')}</p>
                ) : (
                  <div className="space-y-2">
                    {[...session.activityFeed].reverse().map((entry: ActivityEntry, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 bg-warm-700/30 rounded-lg p-3">
                        <span className="text-lg">{getActionIcon(entry.action)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{entry.displayName || entry.userId}</span>
                            <span className="text-xs text-warm-500">{entry.action}</span>
                          </div>
                          <p className="text-xs text-warm-400 mt-0.5">{entry.detail}</p>
                        </div>
                        <span className="text-xs text-warm-500 whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{session.participantCount}</div>
              <div className="text-xs text-warm-400 mt-1">{t('collaborativeEditing.stats.participants', 'Participants')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{session.documentVersion}</div>
              <div className="text-xs text-warm-400 mt-1">{t('collaborativeEditing.stats.version', 'Doc Version')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{session.activityFeed.length}</div>
              <div className="text-xs text-warm-400 mt-1">{t('collaborativeEditing.stats.activities', 'Activities')}</div>
            </div>
            <div className="bg-warm-800 rounded-lg p-4 text-center">
              <div className="text-sm font-medium text-yellow-400 truncate">
                {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleTimeString() : '—'}
              </div>
              <div className="text-xs text-warm-400 mt-1">{t('collaborativeEditing.stats.lastActivity', 'Last Activity')}</div>
            </div>
          </div>
        </>
      )}

      {/* History */}
      {showHistory && (
        <div className="bg-warm-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">{t('collaborativeEditing.historyTitle', 'Session History')}</h4>
            <button onClick={() => setShowHistory(false)} className="text-warm-400 hover:text-white text-sm">
              {t('collaborativeEditing.close', 'Close')}
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-warm-400 text-sm">{t('collaborativeEditing.noHistory', 'No session history.')}</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="bg-warm-700/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      h.status === 'active' ? 'bg-green-900/50 text-green-300' :
                      'bg-warm-600 text-warm-300'
                    }`}>
                      {h.status}
                    </span>
                    <span className="text-sm">{h.sessionName}</span>
                    <span className="text-xs text-warm-400">{h.participantCount} participants, v{h.documentVersion}</span>
                  </div>
                  <span className="text-xs text-warm-500">{new Date(h.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
